import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),site=JSON.parse(fs.readFileSync(path.join(root,'content/site.json'))),plans=JSON.parse(fs.readFileSync(path.join(root,'content/plans.json')));
const errors=[];
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push(file+': requires one H1');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(ids.length!==new Set(ids).size)errors.push(file+': duplicate IDs');
 for(const m of html.matchAll(/<(?:a|img|script|link)\b[^>]*\b(?:href|src)="([^"]+)"/g)){
  const url=m[1].replace(/&amp;/g,'&');if(/^(?:https?:|tel:|mailto:|#)/.test(url))continue;
  const [target,hash]=url.split('#');const local=target.split('?')[0];
  if(local&&!fs.existsSync(path.join(root,local)))errors.push(file+': missing '+local);
  if(hash&&local.endsWith('.html')&&fs.existsSync(path.join(root,local))&&!fs.readFileSync(path.join(root,local),'utf8').includes('id="'+hash+'"'))errors.push(file+': missing anchor '+url);
 }
 for(const m of html.matchAll(/<img\b[^>]*>/g))if(!/\balt="[^"]*"/.test(m[0]))errors.push(file+': missing alt');
 if(!html.includes('name="description"'))errors.push(file+': missing SEO description');
}
if(new Set(plans.map(p=>p.id)).size!==plans.length)errors.push('Duplicate plan IDs');
if(site.modules.terms&&!site.terms.items.length)errors.push('Terms module enabled without confirmed content');
if(site.popup.enabled&&(!site.popup.title||!site.popup.body))errors.push('Popup enabled without content');
if(site.domain&&!/^https:\/\//.test(site.domain))errors.push('Production domain must use HTTPS');
if(site.contact.ga4Id&&!/^G-[A-Z0-9]+$/.test(site.contact.ga4Id))errors.push('Invalid GA4 ID');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('All pages: links, assets, anchors, H1, alt, metadata and configuration passed.');

