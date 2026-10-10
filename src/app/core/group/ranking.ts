import type { BoardRow, SessionRecord } from './group-models';

/** entrada do ranking de uma partida */
export interface RankItem {
  id: string;
  total: number;
  /** vitória imediata: fica acima de qualquer pontuação */
  forced?: boolean;
  /** critérios oficiais de desempate, em ordem; maior vence */
  tiebreak?: number[];
}

export interface Ranked extends RankItem {
  rank: number;
  shared: boolean;
  /** índice do critério que separou do vizinho com os mesmos pontos; -1 = escolha da mesa */
  decidedBy?: number;
}

/** compara só pelas regras do jogo (vitória imediata, pontos, desempates) */
function byRules(a: RankItem, b: RankItem): number {
  if (!!a.forced !== !!b.forced) return a.forced ? -1 : 1;
  if (a.total !== b.total) return b.total - a.total;
  return tieIndex(a, b) === null ? 0 : tieDiff(a, b);
}

/** primeiro critério de desempate em que os dois diferem (null = iguais em todos) */
function tieIndex(a: RankItem, b: RankItem): number | null {
  const ta = a.tiebreak ?? [];
  const tb = b.tiebreak ?? [];
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    if ((ta[i] ?? 0) !== (tb[i] ?? 0)) return i;
  }
  return null;
}

function tieDiff(a: RankItem, b: RankItem): number {
  const i = tieIndex(a, b)!;
  return (b.tiebreak?.[i] ?? 0) - (a.tiebreak?.[i] ?? 0);
}

/**
 * Ordena a mesa e atribui posições no padrão de competição (1, 2, 2, 4).
 * `manual` é a ordem escolhida pela mesa para um empate que a regra manda
 * decidir por algo que o app não registra (ex.: etapas no Architects).
 */
export function rankStandings(items: readonly RankItem[], manual: readonly string[] = []): Ranked[] {
  const mIdx = (id: string) => {
    const i = manual.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const full = (a: RankItem, b: RankItem) => byRules(a, b) || Math.sign(mIdx(a.id) - mIdx(b.id));

  const sorted = [...items].sort(full);
  const out: Ranked[] = [];
  sorted.forEach((it, i) => {
    const prev = out[i - 1];
    const rank = prev && full(sorted[i - 1], it) === 0 ? prev.rank : i + 1;
    out.push({ ...it, rank, shared: false });
  });

  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    cur.shared = out.some((o) => o !== cur && o.rank === cur.rank);
    // mesmo total, mas posições diferentes: quem separou foi um desempate
    const reasons: number[] = [];
    for (const nb of [out[i - 1], out[i + 1]]) {
      if (!nb || nb.rank === cur.rank || !!nb.forced !== !!cur.forced || nb.total !== cur.total) continue;
      const idx = tieIndex(nb, cur);
      reasons.push(idx === null ? -1 : idx);
    }
    if (reasons.length) {
      const auto = reasons.filter((r) => r >= 0);
      cur.decidedBy = auto.length ? Math.min(...auto) : -1;
    }
  }
  return out;
}

/**
 * Ranking temporário da sessão: quem mais venceu e, depois, quem somou mais
 * pontos. Os registros chegam do mais novo para o mais antigo — o nome e a cor
 * exibidos são os mais recentes.
 */
export function sessionBoard(records: readonly SessionRecord[]): BoardRow[] {
  const map = new Map<string, Omit<BoardRow, 'pos' | 'avg'>>();
  for (const rec of records) {
    for (const r of rec.results) {
      const row = map.get(r.playerId);
      if (!row) {
        map.set(r.playerId, {
          playerId: r.playerId,
          name: r.name,
          color: r.color,
          wins: r.rank === 1 ? 1 : 0,
          points: r.total,
          matches: 1,
          best: r.total,
        });
      } else {
        row.wins += r.rank === 1 ? 1 : 0;
        row.points += r.total;
        row.matches += 1;
        row.best = Math.max(row.best, r.total);
      }
    }
  }
  const rows = [...map.values()]
    .map((r) => ({ ...r, avg: Math.round((r.points / r.matches) * 10) / 10, pos: 0 }))
    .sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name));
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.pos = prev && prev.wins === r.wins && prev.points === r.points ? prev.pos : i + 1;
  });
  return rows;
}

/** nome normalizado para reconhecer o mesmo jogador entre partidas */
export function nameKey(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}
