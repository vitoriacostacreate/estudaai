#!/usr/bin/env python3
"""estudaai: liga a sincronia entre aparelhos. Roda UMA vez em cada aparelho.

    python configurar_sincronia.py            (Windows: dois cliques em CONFIGURAR-SINCRONIA.bat)

O que faz: confere o Git e o login do GitHub, cria (ou acha) o seu repositório PRIVADO `estudaai-dados`,
clona em dados/sync, traz o que estava na pasta antiga do Google Drive e faz a primeira sincronia.
Depois disso o servidor cuida de tudo sozinho (nucleo/sincronia.py).

Dados pessoais nunca vão para o repositório do código: o script se recusa a usar um repositório público
ou o próprio repositório do estudaai.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))
import servidor  # noqa: E402
from nucleo import sincronia  # noqa: E402

DADOS = RAIZ / "dados"
REPO = "estudaai-dados"


def rodar(*cmd: str, interativo: bool = False, cwd: Path | None = None) -> tuple[bool, str]:
    try:
        if interativo:
            return subprocess.run(cmd, cwd=cwd).returncode == 0, ""
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        return r.returncode == 0, (r.stdout + r.stderr).strip()
    except FileNotFoundError:
        return False, "comando não encontrado"


def sim(pergunta: str) -> bool:
    try:
        return input(f"  {pergunta} [S/n] ").strip().lower() not in ("n", "nao", "não")
    except (EOFError, KeyboardInterrupt):
        return False


def url_pelo_gh() -> str | None:
    """Com o GitHub CLI: faz o login se precisar, cria o repositório privado se não existir e devolve a URL."""
    if not rodar("gh", "auth", "status", "--hostname", "github.com")[0]:
        print("  Este aparelho ainda não está logado no GitHub. Vou abrir o navegador para você entrar.\n")
        if not rodar("gh", "auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--web", interativo=True)[0]:
            print("\n  ✗ O login não terminou. Rode de novo quando quiser.")
            return None
    rodar("gh", "auth", "setup-git")                       # o Git passa a usar esse login, sem pedir senha
    ok, usuario = rodar("gh", "api", "user", "--jq", ".login")
    if not ok or not usuario:
        print("  ✗ Não consegui descobrir o seu usuário do GitHub:", usuario)
        return None
    nome = f"{usuario}/{REPO}"
    ok, saida = rodar("gh", "repo", "view", nome, "--json", "isPrivate")
    if ok:
        if not json.loads(saida).get("isPrivate"):
            print(f"  ✗ O repositório {nome} existe, mas é PÚBLICO. Não vou enviar dados pessoais para ele.")
            print("    Torne-o privado no GitHub (Settings → Danger Zone → Change visibility) e rode de novo.")
            return None
        print(f"  ✓ Achei o seu repositório privado {nome}.")
    else:
        ok, saida = rodar("gh", "repo", "create", nome, "--private", "--description", "estudaai: progresso e PDFs (dados pessoais, privado)")
        if not ok:
            print(f"  ✗ Não consegui criar {nome}:", saida)
            return None
        print(f"  ✓ Criei o repositório privado {nome}.")
    return f"https://github.com/{nome}.git"


def url_na_mao() -> str | None:
    print("  O GitHub CLI (gh) não está instalado. O jeito mais fácil: instale e rode este script de novo:")
    print("      winget install GitHub.cli")
    print(f"  Ou crie você mesma um repositório PRIVADO chamado {REPO} em https://github.com/new e cole a URL dele aqui.")
    try:
        url = input("  URL do repositório privado (Enter = sair): ").strip()
    except (EOFError, KeyboardInterrupt):
        return None
    if not url:
        return None
    if not sim("Confirma que esse repositório é PRIVADO? (os seus PDFs e o seu progresso vão para ele)"):
        return None
    return url


def mesma(a: str, b: str) -> bool:
    norm = lambda u: u.strip().lower().removesuffix("/").removesuffix(".git")  # noqa: E731
    return bool(a and b) and norm(a) == norm(b)


def main() -> int:
    primeira = "--primeira-vez" in sys.argv        # chamado pelo ESTUDAAI.bat: só oferece uma vez
    rp = DADOS / sincronia.PASTA_REPO
    if not (rp / ".git").exists():
        if primeira:
            marca = DADOS / ".sincronia-oferecida"
            if marca.exists():
                return 0
            DADOS.mkdir(exist_ok=True)
            marca.write_text("1", encoding="utf-8")
            print("\n  Quer o progresso igual no notebook e no PC, sozinho? (uns 2 minutos, só desta vez)")
            if not sim("Ligar a sincronia agora?"):
                print("  Tudo bem. Para ligar depois: CONFIGURAR-SINCRONIA.bat\n")
                return 0
        print("\n  estudaai: ligar a sincronia entre aparelhos\n  ===========================================")
        if not shutil.which("git"):
            print("  ✗ O Git não está instalado. Instale em https://git-scm.com/download/win e rode de novo.")
            return 1
        url = url_pelo_gh() if shutil.which("gh") else url_na_mao()
        if not url:
            return 1
        if mesma(url, rodar("git", "-C", str(RAIZ), "remote", "get-url", "origin")[1]):
            print("  ✗ Esse é o repositório do CÓDIGO do estudaai. Os dados precisam de um repositório separado e privado.")
            return 1
        if rp.exists() and any(rp.iterdir()):
            print(f"  ✗ A pasta {rp} já existe e não é um clone do Git. Renomeie-a e rode de novo.")
            return 1
        DADOS.mkdir(exist_ok=True)
        ok, saida = rodar("git", "clone", "--quiet", url, str(rp))
        if not ok:
            print("  ✗ Não consegui clonar o repositório de dados:\n   ", saida)
            return 1
        print(f"  ✓ Repositório de dados clonado em {rp}")
    elif primeira:
        return 0
    else:
        print("\n  A sincronia já está ligada neste aparelho. Vou sincronizar agora para conferir.")

    antiga = sincronia.pasta_antiga(DADOS)
    if antiga and not sincronia._local(DADOS).get("migrado_drive"):
        print(f"  Achei a pasta antiga em {antiga}: vou trazer o que está lá (não apago nada dela).")
    r = sincronia.sincronizar(DADOS, servidor.VERSAO)
    if r["ok"]:
        outros = [o["aparelho"] for o in sincronia.outros(DADOS, rp, sincronia.aparelho(DADOS))]
        print(f"  ✓ Sincronizado. Este aparelho: {sincronia.aparelho(DADOS)}." + (f" Outros no repositório: {', '.join(outros)}." if outros else ""))
        if r["grandes"]:
            print("  ⚠ Grandes demais para sincronizar (ficam só neste aparelho):", ", ".join(r["grandes"]))
        print("\n  Pronto. Daqui em diante é sozinho: o app puxa ao abrir e envia depois de salvar e ao fechar.\n")
        return 0
    print(f"  ⚠ Configurado, mas ainda não consegui enviar: {r['erro']}")
    print("    O app tenta de novo sozinho quando você abrir.\n")
    return 0 if primeira else 1


if __name__ == "__main__":
    sys.exit(main())
