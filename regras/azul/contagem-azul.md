# Azul — Especificação de Cálculo de Pontos

Escopo: **fim do turno** (fase de preparação da parede). Migração de azulejos, pontuação por ligação e penalidades.

---

## 1. Estruturas

### Parede (posição fixa das cores)

`cor(linha, coluna) = CORES[(coluna - linha) mod 5]`, com `CORES = [azul, amarelo, vermelho, preto, branco]`

| Linha \ Col | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **1** | azul | amarelo | vermelho | preto | branco |
| **2** | branco | azul | amarelo | vermelho | preto |
| **3** | preto | branco | azul | amarelo | vermelho |
| **4** | vermelho | preto | branco | azul | amarelo |
| **5** | amarelo | vermelho | preto | branco | azul |

### Estado por jogador

```
parede[5][5]         // boolean — ocupado ou não
linhasPadrao[5]      // { cor, quantidade }, capacidade = índice + 1
linhaChao[]          // lista de azulejos, máx. 7 relevantes
pontuacao            // inteiro, nunca < 0
```

---

## 2. Migração para a parede

Processar as linhas **em ordem, de 1 a 5**. Cada azulejo pontua **no instante** em que é colocado — o estado da parede é atualizado antes de processar a próxima linha.

```
para linha de 1 até 5:
    se linhasPadrao[linha].quantidade == linhaPadrao.capacidade:
        coluna = colunaDaCor(linha, linhasPadrao[linha].cor)
        parede[linha][coluna] = true
        pontuacao += pontuarColocacao(linha, coluna)
        descartar(capacidade - 1 azulejos)   // vão para a tampa da caixa
        limpar(linhasPadrao[linha])
    senão:
        manter intacta para a próxima rodada   // não pontua, não penaliza
```

---

## 3. Pontuação por ligação

Contam apenas azulejos **contíguos**. Um espaço vazio interrompe a sequência.

```
função pontuarColocacao(linha, coluna):
    h = 1 + contarContiguos(linha, coluna, esquerda) + contarContiguos(linha, coluna, direita)
    v = 1 + contarContiguos(linha, coluna, cima)     + contarContiguos(linha, coluna, baixo)

    se h == 1 e v == 1:  retornar 1     // isolado
    se h == 1:           retornar v     // só vertical
    se v == 1:           retornar h     // só horizontal
    retornar h + v                      // cruzamento: o azulejo conta nas duas somas
```

| Caso | h | v | Pontos |
|---|---|---|---|
| Isolado | 1 | 1 | 1 |
| Só horizontal | 4 | 1 | 4 |
| Só vertical | 1 | 3 | 3 |
| Cruzamento | 4 | 3 | 7 |

---

## 4. Penalidades (linha do chão)

Aplicadas **depois** de toda a migração da parede.

```
PENALIDADES = [-1, -1, -2, -2, -2, -3, -3]

função aplicarPenalidades(linhaChao):
    total = soma(PENALIDADES[0 .. min(len(linhaChao), 7) - 1])
    pontuacao = max(0, pontuacao + total)
    limpar(linhaChao)
```

- Preenchimento sempre da esquerda para a direita.
- Máximo por rodada: **−14**.
- Azulejos além do 7º espaço: descartados **sem** penalidade adicional.
- O marcador de primeiro jogador ocupa um espaço e **penaliza normalmente**.
- **A pontuação nunca fica negativa** — piso em 0.

---

## 5. Ordem de execução do turno

```
1. para cada jogador:
2.     migrar linhas de padrão completas (linha 1 → 5), pontuando cada azulejo
3.     aplicar penalidades da linha do chão
4.     pontuacao = max(0, pontuacao)
5.     limpar linha do chão
```

---

## 6. Casos de teste sugeridos

| # | Cenário | Esperado |
|---|---|---|
| 1 | Primeiro azulejo em parede vazia | +1 |
| 2 | Azulejo colado a 2 vizinhos horizontais | +3 |
| 3 | Azulejo formando h=3 e v=2 | +5 |
| 4 | Azulejo com vizinho separado por 1 espaço vazio | +1 |
| 5 | Duas linhas completas na mesma rodada, linha 2 encostando na 1 | Linha 1 pontua antes e conta como vizinha |
| 6 | 3 pontos na parede, 3 azulejos no chão (−4) | 0 (não −1) |
| 7 | 9 azulejos no chão | −14 |
| 8 | Linha de padrão com 3/4 preenchida | Nenhuma alteração |