"""IA opcional: gera aulas e revisa respostas usando a API da Anthropic, da OpenAI ou do Google (Gemini).

Sem chave configurada, o estudaai continua funcionando (aula automática e "copiar pedido").
As chaves ficam em dados/config.json:
    {"anthropic_api_key": "...", "openai_api_key": "...", "gemini_api_key": "...",
     "modelo": "...", "modelo_openai": "...", "modelo_gemini": "..."}
ou nas variáveis de ambiente ANTHROPIC_API_KEY, OPENAI_API_KEY e GEMINI_API_KEY.
Elas nunca saem do seu computador, exceto na chamada para a API de cada empresa.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

MODELO_PADRAO = "claude-sonnet-5-5"
# (campo da chave, variável de ambiente, campo do modelo, modelo padrão)
PROVEDORES = {
    "anthropic": ("anthropic_api_key", "ANTHROPIC_API_KEY", "modelo", MODELO_PADRAO),
    "openai": ("openai_api_key", "OPENAI_API_KEY", "modelo_openai", "gpt-5"),
    "gemini": ("gemini_api_key", "GEMINI_API_KEY", "modelo_gemini", "gemini-2.5-pro"),
}
CAMPOS = [c for p in PROVEDORES.values() for c in (p[0], p[2])]
LIMITE_TEXTO = 80000          # caracteres do pedido de revisão (material + respostas)


def config(dados: Path) -> dict:
    cfg = {}
    arq = dados / "config.json"
    if arq.exists():
        try:
            cfg = json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    for chave, env, campo_modelo, padrao in PROVEDORES.values():
        cfg[chave] = cfg.get(chave) or os.environ.get(env, "")   # chave vazia no arquivo não esconde a do ambiente
        cfg[campo_modelo] = cfg.get(campo_modelo) or (os.environ.get("ESTUDAAI_MODELO") if campo_modelo == "modelo" else None) or padrao
    return cfg


def provedores(dados: Path) -> list[str]:
    """Provedores com chave, na ordem de preferência (Claude → GPT → Gemini)."""
    cfg = config(dados)
    return [p for p, (chave, *_) in PROVEDORES.items() if cfg.get(chave)]


def disponivel(dados: Path) -> bool:
    """Gerar aula usa o Claude (o formato do JSON foi afinado para ele)."""
    return "anthropic" in provedores(dados)


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
        raise RuntimeError(f"A API respondeu {e.code}: {msg or e.reason}") from None


# ---------- chamadas por provedor (devolvem o texto da resposta) ----------
def _anthropic(cfg: dict, prompt: str, busca: bool, max_tokens: int) -> str:
    msgs = [{"role": "user", "content": prompt}]
    corpo = {"model": cfg["modelo"], "max_tokens": max_tokens, "messages": msgs}
    if busca:
        corpo["tools"] = [{"type": "web_search_20250305", "name": "web_search", "max_uses": 8}]
    partes = []
    for _ in range(4):        # a busca na web pode pausar o turno (pause_turn): continua de onde parou
        resp = _post("https://api.anthropic.com/v1/messages", corpo, {
            "x-api-key": cfg["anthropic_api_key"], "anthropic-version": "2023-06-01"})
        partes += [b.get("text", "") for b in resp.get("content", []) if b.get("type") == "text"]
        if resp.get("stop_reason") != "pause_turn":
            break
        msgs.append({"role": "assistant", "content": resp["content"]})
    return "".join(partes)


def _openai(cfg: dict, prompt: str, busca: bool, max_tokens: int) -> str:
    corpo = {"model": cfg["modelo_openai"], "input": prompt, "max_output_tokens": max_tokens}
    if busca:
        corpo["tools"] = [{"type": "web_search"}]
    resp = _post("https://api.openai.com/v1/responses", corpo, {"authorization": "Bearer " + cfg["openai_api_key"]})
    if resp.get("output_text"):
        return resp["output_text"]
    return "".join(c.get("text", "") for item in resp.get("output", []) if item.get("type") == "message"
                   for c in item.get("content", []) if c.get("type") == "output_text")


def _gemini(cfg: dict, prompt: str, busca: bool, max_tokens: int) -> str:
    corpo = {"contents": [{"role": "user", "parts": [{"text": prompt}]}],
             "generationConfig": {"maxOutputTokens": max_tokens}}
    if busca:
        corpo["tools"] = [{"google_search": {}}]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{cfg['modelo_gemini']}:generateContent"
    resp = _post(url, corpo, {"x-goog-api-key": cfg["gemini_api_key"]})
    cands = resp.get("candidates") or [{}]
    return "".join(p.get("text", "") for p in cands[0].get("content", {}).get("parts", []))


CHAMAR = {"anthropic": _anthropic, "openai": _openai, "gemini": _gemini}


def gerar_texto(dados: Path, prompt: str, provedor: str | None = None, busca: bool = True) -> tuple[str, str]:
    """Manda o pedido para o provedor escolhido (ou o primeiro disponível) e devolve (provedor, texto)."""
    disp = provedores(dados)
    if not disp:
        raise RuntimeError("Nenhuma IA configurada. Coloque uma chave em Biblioteca → IA, ou use 'Copiar pedido'.")
    if provedor and provedor not in disp:
        raise RuntimeError(f"O provedor '{provedor}' não tem chave configurada.")
    p = provedor or disp[0]
    txt = CHAMAR[p](config(dados), prompt[:LIMITE_TEXTO], busca, 12000).strip()
    if not txt:
        raise RuntimeError("A IA respondeu vazio. Tente de novo.")
    return p, txt


def gerar_aula(dados: Path, prompt: str) -> dict:
    """Envia o pedido (montado pelo app, igual ao da versão na nuvem) e devolve o JSON da aula."""
    cfg = config(dados)
    if not cfg.get("anthropic_api_key"):
        raise RuntimeError("Sem chave da API. Use 'Copiar pedido' e cole a resposta, ou configure dados/config.json.")
    txt = _anthropic(cfg, prompt[:20000], False, 6000)
    i, j = txt.find("{"), txt.rfind("}")
    if i < 0 or j < 0:
        raise RuntimeError("A IA não devolveu um JSON. Tente de novo.")
    return json.loads(txt[i:j + 1])
