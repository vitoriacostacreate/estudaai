"""Testes do servidor local: armazém de arquivos, índice, proteção CSRF e migração do formato antigo."""
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.request
from unittest import mock
from http.server import ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
import servidor  # noqa: E402


def pedir(url, metodo="GET", corpo=None, tipo=None, origem=None):
    req = urllib.request.Request(url, data=corpo, method=metodo)
    if tipo:
        req.add_header("Content-Type", tipo)
    if origem:
        req.add_header("Origin", origem)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


class TestServidor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        servidor.Handler.dados = Path(cls.tmp.name)
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), servidor.Handler)
        cls.url = f"http://127.0.0.1:{cls.srv.server_port}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        servidor.Handler.dados = servidor.DADOS
        cls.tmp.cleanup()

    def test_guarda_le_e_apaga_arquivo(self):
        st, corpo = pedir(self.url + "/api/arquivos", "POST", b"%PDF-1.4 teste", "application/pdf")
        self.assertEqual(st, 200)
        info = json.loads(corpo)
        self.assertTrue(info["id"].endswith(".pdf"))
        st, corpo = pedir(self.url + info["url"])
        self.assertEqual((st, corpo), (200, b"%PDF-1.4 teste"))
        self.assertEqual(pedir(self.url + info["url"], "DELETE")[0], 200)
        self.assertEqual(pedir(self.url + info["url"])[0], 404)

    def test_recusa_arquivo_que_nao_e_pdf(self):
        self.assertEqual(pedir(self.url + "/api/arquivos", "POST", b"oi", "application/pdf")[0], 400)
        self.assertEqual(pedir(self.url + "/api/arquivos", "POST", b"oi", "text/html")[0], 400)

    def test_nao_sai_da_pasta_de_arquivos(self):
        self.assertEqual(pedir(self.url + "/api/arquivos/..%2Festado.json")[0], 404)

    def test_indice_da_biblioteca(self):
        idx = {"docs": [{"id": "a"}], "temas": [], "anexos": {}}
        self.assertEqual(pedir(self.url + "/api/biblioteca", "PUT", json.dumps(idx).encode(), "application/json")[0], 200)
        self.assertEqual(json.loads(pedir(self.url + "/api/biblioteca")[1]), idx)
        self.assertEqual(pedir(self.url + "/api/biblioteca", "PUT", b'{"x": 1}', "application/json")[0], 400)

    def test_bloqueia_outros_sites(self):
        st, _ = pedir(self.url + "/api/config", "POST", b'{"modelo": "x"}', "application/json", origem="https://malicioso.com")
        self.assertEqual(st, 403)
        st, _ = pedir(self.url + "/api/config", "POST", b'{"modelo": "x"}', "application/json", origem=self.url)
        self.assertEqual(st, 200)

    def test_json_quebrado(self):
        self.assertEqual(pedir(self.url + "/api/ia/aula", "POST", b"{quebrado", "application/json")[0], 400)


class TestMigracao(unittest.TestCase):
    def test_formato_antigo_vira_pacotes(self):
        with tempfile.TemporaryDirectory() as t:
            d = Path(t)
            (d / "pdfs").mkdir()
            (d / "textos").mkdir()
            (d / "pdfs" / "doc1.pdf").write_bytes(b"%PDF")
            (d / "textos" / "doc1.json").write_text('{"p-doc1-1": "texto"}', encoding="utf-8")
            antigo = {"docs": [{"id": "doc1", "tema": "pdf-doc1"}],
                      "temas": [{"id": "pdf-doc1", "doc": "doc1", "disciplinas": [{"topicos": [{"id": "p-doc1-1", "t": "Seção"}]}]}],
                      "anexos": {}, "aulas": {"p-doc1-1": {"titulo": "Seção"}, "p-outro-1": {}},
                      "cartoes": [{"id": "c1", "doc": "doc1"}, {"id": "c2", "doc": "outro"}]}
            (d / "biblioteca.json").write_text(json.dumps(antigo), encoding="utf-8")

            self.assertEqual(servidor.migrar_v1(d), 1)
            novo = json.loads((d / "biblioteca.json").read_text(encoding="utf-8"))
            self.assertNotIn("aulas", novo)
            self.assertEqual(novo["docs"][0]["pacoteUrl"], "/api/arquivos/doc1.json")
            pk = json.loads((d / "arquivos" / "doc1.json").read_text(encoding="utf-8"))
            self.assertEqual(list(pk["aulas"]), ["p-doc1-1"])
            self.assertEqual([c["id"] for c in pk["cartoes"]], ["c1"])      # mesmo id: progresso mantido
            self.assertEqual(pk["textos"], {"p-doc1-1": "texto"})
            self.assertTrue((d / "arquivos" / "doc1.pdf").exists())
            self.assertTrue((d / "biblioteca-v1.json").exists())
            self.assertEqual(servidor.migrar_v1(d), 0)                         # só migra uma vez


class FakeResp:
    def __init__(self, obj):
        self.obj = obj

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def read(self):
        return json.dumps(self.obj).encode()


SEM_CHAVES = {k: "" for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "ESTUDAAI_MODELO")}


@mock.patch.dict(os.environ, SEM_CHAVES)
class TestIA(unittest.TestCase):
    """Revisão com IA: escolha do provedor e leitura da resposta de cada API (rede simulada)."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def chaves(self, **kw):
        (self.d / "config.json").write_text(json.dumps(kw), encoding="utf-8")

    def chamar(self, resposta, provedor=None):
        enviados = []

        def falso(req, timeout=None):
            enviados.append((req.full_url, json.loads(req.data)))
            return FakeResp(resposta)
        with mock.patch("urllib.request.urlopen", falso):
            return servidor.ia.gerar_texto(self.d, "revise", provedor), enviados

    def test_sem_chave_avisa(self):
        self.assertEqual(servidor.ia.provedores(self.d), [])
        with self.assertRaises(RuntimeError):
            servidor.ia.gerar_texto(self.d, "x")

    def test_ordem_de_preferencia(self):
        self.chaves(gemini_api_key="g", openai_api_key="o")
        self.assertEqual(servidor.ia.provedores(self.d), ["openai", "gemini"])
        self.assertFalse(servidor.ia.disponivel(self.d))      # gerar aula continua só com o Claude

    def test_claude_com_busca_e_pause_turn(self):
        self.chaves(anthropic_api_key="a")
        respostas = iter([{"stop_reason": "pause_turn", "content": [{"type": "text", "text": "parte 1 "}]},
                          {"stop_reason": "end_turn", "content": [{"type": "server_tool_use"}, {"type": "text", "text": "parte 2"}]}])
        enviados = []

        def falso(req, timeout=None):
            enviados.append(json.loads(req.data))
            return FakeResp(next(respostas))
        with mock.patch("urllib.request.urlopen", falso):
            prov, txt = servidor.ia.gerar_texto(self.d, "revise")
        self.assertEqual((prov, txt), ("anthropic", "parte 1 parte 2"))
        self.assertEqual(enviados[0]["tools"][0]["name"], "web_search")
        self.assertEqual(enviados[1]["messages"][-1]["role"], "assistant")

    def test_openai(self):
        self.chaves(openai_api_key="o")
        (prov, txt), env = self.chamar({"output": [{"type": "web_search_call"}, {"type": "message", "content": [{"type": "output_text", "text": "ok gpt"}]}]})
        self.assertEqual((prov, txt), ("openai", "ok gpt"))
        self.assertIn("/v1/responses", env[0][0])
        self.assertEqual(env[0][1]["tools"], [{"type": "web_search"}])

    def test_gemini(self):
        self.chaves(gemini_api_key="g", modelo_gemini="gemini-x")
        (prov, txt), env = self.chamar({"candidates": [{"content": {"parts": [{"text": "ok "}, {"text": "gemini"}]}}]})
        self.assertEqual((prov, txt), ("gemini", "ok gemini"))
        self.assertIn("models/gemini-x:generateContent", env[0][0])

    def test_provedor_sem_chave(self):
        self.chaves(openai_api_key="o")
        with self.assertRaises(RuntimeError):
            servidor.ia.gerar_texto(self.d, "x", "gemini")

    def test_rota_texto_valida_pedido(self):
        Handler = servidor.Handler
        antigo, Handler.dados = Handler.dados, self.d
        srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{srv.server_port}"
        try:
            self.assertEqual(pedir(url + "/api/ia/texto", "POST", b'{"prompt": ""}', "application/json")[0], 400)
            self.assertEqual(pedir(url + "/api/ia/texto", "POST", b'{"prompt": "x", "provedor": "outro"}', "application/json")[0], 400)
            st, corpo = pedir(url + "/api/ia/texto", "POST", b'{"prompt": "x"}', "application/json")
            self.assertEqual(st, 500)
            self.assertIn("Nenhuma IA", json.loads(corpo)["erro"])
            st, corpo = pedir(url + "/api/config", "POST", b'{"openai_api_key": "o", "modelo_openai": "gpt-x"}', "application/json")
            self.assertEqual(json.loads(corpo)["provedores"], ["openai"])
            info = json.loads(pedir(url + "/api/info")[1])
            self.assertEqual((info["provedores"], info["modelo_openai"]), (["openai"], "gpt-x"))
            self.assertNotIn("openai_api_key", info)                      # a chave nunca volta para o navegador
        finally:
            srv.shutdown()
            srv.server_close()
            Handler.dados = antigo


if __name__ == "__main__":
    unittest.main()
