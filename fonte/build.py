"""Gera web/index.html a partir de fonte/ (app + aulas) e conteudo/ (temas e cartões prontos).

    python fonte/build.py
"""
import hashlib
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTE, CONT = RAIZ / "fonte", RAIZ / "conteudo"

META = {
    "concurso": ("🎯 Concurso UFMS", "#7f9cff", "Analista de TI (506), prova em 17/01/2027. Específicos, RLM e Legislação valem o dobro."),
    "fisioterapia": ("🦴 Fisioterapia", "#ee7fa8", "Base do curso: anatomia palpável, fisiologia, cinesiologia, avaliação e recursos."),
    "neurociencia": ("🧠 Neurociência", "#a98bf0", "Neurônio, sinapse, memória, atenção e dor. Útil para a fisioterapia e para estudar melhor."),
    "fl-studio": ("🎛️ FL Studio", "#f2a35b", "Produção musical na prática: batida, melodia, sound design, mixagem e arranjo."),
    "teoria-musical": ("🎼 Teoria musical", "#35c9bd", "Escalas, acordes e progressões tocando no piano."),
    "violao": ("🎸 Violão", "#5fd38d", "Acordes abertos, trocas no tempo e repertório."),
    "libras": ("🤟 Libras", "#f4d35e", "Alfabeto manual, parâmetros, vocabulário e cultura surda."),
}
DECK = {"Fisioterapia": "fisioterapia", "Neurociência": "neurociencia", "FL Studio": "fl-studio", "Teoria musical": "teoria-musical", "Libras": "libras"}


def temas():
    out = []
    for tid, (nome, cor, desc) in META.items():
        c = json.loads((CONT / "temas" / f"{tid}.json").read_text(encoding="utf-8"))
        ds = [{"id": d["id"], "nome": d["nome"], "cor": d.get("cor", cor),
               **({"questoes": d["questoes"], "pontos": d["pontos"]} if d.get("questoes") else {}),
               "topicos": [{"id": t["id"], "t": t["t"], "p": t["p"]} for t in d["topicos"]]} for d in c["disciplinas"]]
        out.append({"id": tid, "nome": nome, "cor": cor, "desc": desc, "disciplinas": ds})
    return out


def cartoes():
    out = []
    for f in sorted((CONT / "cartoes").glob("*.csv")):
        fixo = None if f.stem == "TEMAS-importar" else "concurso"
        for l in f.read_text(encoding="utf-8").splitlines():
            if l.startswith("#") or not l.strip():
                continue
            p = l.split(";")
            tema = fixo or DECK.get(p[3].split("::")[-1])
            out.append({"id": hashlib.md5(p[0].encode()).hexdigest()[:10], "f": p[0], "v": p[1], "tema": tema})
    assert all(c["tema"] for c in out)
    return out


def app_js() -> str:
    """Junta fonte/js/*.js na ordem do prefixo numérico (10-util, 20-estado, ... 99-iniciar).
    Todos compartilham o mesmo escopo global, como se fossem um arquivo só."""
    partes = [f"/* ==== js/{f.name} ==== */\n" + f.read_text(encoding="utf-8") for f in sorted((FONTE / "js").glob("[0-9]*.js"))]
    return '"use strict";\n' + "\n".join(partes)


def main():
    ts, cs = temas(), cartoes()
    aulas = "\n".join(f.read_text(encoding="utf-8") for f in sorted(FONTE.glob("aulas-*.js")))
    html = (FONTE / "app.html").read_text(encoding="utf-8")
    html = html.replace("/*CSS*/", (FONTE / "estilo.css").read_text(encoding="utf-8"))
    html = html.replace("/*DATA*/", "const TEMAS = " + json.dumps(ts, ensure_ascii=False) + ";\nconst CARDS = " + json.dumps(cs, ensure_ascii=False) + ";")
    html = html.replace("/*AULAS*/", aulas)
    html = html.replace("/*ORG*/", (FONTE / "organizar.js").read_text(encoding="utf-8"))
    html = html.replace("/*APP*/", app_js())
    (RAIZ / "web").mkdir(exist_ok=True)
    (RAIZ / "web" / "index.html").write_text(html, encoding="utf-8")
    n_aulas = len(re.findall(r"^AULAS\.\w+ =", aulas, re.M))
    print(f"web/index.html: {len(ts)} temas, {len(cs)} cartões, {n_aulas} aulas, {len(html) // 1024} KB")


if __name__ == "__main__":
    main()
