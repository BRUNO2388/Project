import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const token = () => randomBytes(24).toString('hex');
const equal = (a, b) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const TTL = 4 * 60 * 60 * 1000;
export function createApp({ adminKey = token(), now = Date.now } = {}) {
  const rooms = new Map();
  const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/comunicar': ['comunicar.html', 'text/html'], '/comunicar.js': ['comunicar.js', 'text/javascript'], '/comunicar.css': ['comunicar.css', 'text/css'] };
  const server = http.createServer(async (req, res) => {
    const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && files[url.pathname]) {
        const [file, type] = files[url.pathname];
        const data = await readFile(new URL(`public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); return res.end(data);
      }
      if (req.method === 'GET' && url.pathname === '/health') return reply(200, { ok: true, version: '0.1.0' });
      for (const [id, room] of rooms) if (now() > room.expires) rooms.delete(id);
      const auth = req.headers.authorization?.replace(/^Bearer /, '');
      const body = async () => {
        let data = ''; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 12000) throw new Error('size'); data += chunk; }
        try { return JSON.parse(data); } catch { throw new Error('json'); }
      };
      if (req.method === 'POST' && url.pathname === '/api/rooms') {
        if (!equal(auth, adminKey)) return reply(401, { error: 'Chave do organizador inválida.' });
        if (rooms.size >= 50) return reply(429, { error: 'Limite de sessões deste piloto atingido.' });
        const input = await body();
        if (typeof input?.title !== 'string' || !input.title.trim() || input.title.length > 100) return reply(400, { error: 'Informe um título de até 100 caracteres.' });
        const id = randomBytes(8).toString('hex');
        const room = { title: input.title.trim(), owner: token(), viewer: token(), entries: [], revision: 0, ended: false, expires: now() + TTL };
        rooms.set(id, room);
        return reply(201, { id, owner: room.owner, viewer: room.viewer, title: room.title });
      }
      const match = /^\/api\/rooms\/([a-f0-9]{16})$/.exec(url.pathname);
      const room = match && rooms.get(match[1]);
      if (!room) return reply(404, { error: 'Sessão não encontrada ou expirada.' });
      const owner = equal(auth, room.owner);
      if (!owner && !equal(auth, room.viewer)) return reply(403, { error: 'Acesso à sessão não autorizado.' });
      if (req.method === 'GET') return reply(200, { title: room.title, entries: room.entries, ended: room.ended, revision: room.revision, expires: room.expires });
      if (!owner) return reply(403, { error: 'Somente o organizador pode alterar as legendas.' });
      if (req.method === 'POST') {
        if (room.ended) return reply(409, { error: 'Esta sessão já foi encerrada.' });
        const input = await body();
        if (input?.action === 'end') { room.ended = true; room.entries = []; room.revision++; }
        else if (input?.action === 'clear') { room.entries = []; room.revision++; }
        else if (input?.action === 'caption' && typeof input.text === 'string' && input.text.trim() && input.text.length <= 2000) {
          room.entries.push({ id: ++room.revision, text: input.text.trim(), time: now() });
          room.entries = room.entries.slice(-100);
        } else return reply(400, { error: 'Legenda inválida. Use até 2.000 caracteres.' });
        return reply(200, { ok: true });
      }
      return reply(405, { error: 'Método não permitido.' });
    } catch (error) { if (!res.headersSent) reply(error.message === 'size' ? 413 : 400, { error: 'Não foi possível processar a solicitação.' }); else res.end(); }
  });
  return { server, adminKey };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, adminKey } = createApp({ adminKey: process.env.ADMIN_KEY || undefined });
  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => {
    console.log(`Elo Acessível — piloto\nAbra http://localhost:${port}\nChave do organizador: ${adminKey}\nMantenha esta janela aberta. As sessões são temporárias (4 horas).\nEndereço de escuta: ${host}`);
  });
}
