import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
from nucleo.organizar import organizar  # noqa: E402

EXEMPLO = RAIZ / "exemplos" / "apostila-exemplo.pdf"


class TestOrganizar(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = organizar(EXEMPLO, "apostila", "t1")

    def test_secoes_pelos_titulos(self):
        titulos = [t["t"] for t in self.r["topicos"]]
        self.assertEqual(len(titulos), 4)
        self.assertTrue(titulos[1].startswith("2. Contração"))

    def test_paginas_de_origem(self):
        for t in self.r["topicos"]:
            self.assertLessEqual(t["pi"], t["pf"])

    def test_definicoes_viram_cartoes(self):
        frentes = " ".join(c["f"] for c in self.r["cartoes"])
        self.assertIn("sarcômero", frentes)
        self.assertNotIn("<b>Ele</b>", frentes)

    def test_expressoes_de_duas_palavras(self):
        termos = [r[0].lower() for a in self.r["aulas"].values() for r in a["mapa"]["ramos"]]
        self.assertIn("ponte cruzada", termos)

    def test_quiz_valido(self):
        for a in self.r["aulas"].values():
            for q in a["quiz"]:
                self.assertTrue(0 <= q["a"] < len(q["o"]))
                self.assertIn("_____", q["q"])


if __name__ == "__main__":
    unittest.main()
