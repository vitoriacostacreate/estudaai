"""Testes da sincronia pelo Git (nucleo/sincronia.py e rotas /api/sinc).
O "GitHub" aqui é um repositório vazio numa pasta temporária: nada sai do computador."""
import json
import os
import subprocess
import sys
os.environ["ESTUDAAI_SEM_DRIVE"] = "1"   # nunca lê o Google Drive de verdade
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(RAIZ / "testes"))
import servidor  # noqa: E402
from nucleo import sincronia  # noqa: E402
from test_servidor import pedir  # noqa: E402

ESTADO = {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 3}}, "dias": {"2026-11-08": 3, "2026-11-09": 1}, "_t": 1}
BIB = {"docs": [{"id": "d1"}], "temas": [], "anexos": {}}


def gravar(arq: Path, obj):
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(obj), encoding="utf-8")


def ler(arq: Path):
    return json.loads(arq.read_text(encoding="utf-8"))


def git(*args, cwd=None):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.base = Path(self.tmp.name)
        self.remoto = self.base / "remoto.git"
        git("init", "--bare", "-b", "main", str(self.remoto))
        self.note = self.aparelho("notebook")
        self.pc = self.aparelho("pc")
        gravar(self.note / "estado.json", ESTADO)
        gravar(self.note / "biblioteca.json", BIB)
        gravar(self.note / "arquivos" / "x.json", {"aulas": {}})
        (self.note / "arquivos" / "x.pdf").write_bytes(b"%PDF-1.4 x")

    def tearDown(self):
        self.tmp.cleanup()

    def aparelho(self, nome: str) -> Path:
        dados = self.base / nome / "dados"
        gravar(dados / "config.json", {"nome_aparelho": nome, "pasta_sincronia": "nao"})
        git("clone", str(self.remoto), str(dados / "sync"))
        return dados

    def sinc(self, dados: Path) -> dict:
        return sincronia.sincronizar(dados, "1.0")

    def no_remoto(self, caminho: str) -> str:
        return git("--git-dir", str(self.remoto), "show", f"main:{caminho}").stdout


class TestCiclo(Base):
    def test_sem_repositorio_fica_desligada(self):
        sozinho = self.base / "sozinho" / "dados"
        gravar(sozinho / "estado.json", ESTADO)
        self.assertIsNone(sincronia.repo(sozinho))
        self.assertFalse(sincronia.sincronizar(sozinho, "1.0")["ok"])
        gravar(self.note / "config.json", {"nome_aparelho": "notebook", "sincronia_git": "nao"})
        self.assertIsNone(sincronia.repo(self.note))

    def test_envia_e_o_outro_aparelho_recebe_progresso_e_pdfs(self):
        r = self.sinc(self.note)
        self.assertTrue(r["ok"], r)
        enviado = json.loads(self.no_remoto("notebook.json"))
        self.assertEqual(enviado["estado"]["dias"], ESTADO["dias"])
        self.assertEqual(enviado["aparelho"], "notebook")
        self.assertIn("+1 PDF, +2 estudos de tópico, +3 revisões de cartão, +2 dias de estudo", enviado["historico"][0])

        self.assertTrue(self.sinc(self.pc)["ok"])
        outros = sincronia.outros(self.pc, self.pc / "sync", "pc")
        self.assertEqual([(o["aparelho"], o["novo"]) for o in outros], [("notebook", True)])
        self.assertEqual(outros[0]["estado"]["dias"], ESTADO["dias"])
        self.assertIsNone(outros[0]["base"])                                   # primeira vez: junção de 2 vias
        self.assertEqual((self.pc / "arquivos" / "x.pdf").read_bytes(), b"%PDF-1.4 x")
        self.assertEqual(ler(self.pc / "arquivos" / "x.json"), {"aulas": {}})
        self.assertEqual(sincronia.outros(self.note, self.note / "sync", "notebook"), [])   # o próprio arquivo não aparece

    def test_so_envia_quando_muda(self):
        self.sinc(self.note)
        antes = git("--git-dir", str(self.remoto), "rev-list", "--count", "main").stdout.strip()
        self.assertTrue(self.sinc(self.note)["ok"])
        self.assertEqual(git("--git-dir", str(self.remoto), "rev-list", "--count", "main").stdout.strip(), antes)
        gravar(self.note / "estado.json", {**ESTADO, "cards": {"c1": {"n": 4}}, "_t": 2})
        self.sinc(self.note)
        d = json.loads(self.no_remoto("notebook.json"))
        self.assertIn("+1 revisão de cartão", d["historico"][0])
        self.assertEqual(len(d["historico"]), 2)

    def test_aparelho_novo_e_vazio_nao_envia_nada(self):
        gravar(self.pc / "estado.json", {"top": {}, "cards": {}, "dias": {}, "hoje": {"data": "2026-11-10", "feitos": []}, "_t": 9})
        self.assertTrue(self.sinc(self.pc)["ok"])
        self.assertFalse((self.pc / "sync" / "pc.json").exists())

    def test_os_dois_mudam_sem_sincronizar_e_ninguem_sobrescreve_ninguem(self):
        self.sinc(self.note)
        self.sinc(self.pc)
        # os dois estudam "ao mesmo tempo", cada um sem saber do outro
        gravar(self.note / "estado.json", {**ESTADO, "dias": {**ESTADO["dias"], "2026-11-10": 5}, "_t": 5})
        gravar(self.pc / "estado.json", {"top": {"b": {"n": 1}}, "cards": {}, "dias": {"2026-11-10": 2}, "_t": 6})
        self.assertTrue(self.sinc(self.pc)["ok"])
        self.assertTrue(self.sinc(self.note)["ok"])
        self.assertEqual(json.loads(self.no_remoto("notebook.json"))["estado"]["dias"]["2026-11-10"], 5)
        self.assertEqual(json.loads(self.no_remoto("pc.json"))["estado"]["top"], {"b": {"n": 1}})
        self.assertEqual(sincronia.outros(self.note, self.note / "sync", "notebook")[0]["estado"]["top"], {"b": {"n": 1}})

    def test_envio_recusado_porque_o_outro_enviou_no_mesmo_instante_refaz_o_ciclo(self):
        self.sinc(self.note)
        gravar(self.pc / "estado.json", {"top": {"b": {"n": 1}}, "_t": 6})
        gravar(self.note / "estado.json", {**ESTADO, "_t": 7, "principal": "fisio"})
        real, feito = sincronia.git, []

        def git_com_corrida(rp, *args, **kw):
            if args[0] == "push" and not feito and Path(rp) == self.pc / "sync":
                feito.append(1)
                with mock.patch.object(sincronia, "git", real):
                    self.assertTrue(self.sinc(self.note)["ok"])               # o notebook passa na frente
            return real(rp, *args, **kw)

        with mock.patch.object(sincronia, "git", git_com_corrida):
            r = self.sinc(self.pc)
        self.assertTrue(r["ok"], r)
        self.assertEqual(json.loads(self.no_remoto("pc.json"))["estado"]["top"], {"b": {"n": 1}})
        self.assertEqual(json.loads(self.no_remoto("notebook.json"))["estado"]["principal"], "fisio")

    def test_sem_internet_nao_quebra_e_envia_depois(self):
        self.sinc(self.note)
        git("remote", "set-url", "origin", str(self.base / "nao-existe.git"), cwd=self.note / "sync")
        gravar(self.note / "estado.json", {**ESTADO, "dias": {**ESTADO["dias"], "2026-11-10": 1}, "_t": 3})
        r = self.sinc(self.note)                                               # "offline"
        self.assertFalse(r["ok"])
        self.assertIn("sem internet", r["erro"])
        self.assertEqual(ler(self.note / "estado.json")["dias"]["2026-11-10"], 1)   # o app segue com o que tem
        git("remote", "set-url", "origin", str(self.remoto), cwd=self.note / "sync")
        self.assertTrue(self.sinc(self.note)["ok"])                            # a internet voltou
        self.assertEqual(json.loads(self.no_remoto("notebook.json"))["estado"]["dias"]["2026-11-10"], 1)

    def test_clone_baguncado_a_mao_se_conserta_sozinho(self):
        self.sinc(self.note)
        rp = self.note / "sync"
        (rp / "notebook.json").write_text("<<<<<<< conflito escrito à mão", encoding="utf-8")
        (rp / "pc.json").write_text("lixo", encoding="utf-8")
        git("add", "-A", cwd=rp)
        git("-c", "user.name=x", "-c", "user.email=x@x", "commit", "-m", "bagunça", cwd=rp)
        self.assertTrue(self.sinc(self.note)["ok"])
        self.assertEqual(ler(rp / "notebook.json")["estado"]["dias"], ESTADO["dias"])
        self.assertFalse((rp / "pc.json").exists())

    def test_arquivo_grande_demais_fica_so_neste_aparelho(self):
        (self.note / "arquivos" / "enorme.pdf").write_bytes(b"%PDF" + b"0" * 2000)
        with mock.patch.object(sincronia, "LIMITE", 1000):
            r = self.sinc(self.note)
        self.assertTrue(r["ok"])
        self.assertEqual(r["grandes"], ["enorme.pdf"])
        self.assertFalse((self.note / "sync" / "arquivos" / "enorme.pdf").exists())
        self.assertTrue((self.note / "sync" / "arquivos" / "x.pdf").exists())


class TestBase(Base):
    """A base da junção de 3 vias: a última versão do outro aparelho que este já juntou."""

    def test_depois_de_juntar_guarda_a_base_e_nao_avisa_de_novo(self):
        self.sinc(self.note); self.sinc(self.pc)
        rp = self.pc / "sync"
        v1 = sincronia.outros(self.pc, rp, "pc")[0]
        self.assertFalse(sincronia.marcar_visto(self.pc, rp, "notebook", "outra-versao"))   # não era a que o app juntou
        self.assertFalse(sincronia.marcar_visto(self.pc, rp, "../segredo", v1["atualizado"]))
        self.assertTrue(sincronia.marcar_visto(self.pc, rp, "notebook", v1["atualizado"]))
        self.assertEqual(sincronia.outros(self.pc, rp, "pc"), [{"aparelho": "notebook", "atualizado": v1["atualizado"], "novo": False}])

        gravar(self.note / "estado.json", {**ESTADO, "duvidas": [], "_t": 2, "principal": "fisio"})
        with mock.patch.object(sincronia, "datetime", wraps=sincronia.datetime) as dt:      # um minuto depois
            dt.now.return_value = sincronia.datetime(2030, 1, 1, 10, 0)
            self.sinc(self.note)
        self.sinc(self.pc)
        v2 = sincronia.outros(self.pc, rp, "pc")[0]
        self.assertTrue(v2["novo"])
        self.assertEqual(v2["estado"]["principal"], "fisio")
        self.assertEqual(v2["base"]["estado"], ESTADO)                          # o que o notebook tinha quando juntei
        self.assertEqual(v2["base"]["biblioteca"], BIB)

    def test_se_o_outro_foi_reinstalado_a_base_nao_vale(self):
        self.sinc(self.note); self.sinc(self.pc)
        rp = self.pc / "sync"
        sincronia.marcar_visto(self.pc, rp, "notebook", sincronia.outros(self.pc, rp, "pc")[0]["atualizado"])
        (self.note / "sincronia.json").unlink()                                 # pasta dados/ recriada: código novo
        gravar(self.note / "estado.json", {"top": {"z": {"n": 1}}, "_t": 99})
        self.sinc(self.note); self.sinc(self.pc)
        o = sincronia.outros(self.pc, rp, "pc")[0]
        self.assertTrue(o["novo"])
        self.assertIsNone(o["base"])

    def test_nome_do_aparelho_e_unico_e_fixo(self):
        d = self.base / "sem-nome" / "dados"
        a = sincronia.aparelho(d)
        self.assertRegex(a, r"^[a-z0-9\-]+-[0-9a-f]{4}$")
        self.assertEqual(sincronia.aparelho(d), a)                              # sorteado uma vez só
        self.assertEqual(sincronia.instalacao(d), sincronia.instalacao(d))
        self.assertEqual(sincronia.aparelho(d), a)                              # o código não troca o nome
        gravar(d / "config.json", {"nome_aparelho": "Notebook"})
        self.assertEqual(sincronia.aparelho(d), "notebook")


NOTA = """---
aparelho: {ap}
atualizado: {quando}
app: estudaai 1.1.0
---
# estudaai: progresso do {ap}

## Histórico

- 08/11 22:19: +1 sessão de foco

## Dados

```json
{dados}
```
"""


class TestMigracao(Base):
    """A pasta antiga (Google Drive ou Obsidian) entra no Git uma vez, sem perder nem apagar nada."""

    def setUp(self):
        super().setUp()
        self.drive = self.base / "Meu Drive"
        pasta = self.drive / "estudaai-sync"
        (pasta / "arquivos").mkdir(parents=True)
        self.estado_pc = {"top": {"so-no-pc": {"n": 5}}, "dias": {"2026-11-05": 3}, "_t": 4}
        nota = lambda ap, est: NOTA.format(ap=ap, quando="2026-11-08T22:19:24", dados=json.dumps({"estado": est, "biblioteca": {"docs": [{"id": "d9"}]}}))  # noqa: E731
        (pasta / "pc-antigo.md").write_text(nota("pc-antigo", self.estado_pc), encoding="utf-8")
        (pasta / "notebook.md").write_text(nota("notebook", {"top": {"velho": {"n": 1}}}), encoding="utf-8")
        (pasta / "arquivos" / "so-no-drive.pdf").write_bytes(b"%PDF-1.4 d")
        (pasta / "arquivos" / "so-no-drive.json.md").write_text('```json\n{"aulas": {"k": 1}}\n```\n', encoding="utf-8")
        gravar(self.note / "config.json", {"nome_aparelho": "notebook", "pasta_sincronia": str(self.drive)})

    def test_migra_as_notas_dos_outros_e_os_arquivos_sem_apagar_o_drive(self):
        antes = sorted(p.name for p in (self.drive / "estudaai-sync").rglob("*"))
        self.assertTrue(self.sinc(self.note)["ok"])
        migrado = json.loads(self.no_remoto("pc-antigo.json"))
        self.assertEqual(migrado["estado"], self.estado_pc)
        self.assertEqual(migrado["historico"], ["08/11 22:19: +1 sessão de foco"])
        self.assertEqual(json.loads(self.no_remoto("notebook.json"))["estado"], ESTADO)     # o meu vem de dados/, não da nota velha
        self.assertEqual((self.note / "arquivos" / "so-no-drive.pdf").read_bytes(), b"%PDF-1.4 d")
        self.assertEqual(ler(self.note / "arquivos" / "so-no-drive.json"), {"aulas": {"k": 1}})
        self.assertIn("%PDF-1.4 d", self.no_remoto("arquivos/so-no-drive.pdf"))
        self.assertEqual(sorted(p.name for p in (self.drive / "estudaai-sync").rglob("*")), antes)
        # o app junta o progresso do PC antigo na próxima abertura
        o = sincronia.outros(self.note, self.note / "sync", "notebook")
        self.assertEqual([(x["aparelho"], x["novo"]) for x in o], [("pc-antigo", True)])
        self.assertTrue(ler(self.note / "sincronia.json")["migrado_drive"])

    def test_sem_internet_a_migracao_fica_para_depois_e_nao_se_perde(self):
        git("remote", "set-url", "origin", str(self.base / "nao-existe.git"), cwd=self.note / "sync")
        self.assertFalse(self.sinc(self.note)["ok"])
        self.assertFalse(ler(self.note / "sincronia.json").get("migrado_drive", False) if (self.note / "sincronia.json").exists() else False)
        git("remote", "set-url", "origin", str(self.remoto), cwd=self.note / "sync")
        self.assertTrue(self.sinc(self.note)["ok"])
        self.assertEqual(json.loads(self.no_remoto("pc-antigo.json"))["estado"], self.estado_pc)

    def test_nao_passa_por_cima_do_que_o_outro_ja_enviou_pelo_git(self):
        pc = self.aparelho("pc-antigo")
        gravar(pc / "estado.json", {"top": {"novo-pelo-git": {"n": 9}}, "_t": 50})
        with mock.patch.object(sincronia, "datetime", wraps=sincronia.datetime) as dt:
            dt.now.return_value = sincronia.datetime(2026, 11, 10, 9, 0)
            self.sinc(pc)
        self.assertTrue(self.sinc(self.note)["ok"])
        self.assertEqual(json.loads(self.no_remoto("pc-antigo.json"))["estado"]["top"], {"novo-pelo-git": {"n": 9}})


class TestRotas(Base):
    def setUp(self):
        super().setUp()
        self.antigo = servidor.Handler.dados
        servidor.Handler.dados = self.pc
        servidor._SINC.clear()
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), servidor.Handler)
        self.url = f"http://127.0.0.1:{self.srv.server_port}"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def tearDown(self):
        self.srv.shutdown(); self.srv.server_close()
        for s in servidor._SINC.values():
            if s["timer"]:
                s["timer"].cancel()
        servidor.Handler.dados = self.antigo
        super().tearDown()

    def post(self, rota, corpo=None, tipo="application/json"):
        st, r = pedir(self.url + rota, "POST", json.dumps(corpo).encode() if corpo is not None else None, tipo if corpo is not None else None)
        return st, json.loads(r)

    def test_puxar_juntar_e_enviar(self):
        self.sinc(self.note)
        st, r = self.post("/api/sinc/puxar")
        self.assertEqual(st, 200)
        self.assertTrue(r["ligado"])
        self.assertEqual((r["aparelho"], r["pendente"], r["erro"]), ("pc", False, ""))
        self.assertEqual([(o["aparelho"], o["novo"]) for o in r["outros"]], [("notebook", True)])
        self.assertEqual(r["outros"][0]["estado"]["dias"], ESTADO["dias"])
        # o app juntou e avisa: da próxima vez não é mais novidade
        self.assertEqual(self.post("/api/sinc/visto", {"aparelho": "notebook", "atualizado": r["outros"][0]["atualizado"]}), (200, {"ok": True}))
        self.assertEqual(self.post("/api/sinc/visto", {"aparelho": "../x", "atualizado": "y"})[0], 400)
        self.assertFalse(self.post("/api/sinc/puxar")[1]["outros"][0]["novo"])
        # a aba que fecha manda o estado pelo sendBeacon; com ?esperar=1 (chip) a resposta já diz se enviou
        st, r = self.post("/api/sinc/enviar?esperar=1", {"top": {"b": {"n": 1}}, "dias": {"2026-11-10": 1}}, "text/plain")
        self.assertEqual((st, r["pendente"]), (200, False))
        self.assertTrue(r["enviado"])
        self.assertEqual(json.loads(self.no_remoto("pc.json"))["estado"]["top"], {"b": {"n": 1}})
        self.assertEqual(json.loads(pedir(self.url + "/api/sinc")[1])["pendente"], False)

    def test_gravar_agenda_o_envio_e_sem_internet_fica_pendente(self):
        git("remote", "set-url", "origin", str(self.base / "nao-existe.git"), cwd=self.pc / "sync")
        with mock.patch.object(servidor, "ESPERA_ENVIO", 0.05), mock.patch.object(servidor, "ESPERA_NOVA_TENTATIVA", 600):
            st, _ = pedir(self.url + "/api/estado", "PUT", json.dumps({"top": {"b": {"n": 1}}}).encode(), "application/json")
            self.assertEqual(st, 200)
            self.assertTrue(json.loads(pedir(self.url + "/api/sinc")[1])["pendente"])
            st, r = self.post("/api/sinc/enviar?esperar=1")
        self.assertEqual(st, 200)
        self.assertTrue(r["pendente"])
        self.assertIn("sem internet", r["erro"])
        self.assertEqual(json.loads(pedir(self.url + "/api/estado")[1])["top"], {"b": {"n": 1}})   # o app segue funcionando

    def test_sem_sincronia_configurada_as_rotas_respondem_desligado(self):
        servidor.Handler.dados = self.base / "sozinho"
        self.assertEqual(json.loads(pedir(self.url + "/api/sinc")[1]), {"ligado": False})
        self.assertEqual(self.post("/api/sinc/puxar"), (200, {"ligado": False}))
        self.assertEqual(self.post("/api/sinc/enviar?esperar=1"), (200, {"ligado": False}))


if __name__ == "__main__":
    unittest.main()
