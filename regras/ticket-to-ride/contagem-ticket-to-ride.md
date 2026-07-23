# Ticket to Ride — Núcleo Genérico + Diferenças por Edição

Documento de referência para implementação de calculadora de pontos.

**Parte 1** define o motor comum a praticamente todas as edições.
**Parte 2** lista o que cada edição altera ou acrescenta.

> ⚠️ As edições marcadas com 🔍 têm regras menos documentadas online. Confira o manual antes de codificar o cálculo delas.

---
---

# PARTE 1 — Regras genéricas (núcleo comum)

## 1.1 Fluxo da partida

Em cada turno, o jogador executa **exatamente uma** ação:

1. **Comprar cartas de vagão** — 2 cartas (viradas ou do topo do baralho). Pegar uma **locomotiva virada** consome as duas compras.
2. **Reivindicar uma rota** — descartar cartas na cor e quantidade da rota e ocupá-la com vagões.
3. **Comprar bilhetes de destino** — comprar N, manter no mínimo M (varia por edição).

**Gatilho de fim de jogo:** quando um jogador fica com **2 ou menos vagões**, cada jogador (incluindo ele) joga **mais um turno**. Depois, contagem final.

## 1.2 Reivindicar rotas

- Rota colorida: cartas daquela cor. Rota cinza: cartas de **uma** cor qualquer.
- Locomotivas são coringas (com exceções por edição).
- **Rotas duplas**: com 2–3 jogadores, apenas **uma** das vias pode ser ocupada. Com 4–5, ambas, mas nunca pelo mesmo jogador.
- Não é permitido reivindicar uma rota que não se consegue preencher completamente.

## 1.3 Elementos recorrentes (nem toda edição tem)

| Elemento | Como funciona |
|---|---|
| **Túnel** | Após jogar as cartas, revelam-se 3 cartas do baralho. Para cada carta da cor usada, o jogador paga 1 carta extra ou desiste (recupera as cartas). |
| **Ferry** | A rota exibe símbolos de locomotiva; cada símbolo exige 1 locomotiva obrigatória. |
| **Estação / Depósito** | Permite usar rota de outro jogador para efeito de bilhetes. |
| **Rota de montanha** | Exige devolver vagões extras para uma reserva, que pontua no fim. |

## 1.4 Tabela padrão de pontos por rota

Esta é a tabela clássica dos EUA — a maioria das edições usa exatamente ela, mas **quase todas têm exceções nas pontas** (veja a Parte 2).

| Vagões | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Pontos | 1 | 2 | 4 | 7 | 10 | 15 | 18 | 21 | 27 |

Regra de projeto: **modele a tabela como dado por edição**, nunca como constante global.

## 1.5 Bilhetes de destino

- Completo (caminho contínuo de vagões próprios entre as duas cidades): **+ valor impresso**.
- Incompleto: **− valor impresso**.
- Bilhetes descartados durante a partida não pontuam nem penalizam.
- **A pontuação final pode ser negativa.** Não existe piso em zero.

## 1.6 Bônus de fim de partida (catálogo)

| Bônus | Critério | Valor típico |
|---|---|---|
| **Longest Continuous Path** | Maior caminho contínuo em vagões | +10 |
| **Globetrotter** | Mais bilhetes completos | +10 ou +15 |
| **Explorer** | Mais cidades conectadas em uma única rede | +10 |

Empates: normalmente **todos os empatados recebem** o bônus integral.

### Cálculo do caminho contínuo mais longo
- Medido em **vagões**, não em número de rotas.
- Uma mesma rota não pode ser usada duas vezes no mesmo caminho.
- O caminho pode passar pela mesma cidade mais de uma vez.
- Ramificações não somam — vale apenas o caminho único mais longo.
- Estações e rotas emprestadas **não contam**.

Implementação: caminho mais longo em multigrafo sem repetição de aresta → DFS com backtracking a partir de cada vértice da rede do jogador.

## 1.7 Fórmula genérica

```
pontuacaoFinal =
      Σ TABELA_ROTAS[edicao][comprimento]     // por rota reivindicada
    + Σ bilhetesCompletos.valor
    − Σ bilhetesIncompletos.valor
    + bonusEspecificosDaEdicao                // pode ser 0
```

## 1.8 Desempate

1. Maior pontuação.
2. Empate: vence quem detém o bônus principal do mapa.
3. Persistindo: vitória compartilhada.

---
---

# PARTE 2 — Diferenças por edição

## 2.1 Quadro comparativo

| Edição | Jog. | Vagões | Rotas (compr. → pts) | Bônus final | Mecânica exclusiva |
|---|---|---|---|---|---|
| **EUA (2004)** | 2–5 | 45 | 1/2/3/4/5/6 → 1/2/4/7/10/15 | Caminho mais longo +10 | — |
| **Europa (2005)** | 2–5 | 45 | 1/2/3/4/6/8 → 1/2/4/7/15/21 | European Express +10 | Estações, túneis, ferries, bilhetes longos |
| **Märklin (2006)** | 2–5 | 45 | padrão + rotas de 7 | Mais bilhetes +10 | Passageiros e mercadorias |
| **Nordic Countries (2007)** | 2–3 | 40 | 1/2/3/4/5/6/9 → 1/2/4/7/10/15/27 | Globetrotter +10 | Sem restrição de locomotiva |
| **Switzerland** | 2–3 | 45 | padrão | Caminho mais longo +10 | Bilhetes de país |
| **India** | 2–4 | 45 | padrão | Caminho mais longo +10 + Grand Tour (até +40) | Mandala |
| **Heart of Africa** | 2–5 | 45 | padrão | Globetrotter | Cartas de terreno (dobram rotas) |
| **Nederland** | 2–5 | 45 | padrão | Ranking de moedas (até +55) | Pedágios e empréstimos |
| **United Kingdom** | 2–4 | 35 | padrão | 🔍 | Cartas de tecnologia |
| **Pennsylvania** | 2–5 | 45 | padrão | Globetrotter + maiorias acionárias | Ações de companhias |
| **Asia / Legendary Asia** | 2–6 | 45 / 54 | padrão | Explorer +10 (Legendary) | Rotas de montanha; jogo em duplas |
| **Germany (2012)** | 2–5 | 45 | padrão | Globetrotter + maiorias de meeples | Passageiros meeple |
| **France** | 2–5 | 45 | padrão | Caminho mais longo +10 e Globetrotter | Cores das rotas definidas em jogo |
| **Old West** | 2–6 | 45 | padrão | 🔍 | Cidades iniciais próprias |
| **Rails & Sails** | 2–5 | 60 + 50 barcos | 🔍 dupla tabela | 🔍 | Trens **e** navios, portos |
| **Japan** | 2–5 | 45 | padrão | Ranking do Trem-Bala (pode ser negativo) | Rede compartilhada |
| **Italy** | 2–5 | 45 | padrão | Bônus de regiões | Regiões e brasões |
| **Nederland / Great Lakes / World** | — | — | padrão | **Sem bônus clássico** | — |
| **Séries de cidades** (NY, Londres, Amsterdã, SF, Berlim, Paris) | 2–4 | 15–20 | tabela curta própria | Bônus temático próprio | Partidas de 10–20 min |
| **First Journey / Ghost Train** | 2–4 | 20 | — | — | Vence quem completar 6 bilhetes |

---

## 2.2 Caixas grandes

### EUA — original (2004)
Referência de todo o sistema. 45 vagões, rotas de 1 a 6, bônus de **Caminho Contínuo Mais Longo (+10)**. Sem túneis, ferries ou estações.

**Expansão USA 1910**: acrescenta o bônus **Globetrotter de +15** para quem completar mais bilhetes, além das variantes *Big Cities* e *Mega*.

### Europa (2005)
- Rotas de **1/2/3/4/6/8** vagões → **1/2/4/7/15/21**. Não existe rota de 5.
- **Túneis** e **ferries** entram pela primeira vez.
- **3 estações** por jogador. Cada estação **construída** permite designar **uma** rota de outro jogador que toca aquela cidade, usada apenas para completar bilhetes. A rota designada é fixa. Estação não construída vale **+4**.
- Bilhetes longos (fundo azul): 1 por jogador na preparação, não repostos.
- **European Express**: +10 para o caminho contínuo mais longo.

**Expansão Europa 1912**: acrescenta armazéns e depósitos, além das variantes *Big Cities* e *Mega*.

### Märklin (2006) — Alemanha
- Dois baralhos de bilhetes: curtos e longos, comprados em qualquer combinação.
- **Passageiros**: 3 por jogador, movidos pela rede para coletar **fichas de mercadoria** de valores variados nas cidades. As fichas somam diretamente ao placar final.
- Cartas de passageiro funcionam como coringa para atravessar rotas de adversários.
- Cartas **Locomotiva +4** só podem ser usadas em rotas de 4 ou mais espaços.
- Existem rotas triplas e rotas de 7 vagões.
- Bônus: **Mais Bilhetes Completos, +10**. Não há bônus de caminho mais longo.

### Nordic Countries (2007)
- **2–3 jogadores**, 40 vagões.
- Rotas de **1/2/3/4/5/6/9** → **1/2/4/7/10/15/27**.
- Túneis e ferries presentes.
- **Não há restrição** ao comprar locomotivas viradas — diferença importante em relação ao restante da linha.
- Bônus: **Globetrotter +10** (mais bilhetes completos), compartilhado em empate. **Não há** bônus de caminho mais longo nem estações.

### Germany / Zug um Zug Deutschland (2012)
Versão simplificada do mapa de Märklin.
- **Passageiros meeple** distribuídos pelas cidades. Ao reivindicar uma rota, o jogador pega um meeple de cada cidade conectada.
- No fim, para **cada cor de meeple**: maioria vale **+20**, segundo lugar vale **+10**.
- Bônus **Globetrotter**.

### Rails & Sails (2016) 🔍
- Mapas mundiais gigantes. **Dois tipos de rota**: ferroviária e marítima, com **dois baralhos separados**.
- 60 vagões e 50 barcos por jogador; é possível converter entre os dois durante a partida.
- **Portos** pontuam no fim conforme quantos bilhetes passam por eles.
- Compra: 3 cartas de trem + 3 de navio viradas.
- Tabelas de pontuação distintas para trem e navio — trate como duas tabelas independentes na implementação.

### Legacy: Legends of the West (2023) 🔍
Campanha de 12 partidas com regras que evoluem entre sessões. Não modelável com uma fórmula fixa.

---

## 2.3 Map Collections (exigem caixa base)

### Vol. 1 — Ásia / Legendary Asia
- **Team Asia**: 4 ou 6 jogadores em duplas. Cada dupla tem 54 vagões (27 por pessoa). Companheiros sentam lado a lado e compartilham cartas por uma área comum. Bônus de caminho mais longo e Globetrotter.
- **Legendary Asia**: acrescenta **rotas de montanha** (marcadas com X). Ao reivindicá-las, o jogador devolve vagões extras para a "reserva de montanha" — cada vagão ali vale **+2 pontos no fim** e fica indisponível para construir.
- Bônus **Explorer +10**: mais cidades conectadas em uma única rede.

### Vol. 2 — Índia / Suíça
**Índia** (2–4 jogadores):
- **Grand Tour / Mandala**: bilhete completado por **dois caminhos distintos** (formando circuito) ganha bônus extra.
- Escala: os **dois primeiros** bilhetes qualificados valem **+5 cada**; os **três seguintes** valem **+10 cada**. Máximo de **+40**.
- Todos os ferries são cinza.
- Bônus de caminho mais longo **+10**.

**Suíça** (2–3 jogadores):
- Bilhetes de **cidade → país** e **país → país**. Ao completar, pontua o **maior valor** ao qual o jogador se qualifica.
- **Locomotivas só podem ser usadas em túneis**.
- Bilhetes descartados são **removidos do jogo**, não voltam ao baralho.
- Sem restrição ao comprar locomotivas viradas.
- Bônus de caminho mais longo **+10**.

### Vol. 3 — Heart of Africa
- Baralho extra de **45 cartas de terreno** (savana, montanha, selva). Na compra, é possível pegar cartas de terreno em vez de cartas de vagão.
- Ao reivindicar uma rota com símbolo de terreno, jogar cartas do terreno correspondente **dobra os pontos** da rota:

| Comprimento | Pontos normais | Cartas de terreno | Pontos dobrados |
|---|---|---|---|
| 1 | 1 | 1 | 2 |
| 2 | 2 | 1 | 4 |
| 3 | 4 | 1 | 8 |
| 4 | 7 | 2 | 14 |
| 5 | 10 | 2 | 20 |
| 6 | 15 | 2 | 30 |

- Bônus **Globetrotter**.

### Vol. 4 — Nederland
- Introduz **dinheiro**. Cada jogador começa com **30 moedas**.
- Toda rota tem um **pedágio de 1 a 4 moedas**. Na primeira via de uma rota dupla (ou em rota simples), paga-se ao banco; na segunda via, paga-se **ao jogador que construiu a primeira**.
- Sem moedas suficientes, o jogador pega uma **carta de empréstimo**: **−5 pontos** no fim, sem possibilidade de quitação.
- **Bônus final por ranking de moedas** (exemplo com 5 jogadores): **55 / 35 / 20 / 10 / 0**. A escala varia com o número de jogadores.
- Não há bônus de caminho mais longo nem Globetrotter.

### Vol. 5 — Reino Unido / Pennsylvania
**Reino Unido** (2–4 jogadores):
- Apenas **35 vagões**.
- No início, só é possível reivindicar rotas curtas na região de Londres.
- **Cartas de tecnologia** compradas com locomotivas liberam progressivamente rotas mais longas, regiões distantes e habilidades (descontos, uso de ferries etc.).
- Baralho de vagões próprio, com locomotivas adicionais.

**Pennsylvania** (2–5 jogadores):
- Ao reivindicar uma rota, o jogador pega **1 ação** de uma das companhias impressas ao lado dela.
- No fim, cada companhia paga pontos conforme a **maioria de ações**; escalas diferentes por companhia.
- Bônus **Globetrotter**.

### Vol. 6 — França / Velho Oeste
**França**:
- As rotas começam **sem cor**. Ao comprar cartas, o jogador também posiciona uma peça de cor sobre uma rota, definindo sua cor.
- Trilhos sobrepostos: definida a cor de uma rota, as rotas que a cruzam ficam indisponíveis.
- Mão inicial de **8 cartas** em vez de 4.
- Bônus de caminho mais longo **+10** e **Globetrotter**.

**Velho Oeste** 🔍:
- Até 6 jogadores. Cada jogador posiciona uma **cidade inicial** própria e só pode construir a partir da sua rede.
- Pontos adicionais por posse de cidades.
- Variante opcional com os monstros Alvin e Dexter (+15 cada).

### Vol. 7 — Japão / Itália
**Japão**:
- **Rede de Trem-Bala compartilhada**: o jogador gasta cartas para avançar a construção, mas **não ocupa** a rota. As linhas de trem-bala podem ser usadas por **todos** para completar bilhetes.
- As rotas de trem-bala **não pontuam** na hora — avançam um marcador na trilha de contribuição.
- No fim, o ranking de contribuição distribui bônus decrescentes; **quem não contribuiu recebe pontos negativos**.

**Itália**:
- Sem Globetrotter e sem caminho mais longo.
- **Bônus de regiões**: cada cidade pertence a uma região. Pontua-se conforme a **quantidade de regiões distintas** conectadas, segundo tabela progressiva.
- O bônus é calculado **por rede conectada separadamente** — vale muito a pena unificar as redes.
- **Puglia, Sardenha e Sicília** contam como **duas regiões** se o jogador conectar todas as cidades da região na mesma rede.
- Novo tipo de rota de ferry.

---

## 2.4 Séries curtas de cidade

New York, Londres, Amsterdã, São Francisco, Berlim, Paris.

Características comuns:
- 2–4 jogadores, 10–20 minutos, **15 a 20 peças** por jogador.
- Mão inicial de **2 cartas**.
- Tabela de rotas reduzida (comprimentos de 1 a 4).
- Cada uma tem um bônus temático próprio no lugar do caminho mais longo:
  - **New York**: pontos por locais turísticos visitados.
  - **Londres**: bônus por distritos conectados.
  - **Amsterdã**: fichas de mercadoria coletadas.
  - **São Francisco**: lembranças (*souvenirs*) coletadas; peças são bondes.
  - **Berlim**: locais famosos + linhas de metrô.
  - **Paris** 🔍: bônus temático próprio.

## 2.5 Versões infantis

**First Journey** (EUA, Europa) e **Ghost Train**:
- 20 vagões, rotas curtas, bilhetes com ilustrações.
- **Não há contagem de pontos.** Vence quem completar **6 bilhetes** primeiro, ou quem tiver mais bilhetes quando alguém ficar sem vagões.
- Bilhetes impossíveis podem ser trocados gastando o turno.
- Existe um bilhete costa-a-costa que conta como completo ao ligar os dois extremos do mapa.

---

## 3. Recomendações de modelagem

```
Edicao {
    id
    jogadoresMin, jogadoresMax
    vagoesPorJogador
    tabelaRotas: Map<comprimento, pontos>
    bonusFinais: Bonus[]        // estratégia por tipo
    modificadores: Modificador[] // terreno, montanha, pedágio, ações, regiões...
}
```

- Trate **tabela de rotas** e **lista de bônus** como dados de configuração por edição, não como código.
- Modele bônus como estratégias plugáveis: `MaiorCaminho`, `MaisBilhetes`, `MaisCidades`, `RankingDeRecurso`, `MaioriaPorCategoria`, `TabelaProgressiva`.
- Vários mapas geram pontos **negativos** por bônus (Japão) ou por penalidade fixa (empréstimos do Nederland). Não assuma bônus ≥ 0.
- O único cálculo algoritmicamente não trivial é o caminho contínuo mais longo. Todo o resto é soma, contagem ou consulta em tabela.