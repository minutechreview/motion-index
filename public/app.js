import { ultraShapes } from './scenes-ultra.js';
import { scoutShapes } from './scenes-scout.js';
import { newChecker, sorter, SORTS } from './freshness.js';
import { createCommunity, compact } from './community.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = (strings, ...values) => strings.reduce((out, part, i) => out + part + (values[i] ?? ''), '');
const shapes = {
 'design-pack': '<div class="dp-board"><b>Make it</b><span>one brand</span></div>',
 turntable: '<div class="floor"></div><div class="bottle"><span>FORM<br><small>01 / DAILY</small></span></div><div class="plinth"></div>',
 money: '<div class="money-stack"><i></i><i></i><i></i><i></i><i></i><b>$</b></div><div class="scene-caption">BUILDING VALUE <b>+24%</b></div>',
 flip: '<div class="flip-card"><div class="flip-front">GOOD<br>THINGS<span>01 — OFFER</span></div><div class="flip-back">20%<small>OFF TODAY</small></div></div>',
 receipt: '<div class="paper-receipt"><b>THE RECEIPT</b><span>ITEM 01 <em>$ 24</em></span><span>ITEM 02 <em>$ 12</em></span><span>ITEM 03 <em>$ 08</em></span><strong>TOTAL <em>$ 44</em></strong></div>',
 iceberg: '<svg viewBox="0 0 220 140" role="presentation"><path class="waterline" d="M0 53 H220"/><path class="ice-top" d="M76 52 L101 8 L114 29 L128 15 L150 53 Z"/><path class="ice-bottom" d="M76 53 L150 53 L164 86 L117 132 L62 88 Z"/><path class="ice-lines" d="M101 8 L114 53 M128 15 L122 53 M76 53 L117 132 L150 53"/></svg><span class="micro top-left">THE VISIBLE</span><span class="micro bottom-right">THE REST ↓</span>',
 thread: '<div class="chat"><span class="bubble b1">What if we tried?</span><span class="bubble b2">Let’s make it happen.</span><span class="bubble b3"><i></i><i></i><i></i></span></div>',
 scale: '<div class="scale-line"><div><i></i><span>SMALL</span></div><div><i></i><span>MEDIUM</span></div><div><i></i><span>LARGE</span></div></div>',
 trophy: '<div class="trophy-wrap"><svg viewBox="0 0 100 100" role="presentation"><path d="M25 18 H75 V40 C75 58 64 69 50 69 C36 69 25 58 25 40 Z" fill="#e7bd62"/><path d="M26 25 H14 C14 45 22 50 30 50 M74 25 H86 C86 45 78 50 70 50" fill="none" stroke="#e7bd62" stroke-width="6"/><path d="M47 67 H53 V82 H64 V87 H36 V82 H47 Z" fill="#e7bd62"/></svg><b>100<span>K</span></b><small>A LITTLE MILESTONE</small></div>',
 donut: '<svg class="donut-svg" viewBox="0 0 120 120" role="presentation"><circle cx="60" cy="60" r="43" fill="none" stroke="#e3d9ca" stroke-width="16"/><circle class="donut-a" cx="60" cy="60" r="43" fill="none" stroke="#ee7862" stroke-width="16" stroke-dasharray="128 142"/><circle class="donut-b" cx="60" cy="60" r="43" fill="none" stroke="#313c72" stroke-width="16" stroke-dasharray="58 212" stroke-dashoffset="-128"/></svg><div class="donut-label"><b>100%</b><small>THE WHOLE</small></div>',
 globe: '<svg class="globe-svg" viewBox="0 0 140 140" role="presentation"><circle cx="70" cy="70" r="54"/><ellipse cx="70" cy="70" rx="24" ry="54"/><ellipse cx="70" cy="70" rx="54" ry="20"/><path d="M17 70 H123 M70 16 V124"/><path class="route-path" d="M30 89 Q57 5 112 46"/><circle class="route-dot" cx="30" cy="89" r="3"/><circle class="route-dot" cx="112" cy="46" r="3"/></svg>',
 laptop: '<div class="laptop"><div class="laptop-screen"><span>your next<br><b>big thing.</b></span><i>↗</i></div><div class="laptop-base"></div></div>',
 isometric: '<div class="iso-line"></div><div class="iso iso-a">01</div><div class="iso iso-b">02</div><div class="iso iso-c">03</div><span class="micro bottom-left">A → B → C</span>',
 notifications: '<div class="notif n1"><i></i><span><b>Someone new</b><small>just joined the list</small></span><em>now</em></div><div class="notif n2"><i></i><span><b>New milestone</b><small>1,000 people and counting</small></span><em>1m</em></div><div class="notif n3"><i></i><span><b>Good news</b><small>Your work is moving</small></span><em>2m</em></div>',
 'before-after': '<div class="compare-back"><span>AFTER</span><b>GOOD<br>IDEA.</b></div><div class="compare-front"><span>BEFORE</span><b>good<br>idea.</b></div><div class="compare-handle">↔</div>',
 ranking: '<div class="bars"><div><span>01</span><i></i><b>92</b></div><div><span>02</span><i></i><b>74</b></div><div><span>03</span><i></i><b>55</b></div><div><span>04</span><i></i><b>32</b></div></div>',
 social: '<div class="social-card"><div class="social-user"><i>✳</i><span><b>Creative people</b><small>@makingthings</small></span></div><strong>Good work deserves<br>to be seen.</strong><div class="social-stats">♡  2.4K <span>↗  814</span></div></div>',
 day: '<div class="day-card"><span>THE DAILY PRACTICE</span><b class="day-number"></b><small>DAY / 30</small><i></i></div>',
 versus: '<div class="versus-a">THIS</div><div class="versus-b">THAT</div><div class="versus-vs">VS</div>',
 route: '<div class="map-grid"></div><svg class="map-route" viewBox="0 0 200 140" role="presentation"><path d="M25 110 L60 110 L60 72 L115 72 L115 38 L168 38"/><circle cx="25" cy="110" r="5"/><circle cx="168" cy="38" r="7"/></svg><span class="micro bottom-right">THE WAY THERE ↗</span>',
 teardown: '<div class="layers"><i></i><i></i><i></i><i></i></div><span class="micro bottom-left">WHAT’S INSIDE / 04</span>',
 ink: '<div class="ink-cloud"></div><div class="ink-title">a little<br><em>closer.</em></div>',
 'paper-desk': '<div class="desk-paper paper-one"><small>NOTE / 01</small><b>Things<br>worth<br>making.</b></div><div class="desk-paper paper-two"><small>IN PROGRESS</small><div>✳</div><span>Ideas take shape.</span></div><i class="tape"></i>',
 headline: '<div class="headline-paper"><small>THE DAILY NOTE / 01</small><b>Make room<br>for <em>good ideas.</em></b><span>STORIES FOR CURIOUS PEOPLE</span></div>',
 chart: '<div class="chart-number"><small>THE BIG PICTURE</small><b>84<span>%</span></b><em>↑ A LITTLE HIGHER</em></div><div class="chart-bars"><i></i><i></i><i></i><i></i><i></i></div>',
 app: '<div class="phone"><div class="phone-top"></div><small>HELLO, YOU</small><b>Make today<br>count.</b><div class="app-blob">✳</div><span>LET’S GO ↗</span></div>',
 zoom: '<div class="desktop"><div class="desktop-top">● &nbsp; ● &nbsp; ●</div><div class="desktop-body"><i></i><i></i><i></i><b>Make something<br>great today.</b><span>GET STARTED →</span></div></div><div class="cursor">↖</div>',
 timeline: '<div class="timeline-line"></div><div class="timeline-points"><div><i></i><b>01</b><small>THE IDEA</small></div><div><i></i><b>02</b><small>THE WORK</small></div><div><i></i><b>03</b><small>THE WORLD</small></div></div>',
 orb: '<div class="orb-ring r1"></div><div class="orb-ring r2"></div><div class="glow-orb"></div><span class="orb-text">Take a breath.</span>',
 glass: '<div class="glass-blob gb1"></div><div class="glass-blob gb2"></div><div class="glass-panel"><span>✳</span><b>Good things<br>are coming.</b><i>→</i></div>',
 'one-take': '<div class="one-product"><i></i><b>01</b></div><span class="one-label">A LITTLE<br>MORE POSSIBLE.</span>',
 crt: '<div class="crt-frame"><small>INPUT / 001</small><b>GOOD<br>SIGNAL_</b><span>▓ ▓ ▓ ▓ ▓</span></div>',
 scope: '<div class="scope-grid"></div><svg class="scope-svg" viewBox="0 0 240 100" preserveAspectRatio="none" role="presentation"><path d="M0 50 C12 50 10 16 23 16 S35 83 48 83 S60 16 73 16 S85 83 98 83 S110 16 123 16 S135 83 148 83 S160 16 173 16 S185 83 198 83 S210 16 223 16 S235 50 240 50"/></svg><span class="micro top-left">SIGNAL / 01</span>',
 magazine: '<div class="mag-spread"><small>THE CREATIVE EDIT</small><b>On making<br><em>things.</em></b><i></i><span>A NOTE<br>TO SELF ↗</span></div>',
 blue: '<div class="blue-type"><small>ISSUE NO. 01</small><b>MAKE<br><em>IT</em> MOVE.</b><span>THE CREATIVE EDIT / 2026</span></div>',
 riso: '<div class="riso-grid"><i></i><i></i><i></i><i></i></div><span class="micro bottom-left">HAPPY ACCIDENTS / 01</span>',
 swiss: '<div class="swiss-grid"><small>DESIGN / IN MOTION</small><b>FORM<br>FOLLOWS<br>FEELING.</b><i></i><span>01 — 04 / STUDIES IN MOVEMENT</span></div>',
 blueprint: '<div class="blueprint-grid"></div><svg class="blueprint-svg" viewBox="0 0 200 150" role="presentation"><rect x="60" y="25" width="80" height="90" rx="8"/><circle cx="100" cy="69" r="25"/><circle cx="100" cy="69" r="15"/><path d="M45 20 V120 M42 20 H48 M42 120 H48 M55 130 H145 M55 126 V134 M145 126 V134"/></svg><span class="micro bottom-right">FIG. 01 / 1:1</span>',
 kinetic: '<div class="kinetic-type"><span>MAKE</span><span>IT</span><span>MOVE.</span></div><div class="kinetic-bar"></div>',
 scramble: '<div class="scramble"><small>DECODE / 001</small><b class="decode"></b><div><i></i></div><span>PROCESSING SIGNAL</span></div>',
 'line-draw': '<svg class="line-logo" viewBox="0 0 100 100" role="presentation"><path d="M50 12 L82 32 V68 L50 88 L18 68 V32 Z M28 64 L50 27 L72 64 Z"/></svg><span class="line-word">FORM / STUDIO</span>',
 liquid: '<div class="liquid-shape"></div><span class="micro bottom-left">FORM / IN FLUX</span>',
 bauhaus: '<div class="bauhaus-grid"><i></i><i></i><i></i><i></i></div><span class="micro bottom-right">GEOMETRY / 04</span>',
 splitflap: '<div class="flap-label">NOW DEPARTING</div><div class="flaps"><b>M</b><b>O</b><b>V</b><b>E</b></div><div class="flap-footer">CREATIVE DESTINATION / 01</div>',
 marquee: '<div class="marquee-strip ms1"><span>MAKE IT MOVE ✳ MAKE IT MOVE ✳ MAKE IT MOVE ✳ </span></div><div class="marquee-strip ms2"><span>GOOD IDEAS → GOOD IDEAS → GOOD IDEAS → </span></div><b class="marquee-center">NOW.</b>',
 particles: '<div class="particle-mark">✳</div><div class="particle-field">✧ · . ✦ · . ✧ · ✦ . · ✧ . ✦ · ✧ . · ✦</div><span class="micro bottom-left">GATHER / RELEASE</span>',
 accordion: '<div class="accordion"><i>F</i><i>O</i><i>R</i><i>M</i></div><span class="micro bottom-left">PAPER STUDY / 01</span>',
 magnifier: '<div class="mag-word">IDEAS</div><div class="lens"><span>IDEAS</span></div><span class="micro bottom-right">LOOK CLOSER ↗</span>',
 flow: '<div class="flow-lines"></div><b class="flow-type">FLOW</b><span class="micro bottom-left">GENERATIVE / 01</span>',
 watercolor: '<div class="wash w1"></div><div class="wash w2"></div><div class="wash w3"></div><b class="wash-type">a softer<br>kind of story.</b>',
 ...ultraShapes,
 ...scoutShapes
};
let isNew = () => false, sortMode = 'recommended';
const community = createCommunity({ onChange: id => refreshCounts(id), onNotice: message => showToast(message) });
const likeCount = id => community.state.likes[id] ?? 0;
const copiesLabel = id => { const n = community.state.copies[id] ?? 0; return n ? ` · ${compact(n)} ${n === 1 ? 'copy' : 'copies'}` : ''; };
const likeButton = e => `<button class="like-btn" data-like="${e.id}" aria-pressed="${community.state.liked.has(e.id)}" aria-label="Like ${escapeText(e.title)}"><span class="heart" aria-hidden="true">♥</span><span class="like-count">${compact(likeCount(e.id))}</span></button>`;
let entries = [], category = 'All', query = '', paused = false, selected = null, observer = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const grid = $('#grid'), detailDialog = $('#detail-dialog'), skillDialog = $('#skill-dialog'), submitDialog = $('#submit-dialog');
const scene = entry => entry.demo
 ? `<div class="scene scene-video" aria-hidden="true">${reducedMotion.matches ? `<img src="${escapeText(entry.poster)}" alt="">` : `<video muted loop playsinline preload="none" poster="${escapeText(entry.poster)}" src="${escapeText(entry.demo)}"></video>`}</div>`
 : `<div class="scene scene-${entry.id}" aria-hidden="true">${shapes[entry.id] ?? ''}</div>`;
const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function updateFilters() {
 const newCount=entries.filter(isNew).length;
 const communityCount=entries.filter(e=>e.community).length;
 const names=['All',...(newCount?['New']:[]),...(communityCount?['Community']:[]),'Product','Type','Data','Editorial','Illustration','Interface','Abstract','3D'];
 $('#filters').innerHTML=names.map(name=>{const count=name==='All'?entries.length:name==='New'?newCount:name==='Community'?communityCount:entries.filter(e=>e.category===name).length; return `<button class="filter ${category===name?'active':''}" data-category="${name}" aria-pressed="${category===name}">${name}<span>${count}</span></button>`}).join('');
}
function render() {
 if((category==='New'&&!entries.some(isNew))||(category==='Community'&&!entries.some(e=>e.community)))category='All';
 const filtered=entries.filter(e=>(category==='All'||(category==='New'?isNew(e):category==='Community'?Boolean(e.community):e.category===category))&&`${e.title} ${e.category} ${e.description} ${e.use} ${e.look} ${e.source.author} ${e.source.project}`.toLowerCase().includes(query));
 filtered.sort(sorter(sortMode, isNew, community.state));
 $$('.tile video',grid).forEach(video=>video.pause());
 grid.innerHTML=filtered.map(e=>`<article class="tile" id="style-${escapeText(e.id)}"><button class="tile-open" data-id="${e.id}" aria-label="Open ${escapeText(e.title)} and copy its prompt, reference by ${escapeText(e.source.author)}"></button>${isNew(e)?'<span class="new-badge">New</span>':''}${scene(e)}<div class="tile-info"><div><span class="tile-index">${String(e.index).padStart(2,'0')} / ${escapeText(e.category.toUpperCase())}</span><h3>${escapeText(e.title)}</h3><p>${escapeText(e.description)}</p><div class="tile-credit">${creditLine(e)}<span class="tile-copies" data-copies="${e.id}">${copiesLabel(e.id)}</span></div></div><span class="tile-arrow" aria-hidden="true">↗</span></div>${likeButton(e)}</article>`).join('');
 $('#result-count').textContent=`${filtered.length} ${filtered.length===1?'STYLE':'STYLES'} ${category==='All'?'IN THE COLLECTION':'IN '+category.toUpperCase()}`;
 $('#empty').hidden=filtered.length!==0;
 updateFilters();
 if (observer) observer.disconnect();
 if ('IntersectionObserver' in window) {
   observer = new IntersectionObserver(items => {items.forEach(item => {item.target.classList.toggle('offscreen', !item.isIntersecting);item.target.dataset.inView=String(item.isIntersecting);});syncVideos();});
   $$('.tile').forEach(tile => observer.observe(tile));
 } else { $$('.tile').forEach(tile=>tile.dataset.inView='true');syncVideos(); }
}
function syncVideos() {
 const blocked=paused||reducedMotion.matches||document.hidden;
 $$('.tile video',grid).forEach(video=>{
   const shouldPlay=!blocked&&!detailDialog.open&&video.closest('.tile').dataset.inView==='true';
   if(shouldPlay){if(video.paused)video.play().catch(()=>{});}else if(!video.paused)video.pause();
 });
 const detailVideo=$('video',$('#detail-preview'));
 if(detailVideo){if(!blocked&&detailDialog.open){if(detailVideo.paused)detailVideo.play().catch(()=>{});}else if(!detailVideo.paused)detailVideo.pause();}
}
function renderCredits(sources) {
 $('#credit-list').innerHTML=sources.map((source,index)=>{
   const count=entries.filter(entry=>entry.source.id===source.id).length;
   return `<a class="credit-card" href="${escapeText(source.url)}" target="_blank" rel="noopener noreferrer"><b>${escapeText(source.author)}</b><span>${escapeText(source.project)}</span><em>${count} ${count===1?'style':'styles'} ↗</em></a>`;
 }).join('');
}
async function copyText(value) {
 try { await navigator.clipboard.writeText(value); return true; } catch {
   const area=document.createElement('textarea'); area.value=value; area.style.cssText='position:fixed;top:-9999px;left:-9999px'; document.body.append(area); area.focus(); area.select(); let ok=false; try {ok=document.execCommand('copy')} catch {} area.remove(); return ok;
 }
}
function openDialog(dialog) { if (!dialog.open) dialog.showModal(); }
function showToast(message) { const toast=$('#toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2400); }
async function openEntry(entry) {
 selected=entry;
 $('#detail-kicker').textContent=`STYLE / ${String(entry.index).padStart(2,'0')}`;
 $('#detail-category').textContent=entry.category.toUpperCase();
 $('#detail-title').textContent=entry.title;
 $('#detail-description').textContent=entry.description;
 $('#detail-use').textContent=entry.use;
 $('#detail-prompt').textContent=entry.prompt;
 $('#detail-source').textContent=entry.source.name;
 $('#detail-source').href=entry.source.url;
 $('#detail-preview').innerHTML=scene(entry);
 refreshDetail();
 openDialog(detailDialog);
 syncVideos();
 const copied=await copyText(entry.prompt);
 $('#copy-status').textContent=copied?'Prompt copied to your clipboard.':'Copy the prompt below or use the copy button.';
 if(copied){showToast('Prompt copied to clipboard');void community.recordCopy(entry.id);}
}
function skillText() {
 const base=location.origin;
 return `---\nname: motion-index\ndescription: Find and adapt animation and motion-graphics references from Motion Index when a user asks for a visual style, an animated explainer, a title sequence, product animation, or interface motion.\n---\n\n# Motion Index\n\nUse the visual library at ${base}/ and its machine-readable catalog at ${base}/catalog.json.\n\n## Workflow\n1. Inspect the project and the user’s brief: medium, audience, tone, aspect ratio, duration, content, and existing animation stack. Reuse project conventions and assets.\n2. Read the catalog and shortlist two or three styles by category, use case, visual direction, and motion. Open the library to inspect the live preview and follow each source link for original context. The previews are interpretations, not copies of the source demos.\n3. When the user has named a style, use that entry’s prompt as a starting point and replace its placeholder with the actual brief. Otherwise recommend suitable options and choose in line with the user’s instructions. Preserve the defining composition, palette, pacing, and movement; create original assets rather than copying protected artwork.\n4. Implement a working, editable example in the project’s existing stack. For video, render deterministically at the requested dimensions, duration, and frame rate. For the web, support responsive sizing, keyboard interaction, and prefers-reduced-motion.\n5. Preview the real result, fix visual and functional defects, and report the chosen style, source, files changed, verification, and limitations.\n\n## Prompt essentials\nSpecify subject and copy, composition, palette, visual treatment, timing, easing, transitions, format, and what to avoid. Favor intentional movement, readable holds, and clean handoffs over decorative motion.\n\n## Attribution\nInclude the credited creator or publisher and the original reference URL when presenting or sharing a style. Use the names published in the catalog, and do not invent individual attribution where only a team is identified. Never claim a locally recreated interpretation is the creator’s original demo.\n`;
}
$('#filters').addEventListener('click', event=>{const button=event.target.closest('[data-category]');if(!button)return;category=button.dataset.category;render();document.querySelector(`[data-category="${category}"]`)?.focus({preventScroll:true});});
$('#search').addEventListener('input',event=>{query=event.target.value.trim().toLowerCase();render();});
$('#clear-filters').addEventListener('click',()=>{category='All';query='';$('#search').value='';render();});
grid.addEventListener('click',event=>{const like=event.target.closest('[data-like]');if(like){void community.toggleLike(like.dataset.like);return;}const button=event.target.closest('[data-id]');if(button){const entry=entries.find(e=>e.id===button.dataset.id);if(entry)void openEntry(entry);}});
$('#detail-link').addEventListener('click',async()=>{if(!selected)return;const ok=await copyText(`${location.origin}/#style-${selected.id}`);if(ok)showToast('Link copied');});
$('#detail-copy').addEventListener('click',async()=>{if(!selected)return;const ok=await copyText(selected.prompt);$('#copy-status').textContent=ok?'Prompt copied to your clipboard.':'Could not copy automatically; select the prompt text.';if(ok){showToast('Prompt copied to clipboard');void community.recordCopy(selected.id);}});
$('#pause').addEventListener('click',()=>{paused=!paused;document.body.classList.toggle('paused',paused);$('#pause').setAttribute('aria-pressed',String(paused));$('#pause').title=paused?'Play previews':'Pause previews';$('#pause-icon').textContent=paused?'▶':'Ⅱ';$('#pause .sr-only').textContent=paused?'Play previews':'Pause previews';syncVideos();});
detailDialog.addEventListener('close',syncVideos);
document.addEventListener('visibilitychange',syncVideos);
reducedMotion.addEventListener('change',()=>{render();if(detailDialog.open&&selected){$('#detail-preview').innerHTML=scene(selected);syncVideos();}});
$('#skill-open').addEventListener('click',()=>{$('#skill-text').textContent=skillText();$('#skill-status').textContent='';openDialog(skillDialog);});
$('#skill-copy').addEventListener('click',async()=>{const ok=await copyText(skillText());$('#skill-status').textContent=ok?'Skill copied. Save it as SKILL.md in your agent’s skills folder.':'Select the skill text below to copy it.';if(ok)showToast('Skill copied to clipboard');});
$('#skill-download').addEventListener('click',()=>{const blob=new Blob([skillText()],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SKILL.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
for(const id of ['submit-open','submit-bottom'])$('#'+id).addEventListener('click',()=>{openDialog(submitDialog);});
$$('dialog .close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
$('#submit-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;const status=$('#form-status');const button=$('#send-submission');button.disabled=true;status.textContent='Sending your suggestion…';try{const data=Object.fromEntries(new FormData(form));const response=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not send. Please try again.');status.textContent='Thank you! Your suggestion was received for review.';form.reset();}catch(error){status.textContent=error.message||'Could not send. Please try again.';}finally{button.disabled=false;}});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();$('#search').focus();}});
try {const response=await fetch('/catalog.json');if(!response.ok)throw new Error('Catalog unavailable');const data=await response.json();entries=data.entries;isNew=newChecker(data);renderCredits(data.sources);render();void community.load();const anchor=location.hash.slice(1);if(anchor==='credits'||/^style-[a-z0-9-]+$/.test(anchor))requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));}catch{$('#result-count').textContent='The collection could not load. Please refresh.';}

function creditLine(e) {
  return e.community ? `BY ${escapeText(e.community.name)}` : `REFERENCE · ${escapeText(e.source.author)}`;
}
function refreshDetail() {
  const box = $('#detail-stats');
  if (!box || !selected) return;
  box.hidden = !community.state.available;
  const like = $('#detail-like');
  like.dataset.like = selected.id;
  like.setAttribute('aria-pressed', String(community.state.liked.has(selected.id)));
  like.setAttribute('aria-label', `Like ${selected.title}`);
  $('.like-count', like).textContent = compact(likeCount(selected.id));
  const copies = community.state.copies[selected.id] ?? 0;
  $('#detail-copies').textContent = copies ? `${compact(copies)} ${copies === 1 ? 'copy' : 'copies'}` : 'Be the first to use it';
}
// Update counts in place; the grid only reorders when the person changes the view.
function refreshCounts(id) {
  document.body.classList.toggle('has-stats', community.state.available);
  for (const option of $$('#sort [data-needs-stats]')) option.disabled = !community.state.available;
  const ids = id ? [id] : entries.map(e => e.id);
  for (const styleId of ids) {
    for (const btn of $$(`[data-like="${styleId}"]`, grid)) {
      btn.setAttribute('aria-pressed', String(community.state.liked.has(styleId)));
      $('.like-count', btn).textContent = compact(likeCount(styleId));
    }
    const copies = $(`[data-copies="${styleId}"]`, grid);
    if (copies) copies.textContent = copiesLabel(styleId);
  }
  refreshDetail();
  if (!id && sortMode !== 'az' && sortMode !== 'newest') render();
}
$('#detail-like')?.addEventListener('click', () => { if (selected) void community.toggleLike(selected.id); });
$('#sort')?.addEventListener('change', event => { sortMode = SORTS.includes(event.target.value) ? event.target.value : 'recommended'; render(); });
