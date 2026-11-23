'use strict';

const { listarConflitos } = require('./regras');
const { explorarSolucoes } = require('./solucionador');

const TAMANHO = 6;
const LINHA_VAZIA = '.'.repeat(TAMANHO);

function entradaValida(entrada) {
  return Array.isArray(entrada)
    && entrada.length === TAMANHO
    && entrada.every((linha) => typeof linha === 'string' && /^[01.]{6}$/.test(linha));
}

class SudokuBinario {
  constructor(entrada) {
    if (!entradaValida(entrada)) {
      throw new RangeError('Use seis linhas contendo apenas 0, 1 ou ponto');
    }

    this._celulas = entrada.map((linha) => (
      [...linha].map((caractere) => (caractere === '.' ? null : Number(caractere)))
    ));
    this._originais = this._celulas.map((linha) => linha.map((valor) => valor !== null));
  }

  static vazio() {
    return new SudokuBinario(Array(TAMANHO).fill(LINHA_VAZIA));
  }

  valor(linha, coluna) {
    this._verificarPosicao(linha, coluna);
    return this._celulas[linha][coluna];
  }

  ehFixa(linha, coluna) {
    this._verificarPosicao(linha, coluna);
    return this._originais[linha][coluna];
  }

  definir(linha, coluna, valor) {
    this._verificarPosicao(linha, coluna);
    this._verificarEditavel(linha, coluna);
    if (valor !== 0 && valor !== 1) throw new RangeError('O valor deve ser zero ou um');
    this._celulas[linha][coluna] = valor;
  }

  limpar(linha, coluna) {
    this._verificarPosicao(linha, coluna);
    this._verificarEditavel(linha, coluna);
    this._celulas[linha][coluna] = null;
  }

  paraTexto() {
    return this._celulas.map((linha) => (
      linha.map((valor) => (valor === null ? '.' : String(valor))).join('')
    ));
  }

  completo() {
    return this._celulas.every((linha) => linha.every((valor) => valor !== null));
  }

  conflitos() {
    return listarConflitos(this._celulas);
  }

  resolvido() {
    return this.completo() && this.conflitos().length === 0;
  }

  resolver() {
    let resposta = null;
    explorarSolucoes(this.paraTexto(), 1, (textos) => {
      resposta = textos;
    });
    return resposta === null ? null : new SudokuBinario(resposta);
  }

  contarSolucoes(limite = 2) {
    return explorarSolucoes(this.paraTexto(), limite, () => {});
  }

  solucaoUnica() {
    return this.contarSolucoes(2) === 1;
  }

  _verificarPosicao(linha, coluna) {
    const dentro = Number.isInteger(linha)
      && Number.isInteger(coluna)
      && linha >= 0
      && linha < TAMANHO
      && coluna >= 0
      && coluna < TAMANHO;
    if (!dentro) throw new RangeError('Posição fora do tabuleiro');
  }

  _verificarEditavel(linha, coluna) {
    if (this._originais[linha][coluna]) throw new Error('A célula é fixa');
  }
}

module.exports = { SudokuBinario, TAMANHO };
