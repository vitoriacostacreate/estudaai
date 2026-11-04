"""Gera exemplos/apostila-exemplo.pdf (texto original, para testar o estudaai)."""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

SECOES = [
 ("1. Organização do músculo esquelético", [
  "O músculo esquelético é o tecido responsável pelos movimentos voluntários do corpo. Ele é formado por feixes de fibras musculares envolvidos por camadas de tecido conjuntivo.",
  "A fibra muscular é uma célula longa e multinucleada. Dentro dela existem as miofibrilas, que se repetem em unidades chamadas sarcômeros.",
  "O sarcômero é a unidade contrátil do músculo, delimitada por duas linhas Z. A actina forma os filamentos finos e a miosina forma os filamentos grossos.",
  "O epimísio é a camada de tecido conjuntivo que envolve o músculo inteiro. O perimísio envolve cada fascículo, e o endomísio envolve cada fibra.",
  "Em um adulto, o corpo tem mais de 600 músculos esqueléticos, que correspondem a cerca de 40 % da massa corporal."]),
 ("2. Contração muscular", [
  "A contração começa quando o neurônio motor libera acetilcolina na junção neuromuscular. A membrana da fibra despolariza e o potencial de ação entra pelos túbulos T.",
  "O retículo sarcoplasmático libera cálcio no citoplasma. O cálcio se liga à troponina, que desloca a tropomiosina e expõe os sítios de ligação da actina.",
  "A ponte cruzada é a ligação temporária entre a cabeça da miosina e a actina. Cada ciclo de ponte cruzada gasta uma molécula de ATP.",
  "O relaxamento acontece quando o cálcio é bombeado de volta para o retículo sarcoplasmático. Sem ATP, a miosina não se solta da actina, o que explica a rigidez cadavérica.",
  "A teoria dos filamentos deslizantes explica que os filamentos não encurtam: eles deslizam uns sobre os outros, aproximando as linhas Z."]),
 ("3. Tipos de fibra muscular", [
  "As fibras do tipo I são fibras de contração lenta, ricas em mitocôndrias e mioglobina. Elas resistem à fadiga e predominam em músculos posturais.",
  "As fibras do tipo II são fibras de contração rápida. Elas produzem mais força, mas entram em fadiga com mais facilidade.",
  "A unidade motora é o conjunto formado por um neurônio motor e todas as fibras que ele inerva. Músculos de controle fino, como os dos olhos, têm unidades motoras pequenas.",
  "O treinamento de resistência aumenta a capilarização e a quantidade de mitocôndrias. Já o treinamento de força aumenta a área de secção transversa das fibras em semanas a meses.",
  "A fadiga muscular é a queda temporária da capacidade de gerar força. Ela depende do acúmulo de metabólitos, da disponibilidade de energia e de fatores do sistema nervoso."]),
 ("4. Tipos de contração", [
  "A contração concêntrica é a contração em que o músculo encurta enquanto gera força, como ao subir uma escada.",
  "A contração excêntrica é a contração em que o músculo se alonga sob tensão, freando o movimento, como ao descer uma escada.",
  "A contração isométrica é a contração em que o comprimento do músculo não muda, como ao sustentar uma prancha por 30 segundos.",
  "A dor muscular tardia costuma aparecer entre 24 e 72 horas após exercícios com muitas contrações excêntricas.",
  "O agonista é o músculo que realiza o movimento principal. O antagonista é o músculo que realiza o movimento oposto e ajuda a controlar a velocidade."]),
]
def gerar(destino: Path):
    st = getSampleStyleSheet()
    d = SimpleDocTemplate(str(destino), pagesize=A4, title="Apostila de exemplo: músculo esquelético")
    h = [Paragraph("Apostila de exemplo: músculo esquelético", st["Title"]), Spacer(1, 12)]
    for i, (t, ps) in enumerate(SECOES):
        if i: h.append(PageBreak())
        h.append(Paragraph(t, st["Heading1"]))
        for p in ps * 2:
            h.append(Paragraph(p, st["BodyText"])); h.append(Spacer(1, 6))
    d.build(h)
if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "exemplos" / "apostila-exemplo.pdf"
    gerar(out); print(out)
