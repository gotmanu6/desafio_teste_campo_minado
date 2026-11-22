'use strict';

/**
 * Campo Minado — tabuleiro 18 x 14 (18 colunas por 14 linhas) com 40 bombas.
 *
 * Coordenadas: (linha, coluna), começando em 0.
 *   linhas  : 0..13
 *   colunas : 0..17
 */

const COLUNAS = 18;
const LINHAS = 14;
const BOMBAS = 40;

const ESTADO = Object.freeze({
  EM_ANDAMENTO: 'em_andamento',
  VITORIA: 'vitoria',
  DERROTA: 'derrota',
});

class CampoMinado {
  /**
   * @param {object} [opcoes]
   * @param {Function} [opcoes.rng=Math.random] gerador aleatório (para testes determinísticos)
   * @param {[number,number][]} [opcoes.bombas] posições fixas das bombas (para testes)
   */
  constructor({ rng = Math.random, bombas } = {}) {
    this.linhas = LINHAS;
    this.colunas = COLUNAS;
    this.totalBombas = BOMBAS;
    this.rng = rng;
    this.estado = ESTADO.EM_ANDAMENTO;
    this.jogadas = 0;
    this.celulas = [];
    for (let l = 0; l < LINHAS; l++) {
      const linha = [];
      for (let c = 0; c < COLUNAS; c++) {
        linha.push({ bomba: false, revelada: false, bandeira: false, vizinhas: 0 });
      }
      this.celulas.push(linha);
    }
    this.bombasPosicionadas = false;
    if (bombas) this.posicionarBombas(bombas);
  }

  /** Posiciona as bombas em posições informadas (exatamente 40, sem repetição). */
  posicionarBombas(posicoes) {
    if (this.bombasPosicionadas) throw new Error('As bombas já foram posicionadas');
    if (!Array.isArray(posicoes) || posicoes.length !== BOMBAS) {
      throw new Error(`O tabuleiro deve ter exatamente ${BOMBAS} bombas`);
    }
    const vistas = new Set();
    for (const [l, c] of posicoes) {
      this._validar(l, c);
      const chave = `${l},${c}`;
      if (vistas.has(chave)) throw new Error('Posição de bomba repetida');
      vistas.add(chave);
    }
    for (const [l, c] of posicoes) this.celulas[l][c].bomba = true;
    this._calcularVizinhas();
    this.bombasPosicionadas = true;
  }

  /** Sorteia 40 bombas, nunca na célula protegida (primeira jogada) nem nas vizinhas dela. */
  sortearBombas(protegida) {
    const proibidas = new Set();
    if (protegida) {
      const [pl, pc] = protegida;
      proibidas.add(`${pl},${pc}`);
      for (const [l, c] of this.vizinhos(pl, pc)) proibidas.add(`${l},${c}`);
    }
    const candidatas = [];
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLUNAS; c++) {
        if (!proibidas.has(`${l},${c}`)) candidatas.push([l, c]);
      }
    }
    for (let i = candidatas.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
    }
    this.posicionarBombas(candidatas.slice(0, BOMBAS));
  }

  dentroDoTabuleiro(l, c) {
    return Number.isInteger(l) && Number.isInteger(c) && l >= 0 && l < LINHAS && c >= 0 && c < COLUNAS;
  }

  /** Lista as até 8 células vizinhas válidas. */
  vizinhos(l, c) {
    const lista = [];
    for (let dl = -1; dl <= 1; dl++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dl === 0 && dc === 0) continue;
        if (this.dentroDoTabuleiro(l + dl, c + dc)) lista.push([l + dl, c + dc]);
      }
    }
    return lista;
  }

  /** Revela uma célula. Retorna o estado do jogo após a jogada. */
  revelar(l, c) {
    this._validar(l, c);
    this._verificarEmAndamento();
    if (!this.bombasPosicionadas) this.sortearBombas([l, c]);

    const celula = this.celulas[l][c];
    if (celula.bandeira) throw new Error('Não é possível revelar uma célula com bandeira');
    if (celula.revelada) return this.estado;

    this.jogadas++;
    if (celula.bomba) {
      celula.revelada = true;
      this.estado = ESTADO.DERROTA;
      this._revelarTodasBombas();
      return this.estado;
    }

    // Revelação em cascata (flood fill) a partir de células sem bombas vizinhas.
    const pilha = [[l, c]];
    while (pilha.length) {
      const [al, ac] = pilha.pop();
      const atual = this.celulas[al][ac];
      if (atual.revelada || atual.bandeira || atual.bomba) continue;
      atual.revelada = true;
      if (atual.vizinhas === 0) {
        for (const v of this.vizinhos(al, ac)) pilha.push(v);
      }
    }

    if (this.celulasSeguras() === this.celulasReveladas()) {
      this.estado = ESTADO.VITORIA;
    }
    return this.estado;
  }

  /** Coloca ou retira uma bandeira. Retorna true se a célula ficou com bandeira. */
  alternarBandeira(l, c) {
    this._validar(l, c);
    this._verificarEmAndamento();
    const celula = this.celulas[l][c];
    if (celula.revelada) throw new Error('Não é possível marcar uma célula já revelada');
    if (!celula.bandeira && this.bandeiras() >= BOMBAS) {
      throw new Error('Limite de bandeiras atingido');
    }
    celula.bandeira = !celula.bandeira;
    return celula.bandeira;
  }

  bandeiras() {
    return this.celulas.flat().filter((x) => x.bandeira).length;
  }

  bombasRestantes() {
    return BOMBAS - this.bandeiras();
  }

  celulasReveladas() {
    return this.celulas.flat().filter((x) => x.revelada && !x.bomba).length;
  }

  celulasSeguras() {
    return LINHAS * COLUNAS - BOMBAS;
  }

  contarBombas() {
    return this.celulas.flat().filter((x) => x.bomba).length;
  }

  /** Representação textual do tabuleiro (visão do jogador). */
  paraTexto() {
    return this.celulas
      .map((linha) =>
        linha
          .map((x) => {
            if (x.bandeira) return 'F';
            if (!x.revelada) return '#';
            if (x.bomba) return '*';
            return x.vizinhas === 0 ? '.' : String(x.vizinhas);
          })
          .join('')
      )
      .join('\n');
  }

  _calcularVizinhas() {
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLUNAS; c++) {
        this.celulas[l][c].vizinhas = this.vizinhos(l, c).filter(([vl, vc]) => this.celulas[vl][vc].bomba).length;
      }
    }
  }

  _revelarTodasBombas() {
    for (const linha of this.celulas) for (const x of linha) if (x.bomba) x.revelada = true;
  }

  _validar(l, c) {
    if (!this.dentroDoTabuleiro(l, c)) {
      throw new Error(`Posição (${l}, ${c}) fora do tabuleiro ${COLUNAS}x${LINHAS}`);
    }
  }

  _verificarEmAndamento() {
    if (this.estado !== ESTADO.EM_ANDAMENTO) throw new Error('O jogo já terminou');
  }
}

module.exports = { CampoMinado, COLUNAS, LINHAS, BOMBAS, ESTADO };
