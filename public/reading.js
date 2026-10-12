// Conservative fallback: do not guess grammatical commas or question marks.
export function punctuate(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const capitalized = clean.replace(/^\p{L}/u, c => c.toLocaleUpperCase('pt-BR'));
  return /[.!?…]["'”’)]*$/.test(capitalized) ? capitalized : `${capitalized}.`;
}
export function createReader({ synth, Utterance, settings, notify, schedule = setTimeout, unschedule = clearTimeout }) {
  let queue = [], active = null, timer = null, generation = 0;
  function stop() {
    generation++; queue = []; active = null;
    if (timer !== null) unschedule(timer);
    timer = null; synth?.cancel();
  }
  function pump() {
    if (active || timer !== null || !queue.length) return;
    if (!synth || !Utterance) { stop(); notify('Voz indisponível neste navegador.'); return; }
    const config = settings(), speech = new Utterance(queue.shift()), version = generation;
    active = speech; speech.lang = 'pt-BR'; speech.rate = config.rate;
    const voices = synth.getVoices();
    speech.voice = voices.find(v => v.voiceURI === config.voice) || voices.find(v => /^pt-BR$/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang)) || null;
    speech.onend = () => {
      if (generation !== version) return;
      active = null;
      timer = schedule(() => { timer = null; pump(); }, config.pause);
    };
    speech.onerror = event => {
      if (generation !== version) return;
      stop(); notify(event.error === 'not-allowed' ? 'Clique em Ativar áudio uma vez para liberar a leitura automática.' : 'Não foi possível ler. Confira a voz e o volume; clique em Ativar áudio para tentar novamente.');
    };
    try { synth.speak(speech); } catch { stop(); notify('Não foi possível iniciar a voz. Clique em Ativar áudio.'); }
  }
  return { stop, enqueue(text) {
    if (!text?.trim()) return;
    if (queue.length >= 20) { stop(); notify('A leitura ficou atrasada e foi interrompida. Desative e ative a leitura automática para acompanhar as próximas legendas.'); return; }
    queue.push(text); pump();
  } };
}
