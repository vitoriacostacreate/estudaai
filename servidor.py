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
    dados/sincronia.json      nome e código deste aparelho na sincronia
    dados/sync/               clone do repositório Git privado só de dados (um <aparelho>.json por aparelho + arquivos/)
    dados/sinc-base/          última versão de cada outro aparelho que o app já juntou (base da junção de 3 vias)

Sincronia (nucleo/sincronia.py): com dados/sync configurado (CONFIGURAR-SINCRONIA.bat), o servidor puxa na partida,
envia ~30 s depois de cada gravação, ao fechar a aba e no Ctrl+C, e tenta de novo sozinho se estiver sem internet.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import threading
import time
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
TRAVA_GIT = threading.Lock()                 # um ciclo de sincronia por vez
_SINC: dict[str, dict] = {}                  # por pasta dados/: {enviado, pendente, erro, aviso, mud, ciclo, timer}
ESPERA_ENVIO = 30.0                          # segundos depois da última gravação
ESPERA_NOVA_TENTATIVA = 180.0                # sem internet: tenta de novo sozinho


def _sinc(dados: Path) -> dict:
    return _SINC.setdefault(str(dados), {"enviado": "", "pendente": False, "erro": "", "aviso": "", "mud": 0, "ciclo": 0.0, "timer": None})


def estado_sinc(dados: Path) -> dict:
    """O que o chip do topo mostra. Não toca na rede."""
    if not sincronia.repo(dados):
        return {"ligado": False}
    s = _sinc(dados)
    return {"ligado": True, "aparelho": sincronia.aparelho(dados), **{k: s[k] for k in ("enviado", "pendente", "erro", "aviso")}}


def sincronizar(dados: Path, se_passou: float = 0) -> dict:
    """Roda um ciclo (puxar → regravar o arquivo deste aparelho → enviar). Nunca derruba o servidor.
    se_passou: pula se o último ciclo terminou há menos que isso (segundos)."""
    if not sincronia.repo(dados):
        return {"ligado": False}
    s = _sinc(dados)
    with TRAVA_GIT:
        if se_passou and time.monotonic() - s["ciclo"] < se_passou:
            return estado_sinc(dados)
        mud = s["mud"]
        try:
            r = sincronia.sincronizar(dados, VERSAO)
        except Exception as e:  # noqa: BLE001
            r = {"ok": False, "erro": str(e), "grandes": []}
        s["ciclo"] = time.monotonic()
        s["erro"] = "" if r["ok"] else r["erro"]
        s["aviso"] = ("Grande demais para sincronizar (fica só neste aparelho): " + ", ".join(r["grandes"]) + ".") if r.get("grandes") else ""
        if r["ok"]:
            s["enviado"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            s["pendente"] = s["mud"] != mud          # gravaram de novo durante o ciclo: o próximo envio já está agendado
        else:
            s["pendente"] = True
            sys.stderr.write(f"  Sincronia: ainda não enviei ({r['erro']}) Tento de novo sozinho.\n")
    if not r["ok"]:
        agendar_sinc(dados, ESPERA_NOVA_TENTATIVA, mudou=False)
    return estado_sinc(dados)


def agendar_sinc(dados: Path, espera: float = ESPERA_ENVIO, mudou: bool = True) -> None:
    """Junta várias gravações seguidas num só envio, um pouco depois da última."""
    if not sincronia.repo(dados):
        return
    s = _sinc(dados)
    if mudou:
        s["mud"] += 1
        s["pendente"] = True
    if s["timer"]:
        s["timer"].cancel()
    s["timer"] = t = threading.Timer(espera, sincronizar, args=(dados,))
    t.daemon = True
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
        if p == "/api/sinc":
            return self._json(estado_sinc(self.dados))
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
        agendar_sinc(self.dados)
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
        if p == "/api/sinc/puxar":                          # ao abrir e ao voltar à aba: traz o que os outros enviaram
            st = sincronizar(self.dados, se_passou=20)
            rp = sincronia.repo(self.dados)
            if rp:
                with TRAVA_GIT:
                    st["outros"] = sincronia.outros(self.dados, rp, st["aparelho"])
            return self._json(st)
        if p == "/api/sinc/visto":                          # o app juntou esta versão: vira a base da próxima junção
            c = self._corpo_json() or {}
            rp = sincronia.repo(self.dados)
            if not (rp and isinstance(c.get("aparelho"), str) and sincronia.NOME_OK.match(c["aparelho"]) and isinstance(c.get("atualizado"), str)):
                return self._json({"erro": "pedido inválido"}, 400)
            with TRAVA_GIT:
                return self._json({"ok": sincronia.marcar_visto(self.dados, rp, c["aparelho"], c["atualizado"])})
        if p == "/api/sinc/enviar":                         # chip do topo (?esperar=1) e saída da aba (sendBeacon)
            est = self._corpo_json()                         # a aba que fecha manda o estado pendente junto
            if est and isinstance(est.get("top"), dict):
                with TRAVA:
                    gravar_json(self.dados / "estado.json", est)
            if "esperar=1" in urlparse(self.path).query:
                return self._json(sincronizar(self.dados))
            agendar_sinc(self.dados, 0)
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
    rp = sincronia.repo(DADOS)
    print(f"  Sincronia: {f'ligada, pelo repositório de dados em {rp} (este aparelho: {sincronia.aparelho(DADOS)})' if rp else 'desligada (para ligar: CONFIGURAR-SINCRONIA.bat)'}")
    print("  Para encerrar: Ctrl+C\n")
    if rp:
        threading.Thread(target=sincronizar, args=(DADOS,), daemon=True).start()   # puxa e envia já na partida, sem atrasar a abertura
    if not a.sem_navegador:
        threading.Timer(.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        if rp:
            print("\n  Enviando o progresso antes de sair...")
            st = sincronizar(DADOS)
            print("  " + ("Ainda não consegui enviar: envio na próxima vez que você abrir." if st.get("pendente") else "Progresso enviado."))
        print("\n  Até a próxima sessão de estudo!")


if __name__ == "__main__":
    main()
