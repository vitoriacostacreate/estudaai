#!/usr/bin/env python3
"""estudaai: servidor local.

    python servidor.py            → abre http://127.0.0.1:8765 no navegador
    python servidor.py --porta 9000 --sem-navegador

Tudo roda na sua máquina. Seus PDFs, o progresso e as aulas ficam em ./dados/
(ignorada pelo git, então nada pessoal vai para o GitHub).
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
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

RAIZ = Path(__file__).resolve().parent
WEB = RAIZ / "web"
DADOS = RAIZ / "dados"
PDFS = DADOS / "pdfs"
VERSAO = "1.0.0"

sys.path.insert(0, str(RAIZ))
from nucleo import ia  # noqa: E402

try:
    from nucleo.organizar import organizar  # precisa de pypdf
    PDF_OK = True
except ImportError:  # pragma: no cover
    PDF_OK = False

TRAVA = threading.Lock()


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


def biblioteca() -> dict:
    return ler_json(DADOS / "biblioteca.json", {"docs": [], "temas": [], "anexos": {}, "aulas": {}, "cartoes": []})


def slug(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:30] or "pdf"


CORES = ["#7f9cff", "#35c9bd", "#f2a35b", "#a98bf0", "#ee7fa8", "#5fd38d", "#f4d35e"]


def importar_pdf(nome: str, conteudo: bytes, destino: str, nome_tema: str) -> dict:
    if not PDF_OK:
        raise RuntimeError("Falta a biblioteca pypdf. Rode: python -m pip install -r requirements.txt")
    doc_id = slug(Path(nome).stem)[:18] + "-" + uuid.uuid4().hex[:4]
    PDFS.mkdir(parents=True, exist_ok=True)
    arq = PDFS / f"{doc_id}.pdf"
    arq.write_bytes(conteudo)
    res = organizar(arq, Path(nome).stem, doc_id)
    with TRAVA:
        b = biblioteca()
        if destino in ("", "novo"):
            tema_id = "pdf-" + doc_id
            b["temas"].append({"id": tema_id, "nome": "📄 " + (nome_tema or res["doc"]["titulo"])[:50], "cor": CORES[len(b["temas"]) % len(CORES)],
                               "desc": f"Criado a partir de {nome} ({res['doc']['paginas']} páginas).", "doc": doc_id,
                               "disciplinas": [{"id": "d-" + doc_id, "nome": "Seções do PDF", "topicos": res["topicos"]}]})
        else:
            tema_id = destino
            b["anexos"].setdefault(destino, []).append({"id": "d-" + doc_id, "nome": "📄 " + Path(nome).stem[:50], "doc": doc_id, "topicos": res["topicos"]})
        for c in res["cartoes"]:
            c["tema"] = tema_id
            c["doc"] = doc_id
        b["cartoes"].extend(res["cartoes"])
        b["aulas"].update(res["aulas"])
        doc = dict(res["doc"], tema=tema_id, arquivo=nome, importado=time.strftime("%Y-%m-%d %H:%M"))
        b["docs"].append(doc)
        gravar_json(DADOS / "biblioteca.json", b)
        gravar_json(DADOS / "textos" / f"{doc_id}.json", res["textos"])
    return doc


def apagar_doc(doc_id: str) -> None:
    with TRAVA:
        b = biblioteca()
        b["docs"] = [d for d in b["docs"] if d["id"] != doc_id]
        b["temas"] = [t for t in b["temas"] if t.get("doc") != doc_id]
        for k in list(b["anexos"]):
            b["anexos"][k] = [a for a in b["anexos"][k] if a.get("doc") != doc_id]
            if not b["anexos"][k]:
                del b["anexos"][k]
        b["cartoes"] = [c for c in b["cartoes"] if c.get("doc") != doc_id]
        b["aulas"] = {k: v for k, v in b["aulas"].items() if not k.startswith(f"p-{doc_id}-")}
        gravar_json(DADOS / "biblioteca.json", b)
    for f in (PDFS / f"{doc_id}.pdf", DADOS / "textos" / f"{doc_id}.json"):
        f.unlink(missing_ok=True)


def texto_topico(tid: str) -> str:
    m = re.match(r"^p-(.+)-(\d+)$", tid)
    if not m:
        return ""
    return ler_json(DADOS / "textos" / f"{m.group(1)}.json", {}).get(tid, "")


def buscar(q: str, limite: int = 30) -> list[dict]:
    q = q.strip().lower()
    if len(q) < 3:
        return []
    b = biblioteca()
    titulos = {t["id"]: t["t"] for d in b["docs"] for t in topicos_do_doc(b, d["id"])}
    out = []
    for arq in (DADOS / "textos").glob("*.json"):
        for tid, txt in ler_json(arq, {}).items():
            i = txt.lower().find(q)
            if i >= 0:
                ini = max(0, i - 90)
                out.append({"topico": tid, "titulo": titulos.get(tid, tid), "trecho": ("…" if ini else "") + txt[ini:i + 160].replace("\n", " ") + "…",
                            "ocorrencias": txt.lower().count(q)})
    return sorted(out, key=lambda x: -x["ocorrencias"])[:limite]


def topicos_do_doc(b: dict, doc_id: str) -> list[dict]:
    for t in b["temas"]:
        if t.get("doc") == doc_id:
            return [x for d in t["disciplinas"] for x in d["topicos"]]
    for lista in b["anexos"].values():
        for a in lista:
            if a.get("doc") == doc_id:
                return a["topicos"]
    return []


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)

    def log_message(self, fmt, *args):  # silencioso, exceto erros
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("  %s %s\n" % (self.command, self.path))

    def _json(self, obj, status=200):
        dados = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(dados)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(dados)

    def _corpo(self) -> bytes:
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def do_GET(self):
        u = urlparse(self.path)
        p = u.path
        if p == "/api/info":
            return self._json({"versao": VERSAO, "ia": ia.disponivel(DADOS), "pdf": PDF_OK, "modelo": ia.config(DADOS)["modelo"]})
        if p == "/api/estado":
            return self._json(ler_json(DADOS / "estado.json", {}))
        if p == "/api/biblioteca":
            return self._json(biblioteca())
        if p == "/api/busca":
            return self._json(buscar(parse_qs(u.query).get("q", [""])[0]))
        m = re.match(r"^/api/texto/(.+)$", p)
        if m:
            return self._json({"texto": texto_topico(unquote(m.group(1)))})
        m = re.match(r"^/api/pdf/([\w\-]+)$", p)
        if m:
            arq = PDFS / f"{m.group(1)}.pdf"
            if not arq.exists():
                return self._json({"erro": "PDF não encontrado"}, 404)
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(arq.stat().st_size))
            self.end_headers()
            with open(arq, "rb") as f:
                shutil.copyfileobj(f, self.wfile)
            return
        if p == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_PUT(self):
        if urlparse(self.path).path == "/api/estado":
            try:
                obj = json.loads(self._corpo() or b"{}")
            except json.JSONDecodeError:
                return self._json({"erro": "JSON inválido"}, 400)
            with TRAVA:
                gravar_json(DADOS / "estado.json", obj)
            return self._json({"ok": True})
        self._json({"erro": "rota desconhecida"}, 404)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/pdf":
            q = parse_qs(u.query)
            nome = q.get("nome", ["documento.pdf"])[0]
            dados = self._corpo()
            if not dados.startswith(b"%PDF"):
                return self._json({"erro": f"'{nome}' não parece ser um PDF."}, 400)
            try:
                doc = importar_pdf(nome, dados, q.get("destino", ["novo"])[0], q.get("tema", [""])[0])
                return self._json({"ok": True, "doc": doc})
            except Exception as e:  # noqa: BLE001
                return self._json({"erro": f"Não consegui ler o PDF: {e}"}, 500)
        if u.path == "/api/ia/aula":
            corpo = json.loads(self._corpo() or b"{}")
            tid = corpo.get("topico", "")
            texto = texto_topico(tid) or corpo.get("texto", "")
            if not texto:
                return self._json({"erro": "Sem texto para este tópico."}, 400)
            try:
                aula = ia.gerar_aula(DADOS, corpo.get("titulo", ""), corpo.get("tema", ""), texto)
                return self._json({"ok": True, "aula": aula})
            except Exception as e:  # noqa: BLE001
                return self._json({"erro": str(e)}, 500)
        if u.path == "/api/config":
            corpo = json.loads(self._corpo() or b"{}")
            cfg = ler_json(DADOS / "config.json", {})
            for k in ("anthropic_api_key", "modelo"):
                if k in corpo:
                    cfg[k] = corpo[k].strip()
            gravar_json(DADOS / "config.json", cfg)
            return self._json({"ok": True, "ia": ia.disponivel(DADOS)})
        self._json({"erro": "rota desconhecida"}, 404)

    def do_DELETE(self):
        m = re.match(r"^/api/pdf/([\w\-]+)$", urlparse(self.path).path)
        if m:
            apagar_doc(m.group(1))
            return self._json({"ok": True})
        self._json({"erro": "rota desconhecida"}, 404)


def main():
    ap = argparse.ArgumentParser(description="estudaai: servidor local")
    ap.add_argument("--porta", type=int, default=8765)
    ap.add_argument("--sem-navegador", action="store_true")
    a = ap.parse_args()
    DADOS.mkdir(exist_ok=True)
    srv = ThreadingHTTPServer(("127.0.0.1", a.porta), Handler)
    url = f"http://127.0.0.1:{a.porta}"
    print(f"\n  🧠 estudaai {VERSAO} rodando em {url}")
    print(f"  Leitura de PDF: {'ok' if PDF_OK else 'FALTA pypdf (python -m pip install -r requirements.txt)'}")
    print(f"  IA: {'ligada (' + ia.config(DADOS)['modelo'] + ')' if ia.disponivel(DADOS) else 'desligada (opcional: configure em Biblioteca → IA)'}")
    print("  Para encerrar: Ctrl+C\n")
    if not a.sem_navegador:
        threading.Timer(.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Até a próxima sessão de estudo!")


if __name__ == "__main__":
    main()
