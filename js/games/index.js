import hafiza from './hafiza.js';
import adamasmaca from './adamasmaca.js';
import isimsehir from './isimsehir.js';
import bilgi from './bilgi.js';

export const LIST=[isimsehir,adamasmaca,bilgi,hafiza];
export const GAMES=Object.fromEntries(LIST.map(g=>[g.id,g]));
