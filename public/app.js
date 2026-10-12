const $ = id => document.getElementById(id);
let session, state, revision = -1, recognition, listening = false, pending = Promise.resolve();
const say = message => { $('feedback').textContent = message; };
async function api(path, key, data) {
  const response = await fetch(path, { method: data ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key}`, ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(10000) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Falha no servidor.'); return result;
}
const endpoint = () => `/api/rooms/${session.id}`;
function send(data) {
  pending = pending.catch(() => {}).then(() => api(endpoint(), session.owner, data));
  return pending;
}
function stopMic() { listening = false; recognition?.stop(); $('microphone').textContent = 'Iniciar microfone'; $('interim').textContent = ''; }
function draw(next) {
  $('session-title').textContent = next.title;
  $('connection').textContent = next.ended ? 'Sessão encerrada' : 'Conectado';
  if (next.revision === revision) return;
  const previous = revision; revision = next.revision; state = next;
  const container = $('captions'); const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 70;
  container.replaceChildren(...next.entries.map(entry => { const p = document.createElement('p'); p.textContent = entry.text; return p; }));
  $('empty').hidden = next.entries.length > 0;
  if (next.ended) { $('empty').querySelector('h2').textContent = 'Sessão encerrada'; $('empty').querySelector('p').textContent = 'Obrigado por participar. As legendas desta sessão foram apagadas.'; stopMic(); document.querySelectorAll('#host-panel button,#host-panel textarea').forEach(el => el.disabled = true); }
  if (atBottom) container.scrollTop = container.scrollHeight;
  if ($('announce').checked && !session.owner) $('live').textContent = next.entries.filter(e => e.id > previous).slice(-3).map(e => e.text).join(' ');
}
async function poll() {
  if (!session) return;
  try { const next = await api(endpoint(), session.owner || session.viewer); draw(next); if (next.ended) return; }
  catch (e) { $('connection').textContent = 'Sem conexão'; say(`${e.message} Tentando reconectar…`); }
  setTimeout(poll, 1200);
}
function openSession(data) {
  session = data; $('welcome').hidden = true; $('session').hidden = false; $('host-panel').hidden = !data.owner;
  $('session-title').textContent = data.title || 'Acompanhar sessão'; $('session-title').focus();
  $('role').textContent = data.owner ? 'SEU ESPAÇO DE APRESENTAÇÃO' : 'SEU ESPAÇO DE ACOMPANHAMENTO';
  if (data.owner) {
    const link = new URL(location.href); link.hash = new URLSearchParams({ room: data.id, access: data.viewer }).toString();
    $('audience-url').value = link.href;
    const projection = new URL(link); projection.hash += '&screen=1'; $('projector').href = projection.href;
    $('link-help').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'Este link funciona apenas neste computador. Para celulares, abra o painel pelo endereço de rede do servidor. Consulte o README.' : 'Qualquer pessoa com este link pode acompanhar. Compartilhe apenas com seu público.';
  }
  poll();
}
$('create').addEventListener('submit', async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; try { const data = await api('/api/rooms', $('key').value.trim(), { title: $('title').value }); $('key').value = ''; try { sessionStorage.setItem('elo-host', JSON.stringify(data)); } catch {} openSession(data); say('Sessão criada. Compartilhe o link com o público.'); } catch (e) { say(e.message); } finally { button.disabled = false; } });
$('manual').addEventListener('submit', async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; try { await send({ action: 'caption', text: $('caption').value }); $('caption').value = ''; say('Texto enviado.'); } catch (e) { say(e.message); } finally { button.disabled = Boolean(state?.ended); } });
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('audience-url').value); say('Link copiado.'); } catch { $('audience-url').select(); say('Selecione e copie o link manualmente.'); } };
$('clear').onclick = async () => { if (!confirm('Apagar as legendas desta sessão para todos os participantes?')) return; try { await send({ action: 'clear' }); say('Legendas apagadas.'); } catch (e) { say(e.message); } };
$('end').onclick = async () => { if (!confirm('Encerrar a sessão e apagar suas legendas?')) return; stopMic(); try { await send({ action: 'end' }); try { sessionStorage.removeItem('elo-host'); } catch {} say('Sessão encerrada.'); } catch (e) { say(e.message); } };
$('size').onchange = () => { document.body.classList.remove('size-large','size-extra'); if ($('size').value !== 'normal') document.body.classList.add(`size-${$('size').value}`); };
$('contrast').onclick = () => $('contrast').setAttribute('aria-pressed', document.body.classList.toggle('contrast'));
$('focus').onclick = () => { const active = document.body.classList.toggle('projecting'); $('focus').setAttribute('aria-pressed', active); $('focus').textContent = active ? 'Sair do telão' : 'Modo telão'; };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('projecting')) $('focus').click(); });
$('speak').onclick = () => { const text = state?.entries.at(-1)?.text; if (!text) return say('Ainda não há legenda para ler.'); if (!('speechSynthesis' in window)) return say('Leitura por voz indisponível neste navegador.'); speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(text); speech.lang = 'pt-BR'; speech.onerror = () => say('Não foi possível reproduzir a voz neste dispositivo.'); speechSynthesis.speak(speech); };
$('stop-speak').onclick = () => window.speechSynthesis?.cancel();
$('microphone').onclick = () => {
  if (listening) { stopMic(); $('mic-status').textContent = 'Microfone parado.'; return; }
  if (!$('consent').checked) return say('Leia e marque o aviso de processamento de áudio antes de iniciar.');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || !window.isSecureContext) return say('Transcrição indisponível. Use um navegador compatível em HTTPS ou localhost, ou envie texto manualmente.');
  recognition = new SpeechRecognition(); recognition.lang = 'pt-BR'; recognition.continuous = true; recognition.interimResults = true;
  recognition.onstart = () => { listening = true; $('microphone').textContent = 'Parar microfone'; $('mic-status').textContent = 'Microfone ativo. Verifique a precisão das legendas.'; say(''); };
  recognition.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) { const result = event.results[i]; if (result.isFinal) { const text = result[0].transcript.trim(); if (text) send({ action: 'caption', text: text.slice(0,2000) }).catch(e => { stopMic(); say(`Falha ao enviar legenda: ${e.message} Use o envio manual para reenviar.`); }); } else interim += result[0].transcript; }
    $('interim').textContent = interim;
  };
  recognition.onerror = event => { stopMic(); $('mic-status').textContent = `Transcrição interrompida (${event.error}). Verifique permissão e conexão; reinicie quando estiver pronto.`; };
  recognition.onend = () => { listening = false; $('microphone').textContent = 'Iniciar microfone'; $('interim').textContent = ''; if ($('mic-status').textContent.startsWith('Microfone ativo')) $('mic-status').textContent = 'O navegador encerrou a captura. Clique para iniciar novamente.'; };
  try { recognition.start(); } catch { say('Não foi possível iniciar o microfone.'); }
};
const params = new URLSearchParams(location.hash.slice(1));
if (params.has('room') && params.has('access')) { openSession({ id: params.get('room'), viewer: params.get('access') }); if (params.get('screen') === '1') $('focus').click(); }
else { try { const saved = JSON.parse(sessionStorage.getItem('elo-host')); if (saved?.owner && saved?.id) { api(`/api/rooms/${saved.id}`, saved.owner).then(data => { if (!data.ended) openSession(saved); else sessionStorage.removeItem('elo-host'); }).catch(() => sessionStorage.removeItem('elo-host')); } } catch {} }
