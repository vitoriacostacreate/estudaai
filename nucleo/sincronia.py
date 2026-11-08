"""Sincronia do conteúdo e do progresso pelo cofre do Obsidian (o Obsidian Sync leva os arquivos).

Cada aparelho escreve só a sua nota, <cofre>/estudaai-sync/<aparelho>.md, com um resumo legível,
o histórico do que mudou e um bloco ```json com {estado, biblioteca}. Os PDFs vão em
estudaai-sync/arquivos/ (o pacote JSON vira <id>.json.md, porque o Sync não leva .json por padrão).
Juntar os dados é com o app (fonte/js/22-sincronia.js): aqui só se lê e se grava.
"""
from __future__ import annotations

import json
import re
import secrets
import shutil
import socket
from datetime import datetime
from pathlib import Path

PASTA = "estudaai-sync"
CERCA = "```"
_FRONT = re.compile(r"^---\n(.*?)\n---\n", re.S)
_DADOS = re.compile(r"```json\n(.*)\n```\s*$", re.S)
_HIST = re.compile(r"^- (.+)$", re.M)
NOME_OK = re.compile(r"^[a-z0-9][a-z0-9\-]{0,62}$")


def _ler_json(arq: Path, padrao):
    try:
        return json.loads(arq.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def _slug(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:40]


def aparelho(dados: Path) -> str:
    """Nome deste aparelho na pasta do cofre. config.json → nome_aparelho (ex.: "notebook"); senão o nome
    do Windows + 4 letras sorteadas uma vez (guardado em dados/sincronia.json), para o notebook e o PC
    nunca escreverem na mesma nota mesmo se tiverem o mesmo nome."""
    nome = _slug(str(_ler_json(dados / "config.json", {}).get("nome_aparelho") or ""))
    if NOME_OK.match(nome):
        return nome
    arq = dados / "sincronia.json"
    s = _ler_json(arq, {})
    if not NOME_OK.match(str(s.get("aparelho") or "")):
        s["aparelho"] = f"{_slug(socket.gethostname()) or 'aparelho'}-{secrets.token_hex(2)}"
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
    return s["aparelho"]


def achar_cofre(dados: Path) -> Path | None:
    """config.json → cofre_obsidian (caminho, ou "nao" para desligar); senão a 1ª pasta acima de dados/ com .obsidian."""
    cfg = _ler_json(dados / "config.json", {}).get("cofre_obsidian", "")
    if isinstance(cfg, str) and cfg.strip().lower() in ("nao", "não", "off"):
        return None
    if isinstance(cfg, str) and cfg.strip() and Path(cfg.strip()).is_dir():
        return Path(cfg.strip())
    for d in Path(dados).resolve().parents:
        if (d / ".obsidian").is_dir():
            return d
    return None


# ---------- resumo do que mudou ----------
ROTULOS = [("pdfs", "PDF", "PDFs"), ("estudos", "estudo de tópico", "estudos de tópico"),
           ("cartoes", "revisão de cartão", "revisões de cartão"), ("tentativas", "resposta registrada", "respostas registradas"),
           ("foco", "sessão de foco", "sessões de foco"), ("imersoes", "imersão do prepara.ai", "imersões do prepara.ai"),
           ("dias", "dia de estudo", "dias de estudo")]


def contar(estado: dict, biblioteca: dict) -> dict:
    e, b = estado or {}, biblioteca or {}
    soma = lambda d: sum(int(v.get("n") or 0) for v in (d or {}).values() if isinstance(v, dict))  # noqa: E731
    prep = (e.get("prepara") or {}).get("concluidas") or {}
    return {"pdfs": len(b.get("docs") or []), "estudos": soma(e.get("top")), "cartoes": soma(e.get("cards")),
            "tentativas": len(e.get("tentativas") or []), "foco": len((e.get("foco") or {}).get("sessoes") or []),
            "imersoes": sum(1 for v in prep.values() if v), "dias": len(e.get("dias") or {})}


def resumo(antes: dict, depois: dict) -> str:
    partes = []
    for k, um, varios in ROTULOS:
        d = depois.get(k, 0) - antes.get(k, 0)
        if d:
            partes.append(f"{'+' if d > 0 else '−'}{abs(d)} {um if abs(d) == 1 else varios}")
    return ", ".join(partes) or "ajustes (anotações, respostas ou configurações)"


# ---------- nota ----------
def ler_nota(arq: Path) -> dict | None:
    try:
        txt = arq.read_text(encoding="utf-8")
    except OSError:
        return None
    m, d = _FRONT.match(txt), _DADOS.search(txt)
    if not m or not d:
        return None
    meta = dict(linha.split(": ", 1) for linha in m.group(1).splitlines() if ": " in linha)
    try:
        dados = json.loads(d.group(1))
    except json.JSONDecodeError:
        return None
    corpo = txt[: d.start()]
    hist = _HIST.findall(corpo.split("## Histórico", 1)[1]) if "## Histórico" in corpo else []
    return {"aparelho": meta.get("aparelho", arq.stem), "atualizado": meta.get("atualizado", ""),
            "estado": dados.get("estado") or {}, "biblioteca": dados.get("biblioteca") or {}, "historico": hist}


def _nota(ap: str, quando: datetime, versao: str, estado: dict, bib: dict, hist: list[str]) -> str:
    c = contar(estado, bib)
    tabela = "\n".join(f"| {varios[0].upper() + varios[1:]} | {c[k]} |" for k, _, varios in ROTULOS)
    dados = json.dumps({"estado": estado, "biblioteca": bib}, ensure_ascii=False, separators=(",", ":"))
    return (f"---\naparelho: {ap}\natualizado: {quando.isoformat(timespec='seconds')}\napp: estudaai {versao}\n---\n"
            f"# estudaai: progresso do {ap}\n\n"
            "> Gerada sozinha pelo estudaai. Não edite à mão: o app do outro aparelho lê o bloco de dados no fim.\n\n"
            f"**Última sincronia:** {quando.strftime('%d/%m/%Y %H:%M')}\n\n"
            f"## Totais\n\n| O que | Total |\n|---|---|\n{tabela}\n\n"
            "## Histórico\n\n" + "\n".join(f"- {h}" for h in hist) + "\n\n"
            f"## Dados\n\n{CERCA}json\n{dados}\n{CERCA}\n")


def _copiar_arquivos(origem: Path, destino: Path, para_cofre: bool) -> int:
    """PDF vai como está; o pacote .json vira .json.md (com cerca) no cofre e volta a ser .json no app. Só copia o que falta."""
    if not origem.is_dir():
        return 0
    destino.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in origem.iterdir():
        if f.suffix == ".pdf":
            alvo = destino / f.name
            if not alvo.exists():
                shutil.copy2(f, alvo); n += 1
        elif para_cofre and f.suffix == ".json":
            alvo = destino / (f.name + ".md")
            if not alvo.exists():
                alvo.write_text(f"{CERCA}json\n{f.read_text(encoding='utf-8')}\n{CERCA}\n", encoding="utf-8"); n += 1
        elif not para_cofre and f.name.endswith(".json.md"):
            alvo = destino / f.name[:-3]
            if not alvo.exists():
                m = re.search(r"```json\n(.*)\n```", f.read_text(encoding="utf-8"), re.S)
                if m:
                    alvo.write_text(m.group(1), encoding="utf-8"); n += 1
    return n


def exportar(dados: Path, cofre: Path, ap: str, versao: str, agora: datetime | None = None) -> dict:
    """Grava a nota deste aparelho se o estado ou a biblioteca mudaram, e copia os PDFs novos."""
    pasta = cofre / PASTA
    estado = _ler_json(dados / "estado.json", {})
    bib = _ler_json(dados / "biblioteca.json", {"docs": [], "temas": [], "anexos": {}})
    _copiar_arquivos(dados / "arquivos", pasta / "arquivos", True)
    arq = pasta / f"{ap}.md"
    antiga = ler_nota(arq)
    if antiga and antiga["estado"] == estado and antiga["biblioteca"] == bib:
        return {"mudou": False, "atualizado": antiga["atualizado"]}
    quando = agora or datetime.now()
    linha = f"{quando.strftime('%d/%m %H:%M')}: " + resumo(contar(antiga["estado"], antiga["biblioteca"]) if antiga else {}, contar(estado, bib))
    hist = [linha] + (antiga["historico"] if antiga else [])[:29]
    pasta.mkdir(parents=True, exist_ok=True)
    tmp = arq.with_suffix(".tmp")
    tmp.write_text(_nota(ap, quando, versao, estado, bib, hist), encoding="utf-8")
    tmp.replace(arq)
    return {"mudou": True, "atualizado": quando.isoformat(timespec="seconds")}


def outros(dados: Path, cofre: Path, ap: str) -> list[dict]:
    """Notas dos outros aparelhos, sem os dados pesados, com a marca de 'vista' deste aparelho."""
    vistos = _ler_json(dados / "sincronia.json", {}).get("vistos", {})
    out = []
    for arq in sorted((cofre / PASTA).glob("*.md")):
        if arq.stem == ap:
            continue
        n = ler_nota(arq)
        if n:
            out.append({"aparelho": n["aparelho"], "atualizado": n["atualizado"], "visto": vistos.get(n["aparelho"], ""),
                        "ultimo": n["historico"][0] if n["historico"] else ""})
    return out


def baixar(dados: Path, cofre: Path, nome: str) -> dict | None:
    """Dados completos de outro aparelho; traz para dados/arquivos os PDFs e pacotes que faltam."""
    if not NOME_OK.match(nome or ""):
        return None
    n = ler_nota(cofre / PASTA / f"{nome}.md")
    if n:
        _copiar_arquivos(cofre / PASTA / "arquivos", dados / "arquivos", False)
    return n


def marcar_visto(dados: Path, nome: str, atualizado: str) -> None:
    arq = dados / "sincronia.json"
    s = _ler_json(arq, {})
    s.setdefault("vistos", {})[nome] = atualizado
    arq.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")
