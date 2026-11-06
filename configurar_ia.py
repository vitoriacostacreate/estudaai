#!/usr/bin/env python3
"""Liga as IAs do estudaai com o mínimo de passos.

    python configurar_ia.py          (ou dois cliques no CONFIGURAR-IA.bat)

Para cada IA: abre a página da chave no navegador → você clica em "Criar chave" e copia →
o script percebe sozinho que a chave foi copiada, testa e salva em dados/config.json.
Enter pula a IA. Nada é pago por este script: o teste só lista os modelos.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))
from nucleo import ia  # noqa: E402

DADOS = RAIZ / "dados"
ARQ = DADOS / "config.json"

# Ordem do roteiro: a grátis primeiro (sempre dá certo), depois as pagas.
ROTEIRO = [
    ("gemini", "Gemini (Google): GRÁTIS", [
        "Entre com sua conta Google e aceite os termos, se pedir.",
        "Clique em \"Create API key\" (Criar chave de API) e depois em \"Copiar chave\".",
        "Não precisa de cartão: é a camada gratuita do Google AI Studio."]),
    ("anthropic", "Claude (Anthropic): PAGO, crédito pré-pago", [
        "A assinatura Claude Pro NÃO inclui a API: aqui é crédito à parte (a partir de US$ 5).",
        "Entre, vá em Billing e compre crédito, se ainda não tiver.",
        "Em API Keys, clique em \"Create Key\", dê um nome (estudaai) e copie."]),
    ("openai", "ChatGPT (OpenAI): PAGO, crédito pré-pago", [
        "A assinatura ChatGPT Plus NÃO inclui a API: aqui é crédito à parte (a partir de US$ 5).",
        "Entre, vá em Billing e adicione crédito, se ainda não tiver.",
        "Clique em \"Create new secret key\", dê um nome (estudaai) e copie."]),
]


# ---------- área de transferência (sem instalar nada) ----------
def _clip_windows() -> str:
    import ctypes
    u32, k32 = ctypes.windll.user32, ctypes.windll.kernel32
    u32.GetClipboardData.restype = ctypes.c_void_p
    k32.GlobalLock.argtypes, k32.GlobalLock.restype = [ctypes.c_void_p], ctypes.c_void_p
    k32.GlobalUnlock.argtypes = [ctypes.c_void_p]
    if not u32.OpenClipboard(None):
        return ""
    try:
        h = u32.GetClipboardData(13)            # CF_UNICODETEXT
        if not h:
            return ""
        p = k32.GlobalLock(h)
        try:
            return ctypes.wstring_at(p) if p else ""
        finally:
            k32.GlobalUnlock(h)
    finally:
        u32.CloseClipboard()


def ler_clipboard() -> str:
    try:
        if sys.platform == "win32":
            return _clip_windows()
        cmd = ["pbpaste"] if sys.platform == "darwin" else ["xclip", "-o", "-selection", "clipboard"]
        return subprocess.run(cmd, capture_output=True, text=True, timeout=2).stdout
    except Exception:
        return ""


def achar_chave(provedor: str, texto: str) -> str | None:
    """Reconhece a chave pelo formato conhecido; se o formato mudar de novo, aceita qualquer texto
    com cara de chave (uma palavra longa) que não seja de outra IA: o teste decide se vale."""
    m = re.search(ia.FORMATO_CHAVE[provedor], texto or "")
    if m:
        return m.group(0)
    t = (texto or "").strip()
    outras = [f for p, f in ia.FORMATO_CHAVE.items() if p != provedor]
    if re.fullmatch(r"[A-Za-z0-9._\-]{30,200}", t) and not any(re.search(f, t) for f in outras) and not t.startswith("projects/"):
        return t
    return None


# ---------- teclado: Enter pula; colar a chave no terminal também vale ----------
class Teclado:
    def __init__(self):
        self.buf = ""

    def linha(self) -> str | None:
        """Devolve a linha digitada quando aperta Enter; None enquanto não apertou."""
        if sys.platform == "win32":
            import msvcrt
            while msvcrt.kbhit():
                c = msvcrt.getwch()
                if c in "\r\n":
                    linha, self.buf = self.buf, ""
                    print()
                    return linha
                if c == "\b":
                    self.buf = self.buf[:-1]
                elif c.isprintable():
                    self.buf += c
            return None
        import select
        if select.select([sys.stdin], [], [], 0)[0]:
            return sys.stdin.readline().strip()
        return None


def esperar_chave(provedor: str) -> str | None:
    inicial = ler_clipboard()          # ignora o que já estava copiado antes
    tec = Teclado()
    while True:
        atual = ler_clipboard()
        if atual != inicial and (k := achar_chave(provedor, atual)):
            return k
        linha = tec.linha()
        if linha is not None:
            if (k := achar_chave(provedor, linha)):
                return k
            if not linha.strip():
                return None
            print("  Isso não parece uma chave dessa IA. Copie de novo, ou Enter para pular.")
        time.sleep(0.4)


def salvar(campos: dict) -> None:
    cfg = {}
    if ARQ.exists():
        try:
            cfg = json.loads(ARQ.read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    cfg.update(campos)
    DADOS.mkdir(exist_ok=True)
    ARQ.write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> int:
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    ja = set(ia.provedores(DADOS))
    if "--primeira-vez" in sys.argv:           # chamado pelo ESTUDAAI.bat: só oferece uma vez, e só se não houver chave
        marca = DADOS / ".ia-oferecida"
        if ja or marca.exists():
            return 0
        DADOS.mkdir(exist_ok=True)
        marca.write_text("1", encoding="utf-8")
        print("\n  Primeira vez no estudaai: vamos ligar as IAs (uns 2 minutos).\n  Para pular tudo, aperte Enter 3 vezes; dá para fazer depois no CONFIGURAR-IA.bat.")
    print("\n  estudaai: ligar as IAs\n  ======================")
    print("  Para cada IA, abro a página da chave. Você cria e COPIA a chave: eu percebo sozinho.")
    print("  Enter = pular esta IA.  Ctrl+C = sair.\n")
    for prov, titulo, passos in ROTEIRO:
        print(f"  ▶ {titulo}")
        if prov in ja:
            print("    Já está ligada. Enter mantém; copie uma chave nova para trocar.")
        for p in passos:
            print("    · " + p)
        webbrowser.open(ia.PAGINA_CHAVE[prov])
        print("    Esperando você copiar a chave…", flush=True)
        while True:
            chave = esperar_chave(prov)
            if not chave:
                print("    Pulada.\n")
                break
            print("    Chave copiada! Testando…", end=" ", flush=True)
            try:
                extras = ia.validar_chave(prov, chave) or {}
            except Exception as e:  # noqa: BLE001
                print(f"não deu: {e}. Copie a chave de novo, ou Enter para pular.")
                continue
            campos = {ia.PROVEDORES[prov][0]: chave, **extras}
            if prov == "gemini":
                campos["gemini_plano"] = "gratis"
            salvar(campos)
            print("funcionou e está salva. ✓\n")
            break
    ordem = ia.cadeia(DADOS, "revisao")
    print("  Pronto. Na Revisão com IA, o estudaai vai tentar nesta ordem:")
    for i, op in enumerate(ordem, 1):
        print(f"    {i}. {ia.NOME[op['provedor']]} ({op['modelo']}){' · grátis' if op['gratis'] else ''}")
    print(f"    {len(ordem) + 1}. Copiar e abrir no chat (sua assinatura ou a versão grátis)")
    print("\n  Não precisa reiniciar o estudaai: ele lê as chaves na hora.\n")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n  Saindo. O que já foi salvo continua valendo.")
