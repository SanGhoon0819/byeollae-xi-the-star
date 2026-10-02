import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let relative;
  try { relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400);res.end();return;}
  const file = path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
  if (!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file) || !fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT||4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));

