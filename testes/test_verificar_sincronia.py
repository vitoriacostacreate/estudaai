"""Testes do verificador que roda antes de fechar o navegador (verificar_sincronia.py)."""
import hashlib
import json
import os
import sys
os.environ["ESTUDAAI_SEM_DRIVE"] = "1"   # nunca toca no Google Drive de verdade
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
import verificar_sincronia as vs  # noqa: E402
from nucleo import sincronia  # noqa: E402


def gravar(arq: Path, obj):
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(obj), encoding="utf-8")


class TestVerificar(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.dados, self.cofre = base / "dados", base / "Meu Drive"
        self.cofre.mkdir()
        gravar(self.dados / "config.json", {"pasta_sincronia": str(self.cofre), "nome_aparelho": "notebook"})
        gravar(self.dados / "estado.json", {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 3}}, "_t": 1})
        gravar(self.dados / "biblioteca.json", {"docs": [{"id": "d1"}], "temas": [], "anexos": {}})
        (self.dados / "arquivos").mkdir()
        (self.dados / "arquivos" / "x.pdf").write_bytes(b"%PDF-1.4 x")
        (self.dados / "arquivos" / "x.json").write_text('{\n "aulas": {}\n}', encoding="utf-8")
        sincronia.exportar(self.dados, self.cofre, "notebook", "t")
        self.banco = base / "metadata_sqlite_db"
        c = sqlite3.connect(self.banco)
        c.execute("create table items (id text, proto blob, local_title text, trashed int, is_tombstone int)")
        c.commit(); c.close()
        self.pasta = self.cofre / sincronia.PASTA
        self.servidor = mock.patch.object(vs, "pedir_exportacao", return_value=True)
        self.via = mock.patch.object(sincronia, "via", return_value="Google Drive")
        self.servidor_mock = self.servidor.start()
        self.via.start()

    def tearDown(self):
        mock.patch.stopall()
        self.tmp.cleanup()

    def registrar(self, arq: Path, id_="abc123"):
        proto = b"\x12\x20" + hashlib.md5(arq.read_bytes()).hexdigest().encode() + b"\x00"
        c = sqlite3.connect(self.banco)
        c.execute("insert into items values (?,?,?,0,0)", (id_, proto, arq.name))
        c.commit(); c.close()

    def registrar_tudo(self):
        self.registrar(self.pasta / "notebook.md")
        self.registrar(self.pasta / "arquivos" / "x.pdf")
        self.registrar(self.pasta / "arquivos" / "x.json.md")

    def rodar(self):
        return vs.verificar(self.dados, espera=0, espera_nota=0, bancos=[self.banco])

    def test_tudo_no_google_pode_fechar(self):
        self.registrar_tudo()
        r = self.rodar()
        self.assertEqual((r["codigo"], r["titulo"]), (0, "PODE FECHAR"))
        self.assertEqual(r["totais"]["pdfs"], 1)

    def test_progresso_que_nao_chegou_na_pasta(self):
        self.registrar_tudo()
        gravar(self.dados / "estado.json", {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 8}}, "_t": 2})
        r = self.rodar()
        self.assertEqual(r["codigo"], 1)
        self.assertIn("+5 revisões de cartão", r["linhas"][1][2])

    def test_anotacao_sem_contador_tambem_conta_como_diferente(self):
        self.registrar_tudo()
        gravar(self.dados / "estado.json", {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 3}}, "_t": 1, "nota": "oi"})
        self.assertEqual(self.rodar()["codigo"], 1)

    def test_pdf_ou_pacote_que_faltam(self):
        self.registrar_tudo()
        (self.pasta / "arquivos" / "x.pdf").unlink()
        (self.pasta / "arquivos" / "x.json.md").write_text("```json\noutra coisa\n```\n", encoding="utf-8")
        r = self.rodar()
        self.assertEqual(r["codigo"], 1)
        self.assertIn("faltam 2 de 2", r["linhas"][2][2])

    def test_arquivo_na_fila_ainda_nao_conta_como_enviado(self):
        self.registrar_tudo()
        c = sqlite3.connect(self.banco); c.execute("delete from items where local_title='notebook.md'"); c.commit(); c.close()
        self.registrar(self.pasta / "notebook.md", id_="local-24")   # id local = o Google ainda não recebeu
        r = self.rodar()
        self.assertEqual((r["codigo"], r["titulo"]), (1, "SALVO, AINDA SUBINDO"))

    def test_versao_antiga_na_nuvem_nao_confirma_a_nova(self):
        self.registrar_tudo()
        gravar(self.dados / "estado.json", {"top": {"a": {"n": 9}}, "_t": 9})
        sincronia.exportar(self.dados, self.cofre, "notebook", "t")
        self.assertEqual(self.rodar()["titulo"], "SALVO, AINDA SUBINDO")

    def test_registro_do_drive_ilegivel_nao_vira_sucesso(self):
        r = vs.verificar(self.dados, espera=0, espera_nota=0, bancos=[])
        self.assertEqual(r["codigo"], 2)
        self.banco.write_bytes(b"isto nao e sqlite")
        self.assertEqual(self.rodar()["codigo"], 2)

    def test_pasta_que_nao_e_o_drive_nao_confirma(self):
        mock.patch.stopall()
        mock.patch.object(vs, "pedir_exportacao", return_value=True).start()
        self.assertEqual(self.rodar()["codigo"], 2)

    def test_app_fechado_nao_garante_o_que_estava_na_aba(self):
        self.registrar_tudo()
        self.servidor_mock.return_value = False
        r = self.rodar()
        self.assertEqual((r["codigo"], r["titulo"]), (2, "SÓ CONFERI O QUE FOI SALVO"))

    def test_sincronia_desligada(self):
        gravar(self.dados / "config.json", {"pasta_sincronia": "nao"})
        self.assertEqual(self.rodar()["codigo"], 1)


if __name__ == "__main__":
    unittest.main()
