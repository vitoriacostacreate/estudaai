"""Testes da sincronia pelo cofre do Obsidian (nucleo/sincronia.py e rotas /api/obsidian)."""
import json
import os
import sys
os.environ["ESTUDAAI_SEM_DRIVE"] = "1"   # nunca grava no Google Drive de verdade
import tempfile
import threading
import unittest
from datetime import datetime
from http.server import ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(RAIZ / "testes"))
import servidor  # noqa: E402
from nucleo import sincronia  # noqa: E402
from test_servidor import pedir  # noqa: E402


def gravar(arq: Path, obj):
    arq.parent.mkdir(parents=True, exist_ok=True)
    arq.write_text(json.dumps(obj), encoding="utf-8")


class TestSincronia(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.cofre = base / "cofre"
        (self.cofre / ".obsidian").mkdir(parents=True)
        self.pc = self.cofre / "estudaai" / "dados"          # dados/ dentro do cofre: acha o cofre sozinho
        self.note = base / "note" / "dados"                  # fora do cofre: usa cofre_obsidian do config
        gravar(self.note / "config.json", {"cofre_obsidian": str(self.cofre)})
        gravar(self.pc / "estado.json", {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 3}}, "dias": {"2026-11-08": 3}, "_t": 1})
        gravar(self.pc / "biblioteca.json", {"docs": [{"id": "d1"}], "temas": [], "anexos": {}})
        gravar(self.pc / "arquivos" / "x.json", {"aulas": {}})
        (self.pc / "arquivos" / "x.pdf").write_bytes(b"%PDF-1.4 x")

    def tearDown(self):
        self.tmp.cleanup()

    def test_acha_o_cofre(self):
        self.assertEqual(sincronia.achar_cofre(self.pc), self.cofre.resolve())
        self.assertEqual(sincronia.achar_cofre(self.note), self.cofre)
        gravar(self.note / "config.json", {"cofre_obsidian": "nao"})
        self.assertIsNone(sincronia.achar_cofre(self.note))

    def test_google_drive_vem_antes_do_obsidian(self):
        drive = Path(self.tmp.name) / "Meu Drive"; drive.mkdir()
        from unittest import mock
        with mock.patch.object(sincronia, "google_drive", return_value=drive):
            self.assertEqual(sincronia.achar_cofre(self.pc), drive)
            self.assertEqual(sincronia.via(drive), "Google Drive")
            gravar(self.pc / "config.json", {"pasta_sincronia": str(self.cofre)})
            self.assertEqual(sincronia.achar_cofre(self.pc), self.cofre)          # o config vence
        self.assertEqual(sincronia.via(self.cofre), "Obsidian")

    def test_nome_do_aparelho_e_unico_e_fixo(self):
        a = sincronia.aparelho(self.pc)
        self.assertRegex(a, r"^[a-z0-9\-]+-[0-9a-f]{4}$")
        self.assertEqual(sincronia.aparelho(self.pc), a)                          # sorteado uma vez só
        gravar(self.note / "config.json", {"cofre_obsidian": str(self.cofre), "nome_aparelho": "Notebook"})
        self.assertEqual(sincronia.aparelho(self.note), "notebook")

    def test_exporta_so_quando_muda_e_guarda_historico(self):
        r = sincronia.exportar(self.pc, self.cofre, "pc", "1.0", datetime(2026, 11, 8, 14, 32))
        self.assertTrue(r["mudou"])
        nota = self.cofre / "estudaai-sync" / "pc.md"
        txt = nota.read_text(encoding="utf-8")
        self.assertIn("aparelho: pc", txt)
        self.assertIn("08/11 14:32: +1 PDF, +2 estudos de tópico, +3 revisões de cartão, +1 dia de estudo", txt)
        self.assertTrue((self.cofre / "estudaai-sync" / "arquivos" / "x.pdf").exists())
        self.assertTrue((self.cofre / "estudaai-sync" / "arquivos" / "x.json.md").exists())
        self.assertFalse(sincronia.exportar(self.pc, self.cofre, "pc", "1.0")["mudou"])   # nada mudou: não reescreve
        gravar(self.pc / "estado.json", {"top": {"a": {"n": 2}}, "cards": {"c1": {"n": 4}}, "dias": {"2026-11-08": 3}, "_t": 2})
        sincronia.exportar(self.pc, self.cofre, "pc", "1.0", datetime(2026, 11, 8, 15, 0))
        n = sincronia.ler_nota(nota)
        self.assertEqual(n["historico"][0], "08/11 15:00: +1 revisão de cartão")
        self.assertEqual(len(n["historico"]), 2)
        self.assertEqual(n["estado"]["cards"]["c1"]["n"], 4)

    def test_outro_aparelho_ve_baixa_e_marca_visto(self):
        sincronia.exportar(self.pc, self.cofre, "pc", "1.0")
        outros = sincronia.outros(self.note, self.cofre, "note")
        self.assertEqual([o["aparelho"] for o in outros], ["pc"])
        self.assertEqual(outros[0]["visto"], "")
        self.assertEqual(sincronia.outros(self.pc, self.cofre, "pc"), [])          # a própria nota não aparece
        n = sincronia.baixar(self.note, self.cofre, "pc")
        self.assertEqual(n["biblioteca"]["docs"], [{"id": "d1"}])
        self.assertEqual(json.loads((self.note / "arquivos" / "x.json").read_text(encoding="utf-8")), {"aulas": {}})
        self.assertEqual((self.note / "arquivos" / "x.pdf").read_bytes(), b"%PDF-1.4 x")
        sincronia.marcar_visto(self.note, "pc", outros[0]["atualizado"])
        self.assertEqual(sincronia.outros(self.note, self.cofre, "note")[0]["visto"], outros[0]["atualizado"])
        self.assertIsNone(sincronia.baixar(self.note, self.cofre, "../segredo"))

    def test_rotas_do_servidor(self):
        antigo = servidor.Handler.dados
        servidor.Handler.dados = self.note
        srv = ThreadingHTTPServer(("127.0.0.1", 0), servidor.Handler)
        url = f"http://127.0.0.1:{srv.server_port}"
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            sincronia.exportar(self.pc, self.cofre, "outro-pc", "1.0")
            info = json.loads(pedir(url + "/api/obsidian")[1])
            self.assertEqual(info["cofre"], str(self.cofre))
            self.assertEqual([o["aparelho"] for o in info["outros"]], ["outro-pc"])
            st, corpo = pedir(url + "/api/obsidian/aparelho/outro-pc")
            self.assertEqual((st, json.loads(corpo)["estado"]["top"]), (200, {"a": {"n": 2}}))
            self.assertEqual(pedir(url + "/api/obsidian/aparelho/nao-existe")[0], 404)
            # a aba que fecha manda o estado pelo sendBeacon: grava e exporta na hora
            st, corpo = pedir(url + "/api/obsidian/salvar", "POST", json.dumps({"top": {"b": {"n": 1}}}).encode(), "text/plain")
            self.assertEqual(st, 200)
            self.assertTrue(json.loads(corpo)["mudou"])
            minha = sincronia.ler_nota(self.cofre / "estudaai-sync" / f"{sincronia.aparelho(self.note)}.md")
            self.assertEqual(minha["estado"]["top"], {"b": {"n": 1}})
            st, _ = pedir(url + "/api/obsidian/visto", "POST", json.dumps({"aparelho": "outro-pc", "atualizado": "x"}).encode(), "application/json")
            self.assertEqual(st, 200)
            self.assertEqual(pedir(url + "/api/obsidian/visto", "POST", b'{"aparelho": "../x"}', "application/json")[0], 400)
        finally:
            srv.shutdown(); srv.server_close()
            servidor.Handler.dados = antigo


if __name__ == "__main__":
    unittest.main()
