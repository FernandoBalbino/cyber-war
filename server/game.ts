import { randomInt, randomUUID } from 'node:crypto';
import { MAX_BLOCKS, MAZE_PTS, activeClues, fits } from '../shared/types.ts';
import { makeMaze, play } from '../shared/maze.ts';
import type { Board, Clue, ClueKind, EventKind, Fx, LogItem, Me, Phase, PubPlayer, Result, Results, Team, ToolKind, View } from '../shared/types.ts';
import { makeBank, mutate, shuffle } from './words.ts';
import { QUESTIONS } from './quiz.ts';

// Ajustes do jogo num lugar só. CW_SPEED > 1 encurta os tempos (apenas para testes locais).
const SPEED = Number(process.env.CW_SPEED) || 1;
export const T = {
  prep: 120_000 / SPEED, cooldown: 60_000 / SPEED, window: 4_000, quizEvery: 120_000 / SPEED, quizTime: 20_000,
  eventMin: 60_000 / SPEED, eventMax: 180_000 / SPEED, // evento surpresa a cada 1–3 min
  maze: 45_000 / SPEED, // espera entre um labirinto e outro
};
const PTS = { hit: 100, clue: 10, survive: 100, block: 25, quiz: 15, maze: MAZE_PTS };
const EVENTS: EventKind[] = ['leak', 'brute', 'firewall', 'quiz'];
const BANK_SIZE = 100, EXPAND_SIZE = 20, CAMO = 3, MAX_PLAYERS = 60;
const USES = { len: 1, comp: 1, track: 1 };

export class Oops extends Error {}
export function fail(m: string): never { throw new Oops(m); }
const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: readonly T[]): T => a[rnd(a.length)];

type Section = 'room' | 'players' | 'bank' | 'board' | 'feed' | 'results' | 'history';
const ALL: Section[] = ['room', 'players', 'bank', 'board', 'feed', 'results', 'history'];
export type Send = (sid: string, ev: 'view' | 'fx', data: View | Fx) => void;

type OpenQuiz = { id: number; qi: number; opts: string[]; a: number; until: number };
export type P = {
  id: string; token: string; name: string; av: number; team: Team | null; sid: string | null;
  score: number; total: number;
  entry: number | null; changed: boolean; blocks: number; downBy: string | null; attacks: number; blocked: number;
  nextAt: number; uses: { len: number; comp: number; track: number }; attempts: number; hits: number;
  quiz: OpenQuiz | null; quizAt: number; quizRight: number; asked: Set<number>;
  maze: { id: number; seed: number; at: number } | null; mazeNext: number; mazes: number;
};
type Pending = { id: number; inv: string; def: string; entry: number; w: string; until: number };

export class Room {
  code: string; send: Send;
  profToken = randomUUID(); profSid: string | null = null;
  players = new Map<string, P>();
  phase: Phase = 'lobby'; endsAt = 0; round = 0; minutes = 15; eventAt = 0;
  bank: { id: number; w: string }[] = []; nextId = 1; used = new Set<string>();
  owner = new Map<number, string>(); // senha -> defensor (segredo, nunca sai do servidor)
  strikes = new Map<string, Set<number>>();
  intel: Clue[] = []; expandUsed = false;
  pending: Pending[] = []; seq = 1;
  log: LogItem[] = [];
  results: Results | null = null; history: Results[] = [];
  lastActive = Date.now();
  dirty = new Set<Section>(); meDirty = new Set<string>(); queued = false;

  constructor(code: string, send: Send) { this.code = code; this.send = send; }

  // ---------- membros ----------
  list(team?: Team) { return [...this.players.values()].filter((p) => !team || p.team === team); }
  name(id: string) { return this.players.get(id)?.name ?? '?'; }
  pw(d: P) { return this.bank.find((e) => e.id === d.entry)?.w ?? ''; }

  join(rawName: string, av: number, sid: string): P {
    const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!name) fail('Digite seu nome');
    if (this.players.size >= MAX_PLAYERS) fail('Sala cheia');
    if (this.list().some((p) => p.name.toLowerCase() === name.toLowerCase())) fail('Esse nome já está na sala');
    const p: P = {
      id: randomUUID().slice(0, 8), token: randomUUID(), name, av: Number.isInteger(av) && av >= 0 && av < 16 ? av : 0,
      team: null, sid: null, score: 0, total: 0, entry: null, changed: false, blocks: 1, downBy: null, attacks: 0, blocked: 0,
      nextAt: 0, uses: { ...USES }, attempts: 0, hits: 0, quiz: null, quizAt: 0, quizRight: 0, asked: new Set(),
      maze: null, mazeNext: 0, mazes: 0,
    };
    this.players.set(p.id, p);
    if (this.phase === 'prep' || this.phase === 'live') this.enlist(p);
    this.attach(p, sid);
    this.touch('players');
    return p;
  }

  attach(p: P, sid: string) {
    p.sid = sid;
    if (!p.team && (this.phase === 'prep' || this.phase === 'live')) this.enlist(p);
    this.send(sid, 'view', { ...this.view(p, new Set(ALL), true), full: true });
    this.touch('players');
  }

  attachProf(sid: string) {
    this.profSid = sid;
    this.send(sid, 'view', { ...this.view(null, new Set(ALL), false), full: true });
  }

  detach(sid: string) {
    if (this.profSid === sid) this.profSid = null;
    for (const p of this.players.values()) if (p.sid === sid) { p.sid = null; this.touch('players'); }
  }

  leave(p: P) {
    if (this.phase === 'lobby' || this.phase === 'end') this.remove(p);
    else { p.sid = null; this.touch('players'); }
  }

  kick(id: string) {
    const p = this.players.get(id) ?? fail('Aluno não encontrado');
    if (p.sid) this.send(p.sid, 'fx', { t: 'kicked' });
    this.remove(p);
  }

  remove(p: P) {
    this.players.delete(p.id);
    if (p.entry !== null) this.owner.delete(p.entry); // a senha dele vira só mais uma opção falsa
    this.pending = this.pending.filter((a) => a.inv !== p.id && a.def !== p.id);
    this.touch('players', 'board', 'bank');
  }

  // entra no meio da partida: vai para a equipe menor
  enlist(p: P) {
    const d = this.list('def').length, i = this.list('inv').length;
    p.team = d < i ? 'def' : 'inv';
    this.resetRound(p);
    if (p.team === 'def') {
      const free = this.bank.filter((e) => !this.owner.has(e.id));
      const e = pick(free);
      this.owner.set(e.id, p.id); p.entry = e.id;
      if (this.phase === 'live') p.quizAt = Date.now() + 30_000;
    }
    this.mark(p);
  }

  resetRound(p: P) {
    Object.assign(p, {
      score: 0, entry: null, changed: false, blocks: 1, downBy: null, attacks: 0, blocked: 0,
      nextAt: 0, uses: { ...USES }, attempts: 0, hits: 0, quiz: null, quizAt: 0, quizRight: 0,
      maze: null, mazeNext: 0, mazes: 0,
    });
  }

  // ---------- professor ----------
  sortTeams() {
    if (this.phase === 'prep' || this.phase === 'live') fail('Partida em andamento');
    const on = shuffle(this.list().filter((p) => p.sid));
    if (on.length < 2) fail('São necessários pelo menos 2 alunos conectados');
    for (const p of this.list()) p.team = null;
    on.forEach((p, i) => { p.team = i % 2 === 0 ? 'def' : 'inv'; });
    this.touch('players'); this.mark(...on);
  }

  // professor escolhe a equipe de cada aluno (ex.: separar por fileiras)
  setTeam(id: string, team: Team | null) {
    if (this.phase !== 'lobby') fail('Monte as equipes antes de começar');
    const p = this.players.get(id) ?? fail('Aluno não encontrado');
    p.team = team;
    this.touch('players'); this.mark(p);
  }

  setMinutes(m: number) {
    if (this.phase === 'live') fail('Use +2 min durante a partida');
    if (!Number.isInteger(m) || m < 3 || m > 60) fail('Escolha entre 3 e 60 minutos');
    this.minutes = m;
    this.touch('room');
  }

  extend() {
    if (this.phase !== 'live') fail('Só durante a partida');
    this.endsAt += 120_000;
    this.toast('⏱️', 'O professor deu +2 minutos!');
    this.touch('room');
  }

  toLobby() {
    if (this.phase !== 'end') fail('Termine a partida primeiro');
    this.phase = 'lobby';
    this.touch('room', 'players');
  }

  start() {
    if (this.phase === 'prep' || this.phase === 'live') fail('Partida em andamento');
    for (const p of this.list()) if (!p.sid) p.team = null; // quem está offline fica de fora
    const on = this.list().filter((p) => p.sid);
    if (on.length < 2) fail('São necessários pelo menos 2 alunos conectados');
    if (!on.some((p) => p.team)) this.sortTeams();
    for (const p of shuffle(on.filter((p) => !p.team))) {
      p.team = this.list('def').length < this.list('inv').length ? 'def' : 'inv';
    }
    if (!this.list('def').length || !this.list('inv').length) fail('Coloque alunos nas duas equipes');

    this.round++;
    this.used = new Set();
    this.bank = makeBank(BANK_SIZE, this.used).map((w) => ({ id: this.nextId++, w }));
    this.owner.clear(); this.strikes.clear(); this.intel = []; this.expandUsed = false;
    this.pending = []; this.log = []; this.results = null;
    for (const p of this.list()) this.resetRound(p);
    const ids = shuffle(this.bank.map((e) => e.id));
    this.list('def').forEach((d, i) => { d.entry = ids[i]; this.owner.set(ids[i], d.id); });
    this.phase = 'prep'; this.endsAt = Date.now() + T.prep;
    this.touch(...ALL); this.mark(...this.list());
  }

  skipPrep() { if (this.phase === 'prep') this.goLive(); }

  goLive() {
    const now = Date.now();
    this.phase = 'live'; this.endsAt = now + this.minutes * 60_000;
    this.eventAt = now + T.eventMin + rnd(T.eventMax - T.eventMin);
    for (const d of this.list('def')) d.quizAt = now + (30_000 + rnd(60_000)) / SPEED;
    this.toast('⚡', 'Valendo! Ataques liberados.');
    this.touch('room'); this.mark(...this.list());
  }

  next(swap: boolean) {
    if (this.phase !== 'end') fail('Termine a partida primeiro');
    for (const p of this.list()) p.team = swap && p.team ? (p.team === 'def' ? 'inv' : 'def') : null;
    this.start();
  }

  // eventos surpresa: disparados sozinhos pelo relógio da partida
  event(ev: EventKind) {
    const now = Date.now();
    const item: LogItem = { at: now, k: 'event', ev };
    if (ev === 'leak') {
      const d = pick(this.list('def').filter((x) => !x.downBy));
      if (!d) return;
      Object.assign(item, { def: d.id, clue: this.reveal(d) });
    } else if (ev === 'brute') {
      for (const p of this.list('inv')) { p.nextAt = Math.min(p.nextAt, now); this.mark(p); }
    } else if (ev === 'firewall') {
      for (const p of this.list('def')) { p.blocks = Math.min(MAX_BLOCKS, p.blocks + 1); this.mark(p); }
    } else {
      for (const p of this.list()) if (p.sid && !p.quiz) this.ask(p);
    }
    this.broadcast({ t: 'event', ev });
    this.addLog(item);
  }

  // ---------- invasores ----------
  attempt(p: P, defId: string, entry: number) {
    if (this.phase !== 'live') fail(this.phase === 'prep' ? 'Aguarde o fim da preparação' : 'Partida encerrada');
    if (p.team !== 'inv') fail('Só invasores atacam');
    const now = Date.now();
    if (now < p.nextAt) fail(`Aguarde ${Math.ceil((p.nextAt - now) / 1000)}s`);
    if (this.pending.some((a) => a.inv === p.id)) fail('Ataque em andamento');
    const d = this.target(defId);
    const e = this.bank.find((x) => x.id === entry) ?? fail('Senha não está no banco');
    if (this.strikes.get(d.id)?.has(e.id)) fail('Essa senha já foi testada nesse defensor');
    if (this.pending.some((a) => a.def === d.id && a.entry === e.id)) fail('Um colega já está testando essa');
    if (this.list('def').some((x) => x.downBy && x.entry === e.id)) fail('Essa senha já foi descoberta');
    p.nextAt = now + T.cooldown; p.attempts++; d.attacks++;
    this.pending.push({ id: this.seq++, inv: p.id, def: d.id, entry: e.id, w: e.w, until: now + T.window });
    if (d.sid) this.send(d.sid, 'fx', { t: 'alert', by: p.name });
    this.mark(p, d);
  }

  resolve(a: Pending, blocked: boolean) {
    if (this.phase !== 'live' || !this.pending.includes(a)) return;
    this.pending = this.pending.filter((x) => x !== a);
    const inv = this.players.get(a.inv), d = this.players.get(a.def);
    if (!inv || !d) return;
    const e = this.bank.find((x) => x.id === a.entry); // sumiu = o defensor trocou a senha a tempo
    const r: Result = blocked ? 'blocked' : e && d.entry === e.id && !d.downBy ? 'hit' : 'miss';
    let bonus = false;
    if (r !== 'blocked' && e) {
      const cl = activeClues(this.intel, d.id);
      if (cl.length && cl.every((c) => fits(e.w, c))) { inv.score += PTS.clue; bonus = true; }
    }
    if (r === 'hit') {
      d.downBy = inv.id; inv.score += PTS.hit; inv.hits++;
      this.pending = this.pending.filter((x) => x.def !== d.id);
      this.broadcast({ t: 'vignette', def: d.name, av: d.av, by: inv.name });
    } else if (r === 'miss' && e) {
      if (!this.strikes.has(d.id)) this.strikes.set(d.id, new Set());
      this.strikes.get(d.id)!.add(e.id);
    } else if (r === 'blocked') {
      d.blocks--; d.blocked++; d.score += PTS.block;
      this.toast('🛡️', `${d.name} bloqueou o ataque de ${inv.name}`, 'def');
    }
    if (inv.sid) this.send(inv.sid, 'fx', { t: 'result', r, w: a.w, def: d.name, bonus });
    this.addLog({ at: Date.now(), k: 'try', by: inv.id, def: d.id, w: a.w, r, bonus });
    this.touch('players', 'board'); this.mark(inv, d);
    if (r === 'hit' && this.list('def').every((x) => x.downBy)) this.finish();
  }

  tool(p: P, kind: ToolKind, defId: string) {
    if (this.phase !== 'live') fail('Ferramentas liberam quando a partida começar');
    if (p.team !== 'inv') fail('Só invasores usam ferramentas');
    if (kind === 'expand') {
      if (this.expandUsed) fail('Sua equipe já expandiu o banco');
      this.expandUsed = true;
      for (const w of makeBank(EXPAND_SIZE, this.used)) this.bank.push({ id: this.nextId++, w });
      const d = pick(this.list('def').filter((x) => !x.downBy));
      this.addLog({ at: Date.now(), k: 'tool', by: p.id, tool: 'expand', def: d?.id, clue: d && this.reveal(d) });
      this.toast('📂', `Banco expandido para ${this.bank.length} senhas`, 'inv');
      this.touch('bank');
      return;
    }
    if (!(kind in USES)) fail('Ferramenta inválida');
    const k = kind as keyof typeof USES;
    if (p.uses[k] <= 0) fail('Você já usou essa ferramenta');
    const d = this.target(defId);
    const w = this.pw(d);
    const known = new Set(this.intel.filter((c) => c.def === d.id).map((c) => c.k));
    let clue: { k: ClueKind; v: number | boolean | string };
    if (k === 'len') {
      if (known.has('len')) fail('Sua equipe já sabe o comprimento');
      clue = { k: 'len', v: w.length };
    } else if (k === 'comp') {
      const kinds = (['digit', 'upper', 'symbol'] as const).filter((x) => !known.has(x));
      const ck = pick(kinds.length ? kinds : ['digit', 'upper', 'symbol'] as const);
      clue = { k: ck, v: fits(w, { k: ck, v: true }) };
    } else {
      clue = { k: 'track', v: d.changed };
    }
    p.uses[k]--;
    const c: Clue = { def: d.id, ...clue, at: Date.now() };
    this.intel.push(c);
    this.addLog({ at: c.at, k: 'tool', by: p.id, def: d.id, tool: kind, clue: c });
    if (d.sid) this.send(d.sid, 'fx', { t: 'scan', tool: kind });
    this.touch('board'); this.mark(p);
  }

  // revela uma letra da senha de `d` (Expandir banco e evento Vazamento)
  reveal(d: P): Clue {
    const w = this.pw(d).toLowerCase();
    const known = new Set(this.intel.filter((c) => c.def === d.id && c.k === 'letter').map((c) => c.v));
    const letters = [...new Set(w.replace(/[^a-z]/g, ''))];
    const fresh = letters.filter((l) => !known.has(l));
    const c: Clue = { def: d.id, k: 'letter', v: pick(fresh.length ? fresh : letters), at: Date.now() };
    this.intel.push(c);
    this.touch('board');
    return c;
  }

  target(defId: string): P {
    const d = this.players.get(defId);
    if (!d || d.team !== 'def') fail('Escolha um defensor');
    if (d.downBy) fail('Esse defensor já caiu');
    return d;
  }

  // ---------- defensores ----------
  change(d: P, pos: number, ch: string) {
    if (this.phase !== 'prep' && this.phase !== 'live') fail('Fora da partida');
    if (d.team !== 'def') fail('Só defensores trocam a senha');
    if (d.downBy) fail('Sua senha já foi descoberta');
    if (d.changed) fail('Você já trocou sua senha');
    const e = this.bank.find((x) => x.id === d.entry) ?? fail('Senha não encontrada');
    if (!Number.isInteger(pos) || pos < 0 || pos >= e.w.length) fail('Escolha uma posição');
    if (typeof ch !== 'string' || !/^[a-zA-Z0-9@#$!*&%?]$/.test(ch)) fail('Use uma letra, número ou símbolo');
    if (ch === e.w[pos]) fail('Escolha um caractere diferente');
    const w = e.w.slice(0, pos) + ch + e.w.slice(pos + 1);
    if (this.bank.some((x) => x.w === w)) fail('Essa senha já existe no banco');
    d.entry = this.replace(e, w);
    d.changed = true;
    // camuflagem: outras opções falsas também mudam, para a troca não entregar o defensor
    const decoys = shuffle(this.bank.filter((x) => !this.owner.has(x.id))).slice(0, CAMO);
    for (const x of decoys) {
      let m = mutate(x.w);
      for (let i = 0; i < 20 && this.bank.some((y) => y.w === m); i++) m = mutate(x.w);
      if (!this.bank.some((y) => y.w === m)) this.replace(x, m);
    }
    this.addLog({ at: Date.now(), k: 'change', def: d.id, w });
    this.touch('bank', 'board'); this.mark(d);
  }

  replace(e: { id: number; w: string }, w: string): number {
    const id = this.nextId++;
    this.bank[this.bank.indexOf(e)] = { id, w };
    const o = this.owner.get(e.id);
    if (o) { this.owner.delete(e.id); this.owner.set(id, o); }
    for (const s of this.strikes.values()) s.delete(e.id);
    return id;
  }

  block(d: P) {
    if (this.phase !== 'live') fail('Fora da partida');
    if (d.team !== 'def' || d.downBy) fail('Não é possível bloquear');
    if (d.blocks <= 0) fail('Sem bloqueios disponíveis');
    const a = this.pending.find((x) => x.def === d.id) ?? fail('Nenhum ataque agora');
    this.resolve(a, true);
  }

  // ---------- desafios ----------
  ask(p: P) {
    let pool = QUESTIONS.map((_, i) => i).filter((i) => !p.asked.has(i));
    if (!pool.length) { p.asked.clear(); pool = QUESTIONS.map((_, i) => i); }
    const qi = pick(pool);
    p.asked.add(qi);
    const q = QUESTIONS[qi];
    const order = shuffle(q.o.map((_, i) => i));
    p.quiz = { id: this.seq++, qi, opts: order.map((i) => q.o[i]), a: order.indexOf(q.a), until: Date.now() + T.quizTime };
    this.mark(p);
  }

  answer(p: P, id: number, choice: number) {
    const z = p.quiz;
    if (!z || z.id !== id || Date.now() > z.until + 1500) fail('Pergunta expirada');
    p.quiz = null;
    const correct = choice === z.a;
    let block = false;
    if (correct) {
      p.score += PTS.quiz; p.quizRight++;
      if (p.team === 'def' && p.quizRight % 2 === 0 && p.blocks < MAX_BLOCKS) { p.blocks++; block = true; }
      this.touch('players');
    }
    this.mark(p);
    return { correct, answer: z.a, tip: QUESTIONS[z.qi].tip, block };
  }

  // ---------- labirinto (jogado no navegador; o servidor só confere o caminho no final) ----------
  mazeStart(p: P) {
    if (this.phase !== 'prep' && this.phase !== 'live') fail('Fora da partida');
    if (p.team !== 'def') fail('Só defensores jogam o labirinto');
    const now = Date.now();
    if (!p.maze) {
      if (now < p.mazeNext) fail(`Novo labirinto em ${Math.ceil((p.mazeNext - now) / 1000)}s`);
      p.maze = { id: this.seq++, seed: randomInt(2 ** 31), at: now };
    }
    this.mark(p);
    return { id: p.maze.id, seed: p.maze.seed };
  }

  mazeDone(p: P, id: number, path: string, choice: string) {
    if (this.phase !== 'prep' && this.phase !== 'live') fail('Fora da partida');
    const z = p.maze;
    if (!z || z.id !== id) fail('Labirinto expirado');
    if (path.length > 4000) fail('Caminho inválido');
    if (Date.now() - z.at < path.length * 60) fail('Rápido demais');
    if (!play(makeMaze(z.seed), path)) fail('Caminho inválido');
    p.maze = null; p.mazeNext = Date.now() + T.maze; p.mazes++;
    const reward = choice === 'block' && !p.downBy && p.blocks < MAX_BLOCKS ? 'block' : 'points';
    if (reward === 'block') p.blocks++;
    else p.score += PTS.maze;
    this.addLog({ at: Date.now(), k: 'maze', def: p.id, reward });
    this.touch('players'); this.mark(p);
    return { reward };
  }

  // ---------- relógio ----------
  tick(now: number) {
    if (this.phase === 'prep' && now >= this.endsAt) this.goLive();
    if (this.phase !== 'live') return;
    if (now >= this.endsAt) return this.finish();
    for (const a of this.pending.filter((x) => x.until <= now)) this.resolve(a, false);
    if (this.phase !== 'live') return; // a última senha pode ter caído agora
    if (now >= this.eventAt) {
      this.eventAt = now + T.eventMin + rnd(T.eventMax - T.eventMin);
      this.event(pick(EVENTS));
    }
    for (const p of this.list()) {
      if (p.quiz && now > p.quiz.until + 1500) { p.quiz = null; this.mark(p); }
      if (p.team === 'def' && p.sid && !p.quiz && p.quizAt && now >= p.quizAt) {
        this.ask(p);
        p.quizAt = now + T.quizEvery + rnd(30_000);
      }
    }
  }

  finish() {
    if (this.phase !== 'prep' && this.phase !== 'live') return;
    this.pending = [];
    const players = this.list().filter((p) => p.team);
    for (const p of players) {
      p.quiz = null;
      if (p.team === 'def' && !p.downBy) p.score += PTS.survive;
      p.total += p.score;
    }
    const sum = (t: Team) => players.filter((p) => p.team === t).reduce((s, p) => s + p.score, 0);
    const teams = { def: sum('def'), inv: sum('inv') };
    const tries = this.log.filter((l) => l.k === 'try');
    this.results = {
      round: this.round, at: Date.now(), code: this.code,
      winner: teams.def === teams.inv ? 'tie' : teams.def > teams.inv ? 'def' : 'inv', teams,
      defenders: this.list('def').map((d) => ({
        id: d.id, name: d.name, av: d.av, pw: this.pw(d), down: d.downBy ? this.name(d.downBy) : undefined, attacks: d.attacks, changed: d.changed,
      })),
      players: players.map((p) => ({
        id: p.id, name: p.name, av: p.av, team: p.team!, score: p.score, total: p.total,
        attempts: p.attempts, hits: p.hits, blocked: p.blocked, quiz: p.quizRight, maze: p.mazes,
      })).sort((a, b) => b.score - a.score),
      attempts: tries.length, hits: tries.filter((l) => l.r === 'hit').length, blocks: tries.filter((l) => l.r === 'blocked').length,
    };
    this.history.unshift(this.results);
    this.history.length = Math.min(this.history.length, 20);
    this.phase = 'end';
    this.touch(...ALL); this.mark(...this.list());
  }

  // ---------- envio (agrupa mudanças e manda só o que mudou) ----------
  addLog(l: LogItem) { this.log.push(l); if (this.log.length > 300) this.log.shift(); this.touch('feed'); }
  toast(icon: string, text: string, team?: Team) { this.broadcast({ t: 'toast', icon, text, team }); }
  broadcast(fx: Fx) {
    for (const p of this.players.values()) if (p.sid) this.send(p.sid, 'fx', fx);
    if (this.profSid) this.send(this.profSid, 'fx', fx);
  }
  touch(...s: Section[]) { for (const x of s) this.dirty.add(x); this.queue(); }
  mark(...ps: P[]) { for (const p of ps) this.meDirty.add(p.id); this.queue(); }
  queue() {
    this.lastActive = Date.now();
    if (this.queued) return;
    this.queued = true;
    setTimeout(() => this.flush(), 60);
  }
  flush() {
    this.queued = false;
    for (const p of this.players.values()) {
      if (!p.sid) continue;
      const v = this.view(p, this.dirty, this.meDirty.has(p.id));
      if (Object.keys(v).length > 1) this.send(p.sid, 'view', v);
    }
    if (this.profSid && this.dirty.size) this.send(this.profSid, 'view', this.view(null, this.dirty, false));
    this.dirty.clear(); this.meDirty.clear();
  }

  view(p: P | null, s: Set<Section>, me: boolean): View {
    const v: View = { now: Date.now() };
    const prof = p === null, inv = prof || p.team === 'inv';
    if (s.has('room')) v.room = { code: this.code, phase: this.phase, endsAt: this.endsAt, round: this.round, minutes: this.minutes };
    if (s.has('players')) v.players = this.list().map((x): PubPlayer => ({
      id: x.id, name: x.name, av: x.av, team: x.team, score: x.score, total: x.total, on: !!x.sid,
      down: x.downBy ? this.name(x.downBy) : undefined,
    }));
    if (inv && this.phase !== 'lobby') {
      if (s.has('bank')) v.bank = this.bank.map((e) => [e.id, e.w]);
      if (s.has('board')) v.board = this.board();
      if (s.has('feed')) v.feed = this.log.filter((l) => prof || l.k === 'try' || l.k === 'tool').slice(prof ? -80 : -30);
    }
    if (s.has('results')) v.results = this.results;
    if (prof) {
      if (s.has('bank') || s.has('board') || s.has('players')) {
        v.secrets = Object.fromEntries(this.list('def').map((d) => [d.id, this.pw(d)]));
      }
      if (s.has('history')) v.history = this.history;
    }
    if (p && me) v.me = this.me(p);
    return v;
  }

  board(): Board {
    const strikes: Record<string, number[]> = {};
    for (const [d, set] of this.strikes) strikes[d] = [...set];
    const found: Record<string, number> = {};
    for (const d of this.list('def')) if (d.downBy && d.entry !== null) found[d.id] = d.entry;
    return { strikes, found, intel: this.intel, expandUsed: this.expandUsed };
  }

  me(p: P): Me {
    const z = p.quiz;
    const m: Me = {
      id: p.id, team: p.team, score: p.score,
      quiz: z && { id: z.id, q: QUESTIONS[z.qi].q, opts: z.opts, until: z.until },
    };
    if (p.team === 'def' && this.phase !== 'lobby') {
      Object.assign(m, {
        pw: this.pw(p), changed: p.changed, blocks: p.blocks, maze: p.maze && { id: p.maze.id, seed: p.maze.seed }, mazeNext: p.mazeNext,
        threats: this.pending.filter((a) => a.def === p.id).map((a) => ({ by: this.name(a.inv), until: a.until })),
      });
    }
    if (p.team === 'inv') {
      const a = this.pending.find((x) => x.inv === p.id);
      Object.assign(m, { nextAt: p.nextAt, uses: p.uses, pending: a ? { def: a.def, entry: a.entry, until: a.until } : null });
    }
    return m;
  }
}

// ---------- salas ----------
export const rooms = new Map<string, Room>();
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoom(send: Send): Room {
  if (rooms.size >= 200) fail('Servidor lotado, tente mais tarde');
  let code = '';
  do code = Array.from({ length: 4 }, () => ABC[rnd(ABC.length)]).join(''); while (rooms.has(code));
  const r = new Room(code, send);
  rooms.set(code, r);
  return r;
}

export function closeRoom(r: Room) {
  r.broadcast({ t: 'closed' });
  rooms.delete(r.code);
}
