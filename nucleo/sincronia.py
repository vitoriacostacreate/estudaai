"""Sincronia do progresso e dos PDFs entre aparelhos por um repositório Git privado SÓ DE DADOS,
clonado em dados/sync (o repositório do código nunca recebe dados pessoais).

O Git só transporta. Cada aparelho escreve apenas o próprio arquivo, <aparelho>.json, e acrescenta PDFs em
arquivos/, então nunca existe conflito de merge. O ciclo (sincronizar) é sempre o mesmo:

    buscar → ficar igual ao remoto → trazer os PDFs que faltam → regravar o meu arquivo a partir de dados/ →
    commit → enviar

O que está em dados/sync é sempre reconstruível a partir de dados/ e do remoto; por isso "ficar igual ao remoto"
(reset) é seguro e dispensa merge e rebase. Juntar os estados é com o app (fonte/js/22-sincronia.js), em 3 vias:
a base de cada outro aparelho (a última versão dele que já juntei) fica em dados/sinc-base/.

Sem internet o ciclo devolve ok=False e nada muda: o servidor tenta de novo depois.
A leitura das notas antigas do Google Drive/Obsidian (estudaai-sync/*.md) continua aqui só para a migração.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import shutil
import socket
import subprocess
from datetime import datetime
from pathlib import Path

PASTA = "estudaai-sync"            # pasta antiga, no Google Drive ou no cofre do Obsidian (só migração)
PASTA_REPO = "sync"                # dados/sync: o clone do repositório de dados
PASTA_BASE = "sinc-base"           # dados/sinc-base: última versão já juntada de cada outro aparelho
RAMO = "main"
LIMITE = 50 * 1024 * 1024          # arquivo maior que isso fica só neste aparelho (o GitHub recusa acima de 100 MB)
CERCA = "```"
_FRONT = re.compile(r"^---\n(.*?)\n---\n", re.S)
_DADOS = re.compile(r"```json\n(.*)\n```\s*$", re.S)
_HIST = re.compile(r"^- (.+)$", re.M)
NOME_OK = re.compile(r"^[a-z0-9][a-z0-9\-]{0,62}$")
NAO = ("nao", "não", "off")


def _ler_json(arq: Path, padrao):
    try:
        return json.loads(arq.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def _gravar_json(arq: Path, obj) -> None:
    """Chaves ordenadas e uma por linha: o histórico do Git fica pequeno e dá para ler o que mudou."""
    arq.parent.mkdir(parents=True, exist_ok=True)
    tmp = arq.with_suffix(".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    tmp.replace(arq)


def _slug(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:40]


def _local(dados: Path) -> dict:
    return _ler_json(dados / "sincronia.json", {})


def _gravar_local(dados: Path, s: dict) -> None:
    arq = dados / "sincronia.json"
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")


def aparelho(dados: Path) -> str:
    """Nome deste aparelho no repositório de dados. config.json → nome_aparelho (ex.: "notebook"); senão o nome
    do Windows + 4 letras sorteadas uma vez (guardado em dados/sincronia.json), para o notebook e o PC
    nunca escreverem no mesmo arquivo mesmo se tiverem o mesmo nome."""
    nome = _slug(str(_ler_json(dados / "config.json", {}).get("nome_aparelho") or ""))
    if NOME_OK.match(nome):
        return nome
    s = _local(dados)
    if not NOME_OK.match(str(s.get("aparelho") or "")):
        s["aparelho"] = f"{_slug(socket.gethostname()) or 'aparelho'}-{secrets.token_hex(2)}"
        _gravar_local(dados, s)
    return s["aparelho"]


def instalacao(dados: Path) -> str:
    """Código sorteado uma vez por pasta dados/. Se a pasta for apagada e recriada, o código muda, e os outros
    aparelhos deixam de tratar o que sumiu como "apagado de propósito" (ver outros)."""
    s = _local(dados)
    if not s.get("instalacao"):
        s["instalacao"] = secrets.token_hex(8)
        _gravar_local(dados, s)
    return s["instalacao"]


def repo(dados: Path) -> Path | None:
    """O clone do repositório de dados, se a sincronia estiver configurada (CONFIGURAR-SINCRONIA.bat).
    config.json → "sincronia_git": "nao" desliga."""
    cfg = _ler_json(dados / "config.json", {}).get("sincronia_git")
    if isinstance(cfg, str) and cfg.strip().lower() in NAO:
        return None
    rp = dados / PASTA_REPO
    return rp if (rp / ".git").exists() else None


def git(rp: Path, *args: str, timeout: float = 40) -> tuple[bool, str]:
    """Roda o git sem nunca parar para perguntar nada (senha, editor). Devolve (deu certo, saída)."""
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never", "GIT_EDITOR": "true"}
    cmd = ["git", "-c", "core.autocrlf=false", "-c", "core.quotepath=false", "-C", str(rp), *args]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout, env=env,
                           stdin=subprocess.DEVNULL, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except FileNotFoundError:
        return False, "o Git não está instalado"
    except subprocess.TimeoutExpired:
        return False, "o Git demorou demais"
    return r.returncode == 0, (r.stdout + r.stderr).strip()


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


def vazio(estado: dict, biblioteca: dict) -> bool:
    """Aparelho recém-instalado, ainda sem nada: não há o que enviar (e enviar "nada" confundiria os outros)."""
    e, b = estado or {}, biblioteca or {}
    return not any(e.get(k) for k in ("top", "cards", "dias", "tentativas", "duvidas")) and not b.get("docs") \
        and not (e.get("foco") or {}).get("sessoes") and not (e.get("prepara") or {}).get("r")


# ---------- arquivo de cada aparelho ----------
def ler_aparelho(arq: Path) -> dict | None:
    d = _ler_json(arq, None)
    if not isinstance(d, dict) or not isinstance(d.get("estado"), dict):
        return None
    return {"aparelho": d.get("aparelho") or arq.stem, "atualizado": d.get("atualizado") or "", "app": d.get("app") or "",
            "instalacao": d.get("instalacao") or "", "historico": d.get("historico") or [],
            "estado": d["estado"], "biblioteca": d.get("biblioteca") or {}}


def _copiar_que_faltam(origem: Path, destino: Path) -> list[str]:
    """PDFs e pacotes JSON: só copia o que falta (os nomes são únicos e o conteúdo não muda).
    Devolve os nomes dos que ficaram de fora por serem grandes demais."""
    grandes = []
    if not origem.is_dir():
        return grandes
    destino.mkdir(parents=True, exist_ok=True)
    for f in sorted(origem.iterdir()):
        if f.suffix not in (".pdf", ".json") or not f.is_file():
            continue
        if f.stat().st_size > LIMITE:
            grandes.append(f.name)
        elif not (destino / f.name).exists():
            shutil.copy2(f, destino / f.name)
    return grandes


def exportar(dados: Path, rp: Path, ap: str, versao: str, agora: datetime | None = None) -> dict:
    """Regrava <aparelho>.json no clone se o estado ou a biblioteca mudaram, e copia os PDFs novos."""
    estado = _ler_json(dados / "estado.json", {})
    bib = _ler_json(dados / "biblioteca.json", {"docs": [], "temas": [], "anexos": {}})
    grandes = _copiar_que_faltam(dados / "arquivos", rp / "arquivos")
    arq = rp / f"{ap}.json"
    antigo = ler_aparelho(arq)
    inst = instalacao(dados)
    if vazio(estado, bib):
        return {"mudou": False, "atualizado": antigo["atualizado"] if antigo else "", "grandes": grandes}
    if antigo and antigo["estado"] == estado and antigo["biblioteca"] == bib and antigo["instalacao"] == inst:
        return {"mudou": False, "atualizado": antigo["atualizado"], "grandes": grandes}
    quando = agora or datetime.now()
    linha = f"{quando.strftime('%d/%m %H:%M')}: " + resumo(contar(antigo["estado"], antigo["biblioteca"]) if antigo else {}, contar(estado, bib))
    hist = [linha] + (antigo["historico"] if antigo else [])[:29]
    atualizado = quando.isoformat(timespec="seconds")
    _gravar_json(arq, {"aparelho": ap, "atualizado": atualizado, "app": f"estudaai {versao}", "instalacao": inst,
                       "historico": hist, "estado": estado, "biblioteca": bib})
    return {"mudou": True, "atualizado": atualizado, "grandes": grandes}


def outros(dados: Path, rp: Path, ap: str) -> list[dict]:
    """Os outros aparelhos. Para os que têm novidade (novo=True) vão os dados completos e a base da junção de 3 vias:
    a última versão daquele aparelho que este já juntou. Se o outro foi reinstalado, a base não vale (base=None)
    e o app só une, sem apagar nada."""
    out = []
    for arq in sorted(rp.glob("*.json")):
        if arq.stem == ap or not NOME_OK.match(arq.stem):
            continue
        d = ler_aparelho(arq)
        if not d:
            continue
        base = ler_aparelho(dados / PASTA_BASE / arq.name)
        if base and base["atualizado"] == d["atualizado"]:
            out.append({"aparelho": arq.stem, "atualizado": d["atualizado"], "novo": False})
            continue
        vale = bool(base) and base["instalacao"] == d["instalacao"]
        out.append({"aparelho": arq.stem, "atualizado": d["atualizado"], "novo": True, "ultimo": (d["historico"] or [""])[0],
                    "estado": d["estado"], "biblioteca": d["biblioteca"],
                    "base": {"estado": base["estado"], "biblioteca": base["biblioteca"]} if vale else None})
    return out


def marcar_visto(dados: Path, rp: Path, nome: str, atualizado: str) -> bool:
    """O app juntou a versão `atualizado` do aparelho `nome`: ela vira a base da próxima junção."""
    if not NOME_OK.match(nome or ""):
        return False
    arq = rp / f"{nome}.json"
    d = ler_aparelho(arq)
    if not d or d["atualizado"] != atualizado:
        return False                      # chegou versão mais nova no meio do caminho: junta de novo na próxima
    (dados / PASTA_BASE).mkdir(parents=True, exist_ok=True)
    shutil.copy2(arq, dados / PASTA_BASE / arq.name)
    return True


# ---------- ciclo ----------
def _erro_de_rede(saida: str) -> str:
    s = saida.lower()
    if "não está instalado" in s or "demorou" in s:
        return saida + "."
    if any(p in s for p in ("authentication", "could not read username", "permission", "403", "401", "denied", "terminal prompts disabled")):
        return "o GitHub não aceitou o login deste aparelho (rode o CONFIGURAR-SINCRONIA.bat)."
    return "sem internet ou sem acesso ao GitHub."


def puxar(rp: Path) -> tuple[bool, str]:
    """Busca o remoto e deixa o clone igual a ele. Seguro: tudo o que é deste aparelho é regravado a partir de dados/."""
    ok, saida = git(rp, "fetch", "--quiet", "origin", timeout=25)
    if not ok:
        return False, _erro_de_rede(saida)
    if git(rp, "rev-parse", "-q", "--verify", f"refs/remotes/origin/{RAMO}")[0]:
        git(rp, "rebase", "--abort"); git(rp, "merge", "--abort")        # se alguém mexeu à mão e deixou algo pela metade
        ok, saida = git(rp, "reset", "--hard", f"origin/{RAMO}")
        if not ok:
            return False, "não consegui atualizar a pasta dados/sync: " + saida[-200:]
    return True, ""


def _enviar(rp: Path) -> tuple[bool, str]:
    git(rp, "add", "-A")
    if git(rp, "status", "--porcelain")[1]:
        ok, saida = git(rp, "-c", "user.name=estudaai", "-c", "user.email=estudaai@localhost", "commit", "--quiet", "-m",
                        f"progresso {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        if not ok:
            return False, "não consegui registrar a mudança: " + saida[-200:]
    cabeca = git(rp, "rev-parse", "-q", "--verify", "HEAD")
    remoto = git(rp, "rev-parse", "-q", "--verify", f"refs/remotes/origin/{RAMO}")
    if not cabeca[0] or (remoto[0] and cabeca[1] == remoto[1]):
        return True, ""                                                    # nada novo para enviar
    ok, saida = git(rp, "push", "--quiet", "origin", f"HEAD:refs/heads/{RAMO}", timeout=120)
    return (True, "") if ok else (False, saida)


def sincronizar(dados: Path, versao: str) -> dict:
    """Um ciclo completo. Nunca levanta erro e nunca pede nada: devolve {ok, erro, atualizado, grandes}.
    Se o outro aparelho enviou no mesmo instante (envio recusado), refaz o ciclo."""
    rp = repo(dados)
    if not rp:
        return {"ok": False, "erro": "sincronia desligada", "grandes": []}
    ap = aparelho(dados)
    erro, r = "", {"grandes": [], "atualizado": ""}
    for _ in range(3):
        ok, erro = puxar(rp)
        if not ok:
            break
        try:
            _copiar_que_faltam(rp / "arquivos", dados / "arquivos")       # PDFs e pacotes dos outros aparelhos
            migrou = migrar_drive(dados, rp, ap)
            r = exportar(dados, rp, ap, versao)
        except OSError as e:
            erro = f"não consegui gravar em dados/: {e}"
            break
        ok, saida = _enviar(rp)
        if ok:
            if migrou is not None:
                s = _local(dados); s["migrado_drive"] = True; _gravar_local(dados, s)
            return {"ok": True, "erro": "", "atualizado": r["atualizado"], "grandes": r["grandes"]}
        erro = _erro_de_rede(saida) if not re.search(r"rejected|fetch first|non-fast-forward", saida) else "o outro aparelho enviou ao mesmo tempo."
        if "ao mesmo tempo" not in erro:
            break
    return {"ok": False, "erro": erro, "atualizado": r["atualizado"], "grandes": r["grandes"]}


# ---------- migração da pasta antiga (Google Drive ou cofre do Obsidian) ----------
def google_drive() -> Path | None:
    """A pasta "Meu Drive" do Google Drive para computador (G:\\Meu Drive no Windows), se estiver instalado.
    ESTUDAAI_SEM_DRIVE=1 desliga a busca (os testes usam, para nunca ler o Drive de verdade)."""
    if os.environ.get("ESTUDAAI_SEM_DRIVE"):
        return None
    nomes = ("Meu Drive", "My Drive")
    cands = [Path(f"{letra}:/") / n for letra in "GHIJKLMNOPQRSTUVWXYZDEF" for n in nomes] if os.name == "nt" else []
    cands += [Path.home() / "Google Drive" / n for n in nomes] + [Path.home() / "Google Drive"]
    return next((c for c in cands if c.is_dir()), None)


def pasta_antiga(dados: Path) -> Path | None:
    """Onde ficava a pasta estudaai-sync/ antes do Git: config.json → pasta_sincronia (ou cofre_obsidian; "nao" = nenhuma)
    → Google Drive → a 1ª pasta acima de dados/ com .obsidian."""
    c = _ler_json(dados / "config.json", {})
    cfg = c.get("pasta_sincronia") or c.get("cofre_obsidian") or ""
    if isinstance(cfg, str) and cfg.strip().lower() in NAO:
        return None
    base = None
    if isinstance(cfg, str) and cfg.strip() and Path(cfg.strip()).is_dir():
        base = Path(cfg.strip())
    base = base or google_drive() or next((d for d in Path(dados).resolve().parents if (d / ".obsidian").is_dir()), None)
    return base / PASTA if base and (base / PASTA).is_dir() else None


def ler_nota(arq: Path) -> dict | None:
    """Nota antiga (<aparelho>.md com frontmatter e um bloco ```json no fim)."""
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


def migrar_drive(dados: Path, rp: Path, ap: str) -> int | None:
    """Traz o que está na pasta antiga, sem apagar nada de lá: as notas dos OUTROS aparelhos viram <aparelho>.json
    no clone (o app junta na próxima abertura) e os PDFs/pacotes que faltam vêm para dados/arquivos.
    A nota deste aparelho é ignorada: dados/ já é a versão mais nova dela.
    Devolve None se não havia o que fazer (já migrado ou sem pasta antiga), senão quantas notas trouxe."""
    if _local(dados).get("migrado_drive"):
        return None
    pasta = pasta_antiga(dados)
    if not pasta:
        return None
    destino = dados / "arquivos"
    if (pasta / "arquivos").is_dir():
        destino.mkdir(parents=True, exist_ok=True)
        for f in (pasta / "arquivos").iterdir():
            if f.suffix == ".pdf" and not (destino / f.name).exists():
                shutil.copy2(f, destino / f.name)
            elif f.name.endswith(".json.md") and not (destino / f.name[:-3]).exists():       # pacote embrulhado em nota
                m = re.search(r"```json\n(.*)\n```", f.read_text(encoding="utf-8"), re.S)
                if m:
                    (destino / f.name[:-3]).write_text(m.group(1), encoding="utf-8")
    n = 0
    for arq in sorted(pasta.glob("*.md")):
        nota = ler_nota(arq)
        nome = nota and nota["aparelho"]
        if not nota or nome == ap or not NOME_OK.match(nome or ""):
            continue
        atual = ler_aparelho(rp / f"{nome}.json")
        if atual and atual["atualizado"] >= nota["atualizado"]:
            continue                      # aquele aparelho já enviou coisa mais nova pelo Git
        _gravar_json(rp / f"{nome}.json", {"aparelho": nome, "atualizado": nota["atualizado"], "app": "migrado da pasta antiga",
                                           "instalacao": "", "historico": nota["historico"], "estado": nota["estado"], "biblioteca": nota["biblioteca"]})
        n += 1
    return n
