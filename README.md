# desafio_teste_campo_minado

Campo Minado 18 x 14 com 40 bombas — casos de teste em **JavaScript** para testar uma implementação em **JavaScript**, usando [Jest](https://jestjs.io/).

## Especificação do desafio

Testar um **Campo Minado** com tabuleiro de **18 x 14** (18 colunas por 14 linhas, 252 células) e **40 bombas**. Regras implementadas e testadas:

- As coordenadas são `(linha, coluna)`, com linha de 0 a 13 e coluna de 0 a 17.
- O tabuleiro tem exatamente 40 bombas, sem repetição de posição.
- As bombas são sorteadas só na **primeira jogada**, e nunca na célula clicada nem nas vizinhas dela, então a primeira jogada é sempre segura.
- Cada célula mostra quantas bombas existem nas até 8 células vizinhas.
- Revelar uma célula com 0 abre automaticamente a região ao redor (**revelação em cascata**).
- Revelar uma bomba causa **derrota** e mostra todas as bombas.
- **Bandeiras** podem ser colocadas e retiradas, com limite de 40. Uma célula com bandeira não pode ser revelada, e o contador de bombas restantes é 40 menos o número de bandeiras.
- **Vitória** acontece ao revelar as 212 células seguras.
- Depois do fim de jogo, nenhuma jogada é aceita, e posições fora do tabuleiro geram erro.

## Estrutura do repositório

```
desafio_teste_campo_minado/
├── src/
│   └── campoMinado.js        # implementação do jogo (regras)
├── tests/
│   └── campoMinado.test.js   # casos de teste (Jest)
├── package.json
└── README.md
```

## Como executar

Pré-requisito: [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm install
npm test               # roda todos os casos de teste
npm run test:coverage  # roda os testes e mostra a cobertura
```

## Funcionamento dos casos de teste

Os testes ficam em `tests/campoMinado.test.js`. Para ter cenários previsíveis, são usados dois **layouts fixos de bombas**, passados em `new CampoMinado({ bombas })`:

- `LAYOUT_FUNDO`: bombas nas duas últimas linhas, mais 4 na linha 11. Um clique no topo abre o tabuleiro todo e dá vitória.
- `LAYOUT_CANTO`: 3 bombas no canto superior esquerdo, o que permite testar a contagem de vizinhas, a derrota e as bandeiras.

Os testes de sorteio usam um gerador com semente (`rngComSemente`) e repetem a verificação para várias sementes, conferindo que sempre existem 40 bombas e que a primeira jogada é segura.

Cada caso de teste tem um identificador (`CT01`, `CT02`, ...) no nome, para facilitar a conferência entre o relatório do Jest e a tabela abaixo. Os testes `test.each` são **parametrizados**: o mesmo caso roda com vários valores de entrada, por isso o Jest mostra **40 execuções** no total.

Para deixar os testes **determinísticos** (sempre com o mesmo resultado), a parte aleatória do jogo recebe um gerador de números com semente fixa (`rng`). Assim os cenários podem ser montados com cartas, peças ou posições escolhidas, sem depender da sorte.

| Caso | Grupo | O que verifica |
|---|---|---|
| CT01 | Criação do tabuleiro | Tabuleiro tem 18 colunas e 14 linhas (252 células) |
| CT02 | Criação do tabuleiro | Jogo começa em andamento, sem células reveladas e sem bandeiras |
| CT03 | Criação do tabuleiro | Existem 212 células seguras (252 - 40) |
| CT04 | Criação do tabuleiro | Bombas só são sorteadas na primeira jogada |
| CT05 | Posicionamento das bombas | Sorteio (semente N) gera exatamente 40 bombas *(parametrizado: roda com vários valores)* |
| CT06 | Posicionamento das bombas | Primeira jogada em (N, N) nunca é bomba nem tem bomba vizinha *(parametrizado: roda com vários valores)* |
| CT07 | Posicionamento das bombas | Posições fixas com quantidade diferente de 40 são rejeitadas |
| CT08 | Posicionamento das bombas | Posições de bomba repetidas são rejeitadas |
| CT09 | Posicionamento das bombas | Bomba fora do tabuleiro é rejeitada |
| CT10 | Posicionamento das bombas | Bombas não podem ser posicionadas duas vezes |
| CT11 | Vizinhança e contagem | Canto tem 3 vizinhos, borda tem 5 e centro tem 8 |
| CT12 | Vizinhança e contagem | Número da célula indica quantas bombas há ao redor |
| CT13 | Revelar células | Revelar célula numerada mostra somente ela |
| CT14 | Revelar células | Revelar célula vazia (0) abre a região em cascata |
| CT15 | Revelar células | Cascata não revela células com bandeira |
| CT16 | Revelar células | Revelar bomba encerra o jogo com derrota e mostra todas as bombas |
| CT17 | Revelar células | Revelar célula já revelada não muda nada |
| CT18 | Revelar células | Não é possível revelar célula com bandeira |
| CT19 | Revelar células | Posição inválida (N, N) lança erro *(parametrizado: roda com vários valores)* |
| CT20 | Revelar células | Linha 13 e coluna 17 são válidas (limites do 18 x 14) |
| CT21 | Bandeiras | Colocar e retirar bandeira |
| CT22 | Bandeiras | Contador de bombas restantes diminui a cada bandeira |
| CT23 | Bandeiras | Não é possível colocar mais de 40 bandeiras |
| CT24 | Bandeiras | Não é possível marcar célula já revelada |
| CT25 | Fim de jogo | Revelar todas as células seguras dá vitória |
| CT26 | Fim de jogo | Vitória revelando célula a célula |
| CT27 | Fim de jogo | Não é possível jogar após derrota |
| CT28 | Fim de jogo | Não é possível jogar após vitória |
| CT29 | Fim de jogo | Ter bandeiras em todas as bombas, sem revelar as seguras, não é vitória |
| CT30 | Representação | ParaTexto mostra 14 linhas de 18 caracteres |

## Colaboradora

| Nome | Curso | Contribuição |
|---|---|---|
| Emanuelly | Engenharia de Software — UniCesumar (6º semestre) | Implementação, casos de teste e documentação |
