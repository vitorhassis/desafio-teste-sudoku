const { SudokuBinario, TAMANHO } = require('../src/sudokuBinario');
const { explorarSolucoes } = require('../src/solucionador');

const SOLUCAO = ['010110', '011001', '100101', '101010', '010011', '101100'];
const QUASE_PRONTO = [...SOLUCAO.slice(0, 5), '......'];

describe('Criação e leitura do tabuleiro', () => {
  test('trabalha com uma grade de seis por seis', () => {
    expect(TAMANHO).toBe(6);
    expect(SudokuBinario.vazio().paraTexto()).toEqual(Array(6).fill('......'));
  });

  test('converte os caracteres em valores e identifica as pistas fixas', () => {
    const jogo = new SudokuBinario(['0.....', '.1....', '......', '......', '......', '.....0']);
    expect(jogo.valor(0, 0)).toBe(0);
    expect(jogo.valor(1, 1)).toBe(1);
    expect(jogo.valor(2, 2)).toBeNull();
    expect(jogo.ehFixa(0, 0)).toBe(true);
    expect(jogo.ehFixa(2, 2)).toBe(false);
  });

  test.each([
    ['entrada textual', '......'],
    ['cinco linhas', Array(5).fill('......')],
    ['sete linhas', Array(7).fill('......')],
    ['linha curta', ['.....', ...Array(5).fill('......')]],
    ['linha longa', ['.......', ...Array(5).fill('......')]],
    ['símbolo desconhecido', ['..x...', ...Array(5).fill('......')]],
    ['linha sem texto', [123456, ...Array(5).fill('......')]],
  ])('recusa tabuleiro inicial inválido: %s', (_caso, entrada) => {
    expect(() => new SudokuBinario(entrada)).toThrow(RangeError);
  });

  test.each([
    [-1, 0], [6, 0], [0, -1], [0, 6], [1.5, 0], [0, '1'],
  ])('recusa a coordenada (%p, %p)', (linha, coluna) => {
    const jogo = SudokuBinario.vazio();
    expect(() => jogo.valor(linha, coluna)).toThrow(RangeError);
  });

  test('a consulta de célula fixa também valida coordenadas', () => {
    expect(() => SudokuBinario.vazio().ehFixa(6, 0)).toThrow(RangeError);
  });
});

describe('Edição das células livres', () => {
  test('aceita somente os valores binários', () => {
    const jogo = SudokuBinario.vazio();
    jogo.definir(2, 3, 0);
    jogo.definir(4, 5, 1);
    expect(jogo.valor(2, 3)).toBe(0);
    expect(jogo.valor(4, 5)).toBe(1);
  });

  test('uma jogada pode ser corrigida e depois apagada', () => {
    const jogo = SudokuBinario.vazio();
    jogo.definir(3, 3, 0);
    jogo.definir(3, 3, 1);
    expect(jogo.valor(3, 3)).toBe(1);
    jogo.limpar(3, 3);
    expect(jogo.valor(3, 3)).toBeNull();
  });

  test('pistas originais não podem ser alteradas ou removidas', () => {
    const jogo = new SudokuBinario(['1.....', ...Array(5).fill('......')]);
    expect(() => jogo.definir(0, 0, 0)).toThrow('A célula é fixa');
    expect(() => jogo.limpar(0, 0)).toThrow('A célula é fixa');
    expect(jogo.valor(0, 0)).toBe(1);
  });

  test.each([2, -1, '1', null, undefined, 0.5])('recusa o valor não binário %p', (valor) => {
    expect(() => SudokuBinario.vazio().definir(0, 0, valor)).toThrow(RangeError);
  });

  test('definir e limpar validam a posição recebida', () => {
    const jogo = SudokuBinario.vazio();
    expect(() => jogo.definir(6, 0, 1)).toThrow(RangeError);
    expect(() => jogo.limpar(0, 6)).toThrow(RangeError);
  });

  test('paraTexto reflete o estado atual sem expor a grade interna', () => {
    const jogo = SudokuBinario.vazio();
    jogo.definir(0, 0, 1);
    const texto = jogo.paraTexto();
    texto[0] = '000000';
    expect(jogo.paraTexto()[0]).toBe('1.....');
  });

  test('completo distingue grades preenchidas de grades com espaços', () => {
    expect(new SudokuBinario(SOLUCAO).completo()).toBe(true);
    expect(new SudokuBinario(QUASE_PRONTO).completo()).toBe(false);
  });
});

function preencher(jogadas) {
  const jogo = SudokuBinario.vazio();
  jogadas.forEach(([linha, coluna, valor]) => jogo.definir(linha, coluna, valor));
  return jogo;
}

describe('Regra de sequências', () => {
  test('detecta três zeros consecutivos em uma linha', () => {
    const jogo = preencher([[0, 1, 0], [0, 2, 0], [0, 3, 0]]);
    expect(jogo.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 0 });
  });

  test('detecta três uns consecutivos em uma coluna', () => {
    const jogo = preencher([[2, 4, 1], [3, 4, 1], [4, 4, 1]]);
    expect(jogo.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'coluna', indice: 4 });
  });

  test('localiza a sequência no começo e no final', () => {
    const inicio = preencher([[1, 0, 1], [1, 1, 1], [1, 2, 1]]);
    const final = preencher([[5, 3, 0], [5, 4, 0], [5, 5, 0]]);
    expect(inicio.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 1 });
    expect(final.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 5 });
  });

  test('duas repetições, lacunas e valores alternados são aceitos', () => {
    const jogo = preencher([[0, 0, 0], [0, 1, 0], [0, 3, 0], [1, 0, 1], [1, 1, 1], [1, 2, 0]]);
    expect(jogo.conflitos()).toEqual([]);
  });

  test('quatro valores iguais registram um conflito de sequência por unidade', () => {
    const jogo = preencher([[3, 0, 1], [3, 1, 1], [3, 2, 1], [3, 3, 1]]);
    expect(jogo.conflitos().filter((item) => item.regra === 'TRES_SEGUIDOS')).toEqual([
      { regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 3 },
    ]);
  });
});

describe('Regra de equilíbrio', () => {
  test('aponta mais de três zeros em uma linha', () => {
    const jogo = preencher([[2, 0, 0], [2, 1, 0], [2, 3, 0], [2, 5, 0]]);
    expect(jogo.conflitos()).toEqual([{ regra: 'EXCESSO', tipo: 'linha', indice: 2, valor: 0 }]);
  });

  test('aponta mais de três uns em uma coluna', () => {
    const jogo = preencher([[0, 5, 1], [1, 5, 1], [3, 5, 1], [5, 5, 1]]);
    expect(jogo.conflitos()).toEqual([{ regra: 'EXCESSO', tipo: 'coluna', indice: 5, valor: 1 }]);
  });

  test('três zeros e três uns formam uma unidade equilibrada', () => {
    const jogo = preencher([0, 1, 2, 3, 4, 5].map((coluna) => [0, coluna, coluna % 2]));
    expect(jogo.conflitos()).toEqual([]);
  });

  test('uma unidade incompleta pode ter até três ocorrências de cada valor', () => {
    const jogo = preencher([[4, 0, 0], [4, 2, 0], [4, 4, 0]]);
    expect(jogo.conflitos()).toEqual([]);
  });
});

describe('Regra de unicidade', () => {
  test('duas linhas completas idênticas entram em conflito', () => {
    const jogo = SudokuBinario.vazio();
    [0, 1, 0, 1, 0, 1].forEach((valor, coluna) => {
      jogo.definir(0, coluna, valor);
      jogo.definir(2, coluna, valor);
    });
    expect(jogo.conflitos()).toContainEqual({ regra: 'DUPLICADA', tipo: 'linha', indices: [0, 2] });
  });

  test('duas colunas completas idênticas entram em conflito', () => {
    const jogo = SudokuBinario.vazio();
    [0, 1, 0, 1, 0, 1].forEach((valor, linha) => {
      jogo.definir(linha, 1, valor);
      jogo.definir(linha, 4, valor);
    });
    expect(jogo.conflitos()).toContainEqual({ regra: 'DUPLICADA', tipo: 'coluna', indices: [1, 4] });
  });

  test('unidades incompletas iguais e unidades completas diferentes são permitidas', () => {
    const incompleto = preencher([[0, 0, 0], [0, 1, 1], [1, 0, 0], [1, 1, 1]]);
    expect(incompleto.conflitos()).toEqual([]);
    const diferentes = new SudokuBinario(['010101', '101010', ...Array(4).fill('......')]);
    expect(diferentes.conflitos()).toEqual([]);
  });
});

describe('Conclusão do desafio', () => {
  test('o gabarito completo não contém violações', () => {
    expect(new SudokuBinario(SOLUCAO).conflitos()).toEqual([]);
  });

  test('resolvido exige preenchimento total e ausência de conflito', () => {
    expect(new SudokuBinario(SOLUCAO).resolvido()).toBe(true);
    expect(new SudokuBinario(QUASE_PRONTO).resolvido()).toBe(false);
    expect(new SudokuBinario(Array(6).fill('000000')).resolvido()).toBe(false);
  });

  test('é possível concluir a última linha por jogadas', () => {
    const jogo = new SudokuBinario(QUASE_PRONTO);
    [...SOLUCAO[5]].forEach((valor, coluna) => jogo.definir(5, coluna, Number(valor)));
    expect(jogo.resolvido()).toBe(true);
  });
});

describe('Busca de soluções', () => {
  test('completa a linha ausente sem modificar o tabuleiro original', () => {
    const jogo = new SudokuBinario(QUASE_PRONTO);
    const resultado = jogo.resolver();
    expect(resultado).not.toBe(jogo);
    expect(resultado.paraTexto()).toEqual(SOLUCAO);
    expect(resultado.resolvido()).toBe(true);
    expect(jogo.paraTexto()).toEqual(QUASE_PRONTO);
  });

  test('um tabuleiro pronto produz uma nova instância equivalente', () => {
    const jogo = new SudokuBinario(SOLUCAO);
    const resultado = jogo.resolver();
    expect(resultado).not.toBe(jogo);
    expect(resultado.paraTexto()).toEqual(SOLUCAO);
  });

  test('também encontra uma solução partindo da grade vazia', () => {
    const resultado = SudokuBinario.vazio().resolver();
    expect(resultado.resolvido()).toBe(true);
    expect(resultado.paraTexto().every((linha) => !linha.includes('.'))).toBe(true);
  });

  test('interrompe imediatamente se as pistas já estão em conflito', () => {
    const impossivel = new SudokuBinario(['000...', ...Array(5).fill('......')]);
    expect(impossivel.resolver()).toBeNull();
    expect(impossivel.contarSolucoes()).toBe(0);
  });

  test('retorna null quando a contradição só aparece durante a busca', () => {
    const impossivel = new SudokuBinario(['001101', '00110.', ...Array(4).fill('......')]);
    expect(impossivel.conflitos()).toEqual([]);
    expect(impossivel.resolver()).toBeNull();
    expect(impossivel.contarSolucoes()).toBe(0);
  });

  test('conta soluções até o limite e identifica unicidade', () => {
    const unica = new SudokuBinario(QUASE_PRONTO);
    expect(unica.contarSolucoes()).toBe(1);
    expect(unica.solucaoUnica()).toBe(true);
    expect(new SudokuBinario(SOLUCAO).contarSolucoes()).toBe(1);
    expect(SudokuBinario.vazio().contarSolucoes()).toBe(2);
    expect(SudokuBinario.vazio().solucaoUnica()).toBe(false);
  });

  test('contarSolucoes(5) para a busca ao encontrar a quinta solução', () => {
    const vazio = SudokuBinario.vazio();
    expect(vazio.contarSolucoes(5)).toBe(5);
    expect(vazio.contarSolucoes(6)).toBe(6); // existem mais de cinco: o limite é que encerra a busca

    // O solucionador entrega exatamente cinco soluções, todas válidas e diferentes entre si.
    const encontradas = [];
    const total = explorarSolucoes(vazio.paraTexto(), 5, (textos) => encontradas.push(textos));
    expect(total).toBe(5);
    expect(encontradas).toHaveLength(5);
    expect(new Set(encontradas.map((textos) => textos.join('|'))).size).toBe(5);
    encontradas.forEach((textos) => expect(new SudokuBinario(textos).resolvido()).toBe(true));
  });

  test('resolver() conserva todas as pistas fixas do tabuleiro original', () => {
    const tabuleiros = [
      ['010...', '.1.0.1', '1..1..', '.0.0.0', '0.001.', '1.1..0'].map((linha, i) => (
        [...linha].map((c, j) => (c === '.' ? '.' : SOLUCAO[i][j])).join('')
      )),
      ['0.....', '.1....', '......', '......', '......', '.....0'],
      QUASE_PRONTO,
    ];

    tabuleiros.forEach((entrada) => {
      const original = new SudokuBinario(entrada);
      const resultado = original.resolver();

      expect(resultado).not.toBeNull();
      expect(resultado.resolvido()).toBe(true);
      for (let linha = 0; linha < TAMANHO; linha++) {
        for (let coluna = 0; coluna < TAMANHO; coluna++) {
          if (original.ehFixa(linha, coluna)) {
            expect(resultado.valor(linha, coluna)).toBe(original.valor(linha, coluna));
          }
        }
      }
      expect(original.paraTexto()).toEqual(entrada); // o original não é alterado
    });
  });
});
