// Sala local com bots para testar como aluno. Uso: node tests/bots.mjs [quantidade] [servidor]
// O script é o professor: quando um humano entra, sorteia as equipes, começa e roda novas rodadas sozinho.
import { io } from 'socket.io-client';
import { activeClues, fits } from '../shared/types.ts';

const N = Number(process.argv[2]) || 7;
const SERVER = process.argv[3] ?? 'http://localhost:3001';
const NAMES = ['Carla', 'Davi', 'Enzo', 'Fabi', 'Gabi', 'Heitor', 'Iara', 'João', 'Kauã', 'Lara', 'Malu', 'Nina'];
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client() {
  const s = io(SERVER, { transports: ['websocket'] });
  const st = { players: [], bank: [], board: null, me: null, room: null, offset: 0 };
  s.on('view', (v) => Object.assign(st, v, { offset: v.now - Date.now() }));
  const call = (ev, d = {}) => new Promise((r) => s.emit(ev, d, r));
  return { s, st, call };
}

const prof = client();
await new Promise((r) => prof.s.on('connect', r));
const { code } = await prof.call('prof:create');

const bots = NAMES.slice(0, N).map((name, i) => ({ name, av: (i * 5 + 3) % 16, ...client() }));
for (const b of bots) await b.call('join', { code, name: b.name, av: b.av });

for (const b of bots) {
  b.s.on('fx', (f) => {
    // defensor bot às vezes bloqueia
    if (f.t === 'alert' && b.st.me?.blocks && Math.random() < 0.35) setTimeout(() => b.call('block'), 1000 + rnd(2000));
  });
  setInterval(async () => {
    const { me, room, bank, board, players } = b.st;
    if (!me || room?.phase !== 'live') return;
    const now = Date.now() + b.st.offset;
    if (me.quiz && !me.quiz.sent) { me.quiz.sent = true; setTimeout(() => b.call('answer', { id: me.quiz.id, choice: rnd(me.quiz.opts.length) }), 2000 + rnd(5000)); }
    if (me.team === 'def' && !me.changed && Math.random() < 0.01) {
      b.call('change', { pos: rnd(me.pw.length), ch: pick('aeiou0@#1s') });
    }
    if (me.team === 'inv' && !me.pending && now >= me.nextAt && Math.random() < 0.3) {
      const alive = players.filter((p) => p.team === 'def' && !p.down);
      if (!alive.length) return;
      const d = pick(alive);
      if (Math.random() < 0.3 && me.uses) {
        const tool = pick(['len', 'comp', 'track'].filter((k) => me.uses[k] > 0));
        if (tool) await b.call('tool', { kind: tool, def: d.id });
      }
      const struck = new Set(board?.strikes[d.id] ?? []);
      const found = new Set(Object.values(board?.found ?? {}));
      const clues = activeClues(board?.intel ?? [], d.id);
      const opts = bank.filter(([id, w]) => !struck.has(id) && !found.has(id) && clues.every((c) => fits(w, c)));
      const [entry] = pick(opts.length ? opts : bank);
      b.call('attempt', { def: d.id, entry });
    }
  }, 1500);
}

const humans = () => prof.st.players.filter((p) => p.on && !bots.some((b) => b.name === p.name));
console.log(`\nSala ${code} com ${N} bots. Entre como aluno; a partida começa 10 s depois que você entrar.\n`);

while (!humans().length) await sleep(1000);
await sleep(10_000);
await prof.call('prof:start');
console.log('partida iniciada (preparação de 2 min)');
for (let swap = true; ; swap = !swap) {
  while (prof.st.room?.phase !== 'end') await sleep(1000);
  console.log('fim da rodada; a próxima começa em 45 s');
  await sleep(45_000);
  await prof.call('prof:next', { swap });
}
