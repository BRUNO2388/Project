import test from 'node:test';
import assert from 'node:assert/strict';
import { punctuate, createReader } from '../public/reading.js';
test('Pontuação preserva números e sinais sem inventar vírgulas', () => {
  assert.equal(punctuate('  bom dia  a todos '), 'Bom dia a todos.');
  assert.equal(punctuate('O valor é 2,50.'), 'O valor é 2,50.');
  assert.equal(punctuate('Tudo bem?'), 'Tudo bem?');
  assert.equal(punctuate(''), '');
});
test('Fila respeita término, pausa, cancelamento e erro de autoplay', () => {
  const spoken = [], timers = new Map(), messages = []; let id = 0;
  const reader = createReader({ synth: { speak: s => spoken.push(s), cancel() {}, getVoices: () => [] }, Utterance: class { constructor(text) { this.text = text; } }, settings: () => ({ rate: .92, pause: 650, voice: '' }), notify: m => messages.push(m), schedule: (fn, delay) => { assert.equal(delay,650); timers.set(++id,fn); return id; }, unschedule: id => timers.delete(id) });
  reader.enqueue('Primeira.'); reader.enqueue('Segunda.'); assert.equal(spoken.length,1);
  spoken[0].onend(); assert.equal(spoken.length,1);
  const resume = timers.get(1); timers.delete(1); resume(); assert.equal(spoken[1].text,'Segunda.');
  reader.enqueue('Terceira.'); reader.stop(); spoken[1].onend(); assert.equal(timers.size,0); assert.equal(spoken.length,2);
  reader.enqueue('Nova.'); spoken[2].onerror({ error:'not-allowed' }); assert.match(messages[0], /Ativar áudio/);
});
