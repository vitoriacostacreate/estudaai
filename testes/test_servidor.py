"""Testes do servidor local: armazém de arquivos, índice, proteção CSRF e migração do formato antigo."""
import io
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
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
    """Cadeia de IAs: pagas (melhor modelo por atividade) → Gemini grátis; se uma falha, tenta a próxima. Rede simulada."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def chaves(self, **kw):
        (self.d / "config.json").write_text(json.dumps(kw), encoding="utf-8")

    def rede(self, *respostas):
        """Simula a internet: cada chamada devolve a próxima resposta (dict) ou levanta o erro (Exception)."""
        fila, enviados = list(respostas), []

        def falso(req, timeout=None):
            enviados.append((req.full_url, json.loads(req.data) if req.data else None))
            r = fila.pop(0)
            if isinstance(r, Exception):
                raise r
            return FakeResp(r)
        return mock.patch("urllib.request.urlopen", falso), enviados

    def test_sem_chave_avisa(self):
        self.assertEqual(servidor.ia.cadeia(self.d, "revisao"), [])
        with self.assertRaises(RuntimeError):
            servidor.ia.gerar_texto(self.d, "x")

    def test_pagas_primeiro_e_gratis_por_ultimo(self):
        self.chaves(gemini_api_key="g", openai_api_key="o", anthropic_api_key="a")
        c = servidor.ia.cadeia(self.d, "revisao")
        self.assertEqual([(x["provedor"], x["gratis"]) for x in c], [("anthropic", False), ("openai", False), ("gemini", True)])
        self.assertEqual(c[0]["modelo"], "claude-opus-5-5")
        self.assertEqual(c[2]["modelo"], servidor.ia.MODELO_GRATIS)
        self.assertEqual(servidor.ia.cadeia(self.d, "duvidas")[0]["modelo"], "claude-sonnet-5-5")   # melhor modelo por atividade

    def test_gemini_pago_entra_com_o_modelo_melhor(self):
        self.chaves(gemini_api_key="g", gemini_plano="pago")
        self.assertEqual(servidor.ia.cadeia(self.d, "revisao"), [{"provedor": "gemini", "modelo": "gemini-2.5-pro", "gratis": False}])

    def test_modelo_fixado_vale_mais_que_a_tabela(self):
        self.chaves(anthropic_api_key="a", modelo="claude-x")
        self.assertEqual(servidor.ia.cadeia(self.d, "aula")[0]["modelo"], "claude-x")

    def test_falha_passa_para_a_proxima(self):
        self.chaves(anthropic_api_key="a", gemini_api_key="g")
        sem_credito = urllib.error.HTTPError("u", 400, "credit", {}, io.BytesIO(b'{"error": {"message": "credit balance is too low"}}'))
        patch, env = self.rede(sem_credito, {"candidates": [{"content": {"parts": [{"text": "ok grátis"}]}}]})
        with patch:
            r = servidor.ia.gerar_texto(self.d, "revise")
        self.assertEqual((r["provedor"], r["gratis"], r["texto"]), ("gemini", True, "ok grátis"))
        self.assertIn("credit balance", r["falhas"][0])
        self.assertEqual(env[1][1]["tools"], [{"google_search": {}}])

    def test_todas_falham(self):
        self.chaves(openai_api_key="o")
        patch, _ = self.rede(urllib.error.URLError("sem rede"))
        with patch, self.assertRaises(RuntimeError) as e:
            servidor.ia.gerar_texto(self.d, "x")
        self.assertIn("ChatGPT", str(e.exception))

    def test_claude_com_busca_e_pause_turn(self):
        self.chaves(anthropic_api_key="a")
        patch, env = self.rede({"stop_reason": "pause_turn", "content": [{"type": "text", "text": "parte 1 "}]},
                               {"stop_reason": "end_turn", "content": [{"type": "server_tool_use"}, {"type": "text", "text": "parte 2"}]})
        with patch:
            r = servidor.ia.gerar_texto(self.d, "revise")
        self.assertEqual(r["texto"], "parte 1 parte 2")
        self.assertEqual(env[0][1]["tools"][0]["name"], "web_search")
        self.assertEqual(env[1][1]["messages"][-1]["role"], "assistant")

    def test_openai(self):
        self.chaves(openai_api_key="o")
        patch, env = self.rede({"output": [{"type": "web_search_call"}, {"type": "message", "content": [{"type": "output_text", "text": "ok gpt"}]}]})
        with patch:
            r = servidor.ia.gerar_texto(self.d, "revise", "duvidas")
        self.assertEqual((r["provedor"], r["texto"]), ("openai", "ok gpt"))
        self.assertIn("/v1/responses", env[0][0])
        self.assertEqual(env[0][1]["tools"], [{"type": "web_search"}])

    def test_aula_sem_json_tenta_a_proxima(self):
        self.chaves(anthropic_api_key="a", openai_api_key="o")
        patch, env = self.rede({"stop_reason": "end_turn", "content": [{"type": "text", "text": "desculpe, não consigo"}]},
                               {"output_text": '{"titulo": "T"}'})
        with patch:
            self.assertEqual(servidor.ia.gerar_aula(self.d, "aula"), {"titulo": "T"})
        self.assertNotIn("tools", env[0][1])                                # aula não usa busca

    def test_validar_chave(self):
        patch, env = self.rede({"data": []})
        with patch:
            servidor.ia.validar_chave("gemini", "AIza-teste")
        self.assertIn("/v1beta/models", env[0][0])
        recusada = urllib.error.HTTPError("u", 401, "no", {}, io.BytesIO(b"{}"))
        patch, _ = self.rede(recusada)
        with patch, self.assertRaises(RuntimeError):
            servidor.ia.validar_chave("openai", "sk-x")

    def test_reconhece_chave_copiada(self):
        import configurar_ia
        self.assertEqual(configurar_ia.achar_chave("gemini", "  AIzaSyA1234567890abcdefghijklmnopqrstu \n"), "AIzaSyA1234567890abcdefghijklmnopqrstu")
        self.assertEqual(configurar_ia.achar_chave("anthropic", "sk-ant-api03-" + "x" * 30), "sk-ant-api03-" + "x" * 30)
        self.assertIsNone(configurar_ia.achar_chave("openai", "sk-ant-api03-" + "x" * 30))   # chave do Claude não vale como OpenAI
        self.assertEqual(configurar_ia.achar_chave("openai", "sk-proj-" + "y" * 40), "sk-proj-" + "y" * 40)

    def test_rota_texto(self):
        Handler = servidor.Handler
        antigo, Handler.dados = Handler.dados, self.d
        srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{srv.server_port}"
        try:
            self.assertEqual(pedir(url + "/api/ia/texto", "POST", b'{"prompt": ""}', "application/json")[0], 400)
            self.assertEqual(pedir(url + "/api/ia/texto", "POST", b'{"prompt": "x", "atividade": "outra"}', "application/json")[0], 400)
            st, corpo = pedir(url + "/api/ia/texto", "POST", b'{"prompt": "x"}', "application/json")
            self.assertEqual(st, 500)
            self.assertIn("CONFIGURAR-IA", json.loads(corpo)["erro"])
            st, corpo = pedir(url + "/api/config", "POST", b'{"gemini_api_key": "g"}', "application/json")
            self.assertEqual(json.loads(corpo)["provedores"], ["gemini"])
            info = json.loads(pedir(url + "/api/info")[1])
            self.assertEqual(info["cadeia"]["revisao"][0]["gratis"], True)
            self.assertNotIn("gemini_api_key", info)                       # a chave nunca volta para o navegador
        finally:
            srv.shutdown()
            srv.server_close()
            Handler.dados = antigo

if __name__ == "__main__":
    unittest.main()
