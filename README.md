# Desafio de testes: Sudoku binário

Implementação em JavaScript de um Sudoku binário 6 x 6, com validação das regras, edição de células e solucionador, e uma suíte de testes automatizados em Jest (51 testes, 100% de cobertura).

## Colaboradores

- Vitor Hugo Assis da Silva — RA: 24140023-2
- Fernando Queiroz — RA: 24038237-2

## Regras

O tabuleiro tem 6 linhas e 6 colunas, preenchidas apenas com `0` e `1`. Em cada linha e em cada coluna:

1. **Sem três seguidos:** não pode haver três valores iguais consecutivos (`TRES_SEGUIDOS`).
2. **Equilíbrio:** não pode haver mais de três zeros nem mais de três uns (`EXCESSO`). Uma linha ou coluna completa tem, portanto, exatamente três de cada.
3. **Unicidade:** duas linhas completas não podem ser iguais, e o mesmo vale para as colunas (`DUPLICADA`).

As células informadas no início são **pistas fixas** e não podem ser alteradas nem apagadas. As demais são livres.

### Formato de entrada

Seis textos de seis caracteres, usando `0`, `1` ou `.` (célula vazia):

```js
const { SudokuBinario } = require('./src/sudokuBinario');

const jogo = new SudokuBinario(['010...', '.1.0.1', '1..1..', '.0.0.0', '0.001.', '1.1..0']);
```

### Principais operações

| Método | O que faz |
| --- | --- |
| `SudokuBinario.vazio()` | cria um tabuleiro sem pistas |
| `valor(l, c)`, `ehFixa(l, c)` | lê uma célula e informa se é pista fixa |
| `definir(l, c, v)`, `limpar(l, c)` | edita uma célula livre |
| `paraTexto()` | devolve o estado atual como seis textos |
| `completo()`, `conflitos()`, `resolvido()` | verificam o preenchimento e as regras |
| `resolver()` | devolve um novo tabuleiro resolvido, mantendo as pistas fixas, ou `null` se não houver solução |
| `contarSolucoes(limite)` | conta as soluções, parando ao chegar no limite (padrão 2) |
| `solucaoUnica()` | verdadeiro se existe exatamente uma solução |

## Estrutura

```
.
├── .github/workflows/testes.yml   # CI: roda npm ci e npm test
├── src/
│   ├── regras.js                  # detecção de conflitos (três seguidos, excesso, duplicadas)
│   ├── solucionador.js            # busca de soluções por retrocesso
│   └── sudokuBinario.js           # classe SudokuBinario
├── tests/
│   └── sudokuBinario.test.js      # testes unitários
└── package.json
```

### Testes

- Criação e leitura do tabuleiro, edição das células livres, as três regras, conclusão do desafio e busca de soluções.
- Busca de soluções: `resolver()` conserva as pistas fixas e não altera o tabuleiro original. `contarSolucoes(5)` para ao encontrar a quinta solução, e a contagem identifica tabuleiros sem solução e com solução única.

## Instalação

Requer [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm ci
```

## Execução

```bash
npm test
```

O comando roda o Jest com relatório de cobertura. O projeto exige 100% de cobertura (instruções, ramos, funções e linhas); se ficar abaixo disso, o comando falha. O relatório HTML é gerado na pasta `coverage/`.

## Integração contínua

O workflow `.github/workflows/testes.yml` executa `npm ci` e `npm test` a cada push e pull request.

## Licença

MIT
