# PUBLICAR.ps1: publica o estudaai em https://github.com/vitoriacostacreate/estudaai
# Rode pelo PUBLICAR-NO-GITHUB.bat. Pode rodar de novo quando quiser: ele envia só o que mudou.
param([switch]$SemPausa)
$ErrorActionPreference = "Continue"
$Raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Raiz
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Usuario = "vitoriacostacreate"; $Repo = "estudaai"
$Desc = "Seu estudo organizado a partir dos seus PDFs: aulas interativas, revisão espaçada (FSRS) e IA opcional. Roda local ou na nuvem."
function Titulo($t) { Write-Host ""; Write-Host "=== $t ===" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "  [OK] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "  [!] $t" -ForegroundColor Yellow }
function Recarregar-Path { $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User") + ";$env:ProgramFiles\Git\cmd;$env:ProgramFiles\GitHub CLI;$env:LOCALAPPDATA\Programs\Git\cmd" }
function Tem($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

function Instalar($nome, $id, $repoGit, $padrao) {
    if (Tem $nome) { Ok "$nome já instalado"; return }
    Write-Host "  Instalando $id..."
    if (Tem winget) { winget install --id $id --exact --silent --accept-package-agreements --accept-source-agreements | Out-Host; Recarregar-Path }
    if (Tem $nome) { Ok "$nome instalado"; return }
    Aviso "winget não resolveu. Baixando direto do GitHub..."
    try {
        $rel = Invoke-RestMethod -UseBasicParsing -Headers @{ "User-Agent" = "estudaai" } "https://api.github.com/repos/$repoGit/releases/latest"
        $asset = $rel.assets | Where-Object { $_.name -match $padrao } | Select-Object -First 1
        $tmp = Join-Path $env:TEMP $asset.name
        Invoke-WebRequest -UseBasicParsing $asset.browser_download_url -OutFile $tmp
        if ($tmp -like "*.msi") { Start-Process msiexec.exe -ArgumentList "/i `"$tmp`" /passive /norestart" -Wait }
        else { Start-Process $tmp -ArgumentList "/VERYSILENT /NORESTART /SUPPRESSMSGBOXES" -Wait }
        Recarregar-Path
    } catch { }
    if (Tem $nome) { Ok "$nome instalado" } else { Aviso "Não consegui instalar $nome. Instale manualmente e rode de novo."; if (-not $SemPausa) { Read-Host "Enter para sair" }; exit 1 }
}

Titulo "1/5 Ferramentas"
Recarregar-Path
Instalar "git" "Git.Git" "git-for-windows/git" "^Git-[\d\.]+-64-bit\.exe$"
Instalar "gh" "GitHub.cli" "cli/cli" "windows_amd64\.msi$"

Titulo "2/5 Login no GitHub"
gh auth status -h github.com 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Vai abrir o navegador: entre na conta $Usuario e cole o código que aparecer aqui." -ForegroundColor Magenta
    gh auth login -h github.com -p https -w -s repo,workflow
}
gh auth status -h github.com 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Aviso "Login não concluído. Rode de novo."; if (-not $SemPausa) { Read-Host "Enter para sair" }; exit 1 }
gh auth setup-git 2>$null | Out-Null
$logado = (gh api user --jq .login 2>$null)
Ok "Logado como $logado"
if ($logado -and $logado -ne $Usuario) { Aviso "Você está logada como $logado, e o repositório será criado nessa conta."; $Usuario = $logado }

Titulo "3/5 Arquivos e commit"
if (-not (git config --global user.name)) { git config --global user.name "Vitória Costa" }
if (-not (git config --global user.email)) { git config --global user.email "$Usuario@users.noreply.github.com" }
$wf = Join-Path $Raiz ".github\workflows\testes.yml"
if (-not (Test-Path $wf)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $wf) | Out-Null
    $yml = @"
name: testes
on: [push, pull_request]
jobs:
  testes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: python -m unittest discover testes -v
      - run: node --test testes/
      - run: python fonte/build.py
"@
    [IO.File]::WriteAllText($wf, $yml, (New-Object System.Text.UTF8Encoding($false)))
    Ok "Testes automáticos do GitHub (testes.yml) recriados"
}
if (-not (Test-Path (Join-Path $Raiz ".git"))) { git init -b main | Out-Null; Ok "Repositório git criado" }
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -q -m "estudaai: atualização $(Get-Date -Format 'yyyy-MM-dd HH:mm')"; Ok "Commit feito" } else { Ok "Nada novo para registrar" }

Titulo "4/5 Repositório no GitHub"
gh repo view "$Usuario/$Repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    gh repo create "$Usuario/$Repo" --public --description $Desc --homepage "https://claude.ai/artifact/3CSuNHxKdDwUJNcsMpDLxS" | Out-Host
    if ($LASTEXITCODE -ne 0) { Aviso "Não consegui criar o repositório."; if (-not $SemPausa) { Read-Host "Enter para sair" }; exit 1 }
    Ok "Repositório $Usuario/$Repo criado"
} else { Ok "Repositório $Usuario/$Repo já existe" }
gh repo edit "$Usuario/$Repo" --add-topic estudo,flashcards,spaced-repetition,fsrs,pdf,concurso,python 2>$null | Out-Null

Titulo "5/5 Enviando"
git remote remove origin 2>$null
git remote add origin "https://github.com/$Usuario/$Repo.git"
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Aviso "O GitHub recusou (o repositório já tinha conteúdo?). Tentando juntar as versões..."
    git pull origin main --rebase --allow-unrelated-histories
    git push -u origin main
}
if ($LASTEXITCODE -eq 0) {
    Write-Host ""; Write-Host "  Pronto! https://github.com/$Usuario/$Repo" -ForegroundColor Green
    Start-Process "https://github.com/$Usuario/$Repo"
} else { Aviso "O envio falhou. Copie a mensagem acima e mande para o Claude."; exit 1 }
if (-not $SemPausa) { Read-Host "Enter para fechar" }
