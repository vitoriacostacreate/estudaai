"""IA opcional: transforma o trecho de um PDF numa aula completa usando a API da Anthropic.

Sem chave configurada, o estudaai continua funcionando com a aula automática.
A chave fica em dados/config.json ({"anthropic_api_key": "...", "modelo": "..."})
ou na variável de ambiente ANTHROPIC_API_KEY. Ela nunca sai do seu computador,
exceto na chamada para api.anthropic.com.
"""
from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path

MODELO_PADRAO = "claude-sonnet-5-5"


def config(dados: Path) -> dict:
    cfg = {}
    arq = dados / "config.json"
    if arq.exists():
        try:
            cfg = json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    cfg.setdefault("anthropic_api_key", os.environ.get("ANTHROPIC_API_KEY", ""))
    cfg.setdefault("modelo", os.environ.get("ESTUDAAI_MODELO", MODELO_PADRAO))
    return cfg


def disponivel(dados: Path) -> bool:
    return bool(config(dados).get("anthropic_api_key"))


def prompt_aula(titulo: str, tema: str, texto: str) -> str:
    return f"""Você é um professor excelente e rigoroso. Crie UMA aula curta e muito visual sobre "{titulo}" (tema: {tema}),
usando SOMENTE o texto-fonte abaixo como base. Aluna: aprende melhor com material visual, blocos curtos e exemplos concretos; perfil TDAH.
Português do Brasil. Não invente números, leis ou citações que não estejam no texto. Se o texto estiver confuso, diga.

Responda SOMENTE com um JSON válido, sem texto antes ou depois:
{{
 "titulo": "título curto",
 "ideia": "a ideia central em 1 frase",
 "mapa": {{"raiz": "conceito central", "ramos": [["nome do ramo", ["item curto", "item curto"]]]}},
 "recupere": ["3 perguntas abertas para tentar responder ANTES da aula"],
 "blocos": [{{"t": "título", "html": "HTML simples: <p>, <b>, <ul>, <li>, <table class='tab'>, <p class='dica'> para pegadinhas, <p class='pratica'> para exercícios"}}],
 "widget": "parear",
 "parear": [["termo", "definição curta"]],
 "quiz": [{{"q": "pergunta", "o": ["A", "B", "C", "D"], "a": 0, "e": "por que a correta é a correta"}}],
 "feynman": {{"pergunta": "pedido para explicar com as próprias palavras", "chaves": ["5 palavras-chave"]}},
 "fontes": ["páginas do PDF usadas"]
}}
Use de 4 a 6 ramos, de 3 a 5 blocos, 5 pares e 5 questões.

=== TEXTO-FONTE ===
{texto[:14000]}
"""


def gerar_aula(dados: Path, titulo: str, tema: str, texto: str) -> dict:
    cfg = config(dados)
    chave = cfg.get("anthropic_api_key")
    if not chave:
        raise RuntimeError("Sem chave da API. Use 'Copiar pedido' e cole a resposta, ou configure dados/config.json.")
    corpo = json.dumps({
        "model": cfg["modelo"], "max_tokens": 6000,
        "messages": [{"role": "user", "content": prompt_aula(titulo, tema, texto)}],
    }).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=corpo, method="POST", headers={
        "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        resp = json.loads(r.read().decode())
    txt = "".join(b.get("text", "") for b in resp.get("content", []) if b.get("type") == "text")
    i, j = txt.find("{"), txt.rfind("}")
    if i < 0 or j < 0:
        raise RuntimeError("A IA não devolveu um JSON. Tente de novo.")
    return json.loads(txt[i:j + 1])
