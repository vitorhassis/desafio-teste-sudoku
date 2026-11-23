'use strict';

const { listarConflitos } = require('./regras');

const TAMANHO = 6;

function gradeDosTextos(textos) {
  return textos.map((linha) => [...linha].map((item) => (item === '.' ? null : Number(item))));
}

function textosDaGrade(grade) {
  return grade.map((linha) => linha.join(''));
}

function explorarSolucoes(textos, limite, aoEncontrar) {
  const grade = gradeDosTextos(textos);
  if (listarConflitos(grade).length > 0) return 0;

  let quantidade = 0;

  function visitar(posicao) {
    if (posicao === TAMANHO * TAMANHO) {
      quantidade++;
      aoEncontrar(textosDaGrade(grade));
      return;
    }

    const linha = Math.floor(posicao / TAMANHO);
    const coluna = posicao % TAMANHO;
    if (grade[linha][coluna] !== null) {
      visitar(posicao + 1);
      return;
    }

    for (const candidato of [0, 1]) {
      grade[linha][coluna] = candidato;
      if (listarConflitos(grade).length === 0) visitar(posicao + 1);
      if (quantidade >= limite) return;
    }
    grade[linha][coluna] = null;
  }

  visitar(0);
  return quantidade;
}

module.exports = { explorarSolucoes };

