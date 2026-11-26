/* =====================================================================
   INFORME ANUAL DE GESTIÓN · plantilla de prueba
   1. Carga datos/datos.json (todo el contenido está ahí).
   2. route() lee el # de la dirección (#resumen, #mes-4, #eje-salud…)
      y llama a la función que dibuja esa vista.
   3. Cada vista es una función render*() que arma HTML con los datos.
   Para agregar una sección: un enlace en el <nav> de index.html,
   un caso en route() y una función render nueva.
   ===================================================================== */
(async function(){
let DATA;
try{
  const r=await fetch('datos/datos.json',{cache:'no-store'});
  if(!r.ok)throw new Error(r.status);
  DATA=await r.json();
}catch(e){
  document.getElementById('view').innerHTML='<div class="card"><h2>No se pudieron cargar los datos</h2><p class="muted">Revisa que exista <code>datos/datos.json</code> y que su formato sea JSON válido. Si abriste el archivo con doble clic, usa un servidor local (ver README).</p></div>';
  return;
}

/* ---------------- utilidades ---------------- */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function mesInfo(n){const [y0,m0]=DATA.meta.inicio;const t=(m0-1)+(n-1);return {y:y0+Math.floor(t/12),m:t%12,nom:MESES[t%12]}}
const mesLabel=n=>{const i=mesInfo(n);return cap(i.nom)+' '+i.y};
const EJE=Object.fromEntries(DATA.ejes.map(e=>[e.id,e]));
const COMP=Object.fromEntries(DATA.compromisos.map(c=>[c.id,c]));
const ESTADOS={cumplido:'Cumplido',ejecucion:'En ejecución',retrasado:'Retrasado',sin:'Sin iniciar'};
const ESTCOL={cumplido:'var(--ok)',ejecucion:'var(--accent)',retrasado:'var(--bad)',sin:'var(--idle)'};
const fmt=(v,d)=>Number(v).toLocaleString('es-EC',{minimumFractionDigits:d,maximumFractionDigits:d});
const pill=e=>`<span class="pill st-${e}">${ESTADOS[e]}</span>`;
const chip=id=>`<span class="chip" style="--ec:${EJE[id].c}">${esc(EJE[id].n)}</span>`;
const bar=p=>`<div class="bar" role="img" aria-label="${p} % de avance"><span style="width:${p}%"></span></div>`;
const view=$('view');
let ui={fEje:'todos',fEst:'todos'};   // estado de filtros (en memoria, no en el hash)

/* ---------------- piezas reutilizables ---------------- */
function stackEstados(list){
  const n=list.length,cnt=k=>list.filter(c=>c.estado===k).length;
  return `<div class="stack" role="img" aria-label="Distribución de compromisos por estado">${Object.keys(ESTADOS).map(k=>`<span style="width:${100*cnt(k)/n}%;background:${ESTCOL[k]}"></span>`).join('')}</div>
  <div class="legend">${Object.keys(ESTADOS).map(k=>`<span><i style="background:${ESTCOL[k]}"></i>${ESTADOS[k]} <b class="num">${cnt(k)}</b></span>`).join('')}</div>`;
}
function hitoHTML(h,showMes){
  const i=mesInfo(h.mes);
  return `<li class="card hito"><div class="d"><b class="num">${h.dia}</b><small>${i.nom.slice(0,3)}${showMes?' '+String(i.y).slice(2):''}</small></div>
  <div><div class="tags">${chip(h.eje)}<span class="tipo">${esc(h.tipo)}</span></div><h3>${esc(h.t)}</h3><p>${esc(h.x)}</p>
  ${h.c?`<button class="linkbtn" data-comp="${h.c}" type="button">Compromiso ${h.c}: ${esc(COMP[h.c].t)}</button>`:''}</div></li>`;
}
function spark(ind,hasta){
  const W=300,H=86,P=6,s=ind.serie.slice(0,hasta||12),all=[...ind.serie,ind.meta];
  const lo=Math.min(...all),hi=Math.max(...all),pad=(hi-lo)*.12||1,a=lo-pad,b=hi+pad;
  const x=i=>P+i*(W-2*P)/11,y=v=>H-P-(v-a)/(b-a)*(H-2*P);
  const pts=s.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last=s.length-1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Serie mensual de ${esc(ind.n)}">
   ${[.25,.5,.75].map(f=>`<line x1="${P}" x2="${W-P}" y1="${P+f*(H-2*P)}" y2="${P+f*(H-2*P)}" stroke="var(--line)"/>`).join('')}
   <line x1="${P}" x2="${W-P}" y1="${y(ind.meta)}" y2="${y(ind.meta)}" stroke="var(--ok)" stroke-dasharray="4 4"/>
   <polygon class="area" points="${x(0)},${H-P} ${pts} ${x(last)},${H-P}" fill="var(--accent)" opacity=".10"/>
   <polyline class="linea" pathLength="1" points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
   <circle class="punto" cx="${x(last)}" cy="${y(s[last])}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></svg>`;
}
function indCard(ind){
  const s=ind.serie,v0=s[0],v=s[11],d=v-v0,bien=(ind.mejor==='baja')?d<0:d>0;
  return `<article class="card ind"><div class="tags">${chip(ind.eje)}</div><h3>${esc(ind.n)}</h3>
   <div class="now"><b class="num">${fmt(v,ind.dec)}</b><span class="muted">${esc(ind.u)}</span></div>
   <div class="num" style="font-size:14px;color:${bien?'var(--ok)':'var(--bad)'}">${d>0?'+':''}${fmt(d,ind.dec)} desde ${mesInfo(1).nom} ${mesInfo(1).y}</div>
   ${spark(ind)}
   <div class="foot"><span>${cap(mesInfo(1).nom.slice(0,3))}: <span class="num">${fmt(v0,ind.dec)}</span></span><span style="color:var(--ok)">Meta: <span class="num">${fmt(ind.meta,ind.dec)}</span></span><span>${cap(mesInfo(12).nom.slice(0,3))}: <span class="num">${fmt(v,ind.dec)}</span></span></div></article>`;
}

/* ---------------- vistas ---------------- */
function renderResumen(){
  const C=DATA.compromisos,H=DATA.hitos;
  const cumpl=C.filter(c=>c.estado==='cumplido').length;
  const avg=Math.round(C.reduce((s,c)=>s+c.av,0)/C.length);
  const norm=H.filter(h=>h.tipo==='Normativa').length;
  const recientes=[...H].sort((a,b)=>b.mes-a.mes||b.dia-a.dia).slice(0,4);
  view.innerHTML=`
  <div class="pagehead"><span class="eyebrow">${esc(DATA.meta.periodo)} · ${mesLabel(1)} a ${mesLabel(12)}</span>
   <h1>Un año de gestión en cifras, hitos y compromisos</h1>
   <p class="lead">Este informe recorre los doce meses del primer año de gobierno: qué se prometió, qué se hizo y cómo cambiaron los indicadores principales. Cada dato enlaza a su compromiso y a su fuente.</p></div>
  <section class="grid g4">
   <div class="card kpi"><div class="v num" data-count="${C.length}">${C.length}</div><div class="l">compromisos de gobierno en seguimiento</div></div>
   <div class="card kpi"><div class="v num" data-count="${cumpl}">${cumpl}</div><div class="l">compromisos cumplidos al ${esc(DATA.meta.corte)}</div></div>
   <div class="card kpi"><div class="v num" data-count="${avg}" data-suf=" %">${avg} %</div><div class="l">avance promedio del conjunto</div></div>
   <div class="card kpi"><div class="v num" data-count="${H.length}">${H.length}</div><div class="l">hitos registrados, ${norm} de ellos normativos</div></div>
  </section>
  <section><div class="sechead"><h2>Estado de los compromisos</h2><a href="#compromisos">Ver todos</a></div><div class="card">${stackEstados(C)}</div></section>
  <section><div class="sechead"><h2>Avance por eje</h2><a href="#ejes">Ver ejes</a></div>
   <div class="grid g3">${DATA.ejes.map(e=>{const L=C.filter(c=>c.eje===e.id),p=Math.round(L.reduce((s,c)=>s+c.av,0)/L.length);
    return `<a class="card eje" href="#eje-${e.id}" style="--ec:${e.c}"><h3>${esc(e.n)}</h3>${bar(p)}<div class="meta"><span>${L.length} compromisos</span><span class="num">${p} % de avance</span></div></a>`}).join('')}</div></section>
  <section><div class="sechead"><h2>Últimos hitos</h2><a href="#mes-12">Ir a ${mesLabel(12)}</a></div><ul class="hitos">${recientes.map(h=>hitoHTML(h,true)).join('')}</ul></section>`;
}

function renderMes(n){
  const H=DATA.hitos.filter(h=>h.mes===n).sort((a,b)=>a.dia-b.dia);
  view.innerHTML=`
  <div class="pagehead"><span class="eyebrow">Mes ${n} de 12</span><h1>${mesLabel(n)}</h1>
   <div class="monthnav">
    <a class="btn" href="#mes-${n-1}" aria-disabled="${n===1}">← ${n>1?cap(mesInfo(n-1).nom):'Anterior'}</a>
    <a class="btn" href="#mes-${n+1}" aria-disabled="${n===12}">${n<12?cap(mesInfo(n+1).nom):'Siguiente'} →</a>
    <span class="kbd">También con las flechas ← → del teclado</span></div></div>
  <div class="split">
   <section><div class="sechead"><h2>Hitos del mes</h2><span class="muted num">${H.length} registrados</span></div>
    ${H.length?`<ul class="hitos">${H.map(h=>hitoHTML(h)).join('')}</ul>`:'<p class="card muted">No hay hitos registrados este mes.</p>'}</section>
   <aside class="card"><h3 style="margin-bottom:12px">Indicadores al cierre de ${mesInfo(n).nom}</h3>
    <dl class="mini">${DATA.indicadores.map(i=>`<dt>${esc(i.n)}</dt><dd class="num">${fmt(i.serie[n-1],i.dec)} <span class="muted" style="font-weight:400">${esc(i.u)}</span></dd>`).join('')}</dl>
    <p class="src">Valores mensuales. <a href="#indicadores">Ver series completas</a></p></aside>
  </div>`;
}

function renderEjes(){
  view.innerHTML=`<div class="pagehead"><span class="eyebrow">Ejes de gobierno</span><h1>Cinco ejes organizan el plan de gobierno</h1>
   <p class="lead">Cada eje agrupa compromisos, indicadores e hitos. Entra a uno para ver su recorrido durante el año.</p></div>
   <div class="grid g2">${DATA.ejes.map(e=>{const L=DATA.compromisos.filter(c=>c.eje===e.id),p=Math.round(L.reduce((s,c)=>s+c.av,0)/L.length);
    return `<a class="card eje" href="#eje-${e.id}" style="--ec:${e.c}"><h2 style="font-size:21px">${esc(e.n)}</h2><p class="muted" style="margin:0">${esc(e.obj)}</p>${bar(p)}
     <div class="meta"><span>${L.length} compromisos · ${DATA.hitos.filter(h=>h.eje===e.id).length} hitos</span><span class="num">${p} %</span></div></a>`}).join('')}</div>`;
}

function renderEje(id){
  const e=EJE[id],L=DATA.compromisos.filter(c=>c.eje===id),I=DATA.indicadores.filter(i=>i.eje===id),H=DATA.hitos.filter(h=>h.eje===id).sort((a,b)=>a.mes-b.mes||a.dia-b.dia);
  view.innerHTML=`<div class="pagehead"><span class="eyebrow"><a href="#ejes">Ejes de gobierno</a> / ${esc(e.n)}</span><h1>${esc(e.n)}</h1><p class="lead">${esc(e.obj)}</p></div>
  <section><div class="sechead"><h2>Compromisos</h2></div><div class="card">${stackEstados(L)}</div>
   <div class="grid g3" style="margin-top:14px">${L.map(c=>`<div class="card" style="display:grid;gap:8px"><div class="tags" style="display:flex;justify-content:space-between;gap:8px"><span class="muted num">${c.id}</span>${pill(c.estado)}</div>
    <button class="linkbtn" data-comp="${c.id}" type="button" style="text-align:left;font-size:16px;color:var(--ink);text-decoration:none;font-weight:600">${esc(c.t)}</button>${bar(c.av)}<span class="muted num" style="font-size:14px">${c.av} % · plazo ${esc(c.plazo)}</span></div>`).join('')}</div></section>
  ${I.length?`<section><div class="sechead"><h2>Indicadores</h2></div><div class="grid g2">${I.map(indCard).join('')}</div></section>`:''}
  <section><div class="sechead"><h2>Recorrido del año</h2><span class="muted">${H.length} hitos</span></div><ul class="hitos">${H.map(h=>hitoHTML(h,true)).join('')}</ul></section>`;
}

function renderCompromisos(){
  const L=DATA.compromisos.filter(c=>(ui.fEje==='todos'||c.eje===ui.fEje)&&(ui.fEst==='todos'||c.estado===ui.fEst));
  view.innerHTML=`<div class="pagehead"><span class="eyebrow">Seguimiento</span><h1>Compromisos de gobierno</h1>
   <p class="lead">Cada compromiso tiene una meta verificable, un plazo y una entidad responsable. Selecciona uno para ver sus hitos y su fuente.</p></div>
  <div class="filters">
   <label for="fEje">Eje<select id="fEje"><option value="todos">Todos los ejes</option>${DATA.ejes.map(e=>`<option value="${e.id}"${ui.fEje===e.id?' selected':''}>${esc(e.n)}</option>`).join('')}</select></label>
   <label for="fEst">Estado<select id="fEst"><option value="todos">Todos los estados</option>${Object.entries(ESTADOS).map(([k,v])=>`<option value="${k}"${ui.fEst===k?' selected':''}>${v}</option>`).join('')}</select></label>
  </div>
  <div class="tablewrap"><table><thead><tr><th>N.º</th><th>Compromiso</th><th>Eje</th><th>Estado</th><th>Avance</th><th>Plazo</th></tr></thead><tbody>
   ${L.map(c=>`<tr><td class="num muted">${c.id}</td><td><button class="linkbtn" data-comp="${c.id}" type="button">${esc(c.t)}</button></td><td>${chip(c.eje)}</td><td>${pill(c.estado)}</td>
    <td><div class="pct"><span class="num">${c.av} %</span>${bar(c.av)}</div></td><td class="num">${esc(c.plazo)}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">Ningún compromiso coincide con los filtros.</td></tr>'}
  </tbody></table></div>`;
  $('fEje').onchange=ev=>{ui.fEje=ev.target.value;renderCompromisos()};
  $('fEst').onchange=ev=>{ui.fEst=ev.target.value;renderCompromisos()};
}

function renderIndicadores(){
  view.innerHTML=`<div class="pagehead"><span class="eyebrow">Indicadores</span><h1>Cómo cambiaron los indicadores en el año</h1>
   <p class="lead">Serie mensual de ${mesLabel(1)} a ${mesLabel(12)}. La línea punteada verde marca la meta del compromiso asociado.</p></div>
   <div class="grid g3">${DATA.indicadores.map(indCard).join('')}</div>`;
}

function renderMetodologia(){
  view.innerHTML=`<div class="pagehead"><span class="eyebrow">Metodología y fuentes</span><h1>Cómo se construye este informe</h1></div>
  <div class="prose">
   <h2>Estados de los compromisos</h2>
   <ul>
    <li>${pill('cumplido')} La meta se alcanzó y existe un documento que lo verifica.</li>
    <li>${pill('ejecucion')} Hay acciones en curso y el avance va acorde al plazo.</li>
    <li>${pill('retrasado')} El avance está por debajo de lo previsto para la fecha de corte.</li>
    <li>${pill('sin')} No se registran acciones verificables.</li>
   </ul>
   <h2>Avance</h2><p>El porcentaje de avance compara lo logrado con la meta cuantitativa del compromiso. Cuando la meta no es cuantitativa, se usan hitos intermedios definidos de antemano.</p>
   <h2>Fuentes</h2><p>Cada compromiso, hito e indicador debe citar un documento oficial: Registro Oficial, informes de ejecución presupuestaria, estadísticas oficiales o reportes de las entidades responsables. Fecha de corte: ${esc(DATA.meta.corte)}.</p>
   <p><b>Importante:</b> todas las cifras de este esqueleto son de ejemplo y no describen a ningún gobierno real.</p>
  </div>`;
}

/* ---------------- panel de compromiso ---------------- */
let lastFocus=null;
function openComp(id){
  const c=COMP[id];if(!c)return;lastFocus=document.activeElement;
  const H=DATA.hitos.filter(h=>h.c===id).sort((a,b)=>a.mes-b.mes||a.dia-b.dia);
  const p=$('panel');
  p.innerHTML=`<button class="x" id="pClose" type="button" aria-label="Cerrar">×</button>
   <div style="display:grid;gap:8px"><span class="muted num">${c.id}</span><h2 id="pTitle">${esc(c.t)}</h2><div style="display:flex;gap:10px;flex-wrap:wrap">${chip(c.eje)}${pill(c.estado)}</div></div>
   <div>${bar(c.av)}<span class="num muted" style="font-size:14px">${c.av} % de avance</span></div>
   <dl><dt>Meta</dt><dd>${esc(c.meta)}</dd><dt>Plazo</dt><dd>${esc(c.plazo)}</dd><dt>Responsable</dt><dd>${esc(c.resp)}</dd></dl>
   <div><h3 style="margin-bottom:8px">Hitos relacionados</h3>${H.length?`<ul style="margin:0;padding-left:18px;display:grid;gap:6px">${H.map(h=>`<li><a href="#mes-${h.mes}">${h.dia} de ${mesInfo(h.mes).nom} ${mesInfo(h.mes).y}</a>: ${esc(h.t)}</li>`).join('')}</ul>`:'<p class="muted" style="margin:0">Sin hitos registrados.</p>'}</div>
   <p class="src">Fuente: ${esc(DATA.meta.fuenteGeneral)}</p>`;
  p.hidden=false;$('scrim').hidden=false;$('pClose').focus();
  $('pClose').onclick=closeComp;
}
function closeComp(){if($('panel').hidden)return;$('panel').hidden=true;$('scrim').hidden=true;if(lastFocus&&lastFocus.isConnected)lastFocus.focus()}
$('scrim').onclick=closeComp;
$('panel').addEventListener('click',ev=>{if(ev.target.closest('a[href^="#"]'))closeComp()});
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-comp]');if(b)openComp(b.dataset.comp)});

/* ---------------- enrutador ---------------- */
let curMes=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Transición entre vistas: usa la View Transitions API si el navegador la
   tiene (Chrome, Edge, Safari 18+). Si no, cambia la vista sin animación.
   Entre meses, la dirección (adelante/atrás) decide hacia dónde se desliza. */
function route(){
  const h=decodeURIComponent(location.hash.slice(1))||'resumen';
  const m=h.match(/^mes-(\d{1,2})$/),prev=curMes;
  document.documentElement.dataset.dir=(m&&prev)?(+m[1]>prev?'next':'prev'):'fade';
  if(!document.startViewTransition||reduce){dibujar(h);animar();return}
  document.startViewTransition(()=>dibujar(h)).ready.then(animar,animar);
}

/* Animaciones dentro de la vista nueva: tarjetas escalonadas (CSS con --i)
   y contadores que suben desde 0 hasta su valor. */
function animar(){
  view.querySelectorAll('.card').forEach((el,i)=>el.style.setProperty('--i',Math.min(i,14)));
  if(reduce)return;
  view.querySelectorAll('[data-count]').forEach(el=>{
    const fin=+el.dataset.count,suf=el.dataset.suf||'',t0=performance.now(),dur=900;
    const paso=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(fin*e)+suf;if(k<1)requestAnimationFrame(paso)};
    el.textContent='0'+suf;requestAnimationFrame(paso);
  });
}

function dibujar(h){
  let m,nav=h;curMes=0;
  closeComp();
  if(h==='resumen')renderResumen();
  else if((m=h.match(/^mes-(\d{1,2})$/))&&+m[1]>=1&&+m[1]<=12){curMes=+m[1];nav='mes';renderMes(curMes)}
  else if(h==='ejes')renderEjes();
  else if((m=h.match(/^eje-([a-z]+)$/))&&EJE[m[1]]){nav='ejes';renderEje(m[1])}
  else if(h==='compromisos')renderCompromisos();
  else if(h==='indicadores')renderIndicadores();
  else if(h==='metodologia')renderMetodologia();
  else {renderResumen();nav='resumen'}
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.querySelectorAll('#rail a').forEach(a=>{if(+a.dataset.m===curMes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(curMes){const a=document.querySelector(`#rail a[data-m="${curMes}"]`);a&&a.scrollIntoView({block:'nearest',inline:'nearest'})}
  window.scrollTo(0,0);
}
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape')return closeComp();
  if(!curMes||!$('panel').hidden||/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName))return;
  if(ev.key==='ArrowLeft'&&curMes>1)location.hash='#mes-'+(curMes-1);
  if(ev.key==='ArrowRight'&&curMes<12)location.hash='#mes-'+(curMes+1);
});

/* ---------------- arranque ---------------- */
$('hTitle').textContent=DATA.meta.titulo;
$('hSub').textContent=`${DATA.meta.institucion} · ${DATA.meta.periodo}`;
$('rail').innerHTML=Array.from({length:12},(_,k)=>{const n=k+1,i=mesInfo(n),c=DATA.hitos.filter(h=>h.mes===n).length;
  return `<li><a href="#mes-${n}" data-m="${n}" aria-label="${mesLabel(n)}, ${c} hitos"><span>${cap(i.nom.slice(0,3))}</span><span class="y">${i.y}</span><span class="dots">${'<i></i>'.repeat(c)}</span></a></li>`}).join('');
$('foot').innerHTML=`${esc(DATA.meta.titulo)} · ${esc(DATA.meta.institucion)} · Corte: ${esc(DATA.meta.corte)}. Esqueleto con datos de ejemplo.`;
window.addEventListener('hashchange',route);
route();
})();
