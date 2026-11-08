#!/usr/bin/env python3
"""estudaai: servidor local.

    python servidor.py            → abre http://127.0.0.1:8765 no navegador
    python servidor.py --porta 9000 --sem-navegador

Só usa a biblioteca padrão do Python. O app (web/index.html) lê e organiza os PDFs
no navegador; o servidor só guarda o que o app manda, em ./dados/ (fora do git):

    dados/estado.json         progresso
    dados/biblioteca.json     índice dos PDFs {docs, temas, anexos}
    dados/arquivos/           os PDFs e os pacotes JSON (aulas, cartões, textos) de cada um
    dados/config.json         chaves de API (Claude, GPT, Gemini) e modelos (opcional)
    dados/sincronia.json      até onde já juntou o progresso de cada outro aparelho

Sincronia: se houver um cofre do Obsidian acima de dados/, cada gravação vira uma nota em
<cofre>/estudaai-sync/<aparelho>.md (nucleo/sincronia.py), que o Obsidian Sync leva ao outro aparelho.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import threading
import uuid
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent
WEB = RAIZ / "web"
DADOS = RAIZ / "dados"
VERSAO = "1.1.0"

sys.path.insert(0, str(RAIZ))
from nucleo import ia, sincronia  # noqa: E402

TRAVA = threading.Lock()
TIPOS = {"application/pdf": ".pdf", "application/json": ".json"}
EXT_TIPO = {v: k for k, v in TIPOS.items()}
ID_ARQUIVO = re.compile(r"^[\w\-]+\.(pdf|json)$")
_EXPORTAR: dict[str, threading.Timer] = {}


def exportar_obsidian(dados: Path) -> dict | None:
    """Grava a nota deste aparelho no cofre do Obsidian (se houver cofre). Nunca derruba o servidor."""
    cofre = sincronia.achar_cofre(dados)
    if not cofre:
        return None
    try:
        with TRAVA:
            return sincronia.exportar(dados, cofre, sincronia.aparelho(dados), VERSAO)
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(f"  Não consegui salvar no Obsidian: {e}\n")
        return None


def agendar_obsidian(dados: Path, espera: float = 2.0) -> None:
    """Junta várias gravações seguidas numa só exportação, ~2 s depois da última."""
    chave = str(dados)
    if t := _EXPORTAR.get(chave):
        t.cancel()
    t = threading.Timer(espera, exportar_obsidian, args=(dados,))
    t.daemon = True
    _EXPORTAR[chave] = t
    t.start()


def ler_json(arq: Path, padrao):
    try:
        return json.loads(arq.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def gravar_json(arq: Path, obj) -> None:
    arq.parent.mkdir(parents=True, exist_ok=True)
    tmp = arq.with_suffix(".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(arq)


def indice_vazio() -> dict:
    return {"docs": [], "temas": [], "anexos": {}}


def migrar_v1(dados: Path) -> int:
    """Converte a biblioteca do formato antigo (aulas e cartões dentro do índice, organizados em Python)
    para o formato do armazém. Mantém os ids, então o progresso nos cartões continua valendo.
    Guarda uma cópia do índice antigo em biblioteca-v1.json. Devolve quantos PDFs migrou."""
    arq = dados / "biblioteca.json"
    b = ler_json(arq, None)
    if not isinstance(b, dict) or not ("aulas" in b or "cartoes" in b):
        return 0
    shutil.copy2(arq, dados / "biblioteca-v1.json")
    pasta = dados / "arquivos"
    pasta.mkdir(parents=True, exist_ok=True)
    for d in b.get("docs", []):
        did = d["id"]
        topicos =[x for t in b.get("temas", []) if t.get("doc") == did for dd in t["disciplinas"] for x in dd["topicos"]] \
            or [x for lista in b.get("anexos", {}).values() for a in lista if a.get("doc") == did for x in a["topicos"]]
        pacote = {
            "topicos": topicos,
            "aulas": {k: v for k, v in b.get("aulas", {}).items() if k.startswith(f"p-{did}-")},
            "cartoes": [c for c in b.get("cartoes", []) if c.get("doc") == did],
            "textos": ler_json(dados / "textos" / f"{did}.json", {}),
        }
        gravar_json(pasta / f"{did}.json", pacote)
        pdf_antigo = dados / "pdfs" / f"{did}.pdf"
        if pdf_antigo.exists():
            shutil.copy2(pdf_antigo, pasta / f"{did}.pdf")
        d.update(pdfAsset=f"{did}.pdf", pdfUrl=f"/api/arquivos/{did}.pdf", pacoteAsset=f"{did}.json", pacoteUrl=f"/api/arquivos/{did}.json")
    gravar_json(arq, {"docs": b.get("docs", []), "temas": b.get("temas", []), "anexos": b.get("anexos", {})})
    return len(b.get("docs", []))


class Handler(SimpleHTTPRequestHandler):
    dados: Path = DADOS            # trocado nos testes

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)

    def log_message(self, fmt, *args):  # silencioso, exceto erros
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("  %s %s\n" % (self.command, self.path))

    # ---------- utilidades ----------
    def _json(self, obj, status=200):
        corpo = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def _corpo(self) -> bytes:
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def _corpo_json(self) -> dict | None:
        try:
            obj = json.loads(self._corpo() or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None
        return obj if isinstance(obj, dict) else None

    def _origem_ok(self) -> bool:
        """Bloqueia pedidos de outros sites abertos no navegador (CSRF): só o próprio estudaai pode gravar."""
        origem = self.headers.get("Origin")
        return origem is None or urlparse(origem).netloc == self.headers.get("Host")

    def _arquivo(self, rota: str) -> Path | None:
        m = re.match(r"^/api/arquivos/(.+)$", rota)
        return self.dados / "arquivos" / m.group(1) if m and ID_ARQUIVO.match(m.group(1)) else None

    # ---------- rotas ----------
    def do_GET(self):
        p = urlparse(self.path).path
        if p == "/api/info":
            cfg = ia.config(self.dados)            # nunca devolve as chaves, só quais existem
            return self._json({"versao": VERSAO, "ia": ia.disponivel(self.dados), "provedores": ia.provedores(self.dados),
                               "cadeia": {a: ia.cadeia(self.dados, a) for a in ia.CADEIA}, "gemini_plano": cfg["gemini_plano"],
                               **{k: cfg[k] for k in ("modelo", "modelo_openai", "modelo_gemini")}})
        if p == "/api/estado":
            return self._json(ler_json(self.dados / "estado.json", {}))
        if p == "/api/obsidian":
            cofre = sincronia.achar_cofre(self.dados)
            if not cofre:
                return self._json({"cofre": None})
            ap = sincronia.aparelho(self.dados)
            meu = sincronia.ler_nota(cofre / sincronia.PASTA / f"{ap}.md")
            return self._json({"cofre": str(cofre), "via": sincronia.via(cofre), "aparelho": ap, "meu": meu["atualizado"] if meu else "",
                               "outros": sincronia.outros(self.dados, cofre, ap)})
        if p.startswith("/api/obsidian/aparelho/"):
            cofre = sincronia.achar_cofre(self.dados)
            n = cofre and sincronia.baixar(self.dados, cofre, p.rsplit("/", 1)[1])
            if not n:
                return self._json({"erro": "nota não encontrada"}, 404)
            return self._json({k: n[k] for k in ("aparelho", "atualizado", "estado", "biblioteca", "historico")})
        if p == "/api/biblioteca":
            return self._json(ler_json(self.dados / "biblioteca.json", indice_vazio()))
        if p.startswith("/api/arquivos/"):
            arq = self._arquivo(p)
            if not arq or not arq.exists():
                return self._json({"erro": "arquivo não encontrado"}, 404)
            self.send_response(200)
            self.send_header("Content-Type", EXT_TIPO[arq.suffix])
            self.send_header("Content-Length", str(arq.stat().st_size))
            self.end_headers()
            with open(arq, "rb") as f:
                shutil.copyfileobj(f, self.wfile)
            return
        if p.startswith("/api/"):
            return self._json({"erro": "rota desconhecida"}, 404)
        if p == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_PUT(self):
        if not self._origem_ok():
            return self._json({"erro": "origem não permitida"}, 403)
        p = urlparse(self.path).path
        destino = {"/api/estado": "estado.json", "/api/biblioteca": "biblioteca.json"}.get(p)
        if not destino:
            return self._json({"erro": "rota desconhecida"}, 404)
        obj = self._corpo_json()
        if obj is None or (p == "/api/biblioteca" and not isinstance(obj.get("docs"), list)):
            return self._json({"erro": "JSON inválido"}, 400)
        with TRAVA:
            gravar_json(self.dados / destino, obj)
        agendar_obsidian(self.dados)
        return self._json({"ok": True})

    def do_POST(self):
        if not self._origem_ok():
            return self._json({"erro": "origem não permitida"}, 403)
        p = urlparse(self.path).path
        if p == "/api/arquivos":
            ext = TIPOS.get((self.headers.get("Content-Type") or "").split(";")[0].strip())
            corpo = self._corpo()
            if not ext or (ext == ".pdf" and not corpo.startswith(b"%PDF")):
                return self._json({"erro": "Só aceito PDF ou JSON."}, 400)
            nome = uuid.uuid4().hex + ext
            pasta = self.dados / "arquivos"
            pasta.mkdir(parents=True, exist_ok=True)
            (pasta / nome).write_bytes(corpo)
            return self._json({"id": nome, "url": f"/api/arquivos/{nome}"})
        if p == "/api/obsidian/salvar":                     # chip do topo e saída da aba (sendBeacon)
            est = self._corpo_json()                         # a aba que fecha manda o estado pendente junto
            if est and isinstance(est.get("top"), dict):
                with TRAVA:
                    gravar_json(self.dados / "estado.json", est)
            r = exportar_obsidian(self.dados)
            return self._json({"ok": r is not None, **(r or {})})
        if p == "/api/obsidian/visto":
            c = self._corpo_json() or {}
            if not (isinstance(c.get("aparelho"), str) and sincronia.NOME_OK.match(c["aparelho"]) and isinstance(c.get("atualizado"), str)):
                return self._json({"erro": "pedido inválido"}, 400)
            with TRAVA:
                sincronia.marcar_visto(self.dados, c["aparelho"], c["atualizado"][:40])
            return self._json({"ok": True})
        if p not in ("/api/ia/aula", "/api/ia/texto", "/api/config"):
            return self._json({"erro": "rota desconhecida"}, 404)
        corpo = self._corpo_json()
        if corpo is None:
            return self._json({"erro": "JSON inválido"}, 400)
        if p == "/api/ia/aula":
            prompt = corpo.get("prompt")                     # o pedido é montado no app (o mesmo da nuvem)
            if not isinstance(prompt, str) or not prompt.strip():
                return self._json({"erro": "Pedido vazio."}, 400)
            try:
                return self._json({"ok": True, "aula": ia.gerar_aula(self.dados, prompt)})
            except Exception as e:  # noqa: BLE001
                return self._json({"erro": str(e)}, 500)
        if p == "/api/ia/texto":                             # revisão das respostas e pesquisa das dúvidas (Markdown)
            prompt, atividade = corpo.get("prompt"), corpo.get("atividade", "revisao")
            if not isinstance(prompt, str) or not prompt.strip():
                return self._json({"erro": "Pedido vazio."}, 400)
            if atividade not in ("revisao", "duvidas"):
                return self._json({"erro": "Atividade desconhecida."}, 400)
            try:
                return self._json({"ok": True, **ia.gerar_texto(self.dados, prompt, atividade)})
            except Exception as e:  # noqa: BLE001
                return self._json({"erro": str(e)}, 500)
        cfg = ler_json(self.dados / "config.json", {})
        for k in ia.CAMPOS:
            if isinstance(corpo.get(k), str):
                cfg[k] = corpo[k].strip()
        gravar_json(self.dados / "config.json", cfg)
        return self._json({"ok": True, "ia": ia.disponivel(self.dados), "provedores": ia.provedores(self.dados)})

    def do_DELETE(self):
        if not self._origem_ok():
            return self._json({"erro": "origem não permitida"}, 403)
        arq = self._arquivo(urlparse(self.path).path)
        if not arq:
            return self._json({"erro": "rota desconhecida"}, 404)
        arq.unlink(missing_ok=True)
        return self._json({"ok": True})


def main():
    ap = argparse.ArgumentParser(description="estudaai: servidor local")
    ap.add_argument("--porta", type=int, default=8765)
    ap.add_argument("--sem-navegador", action="store_true")
    a = ap.parse_args()
    DADOS.mkdir(exist_ok=True)
    if n := migrar_v1(DADOS):
        print(f"  Biblioteca atualizada para o formato novo ({n} PDF(s)). Cópia do índice antigo: dados/biblioteca-v1.json")
    srv = ThreadingHTTPServer(("127.0.0.1", a.porta), Handler)
    url = f"http://127.0.0.1:{a.porta}"
    print(f"\n  🧠 estudaai {VERSAO} rodando em {url}")
    print(f"  IA: {'ligada (' + ', '.join(ia.provedores(DADOS)) + ')' if ia.provedores(DADOS) else 'desligada (opcional: configure em Biblioteca → IA)'}")
    cofre = sincronia.achar_cofre(DADOS)
    print(f"  Sincronia: {f'{sincronia.via(cofre)}, em {cofre / sincronia.PASTA} (este aparelho: {sincronia.aparelho(DADOS)})' if cofre else 'desligada (sem Google Drive nem cofre do Obsidian)'}")
    print("  Para encerrar: Ctrl+C\n")
    if cofre:
        exportar_obsidian(DADOS)             # garante a nota deste aparelho logo na partida
    if not a.sem_navegador:
        threading.Timer(.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        exportar_obsidian(DADOS)
        print("\n  Até a próxima sessão de estudo!")


if __name__ == "__main__":
    main()
