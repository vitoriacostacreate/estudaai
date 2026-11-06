"""IA opcional: gera aulas, revisa respostas e pesquisa dúvidas (Claude, ChatGPT ou Gemini).

Regra de escolha (sem a aluna decidir nada):
  1. APIs pagas, na ordem do melhor modelo para a atividade (CADEIA);
  2. se nenhuma responder (sem chave, sem crédito, limite), o Gemini da camada gratuita;
  3. se nada funcionar, o app oferece "copiar e abrir no chat" (assinatura ou versão grátis no navegador).
Se uma chamada falhar, tenta a próxima da cadeia sozinho.

Chaves em dados/config.json (o CONFIGURAR-IA.bat preenche):
    {"anthropic_api_key": "...", "openai_api_key": "...", "gemini_api_key": "...", "gemini_plano": "gratis" | "pago"}
ou nas variáveis ANTHROPIC_API_KEY, OPENAI_API_KEY e GEMINI_API_KEY.
Opcional: "modelo", "modelo_openai", "modelo_gemini" fixam um modelo e ignoram a tabela por atividade.
As chaves nunca saem do computador, exceto na chamada para a API de cada empresa.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

# provedor: (campo da chave, variável de ambiente, campo que fixa o modelo)
PROVEDORES = {
    "anthropic": ("anthropic_api_key", "ANTHROPIC_API_KEY", "modelo"),
    "openai": ("openai_api_key", "OPENAI_API_KEY", "modelo_openai"),
    "gemini": ("gemini_api_key", "GEMINI_API_KEY", "modelo_gemini"),
}
CAMPOS = [c for p in PROVEDORES.values() for c in (p[0], p[2])] + ["gemini_plano", "modelo_gemini_gratis", "modelo_gemini_pro"]

# Melhor modelo de cada provedor para cada atividade (o primeiro da lista é tentado primeiro).
# aula: JSON longo e didático · revisao: rigor e checagem de fatos · duvidas: pesquisa e resumo.
CADEIA = {
    "aula":    [("anthropic", "claude-opus-5-5"), ("openai", "gpt-5"), ("gemini", "gemini-2.5-pro")],
    "revisao": [("anthropic", "claude-opus-5-5"), ("openai", "gpt-5"), ("gemini", "gemini-2.5-pro")],
    "duvidas": [("anthropic", "claude-sonnet-5-5"), ("openai", "gpt-5"), ("gemini", "gemini-2.5-pro")],
}
MODELO_GRATIS = "gemini-2.5-flash"      # o que a camada gratuita do Google AI Studio aguenta bem
BUSCA = {"aula": False, "revisao": True, "duvidas": True}
LIMITE = {"aula": 20000, "revisao": 80000, "duvidas": 40000}
SAIDA = {"aula": 8000, "revisao": 12000, "duvidas": 12000}
NOME = {"anthropic": "Claude", "openai": "ChatGPT", "gemini": "Gemini"}

# Onde pegar cada chave e como reconhecê-la (usado pelo configurar_ia.py).
PAGINA_CHAVE = {
    "gemini": "https://aistudio.google.com/apikey",
    "anthropic": "https://console.anthropic.com/settings/keys",
    "openai": "https://platform.openai.com/api-keys",
}
FORMATO_CHAVE = {"anthropic": r"sk-ant-[A-Za-z0-9_\-]{20,}", "openai": r"sk-(?!ant-)[A-Za-z0-9_\-]{20,}", "gemini": r"(?:AIza|AQ\.)[0-9A-Za-z_\-]{30,}"}   # AQ.: formato novo do AI Studio (2026)


def config(dados: Path) -> dict:
    cfg = {}
    arq = dados / "config.json"
    if arq.exists():
        try:
            cfg = json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    for chave, env, campo_modelo in PROVEDORES.values():
        cfg[chave] = cfg.get(chave) or os.environ.get(env, "")   # chave vazia no arquivo não esconde a do ambiente
        cfg[campo_modelo] = cfg.get(campo_modelo) or (os.environ.get("ESTUDAAI_MODELO", "") if campo_modelo == "modelo" else "")
    cfg["gemini_plano"] = "pago" if cfg.get("gemini_plano") == "pago" else "gratis"
    return cfg


def provedores(dados: Path) -> list[str]:
    """Provedores com chave, na ordem de preferência (Claude → ChatGPT → Gemini)."""
    cfg = config(dados)
    return [p for p, (chave, *_) in PROVEDORES.items() if cfg.get(chave)]


def disponivel(dados: Path) -> bool:
    return bool(provedores(dados))


def cadeia(dados: Path, atividade: str) -> list[dict]:
    """Ordem real de tentativa para a atividade: pagas (melhor modelo primeiro) → gratuita."""
    cfg = config(dados)
    pagas, gratis = [], []
    for prov, modelo in CADEIA[atividade]:
        if not cfg[PROVEDORES[prov][0]]:
            continue
        livre = prov == "gemini" and cfg["gemini_plano"] == "gratis"
        if livre:                # grátis: vários flash da conta, em sequência (um sobrecarregado não derruba tudo)
            modelos = [cfg["modelo_gemini"]] if cfg["modelo_gemini"] else \
                (cfg.get("modelos_gemini_gratis") or [cfg.get("modelo_gemini_gratis") or MODELO_GRATIS])
            gratis += [{"provedor": prov, "modelo": m, "gratis": True} for m in modelos]
            continue
        if prov == "gemini":     # modelos escolhidos da lista da conta pelo configurar_ia (nome fixo envelhece)
            modelo = cfg.get("modelo_gemini_pro") or modelo
        pagas.append({"provedor": prov, "modelo": cfg[PROVEDORES[prov][2]] or modelo, "gratis": False})
    return pagas + gratis


def _post(url: str, corpo: dict, headers: dict, timeout=240) -> dict:
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(), method="POST",
                                 headers={"content-type": "application/json", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode()).get("error", {})
            msg = msg.get("message") if isinstance(msg, dict) else str(msg)
        except Exception:
            msg = ""
        raise RuntimeError(f"respondeu {e.code}: {msg or e.reason}") from None


# ---------- chamadas por provedor (devolvem o texto da resposta) ----------
def _anthropic(chave: str, modelo: str, prompt: str, busca: bool, max_tokens: int) -> str:
    msgs = [{"role": "user", "content": prompt}]
    corpo = {"model": modelo, "max_tokens": max_tokens, "messages": msgs}
    if busca:
        corpo["tools"] = [{"type": "web_search_20250305", "name": "web_search", "max_uses": 8}]
    partes = []
    for _ in range(4):        # a busca na web pode pausar o turno (pause_turn): continua de onde parou
        resp = _post("https://api.anthropic.com/v1/messages", corpo, {"x-api-key": chave, "anthropic-version": "2023-06-01"})
        partes += [b.get("text", "") for b in resp.get("content", []) if b.get("type") == "text"]
        if resp.get("stop_reason") != "pause_turn":
            break
        msgs.append({"role": "assistant", "content": resp["content"]})
    return "".join(partes)


def _openai(chave: str, modelo: str, prompt: str, busca: bool, max_tokens: int) -> str:
    corpo = {"model": modelo, "input": prompt, "max_output_tokens": max_tokens}
    if busca:
        corpo["tools"] = [{"type": "web_search"}]
    resp = _post("https://api.openai.com/v1/responses", corpo, {"authorization": "Bearer " + chave})
    if resp.get("output_text"):
        return resp["output_text"]
    return "".join(c.get("text", "") for item in resp.get("output", []) if item.get("type") == "message"
                   for c in item.get("content", []) if c.get("type") == "output_text")


def _gemini(chave: str, modelo: str, prompt: str, busca: bool, max_tokens: int) -> str:
    corpo = {"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": {"maxOutputTokens": max_tokens}}
    if busca:
        corpo["tools"] = [{"google_search": {}}]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
    aviso = ""
    try:
        resp = _post(url, corpo, {"x-goog-api-key": chave}, timeout=120)
    except RuntimeError as e:
        if not (busca and "respondeu 429" in str(e)):
            raise
        # A camada grátis pode não liberar a busca do Google: responde sem ela, avisando.
        corpo.pop("tools")
        resp = _post(url, corpo, {"x-goog-api-key": chave}, timeout=120)
        aviso = AVISO_SEM_BUSCA
    cands = resp.get("candidates") or [{}]
    txt = "".join(p.get("text", "") for p in cands[0].get("content", {}).get("parts", []))
    return aviso + txt if txt.strip() else txt


AVISO_SEM_BUSCA = ("> ⚠️ **Sem busca na web nesta resposta**: a camada grátis do Gemini não liberou a busca do Google. "
                   "Trate os fatos como \"não verificados na web\" e confira na fonte o que for importante.\n\n")
CHAMAR = {"anthropic": _anthropic, "openai": _openai, "gemini": _gemini}


def gerar_texto(dados: Path, prompt: str, atividade: str = "revisao", validar=None) -> dict:
    """Tenta a cadeia da atividade até uma IA responder. validar(texto) pode recusar a resposta (levanta erro).
    Devolve {"provedor", "modelo", "gratis", "texto", "falhas"}."""
    ordem = cadeia(dados, atividade)
    if not ordem:
        raise RuntimeError("Nenhuma IA configurada. Rode o CONFIGURAR-IA.bat, ou use 'Copiar e abrir no chat'.")
    cfg = config(dados)
    falhas = []
    for op in ordem:
        try:
            txt = CHAMAR[op["provedor"]](cfg[PROVEDORES[op["provedor"]][0]], op["modelo"], prompt[:LIMITE[atividade]],
                                         BUSCA[atividade], SAIDA[atividade]).strip()
            if not txt:
                raise RuntimeError("respondeu vazio")
            if validar:
                validar(txt)
            return {**op, "texto": txt, "falhas": falhas}
        except Exception as e:  # noqa: BLE001  (sem crédito, limite, rede, JSON ruim: tenta a próxima)
            falhas.append(f"{NOME[op['provedor']]} ({op['modelo']}): {e}")
    raise RuntimeError("Nenhuma IA respondeu. " + " · ".join(falhas))


def _json_da_aula(txt: str) -> dict:
    i, j = txt.find("{"), txt.rfind("}")
    if i < 0 or j < 0:
        raise RuntimeError("não devolveu um JSON")
    return json.loads(txt[i:j + 1])


def gerar_aula(dados: Path, prompt: str) -> dict:
    """Envia o pedido de aula (montado pelo app) e devolve o JSON da aula. Resposta sem JSON válido passa para a próxima IA."""
    r = gerar_texto(dados, prompt, "aula", validar=_json_da_aula)
    return _json_da_aula(r["texto"])


# ---------- conferir uma chave (sem gastar crédito: só lista os modelos) ----------
def melhores_gemini(modelos: list) -> dict:
    """Da lista de modelos da conta: os 3 flash mais novos e o flash-lite mais novo (grátis, em sequência)
    e o pro mais novo. Ignora preview, tts, image etc."""
    import re
    achados = {"flash": [], "flash-lite": [], "pro": []}
    for m in modelos:
        nome = str(m.get("name", "")).removeprefix("models/")
        if "generateContent" not in m.get("supportedGenerationMethods", ["generateContent"]):
            continue
        if (r := re.fullmatch(r"gemini-(\d+(?:\.\d+)?)-(flash|flash-lite|pro)", nome)):
            achados[r.group(2)].append((float(r.group(1)), nome))
    out = {}
    gratis = [n for _, n in sorted(achados["flash"], reverse=True)[:3]] + [n for _, n in sorted(achados["flash-lite"], reverse=True)[:1]]
    if gratis:
        out["modelo_gemini_gratis"], out["modelos_gemini_gratis"] = gratis[0], gratis
    if achados["pro"]:
        out["modelo_gemini_pro"] = max(achados["pro"])[1]
    return out


def validar_chave(provedor: str, chave: str) -> dict:
    """Testa a chave. Devolve campos extras para salvar (no Gemini, os modelos atuais da conta)."""
    url, headers = {
        "anthropic": ("https://api.anthropic.com/v1/models", {"x-api-key": chave, "anthropic-version": "2023-06-01"}),
        "openai": ("https://api.openai.com/v1/models", {"authorization": "Bearer " + chave}),
        "gemini": ("https://generativelanguage.googleapis.com/v1beta/models", {"x-goog-api-key": chave}),
    }[provedor]
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:
            corpo = json.loads(r.read().decode() or "{}")
        return melhores_gemini(corpo.get("models", [])) if provedor == "gemini" else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError("a chave foi recusada" if e.code in (400, 401, 403) else f"a API respondeu {e.code}") from None
