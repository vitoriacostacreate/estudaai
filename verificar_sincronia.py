"""Confere, antes de fechar o navegador, se tudo o que mudou neste aparelho foi para o Google Drive.

Três perguntas, nesta ordem:
  1. O app entregou tudo? (com o estudaai aberto, pede para ele salvar agora)
  2. A pasta do Drive tem o mesmo que dados/? (progresso, biblioteca, PDFs e pacotes)
  3. O Google já recebeu? Arquivo em G: ainda pode estar na fila de envio.

A resposta da 3 vem do banco local do Google Drive para computador (%LOCALAPPDATA%/Google/DriveFS),
aberto só para leitura: o MD5 do arquivo só entra no registro depois que o envio termina (testado em 09/11/2026).
O formato desse banco não é documentado. Se o Google mudar, o script avisa que não conseguiu confirmar.

Só leitura: não junta dados nem grava nada além do que o botão "salvar agora" do app já grava.
Código de saída: 0 pode fechar · 1 falta algo · 2 não deu para confirmar.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from contextlib import closing
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))
from nucleo import sincronia  # noqa: E402

DADOS = RAIZ / "dados"
PORTA = 8765
ESPERA_NOTA = 8     # segundos para uma gravação em andamento chegar à pasta
ESPERA_NUVEM = 90   # segundos para o Google Drive terminar o envio
VAZIA = {"docs": [], "temas": [], "anexos": {}}


def pedir_exportacao(porta: int) -> bool:
    """Pede ao estudaai aberto para gravar a nota agora. Falso = o estudaai não está rodando."""
    pedido = urllib.request.Request(f"http://127.0.0.1:{porta}/api/obsidian/salvar", data=b"", method="POST")
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(pedido, timeout=15) as r:
            json.loads(r.read() or b"{}")
        return True
    except (urllib.error.URLError, OSError, ValueError):
        return False


def conferir_nota(dados: Path, cofre: Path, ap: str) -> dict:
    """A nota deste aparelho na pasta tem o mesmo progresso e a mesma biblioteca de dados/?"""
    estado = sincronia._ler_json(dados / "estado.json", {})
    bib = sincronia._ler_json(dados / "biblioteca.json", VAZIA)
    agora = sincronia.contar(estado, bib)
    nota = sincronia.ler_nota(cofre / sincronia.PASTA / f"{ap}.md")
    if nota is None:
        return {"ok": False, "falta": "a nota deste aparelho não está na pasta", "totais": agora}
    ok = nota["estado"] == estado and nota["biblioteca"] == bib
    return {"ok": ok, "atualizado": nota["atualizado"], "ultimo": (nota["historico"] or [""])[0], "totais": agora,
            "falta": "" if ok else sincronia.resumo(sincronia.contar(nota["estado"], nota["biblioteca"]), agora)}


def _md5(b: bytes) -> str:
    return hashlib.md5(b, usedforsecurity=False).hexdigest()


def _pacote_igual(f: Path, alvo: Path) -> bool:
    try:
        m = re.search(r"```json\n(.*)\n```", alvo.read_text(encoding="utf-8"), re.S)
        return bool(m) and m.group(1) == f.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False


def conferir_arquivos(dados: Path, cofre: Path) -> tuple[list[tuple[str, str]], list[str]]:
    """Devolve ([(nome na pasta, md5)], [nomes que faltam]). PDF compara pelo tamanho, sem baixar do Drive;
    quem garante o conteúdo é o MD5 na etapa da nuvem."""
    origem, destino = dados / "arquivos", cofre / sincronia.PASTA / "arquivos"
    achados, faltam = [], []
    if not origem.is_dir():
        return achados, faltam
    for f in sorted(origem.iterdir()):
        if f.suffix == ".pdf":
            alvo = destino / f.name
            if alvo.is_file() and alvo.stat().st_size == f.stat().st_size:
                achados.append((alvo.name, _md5(f.read_bytes())))
            else:
                faltam.append(f.name)
        elif f.suffix == ".json":
            alvo = destino / (f.name + ".md")
            if _pacote_igual(f, alvo):
                achados.append((alvo.name, _md5(alvo.read_bytes())))
            else:
                faltam.append(f.name)
    return achados, faltam


def bancos_drive() -> list[Path]:
    base = Path(os.environ.get("LOCALAPPDATA") or "") / "Google" / "DriveFS"
    return sorted(base.glob("[0-9]*/metadata_sqlite_db")) if base.is_dir() else []


def nuvem(itens: list[tuple[str, str]], bancos: list[Path]) -> set[tuple[str, str]] | None:
    """Quais (nome, md5) o Google já recebeu. None = não consegui ler o registro do Drive."""
    enviados, lidos = set(), 0
    for banco in bancos:
        try:
            with closing(sqlite3.connect(f"{banco.as_uri()}?mode=ro", uri=True, timeout=3)) as c:
                c.text_factory = bytes
                for nome, md5 in itens:
                    linhas = c.execute("select id, proto from items where local_title=? and trashed=0 and is_tombstone=0", (nome,))
                    if any(not bytes(i).startswith(b"local-") and md5.encode() in bytes(p or b"") for i, p in linhas):
                        enviados.add((nome, md5))
            lidos += 1
        except sqlite3.Error:
            continue
    return enviados if lidos else None


def _hora(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso).strftime("%d/%m às %H:%M")
    except (TypeError, ValueError):
        return "?"


def _fim(r: dict, codigo: int, titulo: str, proximo: str) -> dict:
    r.update(codigo=codigo, titulo=titulo, proximo=proximo)
    return r


def verificar(dados: Path = DADOS, porta: int = PORTA, espera: float = ESPERA_NUVEM, espera_nota: float = ESPERA_NOTA,
              bancos: list[Path] | None = None, avisar=lambda _: None) -> dict:
    """Faz a conferência e devolve {codigo, titulo, proximo, linhas, aparelho, totais, ultimo}."""
    r: dict = {"linhas": [], "aparelho": "", "totais": {}, "ultimo": ""}
    linha = lambda marca, rotulo, texto: r["linhas"].append((marca, rotulo, texto))  # noqa: E731
    cofre = sincronia.achar_cofre(dados)
    if not cofre:
        linha("❌", "Sincronia", "desligada: não achei o Google Drive neste aparelho")
        return _fim(r, 1, "NÃO SINCRONIZOU", "Abra o Google Drive para computador, entre na sua conta e rode isto de novo.")
    ap = r["aparelho"] = sincronia.aparelho(dados)

    # 1 e 2: do app para a pasta
    servidor = pedir_exportacao(porta)
    limite = time.monotonic() + espera_nota
    nota = conferir_nota(dados, cofre, ap)
    while not nota["ok"] and time.monotonic() < limite:     # pode haver uma gravação a caminho
        time.sleep(1)
        servidor = pedir_exportacao(porta)
        nota = conferir_nota(dados, cofre, ap)
    r["totais"], r["ultimo"] = nota["totais"], nota.get("ultimo", "")
    if servidor:
        linha("✅", "App", "aberto, salvou agora")
    else:
        linha("⚠️", "App", "fechado: só vejo o que ele salvou antes de parar")
    if nota["ok"]:
        linha("✅", "Progresso", f"igual na pasta (salvo em {_hora(nota['atualizado'])})")
    else:
        linha("❌", "Progresso", f"diferente na pasta. Falta levar: {nota['falta']}")
    arquivos, faltam = conferir_arquivos(dados, cofre)
    total = len(arquivos) + len(faltam)
    if faltam:
        linha("❌", "PDFs e pacotes", f"faltam {len(faltam)} de {total}: {', '.join(faltam[:5])}")
    else:
        linha("✅", "PDFs e pacotes", f"{total} de {total} na pasta")
    if not nota["ok"] or faltam:
        passo = "Clique no selo do Drive no topo do app e rode isto de novo." if servidor \
            else "Abra o ESTUDAAI.bat (ele salva ao abrir) e rode isto de novo."
        return _fim(r, 1, "NÃO FECHE AINDA", passo)

    # 3: da pasta para o Google
    if sincronia.via(cofre) != "Google Drive":
        linha("⚠️", "Nuvem", f"a pasta é {cofre}, não o Google Drive: não sei se saiu deste aparelho")
        return _fim(r, 2, "SALVO, MAS SEM CONFIRMAÇÃO", "Confira se o Google Drive para computador está aberto e logado.")
    bancos = bancos_drive() if bancos is None else bancos
    arq_nota = cofre / sincronia.PASTA / f"{ap}.md"
    limite = time.monotonic() + espera
    avisou = False
    while True:
        itens = [(arq_nota.name, _md5(arq_nota.read_bytes())), *arquivos]
        enviados = nuvem(itens, bancos)
        pendentes = [] if enviados is None else [n for n, m in itens if (n, m) not in enviados]
        if not pendentes or time.monotonic() >= limite:
            break
        if not avisou:
            avisar(f"Esperando o Google Drive terminar o envio (até {int(espera)} s)...")
            avisou = True
        time.sleep(2)
    if enviados is None:
        linha("⚠️", "Nuvem", "não consegui ler o registro do Google Drive")
        return _fim(r, 2, "SALVO, MAS SEM CONFIRMAÇÃO", "Veja o ícone do Google Drive na bandeja: precisa dizer que está tudo em dia.")
    if pendentes:
        linha("⏳", "Nuvem", f"{len(itens) - len(pendentes)} de {len(itens)} enviados; falta: {', '.join(pendentes[:5])}")
        return _fim(r, 1, "SALVO, AINDA SUBINDO", "Pode fechar o navegador, mas deixe o computador ligado e com internet. Rode isto de novo em 1 minuto.")
    linha("✅", "Nuvem", f"{len(itens)} de {len(itens)} já recebidos pelo Google")
    if not servidor:
        return _fim(r, 2, "SÓ CONFERI O QUE FOI SALVO", "Se a aba ainda está aberta e você mexeu depois que o estudaai parou, abra o ESTUDAAI.bat antes de fechá-la.")
    return _fim(r, 0, "PODE FECHAR", "Tudo o que você fez aqui já está no Google Drive.")


def mostrar(r: dict) -> None:
    print(f"\n  estudaai: conferência da sincronia ({r['aparelho'] or 'este aparelho'})\n")
    for marca, rotulo, texto in r["linhas"]:
        print(f"  {marca} {rotulo:<15} {texto}")
    totais = [f"{r['totais'][k]} {um if r['totais'][k] == 1 else varios}" for k, um, varios in sincronia.ROTULOS if r["totais"].get(k)]
    if totais:
        print(f"\n  Neste aparelho: {', '.join(totais)}")
    if r["ultimo"]:
        print(f"  Última mudança: {r['ultimo']}")
    marca = {0: "✅", 1: "❌", 2: "⚠️"}[r["codigo"]]
    print(f"\n  {'=' * 58}\n  {marca} {r['titulo']}\n  {'=' * 58}\n  {r['proximo']}\n")


def main() -> int:
    for saida in (sys.stdout, sys.stderr):
        saida.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Confere se o que mudou neste aparelho chegou ao Google Drive.")
    ap.add_argument("--porta", type=int, default=PORTA)
    ap.add_argument("--espera", type=int, default=ESPERA_NUVEM, help="segundos esperando o Drive terminar o envio")
    a = ap.parse_args()
    r = verificar(porta=a.porta, espera=a.espera, avisar=lambda t: print(f"\n  ⏳ {t}", flush=True))
    mostrar(r)
    return r["codigo"]


if __name__ == "__main__":
    sys.exit(main())
