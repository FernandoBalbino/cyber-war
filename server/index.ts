import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Oops, closeRoom, createRoom, fail, rooms } from './game.ts';
import type { Room } from './game.ts';
import type { ToolKind } from '../shared/types.ts';

const PORT = Number(process.env.PORT) || 3001;
const origins = process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim());

// O site fica no GitHub Pages; aqui só passa o tráfego do jogo.
const http = createServer((req, res) => {
  res.writeHead(req.url === '/healthz' ? 200 : 404, { 'content-type': 'text/plain' }).end(req.url === '/healthz' ? 'ok' : 'CYBER WAR');
});
const io = new Server(http, {
  cors: { origin: origins ?? true },
  serveClient: false,
  perMessageDeflate: { threshold: 1024 },
});
const send = (sid: string, ev: string, data: unknown) => { io.to(sid).emit(ev, data); };

type Ack = (r: unknown) => void;
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const getRoom = (code: unknown) => rooms.get(str(code).trim().toUpperCase()) ?? fail('Sala não encontrada');

io.on('connection', (socket) => {
  let room: Room | null = null, pid: string | null = null, prof = false;
  let tokens = 15, last = Date.now();

  const leave = () => { room?.detach(socket.id); room = null; pid = null; prof = false; };
  const player = () => {
    const p = room && pid ? room.players.get(pid) : undefined;
    if (!room || !p) fail('Você não está em uma sala');
    return { r: room as Room, p };
  };
  const teacher = () => (room && prof ? room : fail('Somente o professor'));

  const on = (ev: string, fn: (a: Record<string, unknown>) => unknown) => socket.on(ev, (a: unknown, ack?: Ack) => {
    const reply: Ack = typeof ack === 'function' ? ack : () => {};
    const now = Date.now();
    tokens = Math.min(15, tokens + (now - last) / 200); last = now;
    if (tokens < 1) return reply({ ok: false, err: 'Calma! Muitas ações seguidas.' });
    tokens--;
    try {
      const r = fn(a && typeof a === 'object' ? (a as Record<string, unknown>) : {});
      reply({ ok: true, ...(r && typeof r === 'object' ? r : {}) });
    } catch (e) {
      if (!(e instanceof Oops)) console.error(ev, e);
      reply({ ok: false, err: e instanceof Oops ? e.message : 'Erro no servidor' });
    }
  });

  // professor
  on('prof:create', () => {
    leave();
    const r = createRoom(send);
    room = r; prof = true;
    r.attachProf(socket.id);
    console.log(`sala ${r.code} criada (${rooms.size} ativas)`);
    return { code: r.code, token: r.profToken };
  });
  on('prof:resume', (a) => {
    const r = getRoom(a.code);
    if (r.profToken !== a.token) fail('Sala não encontrada');
    leave(); room = r; prof = true;
    r.attachProf(socket.id);
  });
  on('prof:sort', () => teacher().sortTeams());
  on('prof:start', () => teacher().start());
  on('prof:skip', () => teacher().skipPrep());
  on('prof:end', () => teacher().finish());
  on('prof:next', (a) => teacher().next(a.swap === true));
  on('prof:kick', (a) => teacher().kick(str(a.id)));
  on('prof:team', (a) => teacher().setTeam(str(a.id), a.team === 'def' || a.team === 'inv' ? a.team : null));
  on('prof:minutes', (a) => teacher().setMinutes(Number(a.minutes)));
  on('prof:extend', () => teacher().extend());
  on('prof:lobby', () => teacher().toLobby());
  on('prof:close', () => { const r = teacher(); closeRoom(r); room = null; prof = false; console.log(`sala ${r.code} fechada`); });

  // alunos
  on('join', (a) => {
    const r = getRoom(a.code);
    if (r.phase === 'end') fail('Aguarde a próxima rodada começar');
    leave();
    const p = r.join(str(a.name), Number(a.av), socket.id);
    room = r; pid = p.id;
    return { token: p.token };
  });
  on('resume', (a) => {
    const r = getRoom(a.code);
    const p = [...r.players.values()].find((x) => x.token === a.token) ?? fail('Sessão expirada');
    leave(); room = r; pid = p.id;
    r.attach(p, socket.id);
  });
  on('leave', () => { const { r, p } = player(); r.leave(p); room = null; pid = null; });
  on('attempt', (a) => { const { r, p } = player(); r.attempt(p, str(a.def), Number(a.entry)); });
  on('tool', (a) => { const { r, p } = player(); r.tool(p, str(a.kind) as ToolKind, str(a.def)); });
  on('change', (a) => { const { r, p } = player(); r.change(p, Number(a.pos), str(a.ch)); });
  on('block', () => { const { r, p } = player(); r.block(p); });
  on('answer', (a) => { const { r, p } = player(); return r.answer(p, Number(a.id), Number(a.choice)); });
  on('maze:start', () => { const { r, p } = player(); return r.mazeStart(p); });
  on('maze:done', (a) => { const { r, p } = player(); return r.mazeDone(p, Number(a.id), str(a.path), str(a.choice)); });

  socket.on('disconnect', leave);
});

setInterval(() => { const now = Date.now(); for (const r of rooms.values()) r.tick(now); }, 500);
// salas esquecidas somem depois de 3 horas sem movimento
setInterval(() => {
  for (const r of rooms.values()) if (Date.now() - r.lastActive > 3 * 3600_000) closeRoom(r);
}, 600_000);

http.listen(PORT, () => console.log(`CYBER WAR no ar na porta ${PORT}`));
