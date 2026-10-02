(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  const storage = {get(k){try{return sessionStorage.getItem(k);}catch{return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch{}}};
  let campaign = {};
  try { campaign = JSON.parse(storage.get('presale_campaign') || '{}'); } catch {}
  const params = new URLSearchParams(location.search);
  if (campaignKeys.some(k => params.has(k))) {
    campaign = Object.fromEntries(campaignKeys.filter(k=>params.has(k)).map(k=>[k,params.get(k).slice(0,200)]));
    storage.set('presale_campaign',JSON.stringify(campaign));
  }
  campaign = Object.fromEntries(campaignKeys.filter(k=>typeof campaign[k]==='string').map(k=>[k,campaign[k].slice(0,200)]));
  // Customer names, phone numbers, messages and form values never enter analytics.
  const track = (event,extra={}) => {
    if (typeof window.gtag==='function') window.gtag('event',event,{...campaign,...extra});
  };
  const gaId = config.contact?.ga4Id || '';
  if (/^G-[A-Z0-9]+$/.test(gaId)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(gaId);document.head.appendChild(tag);
    window.gtag('js',new Date());window.gtag('config',gaId);
  }
  for (const a of document.querySelectorAll('a[href]')) {
    const raw=a.getAttribute('href');
    if(!raw || /^(tel:|mailto:|#|https?:|\/\/)/i.test(raw)) continue;
    const url=new URL(raw,location.href);
    if(url.origin===location.origin && url.pathname.endsWith('.html')) {
      for(const [key,value] of Object.entries(campaign)) url.searchParams.set(key,value);
      a.href=url.href;
    }
  }
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    if(a.getAttribute('href')?.startsWith('tel:'))track('phone_click',{placement:a.dataset.placement || 'other'});
    else if(a.dataset.cta)track('cta_click',{placement:a.dataset.cta});
  });
  const menu=document.querySelector('#site-nav'),toggle=document.querySelector('.menu-toggle');
  const closeMenu=()=>{menu?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','메뉴 열기');};
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu?.classList.contains('open')){closeMenu();toggle.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  window.matchMedia('(min-width:1051px)').addEventListener('change',closeMenu);
  for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{
    const family=b.dataset.filter;
    for(const other of document.querySelectorAll('[data-filter]')){other.setAttribute('aria-pressed',String(other===b));other.classList.toggle('active',other===b);}
    for(const card of document.querySelectorAll('.plan-card'))card.hidden=family!=='all'&&card.dataset.family!==family;
    track('plan_filter',{family});
  });
  const tabs=[...document.querySelectorAll('[data-plan]')];
  if(tabs.length){
    const panels=[...document.querySelectorAll('.plan-panel')];
    document.querySelector('.plan-panels').classList.add('enhanced');
    const activate=(id,{push=false,focus=false}={})=>{
      const tab=tabs.find(t=>t.dataset.plan===id)||tabs[0],block=tab.dataset.blockName;
      for(const t of tabs){t.hidden=t.dataset.blockName!==block;t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;}
      for(const p of panels)p.hidden=p.id!=='plan-'+tab.dataset.plan;
      for(const b of document.querySelectorAll('[data-block]'))b.setAttribute('aria-pressed',String(b.dataset.block===block));
      if(push){history.pushState(null,'','#plan-'+tab.dataset.plan);track('plan_select',{type:tab.dataset.plan});}
      if(focus)tab.focus({preventScroll:true});
    };
    const fromHash=()=>activate(location.hash.replace(/^#plan-/,''));
    fromHash();window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);
    for(const t of tabs)t.addEventListener('click',()=>activate(t.dataset.plan,{push:true}));
    for(const b of document.querySelectorAll('[data-block]'))b.addEventListener('click',()=>activate(tabs.find(t=>t.dataset.blockName===b.dataset.block).dataset.plan,{push:true}));
    document.querySelector('.plan-tabs').addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      const visible=tabs.filter(t=>!t.hidden),index=visible.indexOf(document.activeElement);if(index<0)return;
      e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?visible.length-1:(index+(e.key==='ArrowRight'?1:-1)+visible.length)%visible.length;
      activate(visible[next].dataset.plan,{push:true,focus:true});
    });
  }
  const lightbox=document.querySelector('#lightbox');
  if(lightbox){
    let returnFocus;
    const view=lightbox.querySelector('.lightbox-view'),image=view.querySelector('img'),size=lightbox.querySelector('.lightbox-size');
    for(const b of document.querySelectorAll('.zoom-image'))b.addEventListener('click',()=>{
      returnFocus=b;image.src=b.dataset.image;image.alt=b.dataset.caption||'';document.querySelector('#lightbox-caption').textContent=image.alt;
      view.classList.remove('original');size.setAttribute('aria-pressed','false');size.textContent='원본 크기';lightbox.showModal();document.body.classList.add('modal-open');track('image_view',{image_name:b.dataset.image.split('/').pop()});
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
    lightbox.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus({preventScroll:true});});
    size.addEventListener('click',()=>{const original=view.classList.toggle('original');size.setAttribute('aria-pressed',String(original));size.textContent=original?'화면에 맞춤':'원본 크기';});
  }
  const popup=document.querySelector('#notice-popup');
  if(popup && config.popup?.enabled){
    const key='presale_popup_'+config.popup.id;let expiry=0;try{expiry=Number(localStorage.getItem(key)||0);}catch{}
    popup.querySelector('.popup-close').addEventListener('click',()=>popup.close());
    popup.querySelector('a').addEventListener('click',()=>popup.close());
    popup.querySelector('.popup-today').addEventListener('click',()=>{const now=new Date();now.setHours(24,0,0,0);try{localStorage.setItem(key,String(now.getTime()));}catch{}popup.close();});
    popup.addEventListener('close',()=>document.body.classList.remove('modal-open'));
    if(Date.now()>expiry){popup.showModal();document.body.classList.add('modal-open');track('popup_view',{popup_id:config.popup.id});}
  }
  const form=document.querySelector('#lead-form');
  if(!form)return;
  const status=document.querySelector('#form-status'),button=form.querySelector('[type=submit]'),endpoint=config.contact?.endpoint;
  if(endpoint){button.disabled=false;button.innerHTML='';button.textContent=config.contact.cta||'상담 신청하기';form.querySelector('.form-help').textContent='문의 남겨주시면 담당자가 확인 후 순차적으로 연락 드리겠습니다.';}
  let pending=false,attempt;
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(pending)return;
    if(!endpoint){status.textContent='온라인 접수 준비 중입니다. '+config.phone+'로 문의해 주세요.';return;}
    const f=form.elements,name=f.name.value.trim(),phone=f.phone.value.replace(/\D/g,''),message=f.message.value.trim();
    if(name.length<2||name.length>30||/[<>=]/.test(name)){status.textContent='이름을 2~30자로 입력해 주세요.';f.name.focus();return;}
    if(!/^0\d{8,10}$/.test(phone)){status.textContent='연락처를 확인해 주세요.';f.phone.focus();return;}
    if(!f.privacy_agree.checked){status.textContent='개인정보 수집·이용 동의가 필요합니다.';f.privacy_agree.focus();return;}
    if(!form.reportValidity())return;
    const data={name,phone,message,privacy_agree:true,website:f.website.value,interest_type:f.interest_type?.value||'',visit_date:f.visit_date?.value||''};
    const fingerprint=JSON.stringify(data);if(!attempt||attempt.fingerprint!==fingerprint)attempt={fingerprint,id:uuid()};
    pending=true;button.disabled=true;form.setAttribute('aria-busy','true');status.textContent='접수 중입니다. 잠시만 기다려 주세요.';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...data,...campaign,request_id:attempt.id,project:config.name,page_path:location.pathname}),credentials:'omit',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw new Error('NETWORK');
      const result=await response.json();
      if(result.ok!==true||result.request_id!==attempt.id)throw new Error('UNCONFIRMED');
      track('generate_lead',{form_name:'consultation'});track('lead_submit',{form_name:'consultation'});
      form.reset();attempt=null;status.textContent='상담 신청이 접수되었습니다. 담당자가 연락드리겠습니다.';
    }catch{
      status.textContent='접수 결과를 확인하지 못했습니다. 다시 신청하면 같은 접수번호로 확인합니다. 계속 문제가 있으면 '+config.phone+'로 문의해 주세요.';
    }finally{clearTimeout(timeout);pending=false;button.disabled=false;form.removeAttribute('aria-busy');}
  });
})();

