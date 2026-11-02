// Tipos e regras compartilhados entre servidor e cliente.
export type Team = 'def' | 'inv';
export type Phase = 'lobby' | 'prep' | 'live' | 'end';
export type ToolKind = 'len' | 'comp' | 'track' | 'expand';
export type EventKind = 'leak' | 'brute' | 'firewall' | 'quiz';
export type ClueKind = 'len' | 'digit' | 'upper' | 'symbol' | 'letter' | 'track';
export type Clue = { def: string; k: ClueKind; v: number | boolean | string; at: number };
export type Result = 'hit' | 'miss' | 'blocked';
export const MAX_BLOCKS = 3; // bloqueios guardados no máximo
export const MAZE_PTS = 20;  // prêmio em pontos do baú do labirinto

export type PubPlayer = {
  id: string; name: string; av: number; team: Team | null;
  score: number; total: number; on: boolean; down?: string; // down = nome de quem descobriu
};

export type LogItem = {
  at: number; k: 'try' | 'tool' | 'change' | 'event' | 'maze';
  by?: string; def?: string; w?: string; r?: Result; bonus?: boolean;
  tool?: ToolKind; clue?: Clue; ev?: EventKind; reward?: 'block' | 'points';
};

export type Board = {
  strikes: Record<string, number[]>; // defensor -> ids das senhas já testadas nele
  found: Record<string, number>;     // defensor -> id da senha descoberta
  intel: Clue[];
  expandUsed: boolean;
};

export type Quiz = { id: number; q: string; opts: string[]; until: number };

export type Me = {
  id: string; team: Team | null; score: number; quiz: Quiz | null;
  // defensor
  pw?: string; changed?: boolean; blocks?: number; threats?: { by: string; until: number }[];
  maze?: { id: number; seed: number } | null; mazeNext?: number;
  // invasor
  nextAt?: number; uses?: Record<'len' | 'comp' | 'track', number>;
  pending?: { def: string; entry: number; until: number } | null;
};

export type Results = {
  round: number; at: number; code: string; winner: Team | 'tie';
  teams: Record<Team, number>;
  defenders: { id: string; name: string; av: number; pw: string; down?: string; attacks: number; changed: boolean }[];
  players: { id: string; name: string; av: number; team: Team; score: number; total: number; attempts: number; hits: number; blocked: number; quiz: number; maze: number }[];
  attempts: number; hits: number; blocks: number;
};

export type View = {
  now: number; full?: boolean;
  room?: { code: string; phase: Phase; endsAt: number; round: number; minutes: number };
  players?: PubPlayer[];
  bank?: [number, string][];
  board?: Board;
  feed?: LogItem[];
  me?: Me;
  results?: Results | null;
  secrets?: Record<string, string>; // só professor
  history?: Results[];              // só professor
};

export type Fx =
  | { t: 'vignette'; def: string; av: number; by: string }
  | { t: 'toast'; icon: string; text: string; team?: Team }
  | { t: 'event'; ev: EventKind }
  | { t: 'result'; r: Result; w: string; def: string; bonus: boolean }
  | { t: 'alert'; by: string }
  | { t: 'scan'; tool: ToolKind }
  | { t: 'kicked' } | { t: 'closed' };

export const fits = (w: string, c: Pick<Clue, 'k' | 'v'>): boolean => {
  switch (c.k) {
    case 'len': return w.length === c.v;
    case 'digit': return /\d/.test(w) === c.v;
    case 'upper': return /[A-Z]/.test(w) === c.v;
    case 'symbol': return /[^a-zA-Z0-9]/.test(w) === c.v;
    case 'letter': return w.toLowerCase().includes(String(c.v));
    default: return true;
  }
};

// Pista mais recente de cada tipo vale (a senha pode ter mudado); letras se acumulam.
export const activeClues = (intel: Clue[], def: string): Clue[] => {
  const last = new Map<string, Clue>();
  for (const c of intel) if (c.def === def && c.k !== 'track') last.set(c.k === 'letter' ? `l${c.v}` : c.k, c);
  return [...last.values()];
};
