"""Transforma um PDF em material de estudo, sem IA.

Fluxo (inspirado no cardflash, que liga cada cartão à página de origem, e no
open-notebook, onde as fontes viram cadernos):
  1. extrair o texto página por página (pypdf)
  2. achar as seções: sumário do PDF → títulos numerados ou em CAIXA ALTA → blocos de páginas
  3. para cada seção: termos-chave (TF-IDF), definições ("X é ..."),
     lacunas (cloze) com termos e números, mapa mental, quiz e uma aula automática
Tudo é determinístico e local. A IA (opcional) só melhora a aula depois.
"""
from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from pathlib import Path

from pypdf import PdfReader

STOP = set("""
a à ao aos as às até após com como contra da das de dela dele deles demais depois do dos e é ela elas ele eles em entre era essa
essas esse esses esta está estão estas este estes eu foi foram há isso isto já la lhe lhes mais mas me mesmo meu minha muito
na nas nem no nos nós num numa o os ou para pela pelas pelo pelos por qual quando que quem se sem ser será seu seus sobre sua
suas são também te tem têm ter um uma umas uns vai você vocês the and for with from that this are was were have has not
cada outro outra outros outras pode podem deve devem sendo sido seja sejam assim ainda apenas bem onde porque pois segundo
qualquer quais todo toda todos todas forma parte caso modo vez vezes dia dias ano anos além então sempre grande nova novo
art artigo inciso parágrafo página capítulo seção figura tabela exemplo exemplos
explica acontece começa depende costuma ajuda realiza formam forma quanto mesma mesmos isso esse dessa desse nessa nesse
""".split())
PRONOMES = {"ele", "ela", "eles", "elas", "isso", "isto", "este", "esta", "esse", "essa", "que", "o que", "aquilo", "tudo", "nada", "cada um"}
VERBAL = ("ar", "er", "ir", "ava", "avam", "iam", "ou", "aram", "eram", "iram", "ando", "endo", "indo", "am", "em", "ará", "erá", "irá")

PALAVRA = re.compile(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-]{3,}")
VERBOS_DEF = r"(?:é|são|consiste em|consistem em|refere-se a|referem-se a|significa|significam|corresponde a|define-se como|caracteriza-se por)"


def _limpar(txt: str) -> str:
    txt = txt.replace("­", "")
    txt = re.sub(r"(\w)-\n(\w)", r"\1\2", txt)          # hifenização no fim da linha
    txt = re.sub(r"[ \t]+", " ", txt)
    return txt


def _paragrafos(txt: str) -> str:
    """Junta quebras de linha que não são fim de parágrafo."""
    linhas = [l.strip() for l in txt.split("\n")]
    out, buf = [], []
    for l in linhas:
        if not l:
            if buf:
                out.append(" ".join(buf)); buf = []
            continue
        buf.append(l)
        if re.search(r"[.!?:;]$", l) and len(l) < 70:
            out.append(" ".join(buf)); buf = []
    if buf:
        out.append(" ".join(buf))
    return "\n\n".join(p for p in out if p.strip())


def _frases(txt: str) -> list[str]:
    t = re.sub(r"\s+", " ", txt)
    partes = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9\"“(])", t)
    return [p.strip() for p in partes if 25 <= len(p.strip()) <= 320]


def _e_titulo(l: str) -> bool:
    l = l.strip()
    if not (4 <= len(l) <= 90) or l.endswith((".", ",", ";")):
        return False
    if re.match(r"^(\d+(\.\d+){0,3})[\.\)]?\s+[A-ZÀ-Ú]", l) and len(l.split()) <= 12:
        return True
    if re.match(r"^(CAPÍTULO|CAPITULO|SEÇÃO|SECAO|UNIDADE|MÓDULO|MODULO|AULA|TÍTULO|TITULO|PARTE)\b", l, re.I):
        return True
    letras = [c for c in l if c.isalpha()]
    return len(letras) >= 4 and sum(c.isupper() for c in letras) / len(letras) > 0.85 and len(l.split()) <= 10


def _secoes_por_sumario(r: PdfReader) -> list[tuple[str, int]]:
    try:
        sumario = r.outline
    except Exception:
        return []
    itens: list[tuple[str, int]] = []

    def andar(lista, nivel):
        for it in lista:
            if isinstance(it, list):
                if nivel < 2:
                    andar(it, nivel + 1)
                continue
            try:
                itens.append((str(it.title).strip(), r.get_destination_page_number(it)))
            except Exception:
                pass
    andar(sumario, 0)
    vistos, unicos = set(), []
    for t, p in sorted(itens, key=lambda x: x[1]):
        if p not in vistos and t:
            unicos.append((t, p)); vistos.add(p)
    return unicos if len(unicos) >= 2 else []


def extrair(caminho: str | Path) -> dict:
    r = PdfReader(str(caminho))
    paginas = []
    for pg in r.pages:
        try:
            paginas.append(_limpar(pg.extract_text() or ""))
        except Exception:
            paginas.append("")
    meta_titulo = ""
    try:
        meta_titulo = (r.metadata.title or "").strip() if r.metadata else ""
    except Exception:
        pass
    return {"paginas": paginas, "sumario": _secoes_por_sumario(r), "titulo": meta_titulo}


def secoes(ext: dict, max_secoes: int = 60) -> list[dict]:
    pags = ext["paginas"]
    n = len(pags)
    res: list[dict] = []
    if ext["sumario"]:                                     # 1) sumário do PDF
        marcos = ext["sumario"]
        for i, (t, p) in enumerate(marcos):
            fim = marcos[i + 1][1] - 1 if i + 1 < len(marcos) else n - 1
            fim = max(fim, p)
            res.append({"titulo": t, "pi": p, "pf": fim, "texto": "\n".join(pags[p:fim + 1])})
        origem = "sumário do PDF"
    else:                                                   # 2) títulos detectados no texto
        atual = None
        for pi, txt in enumerate(pags):
            for li, linha in enumerate(txt.split("\n")):
                if _e_titulo(linha):
                    if atual:
                        atual["pf"] = max(atual["pi"], pi - 1 if li < 3 else pi)
                        res.append(atual)
                    atual = {"titulo": linha.strip().rstrip(":"), "pi": pi, "pf": pi, "linhas": []}
                elif atual is not None:
                    atual["linhas"].append(linha)
                else:
                    atual = {"titulo": "Introdução", "pi": pi, "pf": pi, "linhas": [linha]}
        if atual:
            atual["pf"] = n - 1 if not res else max(atual["pi"], n - 1)
            res.append(atual)
        for s in res:
            s["texto"] = "\n".join(s.pop("linhas"))
        origem = "títulos do texto"
        if len([s for s in res if len(s["texto"].split()) > 60]) < 2:     # 3) blocos de páginas
            res, bloco = [], (2 if n <= 30 else 3)
            for i in range(0, n, bloco):
                res.append({"titulo": f"Páginas {i + 1}–{min(n, i + bloco)}", "pi": i, "pf": min(n, i + bloco) - 1, "texto": "\n".join(pags[i:i + bloco])})
            origem = "blocos de páginas"
    # juntar seções minúsculas na anterior
    junt: list[dict] = []
    for s in res:
        if junt and len(s["texto"].split()) < 60:
            junt[-1]["texto"] += "\n" + s["titulo"] + "\n" + s["texto"]
            junt[-1]["pf"] = max(junt[-1]["pf"], s["pf"])
        else:
            junt.append(s)
    junt = [s for s in junt if len(s["texto"].split()) >= 30] or junt
    for s in junt[:max_secoes]:
        s["texto"] = _paragrafos(s["texto"])
        s["titulo"] = re.sub(r"\s+", " ", s["titulo"])[:90]
    return [dict(s, origem=origem) for s in junt[:max_secoes]]


def _tokens(t: str) -> list[str]:
    return [w.lower() for w in PALAVRA.findall(t)]


def _termos(textos: list[str], k: int = 8, fixos: list[set] | None = None) -> list[list[str]]:
    """TF-IDF com expressões de 2 palavras (ex.: "retículo sarcoplasmático") e filtro de verbos."""
    docs = []
    for t in textos:
        toks = _tokens(t)
        c = Counter(w for w in toks if w not in STOP)
        bi = Counter()
        for trecho in re.split(r"[.,;:!?()\n]", t):            # expressões só dentro da mesma frase/oração
            tk = [w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ\-]+", trecho)]   # inclui palavras curtas: "fibras do tipo" não vira par
            for a, b in zip(tk, tk[1:]):
                if len(a) > 3 and len(b) > 3 and a not in STOP and b not in STOP and not a.endswith(VERBAL) and not b.endswith(VERBAL):
                    bi[f"{a} {b}"] += 1
        for b, n in bi.items():
            if n >= 2:
                c[b] = n * 1.8
        docs.append(c)
    df = Counter(w for d in docs for w in d)
    N = len(docs)
    saida = []
    for i, d in enumerate(docs):
        fx = fixos[i] if fixos else set()
        sc = {}
        for w, c in d.items():
            if c < 2 and N > 1 and w not in fx:
                continue
            v = c * math.log(1 + N / df[w]) * (1.3 if len(w) > 6 else 1)
            if " " not in w and w.endswith(VERBAL) and w not in fx:
                v *= .35
            if w in fx:
                v *= 2.5
            sc[w] = v
        escolhidos = []
        for w, _ in sorted(sc.items(), key=lambda x: -x[1]):
            if any(w in e.split() for e in escolhidos if " " in e):
                continue                                  # unigrama já coberto por uma expressão
            if " " in w:
                escolhidos = [e for e in escolhidos if e not in w.split()]
            escolhidos.append(w)
            if len(escolhidos) >= k:
                break
        saida.append(escolhidos)
    return saida


def _definicoes(frases: list[str]) -> list[tuple[str, str]]:
    out = []
    for f in frases:
        m = re.match(rf"^(?:(?:Os|As|Uma|Um|O|A)\s+)?([A-ZÀ-Úa-zà-ú][\w\sÀ-ÿ\-/()]{{2,55}}?)\s+{VERBOS_DEF}\s+(.{{15,260}})$", f)
        if m and len(m.group(1).split()) <= 6:
            termo = m.group(1).strip(" ,")
            pals = termo.lower().split()
            if termo.lower() in PRONOMES or termo.lower() in STOP or len(termo) < 4 or len(pals) > 5 \
                    or any(x in ("quando", "que", "se", "onde", "como") for x in pals) \
                    or any(x.endswith(("ece", "ica", "ia", "ou")) and len(pals) > 2 for x in pals[1:]):
                continue
            out.append((termo, f))
        else:
            m2 = re.match(r"^([A-ZÀ-Ú][\w\sÀ-ÿ\-]{2,45}):\s+(.{15,260})$", f)
            if m2:
                out.append((m2.group(1).strip(), m2.group(2).strip()))
    vistos, res = set(), []
    for t, d in out:
        if t.lower() not in vistos:
            res.append((t, d)); vistos.add(t.lower())
    return res[:8]


def _id(*partes) -> str:
    return hashlib.md5("|".join(map(str, partes)).encode()).hexdigest()[:10]


def _cloze(frases: list[str], termos: list[str], n: int = 6) -> list[dict]:
    cards, usados = [], set()
    num = re.compile(r"\b(\d{1,4}(?:[.,]\d+)?)\s*(dias|anos|meses|horas|%|por cento|mV|kg|cm|mm|vezes|semanas)\b", re.I)
    for f in frases:                                          # números com unidade primeiro (prazos, valores)
        m = num.search(f)
        if m and f not in usados:
            cards.append({"f": f[:m.start()] + "<b>_____</b> " + m.group(2) + f[m.end():], "v": f"<b>{m.group(1)} {m.group(2)}</b><br><small>{f}</small>", "tipo": "número"})
            usados.add(f)
        if len(cards) >= n // 2:
            break
    for t in termos:
        for f in frases:
            if f in usados:
                continue
            m = re.search(rf"\b{re.escape(t)}\b", f, re.I)
            if m and m.start() > 0:
                cards.append({"f": f[:m.start()] + "<b>_____</b>" + f[m.end():], "v": f"<b>{m.group(0)}</b><br><small>{f}</small>", "tipo": "lacuna", "resp": m.group(0)})
                usados.add(f)
                break
        if len(cards) >= n:
            break
    return cards


def organizar(caminho: str | Path, nome: str, doc_id: str) -> dict:
    """Devolve {doc, topicos, aulas, cartoes}. Os ids são estáveis para o mesmo PDF."""
    ext = extrair(caminho)
    sec = secoes(ext)
    defs_por = [_definicoes(_frases(s["texto"])) for s in sec]
    termos = _termos([s["texto"] for s in sec], fixos=[{t.lower() for t, _ in d} for d in defs_por])
    todos_termos = sorted({t for ts in termos for t in ts})
    topicos, aulas, cartoes = [], {}, []
    for i, (s, ts) in enumerate(zip(sec, termos)):
        tid = f"p-{doc_id}-{i + 1}"
        fr = _frases(s["texto"])
        defs = defs_por[i]
        clz = _cloze(fr, ts)
        palavras = len(s["texto"].split())
        topicos.append({"id": tid, "t": s["titulo"], "p": 3 if palavras > 600 else 2 if palavras > 200 else 1,
                        "pi": s["pi"] + 1, "pf": s["pf"] + 1, "palavras": palavras})
        for t, d in defs:
            cartoes.append({"id": _id(tid, t), "f": f"O que é <b>{t}</b>?", "v": d, "tema_topico": tid, "pag": s["pi"] + 1})
        for c in clz:
            cartoes.append({"id": _id(tid, c["f"]), "f": c["f"], "v": c["v"], "tema_topico": tid, "pag": s["pi"] + 1})
        aulas[tid] = _aula_auto(s, ts, fr, defs, clz, todos_termos, doc_id)
    return {
        "doc": {"id": doc_id, "nome": nome, "titulo": ext["titulo"] or nome, "paginas": len(ext["paginas"]),
                "origem": sec[0]["origem"] if sec else "", "secoes": len(sec),
                "palavras": sum(len(s["texto"].split()) for s in sec)},
        "topicos": topicos, "aulas": aulas, "cartoes": cartoes,
        "textos": {f"p-{doc_id}-{i + 1}": s["texto"] for i, s in enumerate(sec)},
    }


def _destacar(p: str, termos: list[str]) -> str:
    import html as _h
    p = _h.escape(p)
    for t in termos[:6]:
        p = re.sub(rf"\b({re.escape(t)})\b", r"<b>\1</b>", p, count=1, flags=re.I)
    return p


def _aula_auto(s, ts, fr, defs, clz, todos, doc_id) -> dict:
    import random
    rnd = random.Random(s["titulo"])
    pars = [p for p in s["texto"].split("\n\n") if len(p.split()) > 8]
    blocos, buf, n = [], [], 0
    for p in pars:
        buf.append(p); n += len(p.split())
        if n >= 140:
            blocos.append(buf); buf, n = [], 0
    if buf:
        blocos.append(buf)
    blocos = blocos[:8]
    ramos = []
    for t in ts[:6]:
        trechos = [f for f in fr if re.search(rf"\b{re.escape(t)}\b", f, re.I)][:2]
        itens = [(x[:70] + "…") if len(x) > 70 else x for x in trechos] or ["aparece neste trecho"]
        ramos.append([t.capitalize(), itens])
    quiz = []
    for c in [c for c in clz if c.get("resp")][:5]:
        certo = c["resp"]
        distr = [t for t in todos if t.lower() != certo.lower() and (" " in t) == (" " in certo)] or [t for t in todos if t.lower() != certo.lower()]
        rnd.shuffle(distr)
        ops = [certo] + distr[:3]
        rnd.shuffle(ops)
        quiz.append({"q": re.sub("<[^>]+>", "", c["f"]).replace("_____", "_____"), "o": ops, "a": ops.index(certo),
                     "e": re.sub("<[^>]+>", "", c["v"].split("<br>")[-1])})
    aula = {
        "titulo": s["titulo"], "auto": True,
        "ideia": (fr[0] if fr else s["texto"][:200]),
        "fonte": {"doc": doc_id, "pi": s["pi"] + 1, "pf": s["pf"] + 1},
        "mapa": {"raiz": s["titulo"][:40], "ramos": ramos or [["Trecho", ["Leia o texto original"]]]},
        "recupere": [f"O que você já sabe sobre \"{s['titulo']}\"?",
                     (f"Como você explicaria \"{ts[0]}\" com suas palavras?" if ts else "Qual parece ser a ideia principal?"),
                     (f"Que relação pode existir entre \"{ts[0]}\" e \"{ts[1]}\"?" if len(ts) > 1 else "Onde isso se aplica na prática?")],
        "blocos": [{"t": f"Parte {i + 1}", "html": "".join(f"<p>{_destacar(p, ts)}</p>" for p in b)} for i, b in enumerate(blocos)],
        "quiz": quiz,
        "feynman": {"pergunta": f"Explique \"{s['titulo']}\" em 3 frases simples.", "chaves": ts[:6]},
        "fontes": [f"PDF, páginas {s['pi'] + 1}–{s['pf'] + 1}"],
    }
    if len(defs) >= 3:
        aula["widget"] = "parear"
        aula["parear"] = [[t, (d[:110] + "…") if len(d) > 110 else d] for t, d in defs[:6]]
    return aula
