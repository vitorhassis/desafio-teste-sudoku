const { SudokuBinario, TAMANHO } = require('../src/sudokuBinario');

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
