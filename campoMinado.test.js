'use strict';

const { CampoMinado, COLUNAS, LINHAS, BOMBAS, ESTADO } = require('../src/campoMinado');

// Gerador pseudoaleatório com semente, para testes repetíveis.
function rngComSemente(semente) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Layout A: 36 bombas nas duas últimas linhas + 4 bombas na linha 11 (colunas 0..3).
const LAYOUT_FUNDO = [];
for (let c = 0; c < COLUNAS; c++) LAYOUT_FUNDO.push([12, c], [13, c]);
LAYOUT_FUNDO.push([11, 0], [11, 1], [11, 2], [11, 3]);

// Layout B: bombas no canto (0,0), (0,1), (1,0) + 36 nas duas últimas linhas + (11,17).
const LAYOUT_CANTO = [[0, 0], [0, 1], [1, 0], [11, 17]];
for (let c = 0; c < COLUNAS; c++) LAYOUT_CANTO.push([12, c], [13, c]);

describe('Criação do tabuleiro', () => {
  test('CT01 - tabuleiro tem 18 colunas e 14 linhas (252 células)', () => {
    const jogo = new CampoMinado();
    expect(jogo.celulas).toHaveLength(14);
    jogo.celulas.forEach((linha) => expect(linha).toHaveLength(18));
    expect(LINHAS * COLUNAS).toBe(252);
  });

  test('CT02 - jogo começa em andamento, sem células reveladas e sem bandeiras', () => {
    const jogo = new CampoMinado();
    expect(jogo.estado).toBe(ESTADO.EM_ANDAMENTO);
    expect(jogo.celulasReveladas()).toBe(0);
    expect(jogo.bandeiras()).toBe(0);
  });

  test('CT03 - existem 212 células seguras (252 - 40)', () => {
    expect(new CampoMinado().celulasSeguras()).toBe(212);
  });

  test('CT04 - bombas só são sorteadas na primeira jogada', () => {
    const jogo = new CampoMinado({ rng: rngComSemente(1) });
    expect(jogo.contarBombas()).toBe(0);
    jogo.revelar(5, 5);
    expect(jogo.contarBombas()).toBe(BOMBAS);
  });
});

describe('Posicionamento das bombas', () => {
  test.each([1, 7, 99, 2024, 31337])('CT05 - sorteio (semente %i) gera exatamente 40 bombas', (semente) => {
    const jogo = new CampoMinado({ rng: rngComSemente(semente) });
    jogo.sortearBombas();
    expect(jogo.contarBombas()).toBe(40);
  });

  test.each([
    [0, 0],
    [13, 17],
    [7, 9],
  ])('CT06 - primeira jogada em (%i, %i) nunca é bomba nem tem bomba vizinha', (l, c) => {
    for (let semente = 1; semente <= 30; semente++) {
      const jogo = new CampoMinado({ rng: rngComSemente(semente) });
      const estado = jogo.revelar(l, c);
      expect(estado).not.toBe(ESTADO.DERROTA);
      expect(jogo.celulas[l][c].bomba).toBe(false);
      expect(jogo.celulas[l][c].vizinhas).toBe(0);
    }
  });

  test('CT07 - posições fixas com quantidade diferente de 40 são rejeitadas', () => {
    expect(() => new CampoMinado({ bombas: [[0, 0]] })).toThrow('exatamente 40 bombas');
  });

  test('CT08 - posições de bomba repetidas são rejeitadas', () => {
    const repetidas = LAYOUT_FUNDO.slice(0, 39).concat([[12, 0]]);
    expect(() => new CampoMinado({ bombas: repetidas })).toThrow('repetida');
  });

  test('CT09 - bomba fora do tabuleiro é rejeitada', () => {
    const fora = LAYOUT_FUNDO.slice(0, 39).concat([[14, 0]]);
    expect(() => new CampoMinado({ bombas: fora })).toThrow('fora do tabuleiro');
  });

  test('CT10 - bombas não podem ser posicionadas duas vezes', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    expect(() => jogo.posicionarBombas(LAYOUT_FUNDO)).toThrow('já foram posicionadas');
  });
});

describe('Vizinhança e contagem', () => {
  test('CT11 - canto tem 3 vizinhos, borda tem 5 e centro tem 8', () => {
    const jogo = new CampoMinado();
    expect(jogo.vizinhos(0, 0)).toHaveLength(3);
    expect(jogo.vizinhos(13, 17)).toHaveLength(3);
    expect(jogo.vizinhos(0, 8)).toHaveLength(5);
    expect(jogo.vizinhos(6, 0)).toHaveLength(5);
    expect(jogo.vizinhos(6, 8)).toHaveLength(8);
  });

  test('CT12 - número da célula indica quantas bombas há ao redor', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    expect(jogo.celulas[1][1].vizinhas).toBe(3);
    expect(jogo.celulas[0][2].vizinhas).toBe(1);
    expect(jogo.celulas[5][5].vizinhas).toBe(0);
    expect(jogo.celulas[11][5].vizinhas).toBe(3);
    expect(jogo.celulas[11][16].vizinhas).toBe(4);
  });
});

describe('Revelar células', () => {
  test('CT13 - revelar célula numerada mostra somente ela', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.revelar(1, 1);
    expect(jogo.celulas[1][1].revelada).toBe(true);
    expect(jogo.celulasReveladas()).toBe(1);
  });

  test('CT14 - revelar célula vazia (0) abre a região em cascata', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.revelar(6, 9);
    expect(jogo.celulasReveladas()).toBeGreaterThan(100);
    expect(jogo.celulas[1][1].revelada).toBe(true); // borda numerada da região
    expect(jogo.celulas[0][0].revelada).toBe(false); // bomba continua escondida
  });

  test('CT15 - cascata não revela células com bandeira', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.alternarBandeira(5, 5);
    jogo.revelar(6, 9);
    expect(jogo.celulas[5][5].revelada).toBe(false);
    expect(jogo.celulas[5][5].bandeira).toBe(true);
  });

  test('CT16 - revelar bomba encerra o jogo com derrota e mostra todas as bombas', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    expect(jogo.revelar(0, 0)).toBe(ESTADO.DERROTA);
    const reveladas = jogo.celulas.flat().filter((x) => x.bomba && x.revelada).length;
    expect(reveladas).toBe(40);
  });

  test('CT17 - revelar célula já revelada não muda nada', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.revelar(1, 1);
    jogo.revelar(1, 1);
    expect(jogo.celulasReveladas()).toBe(1);
    expect(jogo.jogadas).toBe(1);
  });

  test('CT18 - não é possível revelar célula com bandeira', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.alternarBandeira(0, 0);
    expect(() => jogo.revelar(0, 0)).toThrow('bandeira');
  });

  test.each([
    [-1, 0],
    [0, -1],
    [14, 0],
    [0, 18],
    [1.5, 2],
  ])('CT19 - posição inválida (%p, %p) lança erro', (l, c) => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    expect(() => jogo.revelar(l, c)).toThrow('fora do tabuleiro');
  });

  test('CT20 - linha 13 e coluna 17 são válidas (limites do 18 x 14)', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    expect(() => jogo.alternarBandeira(13, 17)).not.toThrow();
  });
});

describe('Bandeiras', () => {
  test('CT21 - colocar e retirar bandeira', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    expect(jogo.alternarBandeira(3, 3)).toBe(true);
    expect(jogo.bandeiras()).toBe(1);
    expect(jogo.alternarBandeira(3, 3)).toBe(false);
    expect(jogo.bandeiras()).toBe(0);
  });

  test('CT22 - contador de bombas restantes diminui a cada bandeira', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    expect(jogo.bombasRestantes()).toBe(40);
    jogo.alternarBandeira(0, 0);
    jogo.alternarBandeira(0, 1);
    expect(jogo.bombasRestantes()).toBe(38);
  });

  test('CT23 - não é possível colocar mais de 40 bandeiras', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    for (const [l, c] of LAYOUT_FUNDO) jogo.alternarBandeira(l, c);
    expect(jogo.bandeiras()).toBe(40);
    expect(() => jogo.alternarBandeira(0, 0)).toThrow('Limite de bandeiras');
  });

  test('CT24 - não é possível marcar célula já revelada', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.revelar(1, 1);
    expect(() => jogo.alternarBandeira(1, 1)).toThrow('já revelada');
  });
});

describe('Fim de jogo', () => {
  test('CT25 - revelar todas as células seguras dá vitória', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    expect(jogo.revelar(0, 17)).toBe(ESTADO.VITORIA);
    expect(jogo.celulasReveladas()).toBe(212);
  });

  test('CT26 - vitória revelando célula a célula', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLUNAS; c++) {
        if (!jogo.celulas[l][c].bomba && !jogo.celulas[l][c].revelada) jogo.revelar(l, c);
      }
    }
    expect(jogo.estado).toBe(ESTADO.VITORIA);
  });

  test('CT27 - não é possível jogar após derrota', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.revelar(0, 0);
    expect(() => jogo.revelar(5, 5)).toThrow('já terminou');
    expect(() => jogo.alternarBandeira(5, 5)).toThrow('já terminou');
  });

  test('CT28 - não é possível jogar após vitória', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    jogo.revelar(0, 17);
    expect(() => jogo.revelar(12, 0)).toThrow('já terminou');
  });

  test('CT29 - ter bandeiras em todas as bombas, sem revelar as seguras, não é vitória', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_FUNDO });
    for (const [l, c] of LAYOUT_FUNDO) jogo.alternarBandeira(l, c);
    expect(jogo.estado).toBe(ESTADO.EM_ANDAMENTO);
  });
});

describe('Representação', () => {
  test('CT30 - paraTexto mostra 14 linhas de 18 caracteres', () => {
    const jogo = new CampoMinado({ bombas: LAYOUT_CANTO });
    jogo.alternarBandeira(0, 0);
    jogo.revelar(1, 1);
    const linhas = jogo.paraTexto().split('\n');
    expect(linhas).toHaveLength(14);
    linhas.forEach((l) => expect(l).toHaveLength(18));
    expect(linhas[0][0]).toBe('F');
    expect(linhas[1][1]).toBe('3');
    expect(linhas[5][5]).toBe('#');
  });
});
