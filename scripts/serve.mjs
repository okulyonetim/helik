/* Yerel deneme sunucusu: npm run serve → http://localhost:8080 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';

const kok=new URL('..',import.meta.url).pathname;
const tur={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const port=Number(process.env.PORT)||8080;
createServer(async(q,s)=>{
  let yol=normalize(decodeURIComponent(new URL(q.url,'http://x').pathname));
  if(yol.endsWith('/'))yol+='index.html';
  try{const d=await readFile(join(kok,yol));s.writeHead(200,{'content-type':tur[extname(yol)]||'application/octet-stream','cache-control':'no-store'});s.end(d)}
  catch(_){s.writeHead(404);s.end('yok')}
}).listen(port,()=>console.log('http://localhost:'+port));
