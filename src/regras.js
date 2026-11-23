'use strict';

const TAMANHO = 6;
const LIMITE_POR_VALOR = TAMANHO / 2;

function colunasDa(grade) {
  return Array.from({ length: TAMANHO }, (_, coluna) => grade.map((linha) => linha[coluna]));
}

function conflitosNasUnidades(tipo, unidades) {
  const encontrados = [];

  unidades.forEach((unidade, indice) => {
    let sequenciaEncontrada = false;
    for (let inicio = 0; inicio <= TAMANHO - 3; inicio++) {
      const valor = unidade[inicio];
      if (!sequenciaEncontrada
        && valor !== null
        && valor === unidade[inicio + 1]
        && valor === unidade[inicio + 2]) {
        encontrados.push({ regra: 'TRES_SEGUIDOS', tipo, indice });
        sequenciaEncontrada = true;
      }
    }

    [0, 1].forEach((valor) => {
      const quantidade = unidade.filter((item) => item === valor).length;
      if (quantidade > LIMITE_POR_VALOR) {
        encontrados.push({ regra: 'EXCESSO', tipo, indice, valor });
      }
    });
  });

  const completas = unidades
    .map((unidade, indice) => ({ unidade, indice }))
    .filter(({ unidade }) => unidade.every((valor) => valor !== null));

  completas.forEach((atual, posicao) => {
    completas.slice(posicao + 1).forEach((outra) => {
      if (atual.unidade.every((valor, indice) => valor === outra.unidade[indice])) {
        encontrados.push({ regra: 'DUPLICADA', tipo, indices: [atual.indice, outra.indice] });
      }
    });
  });

  return encontrados;
}

function listarConflitos(grade) {
  return [
    ...conflitosNasUnidades('linha', grade),
    ...conflitosNasUnidades('coluna', colunasDa(grade)),
  ];
}

module.exports = { listarConflitos };

