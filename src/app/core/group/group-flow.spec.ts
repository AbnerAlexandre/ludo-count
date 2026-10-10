import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TtrMatch } from '../services/ttr-match';
import { SevenWondersMatch, swPlayerLimits } from '../services/sw-match';
import { MatchHistory } from '../services/match-history';
import { PLAYER_COLORS } from './group-models';

const draft = (...names: string[]) => names.map((name, i) => ({ name, color: PLAYER_COLORS[i] }));

describe('mesa em grupo — Ticket to Ride', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('pontua cada jogador na sua planilha e desempata por bilhetes completos', () => {
    const m = TestBed.inject(TtrMatch);
    m.selectVariant('usa');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia', 'Caio'));
    const [ana, bia, caio] = m.table.players();

    m.addRoute(6); // Ana: 15
    m.table.select(bia.id);
    m.addRoute(4);
    m.addRoute(4);
    m.addTicket(1, true); // Bia: 7 + 7 + 1 = 15, com 1 bilhete
    m.table.select(caio.id);
    m.addRoute(3); // Caio: 4

    expect(m.totals()).toEqual({ [ana.id]: 15, [bia.id]: 15, [caio.id]: 4 });
    expect(m.standings().map((s) => [s.name, s.rank])).toEqual([
      ['Bia', 1],
      ['Ana', 2],
      ['Caio', 3],
    ]);
    expect(m.standings()[0].decidedBy).toBe(0);
  });

  it('terminar trava, soma ao ranking da sessão e grava a mesa no histórico', () => {
    const m = TestBed.inject(TtrMatch);
    const history = TestBed.inject(MatchHistory);
    m.selectVariant('usa');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia'));
    m.addRoute(6);
    m.finishGroup();

    expect(m.finished()).toBe(true);
    m.addRoute(6); // travado
    expect(m.total()).toBe(15);
    expect(m.table.board()[0]).toMatchObject({ name: 'Ana', wins: 1, points: 15, matches: 1 });
    const entry = history.entries('ttr')[0];
    expect(entry.players?.map((p) => [p.name, p.rank])).toEqual([
      ['Ana', 1],
      ['Bia', 2],
    ]);

    // de novo com os mesmos: mesmos ids, planilhas zeradas, sessão acumulando
    const ids = m.table.players().map((p) => p.id);
    m.rematch();
    expect(m.table.players().map((p) => p.id)).toEqual(ids);
    expect(m.finished()).toBe(false);
    expect(m.total()).toBe(0);
    m.table.select(ids[1]);
    m.addRoute(4);
    m.finishGroup();
    expect(m.table.board().map((r) => [r.name, r.wins, r.points, r.matches])).toEqual([
      ['Ana', 1, 15, 2],
      ['Bia', 1, 7, 2],
    ]);
  });

  it('respeita o limite de jogadores da edição', () => {
    const m = TestBed.inject(TtrMatch);
    m.selectVariant('nordic'); // 2–3
    m.table.setMode('group');
    m.startGroup(draft('A', 'B', 'C', 'D'));
    expect(m.table.match()).toBeNull();
    m.startGroup(draft('A', 'B', 'C'));
    expect(m.table.players().length).toBe(3);
  });

  it('a planilha individual não se mistura com a da mesa', () => {
    const m = TestBed.inject(TtrMatch);
    m.selectVariant('usa');
    m.addRoute(6);
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia'));
    expect(m.total()).toBe(0);
    m.table.setMode('solo');
    expect(m.total()).toBe(15);
  });

  it('quem volta para a mesa com o mesmo nome mantém as estatísticas', () => {
    const m = TestBed.inject(TtrMatch);
    m.selectVariant('usa');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia'));
    const anaId = m.table.players()[0].id;
    m.finishGroup();
    m.table.clearMatch();
    m.startGroup(draft('Caio', 'ana'));
    expect(m.table.players()[1].id).toBe(anaId);
  });
});

describe('mesa em grupo — 7 Wonders', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('limites: base 7, 8 com Cities, de volta a 7 com Armada; Duel 2; Architects 7', () => {
    expect(swPlayerLimits('base', {}).max).toBe(7);
    expect(swPlayerLimits('base', { cities: true }).max).toBe(8);
    expect(swPlayerLimits('base', { cities: true, armada: true }).max).toBe(7);
    expect(swPlayerLimits('duel')).toEqual({ min: 2, max: 2 });
    expect(swPlayerLimits('architects')).toEqual({ min: 2, max: 7 });
  });

  it('expansões valem para a mesa toda e não podem quebrar o limite', () => {
    const m = TestBed.inject(SevenWondersMatch);
    m.selectVariant('base');
    m.table.setMode('group');
    m.toggleExpansion('cities');
    expect(m.limits().max).toBe(8);
    m.startGroup(draft('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'));
    expect(m.table.players().length).toBe(8);
    expect(m.expansionBlock('cities')).toBe('group.exp.citiesNeeded');
    expect(m.expansionBlock('armada')).toBe('group.exp.armadaMax');
    m.toggleExpansion('cities'); // bloqueado
    expect(m.expansionOn('cities')).toBe(true);
    m.toggleExpansion('leaders');
    for (const p of m.table.players()) {
      m.table.select(p.id);
      expect(m.base().expansions.leaders).toBe(true);
    }
  });

  it('desempate do 7 Wonders: mais moedas', () => {
    const m = TestBed.inject(SevenWondersMatch);
    m.selectVariant('base');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia', 'Caio'));
    const [, bia] = m.table.players();
    m.patchBase({ civilian: 10, coins: 2 }); // Ana 10
    m.table.select(bia.id);
    m.patchBase({ civilian: 9, coins: 3 }); // Bia 9 + 1 = 10, mais moedas
    expect(m.standings().map((s) => s.name).slice(0, 2)).toEqual(['Bia', 'Ana']);
  });

  it('Duel: supremacia vence na hora e é exclusiva de um jogador', () => {
    const m = TestBed.inject(SevenWondersMatch);
    m.selectVariant('duel');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia'));
    const [ana, bia] = m.table.players();
    m.patchDuel({ civilian: 40, victory: 'military' }); // Ana
    m.table.select(bia.id);
    m.patchDuel({ civilian: 60 });
    expect(m.standings()[0]).toMatchObject({ id: ana.id, rank: 1, outcome: 'sw.victory.military' });
    m.patchDuel({ victory: 'science' }); // Bia agora; Ana volta para pontos
    expect(m.standings()[0]).toMatchObject({ id: bia.id, outcome: 'sw.victory.science' });
    m.table.select(ana.id);
    expect(m.duel().victory).toBe('civilian');
  });

  it('Architects: empate decidido pela mesa (mais etapas da Maravilha)', () => {
    const m = TestBed.inject(SevenWondersMatch);
    m.selectVariant('architects');
    m.table.setMode('group');
    m.startGroup(draft('Ana', 'Bia'));
    const [, bia] = m.table.players();
    m.patchArchitects({ wonder: 12 });
    m.table.select(bia.id);
    m.patchArchitects({ wonder: 12 });
    expect(m.standings().every((s) => s.rank === 1)).toBe(true);
    m.finishGroup();
    m.pickTieWinner(bia.id);
    expect(m.standings()[0]).toMatchObject({ id: bia.id, rank: 1, decidedBy: -1 });
    expect(m.table.board().find((r) => r.playerId === bia.id)?.wins).toBe(1);
    expect(m.table.board().find((r) => r.playerId !== bia.id)?.wins).toBe(0);
    expect(TestBed.inject(MatchHistory).entries('sw')[0].players?.[0].name).toBe('Bia');
  });
});
