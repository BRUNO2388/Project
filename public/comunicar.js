const $ = id => document.getElementById(id);
const status = text => { $('status').textContent = text; };
const storageKey = 'elo-communication-phrases-v1';
const defaults = ['Sim', 'Não', 'Preciso de ajuda.', 'Tenho uma pergunta.', 'Pode repetir, por favor?', 'Preciso de água.', 'Onde fica o banheiro?', 'Aguarde, estou escrevendo.', 'Prefiro me comunicar por texto.', 'Obrigado.'];
let saved = [], activeSpeech, voices = [], speechId = 0;
try { const value = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(value)) saved = value.filter(x => typeof x === 'string' && x.trim() && x.length <= 140).slice(0,12); } catch {}
function render(items, target) {
  $(target).replaceChildren(...items.map(text => { const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.onclick = () => { stopVoice(false); $('message').value = text; status('Frase selecionada. Escolha falar ou mostrar.'); }; return button; }));
}
function stopVoice(announce = true) { speechId++; window.speechSynthesis?.cancel(); activeSpeech = undefined; if (announce) status('Voz interrompida.'); }
function loadVoices() {
  const selected = $('voice').value;
  voices = window.speechSynthesis?.getVoices().filter(voice => /^pt(?:-|$)/i.test(voice.lang)) || [];
  $('voice').replaceChildren(new Option('Padrão em português', ''), ...voices.map(voice => new Option(`${voice.name}${voice.localService ? ' (no dispositivo)' : ' (serviço online)'}`, voice.voiceURI)));
  if (voices.some(voice => voice.voiceURI === selected)) $('voice').value = selected;
}
render(defaults, 'phrases'); render(saved, 'saved'); loadVoices();
window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
$('speak-message').onclick = () => {
  const text = $('message').value.trim(); if (!text) { status('Digite ou escolha uma frase primeiro.'); $('message').focus(); return; }
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return status('Voz indisponível neste navegador. Use “Mostrar em letras grandes”.');
  stopVoice(false); const current = speechId;
  activeSpeech = new SpeechSynthesisUtterance(text); activeSpeech.lang = 'pt-BR'; activeSpeech.rate = Number($('rate').value);
  const selected = voices.find(voice => voice.voiceURI === $('voice').value); if (selected) activeSpeech.voice = selected;
  activeSpeech.onstart = () => { if (current === speechId) status('Falando mensagem…'); };
  activeSpeech.onend = () => { if (current === speechId) { activeSpeech = undefined; status('Mensagem falada.'); } };
  activeSpeech.onerror = () => { if (current === speechId) status('Não foi possível falar. Confira a voz e o volume ou mostre a mensagem.'); };
  try { speechSynthesis.speak(activeSpeech); } catch { status('Voz indisponível. Mostre a mensagem em letras grandes.'); }
};
$('stop').onclick = () => stopVoice();
$('show').onclick = () => { const text = $('message').value.trim(); if (!text) { status('Digite ou escolha uma frase primeiro.'); $('message').focus(); return; } stopVoice(false); $('big-message').textContent = text; $('display').showModal(); };
$('close-display').onclick = () => $('display').close();
$('display').addEventListener('close', () => { $('big-message').textContent = ''; $('show').focus(); });
$('erase').onclick = () => { stopVoice(false); $('message').value = ''; $('message').focus(); status('Mensagem apagada.'); };
$('contrast').onclick = () => $('contrast').setAttribute('aria-pressed', document.body.classList.toggle('contrast'));
$('text-size').onchange = () => { document.body.classList.remove('large','extra'); if ($('text-size').value !== 'normal') document.body.classList.add($('text-size').value); };
$('add-phrase').onsubmit = event => {
  event.preventDefault(); const text = $('custom').value.trim(); if (!text) return;
  if (saved.includes(text)) return status('Esta frase já está salva.');
  if (saved.length >= 12) return status('Limite de 12 frases. Apague as frases salvas antes de adicionar outras.');
  const next = [...saved, text];
  try { localStorage.setItem(storageKey, JSON.stringify(next)); saved = next; render(saved, 'saved'); $('custom').value = ''; status('Frase salva neste navegador.'); } catch { status('O navegador não permitiu salvar. Você ainda pode digitar sua mensagem.'); }
};
$('delete-saved').onclick = () => { if (!saved.length) return status('Não há frases salvas.'); if (!confirm('Apagar todas as suas frases salvas neste navegador?')) return; try { localStorage.removeItem(storageKey); saved = []; render(saved, 'saved'); status('Frases salvas apagadas.'); } catch { status('Não foi possível apagar. Verifique o armazenamento do navegador.'); } };
window.addEventListener('pagehide', () => stopVoice(false));
