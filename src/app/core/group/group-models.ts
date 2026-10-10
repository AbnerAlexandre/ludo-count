/**
 * Partida em grupo: vários jogadores numa mesma mesa, cada um com a sua
 * planilha. Tipos compartilhados por Ticket to Ride e 7 Wonders.
 */

export type GroupMode = 'solo' | 'group';

export interface GroupPlayer {
  id: string;
  name: string;
  /** cor do assento (hex), só para identificar o jogador na tela */
  color: string;
}

/** linha da tela de cadastro, antes de virar jogador (sem id = jogador novo) */
export interface DraftPlayer {
  id?: string;
  name: string;
  color: string;
}

export interface GroupMatch<S> {
  id: string;
  variantId: string;
  /** ISO 8601 */
  startedAt: string;
  /** ids na ordem dos assentos (é a ordem do "próximo jogador") */
  order: string[];
  sheets: Record<string, S>;
  activeId: string;
  finished: boolean;
  /** desempate escolhido pela mesa quando a regra depende de algo que o app não registra */
  manualOrder?: string[];
  /** entrada correspondente no histórico (para atualizar após um desempate manual) */
  historyId?: string;
}

/** posição final de um jogador numa partida */
export interface Standing {
  id: string;
  name: string;
  color: string;
  total: number;
  /** 1 = vencedor; empates dividem a posição (1, 2, 2, 4) */
  rank: number;
  /** a posição é dividida com outro jogador */
  shared: boolean;
  /** critério de desempate que separou este jogador de outro com os mesmos pontos (-1 = escolha da mesa) */
  decidedBy?: number;
  /** vitória imediata (ex.: supremacia no Duel) — fica à frente de qualquer pontuação */
  forced?: boolean;
  /** chave de tradução do desfecho, ex.: 'sw.victory.military' */
  outcome?: string;
}

export interface SessionResult {
  playerId: string;
  name: string;
  color: string;
  total: number;
  rank: number;
}

/** uma partida terminada dentro da sessão (ranking temporário) */
export interface SessionRecord {
  /** = id da partida em grupo */
  id: string;
  /** ISO 8601 */
  date: string;
  variantId: string;
  results: SessionResult[];
}

/** linha do ranking da sessão */
export interface BoardRow {
  playerId: string;
  name: string;
  color: string;
  /** posição no ranking da sessão (empates dividem) */
  pos: number;
  wins: number;
  points: number;
  matches: number;
  best: number;
  avg: number;
}

/** quantos jogadores a regra permite (já considerando expansões ligadas) */
export interface PlayerLimits {
  min: number;
  max: number;
}

/** cores sólidas e distintas para os assentos (sem gradiente) */
export const PLAYER_COLORS = ['#e5484d', '#3e8ef7', '#30a46c', '#f2c230', '#8e4ec6', '#f76b15', '#12a594', '#d6409f'];
