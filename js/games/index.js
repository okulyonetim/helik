import hafiza from './hafiza.js';
import adamasmaca from './adamasmaca.js';
import isimsehir from './isimsehir.js';
import bilgi from './bilgi.js';
import kelime from './kelime.js';
import yapboz from './yapboz.js';
import boyama from './boyama.js';

export const LIST=[isimsehir,kelime,bilgi,adamasmaca,hafiza,yapboz,boyama];
export const GAMES=Object.fromEntries(LIST.map(g=>[g.id,g]));
