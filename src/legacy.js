
/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function fmt(n){return'$'+Math.round(Math.abs(n)).toLocaleString('es-AR');}
function fmtU(n){return'U$S '+(Math.round(n*100)/100).toLocaleString('es-AR');}
function fmtTC(n){return'$'+Math.round(n).toLocaleString('es-AR');}
function fmtDate(d){if(!d)return'';const[,m,day]=d.split('-');return`${day}/${m}`;}
function monthKey(d){return d?d.slice(0,7):'';}
function nowKey(){const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;}
function monthLabel(mk){if(!mk)return'';const[y,m]=mk.split('-');const N=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];return`${N[parseInt(m)-1]} ${y}`;}
function effAmt(e){return e.myAmount!=null?e.myAmount:(e.shared?e.amount*(e.sharedPercent/100):e.amount);}
function allMonths(){const s=new Set(expenses.map(e=>monthKey(e.date)).filter(Boolean));s.add(nowKey());return[...s].sort((a,b)=>b.localeCompare(a));}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function newId(){return String(Date.now())+Math.random().toString(36).slice(2,6);}
function customCats(){return cats.filter(c=>!DEF_CATS.includes(c));}

// Per-user icon overrides stored in localStorage
function loadIconOverrides(){try{return JSON.parse(localStorage.getItem(lsKey('gp_icons_v1')))||{};}catch{return{};}}
function saveIconOverrides(map){try{localStorage.setItem(lsKey('gp_icons_v1'),JSON.stringify(map));}catch{}}
function catIcon(cat){const ov=loadIconOverrides();return ov[cat]||ICONS[cat]||'📌';}
// Override the global icon() call used in expHTML etc.
function icon(cat){return catIcon(cat);}

// Hidden categories (default cats the user doesn't use)
function loadHiddenCats(){try{return JSON.parse(localStorage.getItem(lsKey('gp_hidden_cats_v1')))||[];}catch{return[];}}
function saveHiddenCats(arr){try{localStorage.setItem(lsKey('gp_hidden_cats_v1'),JSON.stringify(arr));}catch{}}
function isCatHidden(cat){return loadHiddenCats().includes(cat);}
function toggleHideCat(cat){
  const hidden=loadHiddenCats();
  const idx=hidden.indexOf(cat);
  if(idx>-1)hidden.splice(idx,1);else hidden.push(cat);
  saveHiddenCats(hidden);
  renderCatManager();
  buildCatSelect();
  toast(idx>-1?`👁️ "${cat}" visible nuevamente`:`🚫 "${cat}" ocultada del formulario`);
}

function editCatIcon(catName){
  const current=catIcon(catName);
  const newIco=prompt(`Cambiar ícono de "${catName}"\nActual: ${current}\n\nPegá un emoji nuevo:`,current);
  if(!newIco?.trim()||newIco.trim()===current)return;
  const t=newIco.trim();
  const ov=loadIconOverrides();
  ov[catName]=t;
  saveIconOverrides(ov);
  renderCatManager();
  renderAll();
  toast(`✅ Ícono de "${catName}" cambiado a ${t}`);
}

function confirmDeleteCat(name){
  const inUse=expenses.some(e=>e.category===name);
  pendingDel={type:'cat',name};
  document.getElementById('conf-txt').textContent=inUse
    ?`"${name}" se usa en gastos existentes.\nSe eliminará solo la categoría, los gastos quedan intactos.\n¿Eliminar igual?`
    :`¿Eliminar la categoría "${name}"?\nEsta acción no se puede deshacer.`;
  document.getElementById('conf-overlay').classList.add('on');
}
function personById(id){return persons.find(p=>p.id===id);}

/* ══════════════════════════════════
   CALC ARS
══════════════════════════════════ */
function calcSummary(mk){
  const rows=expenses.filter(e=>monthKey(e.date)===mk);
  let ing=0,pag=0,real=0;
  rows.forEach(e=>{if(e.type==='Ingreso'){ing+=e.amount;}else{pag+=e.amount;real+=effAmt(e);}});
  return{ing,pag,real,bal:ing-real};
}
function calcByCat(mk){
  const map={};
  expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Egreso').forEach(e=>{map[e.category]=(map[e.category]||0)+effAmt(e);});
  return map;
}

/* ══════════════════════════════════
   CALC DEBTS
══════════════════════════════════ */
function personBalance(personId){
  // positive = they owe me, negative = I owe them
  return debts.filter(d=>d.personId===personId&&!d.settled).reduce((s,d)=>s+d.amount,0);
}
function personDebtsActive(personId){return debts.filter(d=>d.personId===personId&&!d.settled).sort((a,b)=>b.date?.localeCompare(a.date)||b.createdAt-a.createdAt);}
function personDebtsSettled(personId){return debts.filter(d=>d.personId===personId&&d.settled).sort((a,b)=>b.settledDate?.localeCompare(a.settledDate)||0);}

/* ══════════════════════════════════
   RENDER ALL
══════════════════════════════════ */
function renderAll(){renderDashboard();renderListSec();renderUsdTab();renderSaldosTab();if(activeTab==='cuentas')renderCuentasTab();}

function renderDashboard(){
  const mk=nowKey();
  document.getElementById('hdr-month').textContent=monthLabel(mk);
  const{ing,pag,real,bal}=calcSummary(mk);
  document.getElementById('c-ing').textContent=fmt(ing);
  document.getElementById('c-pag').textContent=fmt(pag);
  document.getElementById('c-real').textContent=fmt(real);
  const balEl=document.getElementById('c-bal');
  balEl.textContent=(bal<0?'-':'')+fmt(bal);balEl.className='card-val '+(bal>=0?'g':'r');
  renderPieChart(mk);
  renderMonthlyChart();
  renderProjection();
  renderRecurringReminders();
  renderBudgetsSection();
  renderGoalsSection();
  renderStats(mk);
  const recent=[...expenses].filter(e=>monthKey(e.date)===mk).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,5);
  document.getElementById('recent-list').innerHTML=recent.length?recent.map(e=>expHTML(e,false)).join(''):'<div class="empty"><div class="empty-ico">📭</div><p>Sin gastos este mes</p></div>';
}

function renderPieChart(mk){
  const data=calcByCat(mk),labels=Object.keys(data),vals=Object.values(data);
  const box=document.getElementById('chart-box');
  if(!labels.length){box.classList.add('hidden');if(chart){chart.destroy();chart=null;}return;}
  box.classList.remove('hidden');
  const ctx=document.getElementById('pie').getContext('2d');
  if(chart){chart.destroy();chart=null;}
  chart=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:vals,backgroundColor:COLORS.slice(0,labels.length),borderWidth:2,borderColor:'#0d0818'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:'rgba(237,232,255,.55)',padding:12,font:{family:'Outfit',size:11,weight:'600'},boxWidth:11,boxHeight:11}},tooltip:{callbacks:{label:c=>`  ${fmt(c.raw)}`},bodyFont:{family:'JetBrains Mono',size:13},backgroundColor:'#1f1040',borderColor:'rgba(102,126,234,.35)',borderWidth:1,padding:10,cornerRadius:10}}}});
}

function renderListSec(){
  const el=document.getElementById('fil-month'),prev=el.value;
  const months=allMonths();
  el.innerHTML=months.map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join('');
  el.value=months.includes(prev)?prev:nowKey();
  const mk=el.value;
  // Cat filter
  const catSel=document.getElementById('fil-cat'),curCat=catSel.value;
  catSel.innerHTML='<option value="">Todas las categorías</option>';
  const used=new Set(expenses.filter(e=>monthKey(e.date)===mk).map(e=>e.category));
  cats.filter(c=>used.has(c)).forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=`${icon(c)} ${c}`;catSel.appendChild(o);});
  if(curCat)catSel.value=curCat;
  const search=(document.getElementById('fil-search')?.value||'').toLowerCase().trim();
  const catFil=catSel.value;
  let rows=expenses.filter(e=>monthKey(e.date)===mk);
  if(search)rows=rows.filter(e=>(e.description||'').toLowerCase().includes(search)||(e.category||'').toLowerCase().includes(search));
  if(catFil)rows=rows.filter(e=>e.category===catFil);
  rows.sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
  const hasFilter=search||catFil;
  document.getElementById('list-count').textContent=rows.length?`${rows.length} resultado${rows.length>1?'s':''}${hasFilter?' (filtrado)':''}` :'';
  document.getElementById('full-list').innerHTML=rows.length?rows.map(e=>expHTML(e,true)).join(''):`<div class="empty"><div class="empty-ico">${hasFilter?'🔍':'📭'}</div><p>${hasFilter?'Sin resultados':'Sin movimientos este mes'}</p></div>`;
}

function renderUsdTab(){
  const stock=usdTx.reduce((s,t)=>s+(t.type==='ingreso'?t.usdAmount:-t.usdAmount),0);
  const txCount=usdTx.length;
  document.getElementById('usd-stock').textContent=fmtU(Math.max(0,stock));
  document.getElementById('usd-stock-sub').textContent=`${txCount} transacción${txCount!==1?'es':''}`;
  const mk=nowKey();
  const rows=usdTx.filter(t=>monthKey(t.date)===mk);
  let inAmt=0,soldAmt=0,arsAmt=0;
  rows.forEach(t=>{if(t.type==='ingreso')inAmt+=t.usdAmount;else{soldAmt+=t.usdAmount;arsAmt+=t.arsAmount||0;}});
  document.getElementById('usd-c-in').textContent=fmtU(inAmt);
  document.getElementById('usd-c-sold').textContent=fmtU(soldAmt);
  document.getElementById('usd-c-ars').textContent=fmt(arsAmt);
  document.getElementById('usd-c-tc').textContent=soldAmt>0?fmtTC(arsAmt/soldAmt):'—';
  renderTcChart();
  const sorted=[...usdTx].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
  document.getElementById('usd-list').innerHTML=sorted.length?sorted.map(t=>usdTxHTML(t)).join(''):'<div class="empty"><div class="empty-ico">💵</div><p>Sin movimientos USD</p></div>';
}

function renderTcChart(){
  const ventas=usdTx.filter(t=>t.type==='venta'&&t.arsAmount&&t.usdAmount).sort((a,b)=>a.date.localeCompare(b.date));
  const box=document.getElementById('usd-chart-box');
  if(ventas.length<1){box.classList.add('hidden');if(tcChart){tcChart.destroy();tcChart=null;}return;}
  box.classList.remove('hidden');
  const labels=ventas.map(v=>{const[,m,d]=v.date.split('-');return`${d}/${m}`;});
  const tcs=ventas.map(v=>Math.round(v.arsAmount/v.usdAmount));
  const avg=Math.round(tcs.reduce((a,b)=>a+b,0)/tcs.length);
  document.getElementById('usd-chart-sub').textContent=`promedio: ${fmtTC(avg)}/U$S`;
  const ctx=document.getElementById('tc-chart').getContext('2d');
  if(tcChart){tcChart.destroy();tcChart=null;}
  tcChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'TC',data:tcs,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.1)',borderWidth:2.5,pointBackgroundColor:'#f59e0b',pointRadius:5,pointHoverRadius:7,fill:true,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`  ${fmtTC(c.raw)}/U$S`,afterLabel:c=>{const v=ventas[c.dataIndex];return`  ${fmtU(v.usdAmount)} → ${fmt(v.arsAmount)}`;}},bodyFont:{family:'JetBrains Mono',size:12},backgroundColor:'#1f1040',borderColor:'rgba(245,158,11,.4)',borderWidth:1,padding:10,cornerRadius:10}},scales:{x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'rgba(237,232,255,.4)',font:{family:'Outfit',size:11}}},y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'rgba(237,232,255,.4)',font:{family:'JetBrains Mono',size:11},callback:v=>'$'+Math.round(v/1000)+'k'}}}}});
}

/* ══════════════════════════════════
   RENDER SALDOS TAB
══════════════════════════════════ */
function renderSaldosTab(){
  // Summary
  let meDeben=0,yoDebo=0;
  persons.forEach(p=>{const bal=personBalance(p.id);if(bal>0)meDeben+=bal;else yoDebo+=Math.abs(bal);});
  const neto=meDeben-yoDebo;
  document.getElementById('sum-me-deben').textContent=fmt(meDeben);
  document.getElementById('sum-yo-debo').textContent=fmt(yoDebo);
  const netoEl=document.getElementById('sum-neto');
  netoEl.textContent=(neto<0?'-':'')+fmt(neto);
  netoEl.style.color=neto>0?'var(--green)':neto<0?'var(--red)':'var(--txt3)';

  // Build person cards
  // Show: recurrent always, eventuales only if balance != 0
  const visiblePersons=persons.filter(p=>{
    if(p.isRecurrent)return true;
    return personBalance(p.id)!==0;
  });

  let html='';
  if(visiblePersons.length===0){
    html='<div class="empty"><div class="empty-ico">🤝</div><p>Sin cuentas pendientes<br><small>Agregá una deuda con el botón ＋</small></p></div>';
  } else {
    visiblePersons.forEach(p=>{
      const bal=personBalance(p.id);
      const activeDebts=personDebtsActive(p.id);
      const hasHistory=personDebtsSettled(p.id).length>0;
      const balClass=bal>0?'pos':bal<0?'neg':'zero';
      const balLbl=bal>0?'te debe':bal<0?'le debés':'en cero';
      const cardId=`pc_${p.id}`;
      const histId=`ph_${p.id}`;

      html+=`<div class="person-card" id="${cardId}">
        <div class="person-header">
          <div class="person-ava">${p.emoji}</div>
          <div class="person-info">
            <div class="person-name">${esc(p.name)}</div>
            <div class="person-sub">${activeDebts.length} movimiento${activeDebts.length!==1?'s':''} activo${activeDebts.length!==1?'s':''}</div>
          </div>
          <div class="person-balance">
            <div class="person-bal-val ${balClass}">${bal===0?'$0':((bal>0?'':'-')+fmt(bal))}</div>
            <div class="person-bal-lbl">${balLbl}</div>
          </div>
        </div>`;

      // Active debts list
      if(activeDebts.length>0){
        html+=`<div class="person-debts">`;
        activeDebts.forEach(d=>{
          const amtClass=d.amount>0?'pos':'neg';
          const dir=d.amount>0?'↙ te deben':'↗ vos debés';
          html+=`<div class="debt-item">
            <div class="debt-info">
              <div class="debt-desc">${esc(d.description)}</div>
              <div class="debt-meta">${fmtDate(d.date)} · ${dir}</div>
            </div>
            <div class="debt-amt ${amtClass}">${d.amount>0?'+':'-'}${fmt(d.amount)}</div>
            <button class="btn-ico del" onclick="deleteDebt('${d.id}',event)" style="width:28px;height:28px;font-size:12px">🗑️</button>
          </div>`;
        });
        html+=`</div>`;
      }

      // Actions
      html+=`<div class="person-actions">
        <button class="btn-settle" onclick="openSettleModal('${p.id}')" ${bal===0?'disabled':''}>
          ${bal>0?'💸 Marcar cobrado':'✅ Marcar pagado'}
        </button>`;
      if(hasHistory){
        html+=`<button class="btn-hist" onclick="toggleHistory('${p.id}')">🕐 Historial</button>`;
      }
      html+=`</div>`;

      // History (hidden by default)
      const settled=personDebtsSettled(p.id);
      if(settled.length>0){
        html+=`<div id="${histId}" style="display:none;margin-top:10px">
          <div style="font-size:11px;color:var(--txt3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Historial saldado</div>
          <div style="display:flex;flex-direction:column;gap:5px">`;
        settled.forEach(d=>{
          html+=`<div class="debt-item settled">
            <div class="debt-info">
              <div class="debt-desc">${esc(d.description)}</div>
              <div class="debt-meta">${fmtDate(d.date)} · Saldado ${fmtDate(d.settledDate)}</div>
            </div>
            <div class="debt-amt" style="color:var(--txt3)">${fmt(Math.abs(d.amount))}</div>
            <span class="debt-settled-ico">✓</span>
          </div>`;
        });
        html+=`</div></div>`;
      }

      html+=`</div>`;// end person-card
    });
  }

  // Eventuales with zero balance — show "ver historial" section
  const hiddenPersons=persons.filter(p=>!p.isRecurrent&&personBalance(p.id)===0&&debts.some(d=>d.personId===p.id));
  if(hiddenPersons.length>0){
    html+=`<div style="text-align:center;margin-top:8px"><button class="btn-hist" onclick="toggleZeroPersons()" id="btn-zero-toggle">+ ${hiddenPersons.length} persona${hiddenPersons.length>1?'s':''} saldada${hiddenPersons.length>1?'s':''}</button></div>`;
    html+=`<div id="zero-persons" style="display:none;margin-top:8px">`;
    hiddenPersons.forEach(p=>{
      html+=`<div class="person-card" style="opacity:.5">
        <div class="person-header">
          <div class="person-ava">${p.emoji}</div>
          <div class="person-info"><div class="person-name">${esc(p.name)}</div><div class="person-sub">Saldo en cero</div></div>
          <div class="person-balance"><div class="person-bal-val zero">$0</div></div>
        </div>
      </div>`;
    });
    html+=`</div>`;
  }

  document.getElementById('saldos-list').innerHTML=html;

  // Old debt alerts
  const old=oldDebtAlerts();
  if(old.length){
    const alertHtml=`<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:14px;padding:13px 15px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:6px">⏰ Deudas sin saldar hace más de 30 días</div>
      ${old.map(d=>`<div style="font-size:12px;color:var(--txt2);margin-bottom:3px">${d.amount>0?'↙':'↗'} <b>${esc(d.personName)}</b> · ${esc(d.description)} · ${fmt(Math.abs(d.amount))}</div>`).join('')}
    </div>`;
    document.getElementById('saldos-list').insertAdjacentHTML('afterbegin',alertHtml);
  }
}

function toggleHistory(personId){
  const el=document.getElementById(`ph_${personId}`);
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}
function toggleZeroPersons(){
  const el=document.getElementById('zero-persons');
  const btn=document.getElementById('btn-zero-toggle');
  if(el){el.style.display=el.style.display==='none'?'block':'none';}
}

/* ══════════════════════════════════
   EXPENSE HTML
══════════════════════════════════ */
function expHTML(e,actions){
  const ing=e.type==='Ingreso';
  const hasSplit=e.splits&&e.splits.length>0;
  const splitBadge=hasSplit?`<span class="badge sh">🤝 ${e.splits.map(s=>s.personName).join(', ')}</span>`:'';
  const ingBadge=ing?'<span class="badge ing">Ingreso</span>':'';
  const recurBadge=e.recurring?'<span class="badge" style="background:rgba(96,165,250,.1);color:var(--blue);border-color:rgba(96,165,250,.25)">🔁</span>':'';
  const pending=pendingQ.some(p=>p.path===arsPath(e.id))?'<span style="color:var(--yellow);font-size:10px">⏳</span>':'';
  const notesLine=e.notes?`<div style="font-size:11px;color:var(--txt3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📝 ${esc(e.notes)}</div>`:'';
  const btns=actions?`<div class="exp-actions"><button class="btn-ico edit" onclick="editExp('${e.id}',event)">✏️</button><button class="btn-ico del" onclick="delExp('${e.id}',event)">🗑️</button></div>`:'';
  return`<div class="exp-item swipeable" data-id="${e.id}" onclick="editExp('${e.id}',event)">
    <div class="exp-ico purple-bg">${icon(e.category)}</div>
    <div class="exp-info">
      <div class="exp-desc">${esc(e.description||e.category)} ${pending}</div>
      ${notesLine}
      <div class="exp-meta"><span>${fmtDate(e.date)}</span><span style="color:var(--txt3)">·</span><span>${esc(e.category)}</span>${splitBadge}${ingBadge}${recurBadge}</div>
    </div>
    <div class="exp-right"><div class="exp-amt ${ing?'i':'e'}">${ing?'+':'-'}${fmt(effAmt(e))}</div>${btns}</div>
  </div>`;
}

function usdTxHTML(t){
  const isIn=t.type==='ingreso';
  const badge=isIn?'<span class="badge usd-in">📥 Ingreso</span>':'<span class="badge usd-sell">💸 Venta</span>';
  const tc=!isIn&&t.arsAmount&&t.usdAmount?`<span>TC: ${fmtTC(t.arsAmount/t.usdAmount)}</span>`:'';
  const arsLine=!isIn&&t.arsAmount?`<div class="exp-amt-sub">→ ${fmt(t.arsAmount)} ARS</div>`:'';
  return`<div class="exp-item" onclick="editUsdTx('${t.id}',event)">
    <div class="exp-ico gold-bg">${isIn?'💵':'🔄'}</div>
    <div class="exp-info">
      <div class="exp-desc">${esc(t.description||(isIn?'Ingreso USD':'Venta USD'))}</div>
      <div class="exp-meta"><span>${fmtDate(t.date)}</span><span style="color:var(--txt3)">·</span>${badge}${tc}</div>
    </div>
    <div class="exp-right">
      <div><div class="exp-amt ${isIn?'gold':'r'}">${isIn?'+':'-'}${fmtU(t.usdAmount)}</div>${arsLine}</div>
      <div class="exp-actions"><button class="btn-ico edit" onclick="editUsdTx('${t.id}',event)">✏️</button><button class="btn-ico del" onclick="delUsdTx('${t.id}',event)">🗑️</button></div>
    </div>
  </div>`;
}

/* ══════════════════════════════════
   SPLIT PANEL
══════════════════════════════════ */
function toggleSplitPanel(){
  splitPanelOpen=!splitPanelOpen;
  document.getElementById('split-panel').classList.toggle('on',splitPanelOpen);
  document.getElementById('split-toggle-btn').classList.toggle('active',splitPanelOpen);
  document.getElementById('split-toggle-ico').textContent=splitPanelOpen?'−':'＋';
  if(splitPanelOpen&&splitRows.length===0){
    // Auto-add Vicky as first split
    const vicky=persons.find(p=>p.id==='person_vicky');
    if(vicky)splitRows.push({personId:vicky.id,personName:vicky.name,emoji:vicky.emoji,amount:0});
    renderSplitRows();
  }
  recalcSplit();
}

function renderSplitRows(){
  const total=parseFloat(document.getElementById('f-amt').value)||0;
  let html='';
  splitRows.forEach((row,i)=>{
    html+=`<div class="split-person-row">
      <div style="width:28px;text-align:center;font-size:18px">${row.emoji}</div>
      <div class="split-person-name">${esc(row.personName)}</div>
      <div class="split-preset-btns">
        <button class="split-preset ${row._preset==='50'?'on':''}" onclick="setSplitPreset(${i},'50')">50%</button>
        <button class="split-preset ${row._preset==='40'?'on':''}" onclick="setSplitPreset(${i},'40')">40%</button>
        <button class="split-preset ${row._preset==='60'?'on':''}" onclick="setSplitPreset(${i},'60')">60%</button>
      </div>
      <input type="number" class="split-amt-inp" value="${row.amount||''}" placeholder="$0"
        oninput="setSplitAmt(${i},this.value)" inputmode="decimal" min="0">
      <button class="btn-ico del" onclick="removeSplitRow(${i})" style="flex-shrink:0;width:28px;height:28px;font-size:12px">✕</button>
    </div>`;
  });
  document.getElementById('split-persons-list').innerHTML=html;
  recalcSplit();
}

function setSplitPreset(i,pct){
  const total=parseFloat(document.getElementById('f-amt').value)||0;
  splitRows[i].amount=Math.round(total*(parseInt(pct)/100));
  splitRows[i]._preset=pct;
  renderSplitRows();
}
function setSplitAmt(i,val){
  splitRows[i].amount=parseFloat(val)||0;
  splitRows[i]._preset=null;
  recalcSplit();
}
function removeSplitRow(i){
  splitRows.splice(i,1);
  renderSplitRows();
  if(splitRows.length===0){
    splitPanelOpen=false;
    document.getElementById('split-panel').classList.remove('on');
    document.getElementById('split-toggle-btn').classList.remove('active');
    document.getElementById('split-toggle-ico').textContent='＋';
    document.getElementById('split-toggle-lbl').textContent='🤝 Dividir con alguien';
  }
}
function recalcSplit(){
  if(!splitPanelOpen)return;
  const total=parseFloat(document.getElementById('f-amt').value)||0;
  const theirTotal=splitRows.reduce((s,r)=>s+(parseFloat(r.amount)||0),0);
  const myPart=Math.max(0,total-theirTotal);
  document.getElementById('split-my-val').textContent=fmt(myPart);
  // Update toggle label
  const names=splitRows.map(r=>r.personName).join(', ');
  document.getElementById('split-toggle-lbl').textContent=splitPanelOpen&&names?`🤝 Dividido con ${names}`:'🤝 Dividir con alguien';
}
function addSplitPerson(){
  const used=new Set(splitRows.map(r=>r.personId));
  const available=persons.filter(p=>!used.has(p.id));
  if(available.length===0){
    openAddContactModal(null,true);return;
  }
  const names=available.map((p,i)=>`${i+1}. ${p.emoji} ${p.name}`).join('\n');
  const idx=prompt(`Elegí una persona (número):\n${names}\n${available.length+1}. + Nueva persona`);
  const n=parseInt(idx);
  if(n===available.length+1){openAddContactModal(null,true);return;}
  if(n>=1&&n<=available.length){
    const p=available[n-1];
    splitRows.push({personId:p.id,personName:p.name,emoji:p.emoji,amount:0});
    renderSplitRows();
  }
}
function addDebtPersonPrompt(forSplit=false){
  // Open proper contacts flow instead of basic prompt
  openAddContactModal(null, forSplit);
}

/* ══════════════════════════════════
   CONTACTS MANAGER
══════════════════════════════════ */
let _contactForSplit=false; // flag: opened from split panel

function openContactsModal(){
  renderContactsList();
  document.getElementById('contacts-overlay').classList.add('on');
}
function closeContactsModal(){document.getElementById('contacts-overlay').classList.remove('on');}
function contactsOverlayClick(ev){if(ev.target===document.getElementById('contacts-overlay'))closeContactsModal();}

function renderContactsList(){
  const favs=persons.filter(p=>p.isRecurrent);
  const occ=persons.filter(p=>!p.isRecurrent);
  let html='';

  if(persons.length===0){
    html=`<div class="empty" style="padding:24px 0"><div class="empty-ico">👥</div><p>No tenés contactos aún.<br>Agregá a las personas con las que solés dividir gastos.</p></div>`;
  } else {
    if(favs.length>0){
      html+=`<div class="cat-section-lbl">⭐ Favoritos (${favs.length})</div>`;
      favs.forEach(p=>{ html+=contactItemHTML(p); });
    }
    if(occ.length>0){
      html+=`<div class="cat-section-lbl">👥 Ocasionales (${occ.length})</div>`;
      occ.forEach(p=>{ html+=contactItemHTML(p); });
    }
  }
  document.getElementById('contacts-body').innerHTML=html;
}

function contactItemHTML(p){
  return`<div class="cat-manager-item">
    <div style="font-size:24px;width:36px;text-align:center">${p.emoji}</div>
    <div class="cat-manager-name custom">${esc(p.name)}</div>
    <div style="font-size:10px;padding:2px 7px;border-radius:10px;background:${p.isRecurrent?'rgba(45,212,191,.1)':'rgba(255,255,255,.05)'};color:${p.isRecurrent?'var(--teal)':'var(--txt3)'};border:1px solid ${p.isRecurrent?'rgba(45,212,191,.2)':'var(--bdr)'};font-weight:600;flex-shrink:0">${p.isRecurrent?'⭐ Fav':'Ocasional'}</div>
    <div class="cat-manager-actions">
      <button class="cat-mgr-btn rename" onclick="openAddContactModal('${p.id}')" title="Editar">✏️</button>
      <button class="cat-mgr-btn delete" onclick="confirmDeleteContact('${p.id}')" title="Eliminar">🗑️</button>
    </div>
  </div>`;
}

function confirmDeleteContact(personId){
  const p=personById(personId);
  if(!p)return;
  const hasDebts=debts.some(d=>d.personId===personId&&!d.settled);
  pendingDel={type:'contact',id:personId};
  document.getElementById('conf-txt').textContent=
    (hasDebts?`"${p.name}" tiene saldos pendientes.\n`:``) +
    `¿Eliminar el contacto "${p.name}"?\nEsta acción no se puede deshacer.`;
  document.getElementById('conf-overlay').classList.add('on');
}

// Add contact type to doDelete — handled below in doDelete

let _editingContactId=null;
function openAddContactModal(personId=null, forSplit=false){
  _contactForSplit=forSplit;
  _editingContactId=personId;
  const p=personId?personById(personId):null;
  document.getElementById('add-contact-title').textContent=p?'Editar contacto':'Nuevo contacto';
  document.getElementById('ac-id').value=personId||'';
  document.getElementById('ac-name').value=p?.name||'';
  document.getElementById('ac-emoji-preview').textContent=p?.emoji||'👤';
  setContactType(p?(p.isRecurrent?'recurrent':'occasional'):'recurrent');
  document.getElementById('add-contact-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('ac-name').focus(),200);
}
function closeAddContactModal(){document.getElementById('add-contact-overlay').classList.remove('on');}
function addContactOverlayClick(ev){if(ev.target===document.getElementById('add-contact-overlay'))closeAddContactModal();}

function setContactType(t){
  document.getElementById('ac-type').value=t;
  document.getElementById('ac-btn-fav').className='type-btn'+(t==='recurrent'?' ai':'');
  document.getElementById('ac-btn-occ').className='type-btn'+(t==='occasional'?' ae':'');
  document.getElementById('ac-type-hint').textContent=t==='recurrent'
    ?'Favorito: siempre visible en Saldos aunque esté en cero'
    :'Ocasional: se oculta en Saldos cuando el saldo es cero';
}

const CONTACT_EMOJIS=['👤','👨','👩','🧑','🧔','👦','👧','👴','👵','🧒','💁','🙋','🤷','🧑‍💼','🧑‍🔧','🧑‍🍳','🧑‍⚕️','👮','🧑‍🎓','🧑‍🎨'];
let _emojiPickerOpen=false;
function pickContactEmoji(){
  const grid=CONTACT_EMOJIS.map((e,i)=>`<span onclick="selectContactEmoji('${e}')" style="font-size:28px;cursor:pointer;padding:6px;border-radius:8px;display:inline-block" onmouseover="this.style.background='rgba(255,255,255,.1)'" onmouseout="this.style.background=''">${e}</span>`).join('');
  const existing=document.getElementById('emoji-picker-inline');
  if(existing){existing.remove();return;}
  const div=document.createElement('div');
  div.id='emoji-picker-inline';
  div.style.cssText='background:#1a0d30;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px;margin-top:8px;text-align:center;line-height:1';
  div.innerHTML=grid;
  document.getElementById('ac-emoji-preview').parentNode.insertBefore(div,document.getElementById('ac-emoji-preview').nextSibling.nextSibling);
}
function selectContactEmoji(e){
  document.getElementById('ac-emoji-preview').textContent=e;
  const picker=document.getElementById('emoji-picker-inline');
  if(picker)picker.remove();
}

function saveContact(){
  const id=document.getElementById('ac-id').value;
  const name=document.getElementById('ac-name').value.trim();
  const emoji=document.getElementById('ac-emoji-preview').textContent;
  const type=document.getElementById('ac-type').value;
  if(!name){toast('⚠️ Escribí un nombre');return;}
  if(!id&&persons.find(p=>p.name.toLowerCase()===name.toLowerCase())){toast('⚠️ Ya existe ese nombre');return;}

  const p={
    id:id||'person_'+newId(),
    name,emoji,
    isRecurrent:type==='recurrent'
  };

  if(id){const i=persons.findIndex(x=>x.id===id);if(i>-1)persons[i]=p;else persons.push(p);}
  else persons.push(p);
  saveLocal();

  closeAddContactModal();
  // If opened from split panel, add to split
  if(_contactForSplit&&!id){
    splitRows.push({personId:p.id,personName:p.name,emoji:p.emoji,amount:0});
    renderSplitRows();
  }
  // If contacts modal was open, refresh it
  const picker=document.getElementById('emoji-picker-inline');
  if(picker)picker.remove();
  renderContactsList();
  buildDebtPersonSelect();
  renderSaldosTab();
  toast(`✅ Contacto "${name}" ${id?'actualizado':'agregado'}`);
}

/* ══════════════════════════════════
   MODAL GASTOS ARS
══════════════════════════════════ */
function openModal(data){
  document.getElementById('m-title').textContent=data?'Editar Gasto':'Nuevo Gasto';
  document.getElementById('f-id').value=data?.id||'';
  document.getElementById('f-date').value=data?.date||new Date().toISOString().split('T')[0];
  document.getElementById('f-desc').value=data?.description||'';
  document.getElementById('f-notes').value=data?.notes||'';
  document.getElementById('f-amt').value=data?.amount||'';
  document.getElementById('f-recur').checked=data?.recurring||false;
  setType(data?.type||'Egreso');
  buildCatSelect();
  if(data?.category)document.getElementById('f-cat').value=data.category;
  // Restore split state
  splitRows=data?.splits?data.splits.map(s=>({...s})):[];
  splitPanelOpen=splitRows.length>0;
  document.getElementById('split-panel').classList.toggle('on',splitPanelOpen);
  document.getElementById('split-toggle-btn').classList.toggle('active',splitPanelOpen);
  document.getElementById('split-toggle-ico').textContent=splitPanelOpen?'−':'＋';
  if(splitPanelOpen)renderSplitRows();
  recalcSplit();
  document.getElementById('m-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('f-amt').focus(),200);
}
function closeModal(){document.getElementById('m-overlay').classList.remove('on');splitRows=[];splitPanelOpen=false;}
function overlayClick(ev){if(ev.target===document.getElementById('m-overlay'))closeModal();}
function setType(t){
  document.getElementById('f-type').value=t;
  document.getElementById('btn-eg').className='type-btn'+(t==='Egreso'?' ae':'');
  document.getElementById('btn-in').className='type-btn'+(t==='Ingreso'?' ai':'');
}
function buildCatSelect(){
  const hidden=loadHiddenCats();
  const sel=document.getElementById('f-cat'),cur=sel.value;
  sel.innerHTML=cats.filter(c=>!hidden.includes(c)).map(c=>`<option value="${esc(c)}">${icon(c)} ${c}</option>`).join('');
  if(cur&&cats.includes(cur)&&!hidden.includes(cur))sel.value=cur;
}
function addCatPrompt(){
  const name=prompt('Nombre de la nueva categoría:');if(!name?.trim())return;
  const t=name.trim();if(cats.includes(t)){toast('⚠️ Ya existe');return;}
  cats.push(t);saveLocal();buildCatSelect();document.getElementById('f-cat').value=t;toast(`✅ Categoría "${t}" creada`);
}
function openCatManager(){renderCatManager();document.getElementById('cat-overlay').classList.add('on');}
function closeCatManager(){document.getElementById('cat-overlay').classList.remove('on');}
function catOverlayClick(ev){if(ev.target===document.getElementById('cat-overlay'))closeCatManager();}
function renderCatManager(){
  const custom=customCats();const hidden=loadHiddenCats();let html='';
  // Custom cats
  if(custom.length>0){
    html+=`<div class="cat-section-lbl">Personalizadas (${custom.length})</div><div class="cat-manager-list">`;
    custom.forEach(c=>{html+=`<div class="cat-manager-item"><div class="cat-manager-ico">${catIcon(c)}</div><div class="cat-manager-name custom">${esc(c)}</div><span class="cat-manager-badge">Custom</span><div class="cat-manager-actions"><button class="cat-mgr-btn ico" onclick="editCatIcon('${esc(c)}')" title="Cambiar ícono">🎨</button><button class="cat-mgr-btn rename" onclick="renameCat('${esc(c)}')">✏️</button><button class="cat-mgr-btn delete" onclick="confirmDeleteCat('${esc(c)}')">🗑️</button></div></div>`;});
    html+=`</div>`;
  }else{html+=`<div class="empty" style="padding:24px 0"><div class="empty-ico">🏷️</div><p>No tenés categorías personalizadas.</p></div>`;}
  // Default cats (only those still active — not renamed away)
  const activeDefs=DEF_CATS.filter(c=>cats.includes(c));
  html+=`<div class="cat-section-lbl">Predefinidas</div><div class="cat-manager-list">`;
  activeDefs.forEach(c=>{
    const isHidden=hidden.includes(c);
    html+=`<div class="cat-manager-item${isHidden?' cat-hidden':''}">
      <div class="cat-manager-ico">${catIcon(c)}</div>
      <div class="cat-manager-name default">${esc(c)}${isHidden?'<span class="cat-hidden-badge">oculta</span>':''}</div>
      <div class="cat-manager-actions">
        <button class="cat-mgr-btn ico" onclick="editCatIcon('${esc(c)}')" title="Cambiar ícono">🎨</button>
        <button class="cat-mgr-btn rename" onclick="renameCat('${esc(c)}')" title="Renombrar">✏️</button>
        <button class="cat-mgr-btn ${isHidden?'show':'hide'}" onclick="toggleHideCat('${esc(c)}')" title="${isHidden?'Mostrar':'Ocultar'}">${isHidden?'👁️':'🚫'}</button>
      </div>
    </div>`;
  });
  html+=`</div>`;
  document.getElementById('cat-manager-body').innerHTML=html;
}
function renameCat(oldName){
  const newName=prompt(`Renombrar "${oldName}" a:`,oldName);if(!newName?.trim()||newName.trim()===oldName)return;
  const t=newName.trim();if(cats.includes(t)){toast('⚠️ Ya existe');return;}
  const idx=cats.indexOf(oldName);if(idx>-1)cats[idx]=t;
  expenses=expenses.map(e=>e.category===oldName?{...e,category:t}:e);
  saveLocal();expenses.filter(e=>e.category===t).forEach(e=>{skipNextArs=fbOnline;persistArs(e,null);});
  buildCatSelect();renderCatManager();renderAll();toast(`✅ "${oldName}" → "${t}"`);
}

/* ══════════════════════════════════
   SAVE EXPENSE  (with split logic)
══════════════════════════════════ */
async function saveExpense(){
  const id=document.getElementById('f-id').value;
  const type=document.getElementById('f-type').value;
  const date=document.getElementById('f-date').value;
  const cat=document.getElementById('f-cat').value;
  const desc=document.getElementById('f-desc').value.trim();
  const notes=document.getElementById('f-notes').value.trim();
  const amt=parseFloat(document.getElementById('f-amt').value);
  const recurring=document.getElementById('f-recur').checked;
  if(!date){toast('⚠️ Completá la fecha');return;}
  if(!amt||amt<=0||isNaN(amt)){toast('⚠️ Ingresá un monto válido');return;}

  // Calculate my amount from split
  const splits=splitPanelOpen&&splitRows.length>0?splitRows.map(r=>({personId:r.personId,personName:r.personName,emoji:r.emoji,amount:parseFloat(r.amount)||0})):[];
  const theirTotal=splits.reduce((s,r)=>s+r.amount,0);
  const myAmount=splitPanelOpen&&splits.length>0?Math.max(0,amt-theirTotal):amt;

  const exp={
    id:id||newId(),type,date,category:cat,
    description:desc||cat,notes:notes||null,amount:amt,myAmount,
    splits:splits.length>0?splits:null,
    recurring:recurring||false,
    shared:false,sharedPercent:100,
    createdAt:id?(expenses.find(e=>e.id===id)?.createdAt||Date.now()):Date.now(),
    updatedAt:Date.now()
  };

  if(id){const i=expenses.findIndex(e=>e.id===id);if(i>-1)expenses[i]=exp;else expenses.push(exp);}
  else expenses.push(exp);

  haptic();closeModal();renderAll();
  toast(id?'✅ Gasto actualizado':'✅ Gasto guardado');
  skipNextArs=fbOnline;
  await persistArs(exp,null);

  // Create debt records for each split person
  if(splits.length>0&&type==='Egreso'){
    for(const s of splits){
      if(s.amount<=0)continue;
      const debt={
        id:newId(),personId:s.personId,personName:s.personName,
        description:desc||cat,amount:s.amount, // positive = they owe me
        date,settled:false,settledDate:null,
        linkedExpenseId:exp.id,
        createdAt:Date.now(),updatedAt:Date.now()
      };
      debts.push(debt);
      skipNextDebt=fbOnline;
      await persistDebt(debt,null);
    }
    renderSaldosTab();
  }
}

/* ══════════════════════════════════
   MODAL USD
══════════════════════════════════ */
function openUsdModal(data){
  document.getElementById('usd-m-title').textContent=data?'Editar movimiento USD':'Nuevo movimiento USD';
  document.getElementById('uf-id').value=data?.id||'';
  document.getElementById('uf-date').value=data?.date||new Date().toISOString().split('T')[0];
  document.getElementById('uf-usd').value=data?.usdAmount||'';
  document.getElementById('uf-ars').value=data?.arsAmount||'';
  document.getElementById('uf-desc').value=data?.description||'';
  document.getElementById('uf-autoars').checked=true;
  setUsdType(data?.type||'ingreso');calcTC();
  document.getElementById('usd-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('uf-usd').focus(),200);
}
function closeUsdModal(){document.getElementById('usd-overlay').classList.remove('on');}
function usdOverlayClick(ev){if(ev.target===document.getElementById('usd-overlay'))closeUsdModal();}
function setUsdType(t){
  document.getElementById('uf-type').value=t;
  document.getElementById('ubtn-in').className='type-btn'+(t==='ingreso'?' au':'');
  document.getElementById('ubtn-sell').className='type-btn'+(t==='venta'?' av':'');
  document.getElementById('uf-ars-wrap').style.display=t==='venta'?'block':'none';
  calcTC();
}
function calcTC(){
  const usd=parseFloat(document.getElementById('uf-usd').value);
  const ars=parseFloat(document.getElementById('uf-ars').value);
  const preview=document.getElementById('tc-preview');
  if(usd>0&&ars>0){document.getElementById('tc-val').textContent=fmtTC(ars/usd)+' / U$S';document.getElementById('tc-sub').textContent=`${fmtU(usd)} × ${fmtTC(ars/usd)} = ${fmt(ars)}`;preview.classList.add('on');}
  else preview.classList.remove('on');
}
async function saveUsdTx(){
  const id=document.getElementById('uf-id').value;
  const type=document.getElementById('uf-type').value;
  const date=document.getElementById('uf-date').value;
  const usd=parseFloat(document.getElementById('uf-usd').value);
  const ars=parseFloat(document.getElementById('uf-ars').value);
  const desc=document.getElementById('uf-desc').value.trim();
  const autoArs=document.getElementById('uf-autoars').checked;
  if(!date){toast('⚠️ Completá la fecha');return;}
  if(!usd||usd<=0||isNaN(usd)){toast('⚠️ Ingresá los USD');return;}
  if(type==='venta'&&(!ars||ars<=0||isNaN(ars))){toast('⚠️ Ingresá los ARS recibidos');return;}
  const tx={id:id||newId(),type,date,usdAmount:usd,arsAmount:type==='venta'?ars:null,exchangeRate:type==='venta'?Math.round(ars/usd):null,description:desc||(type==='ingreso'?'Ingreso USD':'Venta USD P2P'),linkedArsId:null,createdAt:id?(usdTx.find(t=>t.id===id)?.createdAt||Date.now()):Date.now(),updatedAt:Date.now()};
  if(id){const prev=usdTx.find(t=>t.id===id);tx.linkedArsId=prev?.linkedArsId||null;}
  if(type==='venta'&&autoArs){
    let arsId=tx.linkedArsId||newId();tx.linkedArsId=arsId;
    const arsEntry={id:arsId,type:'Ingreso',date,category:'Venta USD',description:`Venta ${fmtU(usd)} @ ${fmtTC(ars/usd)}`,amount:ars,myAmount:ars,shared:false,sharedPercent:100,createdAt:expenses.find(e=>e.id===arsId)?.createdAt||Date.now(),updatedAt:Date.now(),autoGenerated:true};
    const ei=expenses.findIndex(e=>e.id===arsId);if(ei>-1)expenses[ei]=arsEntry;else expenses.push(arsEntry);
    skipNextArs=fbOnline;await persistArs(arsEntry,null);
  }else if(type==='ingreso'&&tx.linkedArsId){
    expenses=expenses.filter(e=>e.id!==tx.linkedArsId);const lid=tx.linkedArsId;tx.linkedArsId=null;
    skipNextArs=fbOnline;await persistArs(null,lid);
  }
  if(id&&type==='ingreso'){const prev=usdTx.find(t=>t.id===id);if(prev?.linkedArsId){expenses=expenses.filter(e=>e.id!==prev.linkedArsId);skipNextArs=fbOnline;await persistArs(null,prev.linkedArsId);tx.linkedArsId=null;}}
  if(id){const i=usdTx.findIndex(t=>t.id===id);if(i>-1)usdTx[i]=tx;else usdTx.push(tx);}else usdTx.push(tx);
  haptic();closeUsdModal();renderAll();
  toast(type==='venta'?`✅ Venta · TC ${fmtTC(ars/usd)}/U$S`:'✅ Ingreso USD guardado');
  skipNextUsd=fbOnline;await persistUsd(tx,null);
}

/* ══════════════════════════════════
   MODAL DEUDA MANUAL
══════════════════════════════════ */
function openDebtModal(data){
  document.getElementById('df-id').value=data?.id||'';
  document.getElementById('df-date').value=data?.date||new Date().toISOString().split('T')[0];
  document.getElementById('df-amt').value=data?Math.abs(data.amount):'';
  document.getElementById('df-desc').value=data?.description||'';
  buildDebtPersonSelect();
  if(data?.personId)document.getElementById('df-person').value=data.personId;
  setDebtDir(data?(data.amount>0?'me-deben':'yo-debo'):'me-deben');
  document.getElementById('debt-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('df-amt').focus(),200);
}
function closeDebtModal(){document.getElementById('debt-overlay').classList.remove('on');}
function debtOverlayClick(ev){if(ev.target===document.getElementById('debt-overlay'))closeDebtModal();}
function buildDebtPersonSelect(){
  const sel=document.getElementById('df-person'),cur=sel.value;
  sel.innerHTML=persons.map(p=>`<option value="${p.id}">${p.emoji} ${esc(p.name)}</option>`).join('');
  if(cur&&persons.find(p=>p.id===cur))sel.value=cur;
}
function debtPersonChange(){}
function setDebtDir(dir){
  document.getElementById('df-dir').value=dir;
  document.getElementById('df-btn-medb').className='type-btn'+(dir==='me-deben'?' ai':'');
  document.getElementById('df-btn-debo').className='type-btn'+(dir==='yo-debo'?' ae':'');
}
async function saveDebt(){
  const id=document.getElementById('df-id').value;
  const personId=document.getElementById('df-person').value;
  const dir=document.getElementById('df-dir').value;
  const date=document.getElementById('df-date').value;
  const amt=parseFloat(document.getElementById('df-amt').value);
  const desc=document.getElementById('df-desc').value.trim();
  if(!personId){toast('⚠️ Elegí una persona');return;}
  if(!date){toast('⚠️ Completá la fecha');return;}
  if(!amt||amt<=0||isNaN(amt)){toast('⚠️ Ingresá el monto');return;}
  if(!desc){toast('⚠️ Agregá una descripción');return;}
  const p=personById(personId);
  const debt={
    id:id||newId(),personId,personName:p?.name||'',
    description:desc,
    amount:dir==='me-deben'?amt:-amt,
    date,settled:false,settledDate:null,linkedExpenseId:null,
    createdAt:id?(debts.find(d=>d.id===id)?.createdAt||Date.now()):Date.now(),
    updatedAt:Date.now()
  };
  if(id){const i=debts.findIndex(d=>d.id===id);if(i>-1)debts[i]=debt;else debts.push(debt);}
  else debts.push(debt);
  haptic();closeDebtModal();renderSaldosTab();
  toast('✅ Deuda guardada');
  skipNextDebt=fbOnline;await persistDebt(debt,null);
}
function deleteDebt(id,ev){
  ev?.stopPropagation();
  pendingDel={type:'debt',id};
  const d=debts.find(x=>x.id===id);
  document.getElementById('conf-txt').textContent=d
    ?`"${d.description}" · ${fmt(Math.abs(d.amount))}\nEsta acción no se puede deshacer.`
    :'Esta acción no se puede deshacer.';
  document.getElementById('conf-overlay').classList.add('on');
}

/* ══════════════════════════════════
   SETTLE MODAL
══════════════════════════════════ */
function openSettleModal(personId){
  const p=personById(personId);
  if(!p)return;
  const bal=personBalance(personId);
  if(bal===0){toast('Saldo en cero, no hay nada que saldar');return;}
  document.getElementById('settle-pid').value=personId;
  document.getElementById('settle-ava').textContent=p.emoji;
  document.getElementById('settle-name').textContent=p.name;
  document.getElementById('settle-bal-txt').textContent=bal>0?`Te debe ${fmt(bal)}`:`Le debés ${fmt(Math.abs(bal))}`;
  document.getElementById('settle-amt').value=Math.abs(bal);
  document.getElementById('settle-date').value=new Date().toISOString().split('T')[0];
  setSettleType('transfer');
  document.getElementById('settle-overlay').classList.add('on');
}
function closeSettleModal(){document.getElementById('settle-overlay').classList.remove('on');}
function settleOverlayClick(ev){if(ev.target===document.getElementById('settle-overlay'))closeSettleModal();}
function setSettleType(t){
  document.getElementById('settle-type').value=t;
  document.getElementById('stype-transfer').className='settle-type-btn'+(t==='transfer'?' on':'');
  document.getElementById('stype-comp').className='settle-type-btn'+(t==='comp'?' on':'');
}
async function doSettle(){
  const personId=document.getElementById('settle-pid').value;
  const type=document.getElementById('settle-type').value;
  const amt=parseFloat(document.getElementById('settle-amt').value);
  const date=document.getElementById('settle-date').value;
  if(!amt||amt<=0||isNaN(amt)){toast('⚠️ Ingresá el monto');return;}
  const p=personById(personId);
  const bal=personBalance(personId);

  // Mark active debts as settled up to amt
  let remaining=amt;
  const activeDebts=personDebtsActive(personId);
  const settledIds=[];
  for(const d of activeDebts){
    if(remaining<=0)break;
    const absAmt=Math.abs(d.amount);
    if(absAmt<=remaining){
      debts=debts.map(x=>x.id===d.id?{...x,settled:true,settledDate:date,updatedAt:Date.now()}:x);
      remaining-=absAmt;settledIds.push(d.id);
    }
  }

  // Create ARS ingreso if they were paying me and it's a transfer
  if(bal>0&&type==='transfer'){
    const arsEntry={
      id:newId(),type:'Ingreso',date,category:'Otro',
      description:`Liquidación ${p.name}`,
      amount:amt,myAmount:amt,shared:false,sharedPercent:100,
      createdAt:Date.now(),updatedAt:Date.now(),autoGenerated:true
    };
    expenses.push(arsEntry);
    skipNextArs=fbOnline;await persistArs(arsEntry,null);
  }

  // Persist settled debts
  for(const id of settledIds){
    const d=debts.find(x=>x.id===id);
    skipNextDebt=fbOnline;await persistDebt(d,null);
  }

  haptic();closeSettleModal();renderAll();
  toast(`✅ Saldo con ${p.name} marcado como saldado${bal>0&&type==='transfer'?' · Ingreso creado':''}`);
}

/* ══════════════════════════════════
   EDIT / DELETE ARS & USD
══════════════════════════════════ */
function editExp(id,ev){ev?.stopPropagation();const e=expenses.find(x=>x.id===id);if(e)openModal(e);}
function delExp(id,ev){
  ev?.stopPropagation();pendingDel={type:'ars',id};
  const e=expenses.find(x=>x.id===id);
  document.getElementById('conf-txt').textContent=e?`"${e.description}" · ${fmt(e.amount)}\nEsta acción no se puede deshacer.`:'Esta acción no se puede deshacer.';
  document.getElementById('conf-overlay').classList.add('on');
}
function editUsdTx(id,ev){ev?.stopPropagation();const t=usdTx.find(x=>x.id===id);if(t)openUsdModal(t);}
function delUsdTx(id,ev){
  ev?.stopPropagation();pendingDel={type:'usd',id};
  const t=usdTx.find(x=>x.id===id);
  document.getElementById('conf-txt').textContent=t?`"${t.description}" · ${fmtU(t.usdAmount)}${t.linkedArsId?'\n(también se eliminará el ingreso ARS asociado)':''}\nEsta acción no se puede deshacer.`:'Esta acción no se puede deshacer.';
  document.getElementById('conf-overlay').classList.add('on');
}
function closeConf(){pendingDel=null;document.getElementById('conf-overlay').classList.remove('on');}

async function doDelete(){
  if(!pendingDel){closeConf();return;}
  const{type,id,name}=pendingDel;closeConf();
  if(type==='cat'){
    haptic([30,30,60]);
    cats=cats.filter(c=>c!==name);saveLocal();buildCatSelect();renderCatManager();toast(`🗑️ Categoría "${name}" eliminada`);
    return;
  }
  if(type==='contact'){
    haptic([30,30,60]);
    persons=persons.filter(p=>p.id!==id);saveLocal();
    renderContactsList();renderSaldosTab();buildDebtPersonSelect();
    toast('🗑️ Contacto eliminado');return;
  }
  if(type==='account'){
    haptic([30,30,60]);
    accounts=accounts.filter(a=>a.id!==id);saveAccounts();renderCuentasTab();toast('🗑️ Billetera eliminada');return;
  }
  if(type==='transfer'){
    haptic([30,30,60]);
    transfers=transfers.filter(x=>x.id!==id);saveAccounts();renderCuentasTab();toast('🗑️ Transferencia eliminada');return;
  }
  if(type==='goal'){
    haptic([30,30,60]);
    goals=goals.filter(x=>x.id!==id);saveGoals();renderGoalsSection();toast('🗑️ Meta eliminada');return;
  }
  haptic([30,30,60]);
  if(type==='debt'){
    debts=debts.filter(d=>d.id!==id);renderSaldosTab();toast('🗑️ Deuda eliminada');
    skipNextDebt=fbOnline;await persistDebt(null,id);
  }else if(type==='ars'){
    expenses=expenses.filter(e=>e.id!==id);renderAll();toast('🗑️ Gasto eliminado');
    skipNextArs=fbOnline;await persistArs(null,id);
  }else{
    const t=usdTx.find(x=>x.id===id);
    if(t?.linkedArsId){expenses=expenses.filter(e=>e.id!==t.linkedArsId);skipNextArs=fbOnline;await persistArs(null,t.linkedArsId);}
    usdTx=usdTx.filter(x=>x.id!==id);renderAll();toast('🗑️ Movimiento USD eliminado');
    skipNextUsd=fbOnline;await persistUsd(null,id);
  }
}

/* ══════════════════════════════════
   TAB SWITCH
══════════════════════════════════ */
function switchTab(t){
  activeTab=t;
  document.querySelectorAll('.tab').forEach((b,i)=>{
    b.classList.toggle('on',(i===0&&t==='dashboard')||(i===1&&t==='lista')||(i===2&&t==='usd')||(i===3&&t==='saldos')||(i===4&&t==='cuentas'));
  });
  ['dashboard','lista','usd','saldos','cuentas'].forEach(s=>{
    const el=document.getElementById('tab-'+s);if(el)el.classList.toggle('on',s===t);
  });
  const inMain=t==='dashboard'||t==='lista';
  document.getElementById('fab-ars').classList.toggle('hidden',!inMain);
  document.getElementById('fab-quick').classList.toggle('hidden',!inMain);
  document.getElementById('fab-usd').classList.toggle('hidden',t!=='usd');
  document.getElementById('fab-debt').classList.toggle('hidden',t!=='saldos');
  document.getElementById('fab-account').classList.toggle('hidden',t!=='cuentas');
  if(t==='lista')renderListSec();
  if(t==='dashboard')renderDashboard();
  if(t==='usd')renderUsdTab();
  if(t==='saldos')renderSaldosTab();
  if(t==='cuentas'){loadAccounts();renderCuentasTab();}
}

/* ══════════════════════════════════
   TOAST
══════════════════════════════════ */
let toastTimer;
function toast(msg,ms=2500){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('on'),ms);}

/* ══════════════════════════════════
   MIGRATION
══════════════════════════════════ */
async function checkMigration(){
  if(!db||!currentUID)return;
  try{
    const snap=await db.ref('gastos').once('value');
    const snapUsd=await db.ref('usd').once('value');
    if(snap.val()||snapUsd.val())document.getElementById('mig-banner').classList.add('on');
  }catch(e){console.warn('Migration check:',e);}
}
async function runMigration(){
  const banner=document.getElementById('mig-banner');
  banner.querySelector('.mig-title').textContent='⏳ Migrando datos…';
  banner.querySelector('.mig-btns').style.display='none';
  try{
    let ma=0,mu=0;
    const sA=await db.ref('gastos').once('value');const aD=sA.val();
    if(aD){for(const e of Object.values(aD).filter(e=>e&&e.id)){await db.ref(arsPath(e.id)).set(e);ma++;}await db.ref('gastos').remove();}
    const sU=await db.ref('usd').once('value');const uD=sU.val();
    if(uD){for(const t of Object.values(uD).filter(t=>t&&t.id)){await db.ref(usdPath(t.id)).set(t);mu++;}await db.ref('usd').remove();}
    banner.classList.remove('on');toast(`✅ Migración: ${ma} gastos + ${mu} USD importados`,4000);
  }catch(e){console.error('Migration error:',e);banner.querySelector('.mig-title').textContent='⚠️ Error en la migración';banner.querySelector('.mig-btns').style.display='flex';toast('❌ Error al migrar');}
}
function dismissMigration(){document.getElementById('mig-banner').classList.remove('on');}

/* ══════════════════════════════════
   KEYBOARD
══════════════════════════════════ */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeUsdModal();closeDebtModal();closeSettleModal();closeConf();closeCatManager();closeContactsModal();closeAddContactModal();closeGlobalSearch();closeQuickAdd();closeTransferModal();closeAccountModal();closeGoalModal();closeBudgetModal();}
  if(e.key==='Enter'&&(document.activeElement.id==='login-email'||document.activeElement.id==='login-pass'))loginEmail();
});

/* ══════════════════════════════════
   THEME TOGGLE
══════════════════════════════════ */
function toggleTheme(){
  const light=document.body.classList.toggle('light');
  document.getElementById('btn-theme').textContent=light?'☀️':'🌙';
  localStorage.setItem('gp_theme',light?'light':'dark');
}
function loadTheme(){
  const t=localStorage.getItem('gp_theme');
  if(t==='light'){document.body.classList.add('light');document.getElementById('btn-theme').textContent='☀️';}
}

/* ══════════════════════════════════
   MAGIC LINK
══════════════════════════════════ */
async function sendMagicLink(){
  const email=document.getElementById('login-email').value.trim();
  if(!email){document.getElementById('login-err').textContent='Escribí tu email primero.';return;}
  try{
    const url=window.location.href;
    await auth.sendSignInLinkToEmail(email,{url,handleCodeInApp:true});
    localStorage.setItem('gp_magic_email',email);
    document.getElementById('magic-link-sent').style.display='block';
    document.getElementById('login-err').textContent='';
  }catch(e){document.getElementById('login-err').textContent=e.message;}
}
function checkMagicLink(){
  if(!auth||!firebase.auth().isSignInWithEmailLink(window.location.href))return;
  let email=localStorage.getItem('gp_magic_email');
  if(!email)email=prompt('Confirma tu email:');
  if(email){
    auth.signInWithEmailLink(email,window.location.href)
      .then(()=>{localStorage.removeItem('gp_magic_email');window.history.replaceState({},'',window.location.pathname);})
      .catch(e=>console.warn('Magic link error:',e));
  }
}

/* ══════════════════════════════════
   EXPORT CSV
══════════════════════════════════ */
function exportCSV(){
  const mk=document.getElementById('fil-month')?.value||nowKey();
  const rows=expenses.filter(e=>monthKey(e.date)===mk);
  if(!rows.length){toast('⚠️ No hay gastos para exportar');return;}
  const headers=['Fecha','Tipo','Categoría','Descripción','Notas','Monto Total','Mi Parte','Compartido','Recurrente'];
  const lines=[headers.join(',')];
  rows.sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
    const splitNames=e.splits?e.splits.map(s=>s.personName).join('+'):'';
    lines.push([
      e.date, e.type, e.category,
      `"${(e.description||'').replace(/"/g,'""')}"`,
      `"${(e.notes||'').replace(/"/g,'""')}"`,
      e.amount, effAmt(e),
      splitNames, e.recurring?'Sí':'No'
    ].join(','));
  });
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`gastos_${mk}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('📥 CSV descargado');
}

/* ══════════════════════════════════
   RECURRING REMINDERS
══════════════════════════════════ */
function renderRecurringReminders(){
  const mk=nowKey();
  const prevMk=getPrevMonth(mk);
  // Get all recurring templates from last month not yet entered this month
  const recurringTemplates=expenses.filter(e=>e.recurring&&monthKey(e.date)===prevMk);
  const thisMonthDescs=new Set(expenses.filter(e=>monthKey(e.date)===mk).map(e=>e.description));
  const missing=recurringTemplates.filter(e=>!thisMonthDescs.has(e.description));

  const el=document.getElementById('recurring-reminders');
  if(!missing.length){el.innerHTML='';return;}
  el.innerHTML=`<div style="background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.2);border-radius:14px;padding:14px 16px;margin-bottom:14px">
    <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:10px">🔁 Gastos recurrentes pendientes este mes</div>
    ${missing.map(e=>`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div><div style="font-size:13px;font-weight:600">${esc(e.description)}</div><div style="font-size:11px;color:var(--txt3)">${esc(e.category)} · ${fmt(e.amount)}</div></div>
        <button onclick="preloadRecurring('${e.id}')" style="padding:6px 12px;background:rgba(96,165,250,.15);border:1px solid rgba(96,165,250,.3);border-radius:8px;color:var(--blue);font-size:12px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif">＋ Agregar</button>
      </div>`).join('')}
  </div>`;
}
function getPrevMonth(mk){
  const[y,m]=mk.split('-');
  const d=new Date(parseInt(y),parseInt(m)-2,1);
  return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function preloadRecurring(templateId){
  const tmpl=expenses.find(e=>e.id===templateId);
  if(!tmpl)return;
  openModal({...tmpl,id:null,date:new Date().toISOString().split('T')[0]});
}

/* ══════════════════════════════════
   MONTH COMPARISON CHART
══════════════════════════════════ */
let monthlyChart=null;
function renderMonthlyChart(){
  const months=[];
  const now=new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  const labels=months.map(mk=>{ const[,m]=mk.split('-'); return['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m)-1]; });
  const gastos=months.map(mk=>expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Egreso').reduce((s,e)=>s+effAmt(e),0));
  const ingresos=months.map(mk=>expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Ingreso').reduce((s,e)=>s+e.amount,0));
  const box=document.getElementById('monthly-chart-box');
  if(gastos.every(v=>v===0)&&ingresos.every(v=>v===0)){box.classList.add('hidden');return;}
  box.classList.remove('hidden');
  const avgGasto=Math.round(gastos.slice(0,-1).filter(v=>v>0).reduce((s,v)=>s+v,0)/Math.max(1,gastos.slice(0,-1).filter(v=>v>0).length));
  document.getElementById('monthly-chart-sub').textContent=avgGasto>0?`· promedio ${fmt(avgGasto)}`:'';
  const ctx=document.getElementById('monthly-chart').getContext('2d');
  if(monthlyChart){monthlyChart.destroy();monthlyChart=null;}
  monthlyChart=new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[
      {label:'Ingresos',data:ingresos,backgroundColor:'rgba(74,222,128,.3)',borderColor:'rgba(74,222,128,.8)',borderWidth:1.5,borderRadius:6},
      {label:'Gastos',data:gastos,backgroundColor:'rgba(248,113,113,.3)',borderColor:'rgba(248,113,113,.8)',borderWidth:1.5,borderRadius:6}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{color:'rgba(237,232,255,.55)',font:{family:'Outfit',size:11},boxWidth:11,boxHeight:11}},
        tooltip:{bodyFont:{family:'JetBrains Mono',size:12},backgroundColor:'#1f1040',borderColor:'rgba(102,126,234,.35)',borderWidth:1,padding:10,cornerRadius:10,callbacks:{label:c=>`  ${fmt(c.raw)}`}}},
      scales:{x:{grid:{display:false},ticks:{color:'rgba(237,232,255,.4)',font:{family:'Outfit',size:11}}},
        y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'rgba(237,232,255,.4)',font:{family:'JetBrains Mono',size:11},callback:v=>v>=1000?'$'+Math.round(v/1000)+'k':fmt(v)}}}}
  });
}

/* ══════════════════════════════════
   PROJECTION CARD
══════════════════════════════════ */
function renderProjection(){
  const mk=nowKey();
  const today=new Date();
  const dayOfMonth=today.getDate();
  const daysInMonth=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  if(dayOfMonth<3){document.getElementById('proj-card').style.display='none';return;}
  const spentSoFar=expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Egreso').reduce((s,e)=>s+effAmt(e),0);
  const dailyRate=spentSoFar/dayOfMonth;
  const projected=Math.round(dailyRate*daysInMonth);
  const ing=expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Ingreso').reduce((s,e)=>s+e.amount,0);
  const projCard=document.getElementById('proj-card');
  const projVal=document.getElementById('c-proj');
  const projHint=document.getElementById('c-proj-hint');
  projCard.style.display='';
  projVal.textContent=fmt(projected);
  projVal.className='card-val '+(projected>ing&&ing>0?'r':'y');
  const remaining=Math.round(dailyRate*(daysInMonth-dayOfMonth));
  projHint.textContent=`~${fmt(remaining)} más hasta fin de mes`;
}

/* ══════════════════════════════════
   OLD DEBT NOTIFICATIONS
══════════════════════════════════ */
function oldDebtAlerts(){
  const thirtyDaysAgo=new Date();thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);
  return debts.filter(d=>{
    if(d.settled)return false;
    if(!d.date)return false;
    return new Date(d.date)<thirtyDaysAgo;
  });
}

/* ══════════════════════════════════
   GLOBAL SEARCH
══════════════════════════════════ */
function openGlobalSearch(){
  document.getElementById('gsearch-overlay').classList.add('on');
  document.getElementById('gsearch-inp').value='';
  document.getElementById('gsearch-results').innerHTML='<div class="empty" style="padding:24px 0"><div class="empty-ico">🔍</div><p>Escribí para buscar en todo</p></div>';
  setTimeout(()=>document.getElementById('gsearch-inp').focus(),200);
}
function closeGlobalSearch(){document.getElementById('gsearch-overlay').classList.remove('on');}
function gsearchOverlayClick(ev){if(ev.target===document.getElementById('gsearch-overlay'))closeGlobalSearch();}

function runGlobalSearch(){
  const q=(document.getElementById('gsearch-inp').value||'').toLowerCase().trim();
  const el=document.getElementById('gsearch-results');
  if(q.length<2){el.innerHTML='<div style="color:var(--txt3);font-size:12px;text-align:center;padding:16px">Escribí al menos 2 caracteres</div>';return;}

  const matchExp=expenses.filter(e=>(e.description||'').toLowerCase().includes(q)||(e.category||'').toLowerCase().includes(q)||(e.notes||'').toLowerCase().includes(q));
  const matchUsd=usdTx.filter(t=>(t.description||'').toLowerCase().includes(q));
  const matchDebt=debts.filter(d=>!d.settled&&((d.description||'').toLowerCase().includes(q)||(d.personName||'').toLowerCase().includes(q)));

  if(!matchExp.length&&!matchUsd.length&&!matchDebt.length){
    el.innerHTML='<div class="empty" style="padding:24px 0"><div class="empty-ico">🔍</div><p>Sin resultados para "'+esc(q)+'"</p></div>';
    return;
  }

  let html='';
  if(matchExp.length){
    html+=`<div class="div-lbl" style="margin-top:0">Gastos (${matchExp.length})</div>`;
    html+=matchExp.slice(0,8).map(e=>expHTML(e,false)).join('');
  }
  if(matchUsd.length){
    html+=`<div class="div-lbl">USD (${matchUsd.length})</div>`;
    html+=matchUsd.slice(0,5).map(t=>usdTxHTML(t)).join('');
  }
  if(matchDebt.length){
    html+=`<div class="div-lbl">Deudas (${matchDebt.length})</div>`;
    matchDebt.slice(0,5).forEach(d=>{
      const p=personById(d.personId);
      html+=`<div class="exp-item"><div class="exp-ico teal-bg">🤝</div><div class="exp-info"><div class="exp-desc">${esc(d.description)}</div><div class="exp-meta"><span>${fmtDate(d.date)}</span>·<span>${esc(d.personName)}</span></div></div><div class="exp-right"><div class="exp-amt ${d.amount>0?'i':'r'}">${d.amount>0?'+':'-'}${fmt(d.amount)}</div></div></div>`;
    });
  }
  el.innerHTML=html;
}

/* ══════════════════════════════════
   SWIPE TO DELETE
══════════════════════════════════ */
let _swipeEl=null,_swipeStartX=0,_swipeCurX=0;
document.addEventListener('touchstart',ev=>{
  const el=ev.target.closest('.swipeable');
  if(!el)return;
  _swipeEl=el; _swipeStartX=ev.touches[0].clientX; _swipeCurX=_swipeStartX;
  el.classList.add('swiping');
},{ passive:true });
document.addEventListener('touchmove',ev=>{
  if(!_swipeEl)return;
  _swipeCurX=ev.touches[0].clientX;
  const dx=_swipeCurX-_swipeStartX;
  if(dx<0&&dx>-100){_swipeEl.style.transform=`translateX(${dx}px)`;_swipeEl.classList.toggle('revealed',dx<-55);}
},{ passive:true });
document.addEventListener('touchend',()=>{
  if(!_swipeEl)return;
  const dx=_swipeCurX-_swipeStartX;
  _swipeEl.classList.remove('swiping');
  if(dx<-70){
    const id=_swipeEl.dataset.id;
    _swipeEl.style.transform='';
    _swipeEl.classList.remove('revealed');
    if(id) delExp(id,{stopPropagation:()=>{}});
  } else {
    _swipeEl.style.transform='';
    _swipeEl.classList.remove('revealed');
  }
  _swipeEl=null;
});

/* ══════════════════════════════════
   SERVICE WORKER (PWA)
══════════════════════════════════ */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(()=>console.log('[PWA] SW registered'))
      .catch(e=>console.warn('[PWA] SW error:',e));
  });
}

/* ══════════════════════════════════
   ACCOUNTS (CUENTAS)
══════════════════════════════════ */
const ACC_SK='gp_accounts_v1', TRF_SK='gp_transfers_v1';
const ACC_EMOJIS=['🏦','💳','💵','📱','🏧','💰','🪙','🏠','✈️','💻'];
const DEF_ACCOUNTS=[
  {id:'acc_santander',name:'Santander',emoji:'🏦',initialBalance:0,createdAt:Date.now()},
  {id:'acc_mp',name:'Mercado Pago',emoji:'📱',initialBalance:0,createdAt:Date.now()},
  {id:'acc_efectivo',name:'Efectivo',emoji:'💵',initialBalance:0,createdAt:Date.now()},
];
let accounts=[],transfers=[];

function loadAccounts(){
  try{accounts=JSON.parse(localStorage.getItem(lsKey(ACC_SK)))||[...DEF_ACCOUNTS];}catch{accounts=[...DEF_ACCOUNTS];}
  try{transfers=JSON.parse(localStorage.getItem(lsKey(TRF_SK)))||[];}catch{transfers=[];}
}
function saveAccounts(){
  try{localStorage.setItem(lsKey(ACC_SK),JSON.stringify(accounts));localStorage.setItem(lsKey(TRF_SK),JSON.stringify(transfers));}catch(e){}
}
function accountBalance(accId){
  const acc=accounts.find(a=>a.id===accId);
  let bal=acc?.initialBalance||0;
  expenses.forEach(e=>{if(e.accountId!==accId)return;if(e.type==='Ingreso')bal+=e.amount;else bal-=effAmt(e);});
  transfers.forEach(t=>{if(t.fromId===accId)bal-=t.amount;if(t.toId===accId)bal+=t.amount;});
  return bal;
}
function renderCuentasTab(){
  const mk=nowKey();let arsTotal=0;let html='';
  accounts.forEach(a=>{
    const bal=accountBalance(a.id);arsTotal+=bal;const bc=bal>=0?'g':'r';
    html+=`<div class="account-card" onclick="openAccountModal('${a.id}')">
      <div class="account-ava" style="background:rgba(96,165,250,.1);border-color:rgba(96,165,250,.2)">${a.emoji}</div>
      <div class="account-info"><div class="account-name">${esc(a.name)}</div><div class="account-type">${expenses.filter(e=>e.accountId===a.id&&monthKey(e.date)===mk).length} mov. este mes</div></div>
      <div class="account-bal"><div class="account-bal-val card-val ${bc}">${bal<0?'-':''}${fmt(bal)}</div>
      <button onclick="confirmDeleteAccount('${a.id}',event)" class="btn-ico del" style="margin-top:6px;width:26px;height:26px;font-size:11px">🗑️</button></div>
    </div>`;
  });
  if(!accounts.length)html='<div class="empty"><div class="empty-ico">💼</div><p>Sin billeteras. Tocá ＋ para agregar.</p></div>';
  document.getElementById('cuentas-list').innerHTML=html;
  document.getElementById('cuentas-total-ars').textContent=fmt(arsTotal);
  const mTf=transfers.filter(t=>monthKey(t.date)===mk);
  document.getElementById('cuentas-transfers-count').textContent=`${mTf.length} transferencia${mTf.length!==1?'s':''}`;
  const tHtml=transfers.length?[...transfers].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(t=>{
    const fr=accounts.find(a=>a.id===t.fromId),to=accounts.find(a=>a.id===t.toId);
    return`<div class="transfer-box"><div style="font-size:20px">${fr?.emoji||'💼'}</div>
      <div class="exp-info"><div class="exp-desc">${esc(t.description||'Transferencia')}</div><div class="exp-meta">${fmtDate(t.date)} · ${esc(fr?.name||'?')} → ${esc(to?.name||'?')}</div></div>
      <div class="exp-amt e">${fmt(t.amount)}</div>
      <button class="btn-ico del" onclick="deleteTransfer('${t.id}',event)" style="width:28px;height:28px;font-size:12px">🗑️</button></div>`;
  }).join(''):'<div class="empty"><div class="empty-ico">⇄</div><p>Sin transferencias</p></div>';
  document.getElementById('transfers-list').innerHTML=tHtml;
}
let _editAccId=null;
function openAccountModal(id=null,ev=null){
  ev?.stopPropagation?.();
  _editAccId=id;const a=id?accounts.find(x=>x.id===id):null;
  document.getElementById('account-modal-title').textContent=a?'Editar billetera':'Nueva billetera';
  document.getElementById('acc-id').value=id||'';
  document.getElementById('acc-name').value=a?.name||'';
  document.getElementById('acc-emoji-preview').textContent=a?.emoji||'🏦';
  document.getElementById('acc-initial').value=a?.initialBalance||0;
  document.getElementById('account-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('acc-name').focus(),200);
}
function closeAccountModal(){document.getElementById('account-overlay').classList.remove('on');}
function accountOverlayClick(ev){if(ev.target===document.getElementById('account-overlay'))closeAccountModal();}
function pickAccountEmoji(){
  const ex=document.getElementById('acc-emoji-picker');if(ex){ex.remove();return;}
  const g=ACC_EMOJIS.map(e=>`<span onclick="document.getElementById('acc-emoji-preview').textContent='${e}';document.getElementById('acc-emoji-picker').remove()" style="font-size:28px;cursor:pointer;padding:6px;border-radius:8px;display:inline-block">${e}</span>`).join('');
  const d=document.createElement('div');d.id='acc-emoji-picker';d.style.cssText='background:var(--modal-bg);border:1px solid var(--bdr2);border-radius:14px;padding:10px;margin-top:8px;text-align:center';d.innerHTML=g;
  document.getElementById('acc-emoji-preview').parentNode.appendChild(d);
}
function saveAccount(){
  const id=document.getElementById('acc-id').value;const name=document.getElementById('acc-name').value.trim();
  const emoji=document.getElementById('acc-emoji-preview').textContent;const initial=parseFloat(document.getElementById('acc-initial').value)||0;
  if(!name){toast('⚠️ Escribí un nombre');return;}
  const acc={id:id||'acc_'+newId(),name,emoji,initialBalance:initial,createdAt:id?accounts.find(a=>a.id===id)?.createdAt||Date.now():Date.now()};
  if(id){const i=accounts.findIndex(a=>a.id===id);if(i>-1)accounts[i]=acc;else accounts.push(acc);}else accounts.push(acc);
  saveAccounts();closeAccountModal();renderCuentasTab();haptic();toast(`✅ Billetera "${name}" ${id?'actualizada':'creada'}`);
}
function confirmDeleteAccount(id,ev){
  ev?.stopPropagation?.();const a=accounts.find(x=>x.id===id);
  pendingDel={type:'account',id};
  document.getElementById('conf-txt').textContent=`¿Eliminar la billetera "${a?.name}"?\nEsta acción no se puede deshacer.`;
  document.getElementById('conf-overlay').classList.add('on');
}
function openTransferModal(){
  if(!accounts.length){toast('⚠️ Primero creá al menos 2 billeteras');return;}
  const opts=accounts.map(a=>`<option value="${a.id}">${a.emoji} ${esc(a.name)}</option>`).join('');
  document.getElementById('tf-from').innerHTML=opts;document.getElementById('tf-to').innerHTML=opts;
  if(accounts.length>1)document.getElementById('tf-to').selectedIndex=1;
  document.getElementById('tf-amt').value='';document.getElementById('tf-desc').value='';
  document.getElementById('tf-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('transfer-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('tf-amt').focus(),200);
}
function closeTransferModal(){document.getElementById('transfer-overlay').classList.remove('on');}
function transferOverlayClick(ev){if(ev.target===document.getElementById('transfer-overlay'))closeTransferModal();}
function saveTransfer(){
  const fromId=document.getElementById('tf-from').value,toId=document.getElementById('tf-to').value;
  const amt=parseFloat(document.getElementById('tf-amt').value),date=document.getElementById('tf-date').value;
  const desc=document.getElementById('tf-desc').value.trim();
  if(fromId===toId){toast('⚠️ Elegí billeteras distintas');return;}
  if(!amt||amt<=0){toast('⚠️ Ingresá el monto');return;}
  transfers.push({id:'tf_'+newId(),fromId,toId,amount:amt,date,description:desc||'Transferencia',createdAt:Date.now()});
  saveAccounts();closeTransferModal();renderCuentasTab();haptic();toast(`✅ Transferencia de ${fmt(amt)} registrada`);
}
function deleteTransfer(id,ev){
  ev?.stopPropagation?.();const t=transfers.find(x=>x.id===id);
  pendingDel={type:'transfer',id};
  document.getElementById('conf-txt').textContent=t?`¿Eliminar transferencia "${t.description}"?\nEsta acción no se puede deshacer.`:'Esta acción no se puede deshacer.';
  document.getElementById('conf-overlay').classList.add('on');
}

/* ══════════════════════════════════
   BUDGETS (PRESUPUESTOS)
══════════════════════════════════ */
const BDG_SK='gp_budgets_v1';
let budgets={};
function loadBudgets(){try{budgets=JSON.parse(localStorage.getItem(lsKey(BDG_SK)))||{};}catch{budgets={};}}
function saveBudgets(){try{localStorage.setItem(lsKey(BDG_SK),JSON.stringify(budgets));}catch(e){}}
function renderBudgetsSection(){
  const mk=nowKey(),catData=calcByCat(mk),budgetCats=Object.keys(budgets);
  const el=document.getElementById('budgets-section');
  if(!budgetCats.length){el.innerHTML='';return;}
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="div-lbl" style="margin:0;flex:1">Presupuestos</div><button onclick="openBudgetModal()" style="font-size:11px;padding:4px 10px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf);color:var(--txt3);cursor:pointer;font-family:'Outfit',sans-serif;margin-left:10px">＋ Agregar</button></div>`;
  budgetCats.forEach(cat=>{
    const limit=budgets[cat],spent=catData[cat]||0,pct=Math.min(100,Math.round((spent/limit)*100));
    const cls=pct>=100?'over':pct>=80?'warn':'ok';
    html+=`<div class="budget-item"><div class="budget-header"><div class="budget-name">${icon(cat)} ${esc(cat)}</div><div class="budget-amounts">${fmt(spent)} / ${fmt(limit)} <button onclick="deleteBudget('${esc(cat)}')" style="font-size:10px;background:none;border:none;cursor:pointer;color:var(--txt3)">✕</button></div></div><div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div><div class="budget-pct ${cls}">${pct}%${pct>=100?' ⚠️ Excedido':pct>=80?' ⚡ Cerca del límite':''}</div></div>`;
  });
  el.innerHTML=html;
}
function deleteBudget(cat){delete budgets[cat];saveBudgets();renderBudgetsSection();}
function openBudgetModal(){
  document.getElementById('bdg-cat').innerHTML=cats.map(c=>`<option value="${esc(c)}">${icon(c)} ${c}${budgets[c]?' · '+fmt(budgets[c]):''}</option>`).join('');
  document.getElementById('bdg-amt').value='';
  document.getElementById('budget-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('bdg-amt').focus(),200);
}
function closeBudgetModal(){document.getElementById('budget-overlay').classList.remove('on');}
function budgetOverlayClick(ev){if(ev.target===document.getElementById('budget-overlay'))closeBudgetModal();}
function saveBudget(){
  const cat=document.getElementById('bdg-cat').value,amt=parseFloat(document.getElementById('bdg-amt').value);
  if(!cat){toast('⚠️ Elegí una categoría');return;}if(!amt||amt<=0){toast('⚠️ Ingresá un monto');return;}
  budgets[cat]=amt;saveBudgets();closeBudgetModal();renderBudgetsSection();haptic();toast(`✅ Presupuesto de ${fmt(amt)}/mes para ${cat}`);
}

/* ══════════════════════════════════
   GOALS (METAS)
══════════════════════════════════ */
const GOAL_SK='gp_goals_v1';
const GOAL_EMOJIS=['🎯','✈️','🏠','🚗','💻','📱','🏖️','🎓','💍','🏋️','🐾','🎸','🏡','⛵','🛍️'];
let goals=[];
function loadGoals(){try{goals=JSON.parse(localStorage.getItem(lsKey(GOAL_SK)))||[];}catch{goals=[];}}
function saveGoals(){try{localStorage.setItem(lsKey(GOAL_SK),JSON.stringify(goals));}catch(e){}}
function renderGoalsSection(){
  const el=document.getElementById('goals-section');
  if(!goals.length){el.innerHTML='';return;}
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="div-lbl" style="margin:0;flex:1">Metas de ahorro</div><button onclick="openGoalModal()" style="font-size:11px;padding:4px 10px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf);color:var(--txt3);cursor:pointer;font-family:'Outfit',sans-serif;margin-left:10px">＋ Nueva</button></div>`;
  goals.forEach(g=>{
    const pct=Math.min(100,Math.round((g.current/g.target)*100)),done=pct>=100,remaining=Math.max(0,g.target-g.current);
    html+=`<div class="goal-card"><div class="goal-header"><div class="goal-ava">${g.emoji}</div><div><div class="goal-name">${esc(g.name)} ${done?'✅':''}</div><div class="goal-target">Meta: ${fmt(g.target)}</div></div><div style="margin-left:auto;display:flex;gap:5px"><button class="btn-ico edit" onclick="openGoalModal('${g.id}')">✏️</button><button class="btn-ico del" onclick="deleteGoal('${g.id}')">🗑️</button></div></div><div class="goal-progress"><div class="goal-bar"><div class="goal-fill ${done?'done':''}" style="width:${pct}%"></div></div><div class="goal-stats"><span>Acumulado: ${fmt(g.current)}</span><span>${done?'🎉 ¡Completado!':'Faltan '+fmt(remaining)}</span><span>${pct}%</span></div></div><div class="goal-actions"><button class="btn-goal-add" onclick="addToGoal('${g.id}')">＋ Agregar ahorro</button></div></div>`;
  });
  el.innerHTML=html;
}
let _editGoalId=null;
function openGoalModal(id=null){
  _editGoalId=id;const g=id?goals.find(x=>x.id===id):null;
  document.getElementById('goal-modal-title').textContent=g?'Editar meta':'Nueva meta';
  document.getElementById('gl-id').value=id||'';document.getElementById('gl-name').value=g?.name||'';
  document.getElementById('gl-target').value=g?.target||'';document.getElementById('gl-current').value=g?.current||0;
  document.getElementById('gl-emoji-preview').textContent=g?.emoji||'🎯';
  document.getElementById('goal-overlay').classList.add('on');setTimeout(()=>document.getElementById('gl-name').focus(),200);
}
function closeGoalModal(){document.getElementById('goal-overlay').classList.remove('on');}
function goalOverlayClick(ev){if(ev.target===document.getElementById('goal-overlay'))closeGoalModal();}
function pickGoalEmoji(){
  const ex=document.getElementById('gl-emoji-picker');if(ex){ex.remove();return;}
  const g=GOAL_EMOJIS.map(e=>`<span onclick="document.getElementById('gl-emoji-preview').textContent='${e}';document.getElementById('gl-emoji-picker').remove()" style="font-size:28px;cursor:pointer;padding:6px;border-radius:8px;display:inline-block">${e}</span>`).join('');
  const d=document.createElement('div');d.id='gl-emoji-picker';d.style.cssText='background:var(--modal-bg);border:1px solid var(--bdr2);border-radius:14px;padding:10px;margin-top:8px;text-align:center';d.innerHTML=g;
  document.getElementById('gl-emoji-preview').parentNode.appendChild(d);
}
function saveGoal(){
  const id=document.getElementById('gl-id').value,name=document.getElementById('gl-name').value.trim();
  const target=parseFloat(document.getElementById('gl-target').value),current=parseFloat(document.getElementById('gl-current').value)||0;
  const emoji=document.getElementById('gl-emoji-preview').textContent;
  if(!name){toast('⚠️ Escribí un nombre');return;}if(!target||target<=0){toast('⚠️ Ingresá la meta');return;}
  const g={id:id||'goal_'+newId(),name,emoji,target,current,createdAt:id?goals.find(x=>x.id===id)?.createdAt||Date.now():Date.now()};
  if(id){const i=goals.findIndex(x=>x.id===id);if(i>-1)goals[i]=g;else goals.push(g);}else goals.push(g);
  saveGoals();closeGoalModal();renderGoalsSection();haptic();toast(`✅ Meta "${name}" ${id?'actualizada':'creada'}`);
}
function addToGoal(id){
  const g=goals.find(x=>x.id===id);if(!g)return;
  const amt=parseFloat(prompt(`¿Cuánto agregás a "${g.name}"?\nActual: ${fmt(g.current)} / ${fmt(g.target)}`));
  if(!amt||amt<=0||isNaN(amt))return;
  g.current=Math.min(g.target,g.current+amt);saveGoals();renderGoalsSection();haptic();toast(`✅ +${fmt(amt)} a "${g.name}"`);
}
function deleteGoal(id){
  const g=goals.find(x=>x.id===id);pendingDel={type:'goal',id};
  document.getElementById('conf-txt').textContent=`¿Eliminar la meta "${g?.name}"?\nEsta acción no se puede deshacer.`;
  document.getElementById('conf-overlay').classList.add('on');
}

/* ══════════════════════════════════
   STATS
══════════════════════════════════ */
function renderStats(mk){
  const rows=expenses.filter(e=>monthKey(e.date)===mk&&e.type==='Egreso');
  if(!rows.length){document.getElementById('stats-grid').style.display='none';return;}
  const{ing,real}=calcSummary(mk);
  const rate=ing>0?Math.round((1-real/ing)*100):0;
  const today=new Date().getDate(),dailyAvg=today>0?Math.round(real/today):0;
  const catMap={};rows.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+effAmt(e);});
  const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('stats-grid').style.display='grid';
  document.getElementById('st-rate').textContent=ing>0?rate+'%':'—';
  document.getElementById('st-rate').style.color=rate>20?'var(--green)':rate>0?'var(--yellow)':'var(--red)';
  document.getElementById('st-daily').textContent=dailyAvg>0?'$'+Math.round(dailyAvg/1000)+'k':'—';
  document.getElementById('st-topcat').textContent=topCat?icon(topCat[0]):'—';
}

/* ══════════════════════════════════
   QUICK ADD
══════════════════════════════════ */
let _qaCat='';
function openQuickAdd(){
  document.getElementById('qa-amt').value='';_qaCat='';
  document.getElementById('qa-cat-grid').innerHTML=cats.map(c=>`<button class="qa-cat-btn" id="qa_${c.replace(/[^a-z]/gi,'_')}" onclick="selectQaCat('${esc(c)}')" title="${esc(c)}"><span class="qa-ico">${icon(c)}</span>${esc(c.length>7?c.slice(0,7)+'…':c)}</button>`).join('');
  document.getElementById('qa-overlay').classList.add('on');
  setTimeout(()=>document.getElementById('qa-amt').focus(),200);
}
function closeQuickAdd(){document.getElementById('qa-overlay').classList.remove('on');}
function qaOverlayClick(ev){if(ev.target===document.getElementById('qa-overlay'))closeQuickAdd();}
function selectQaCat(cat){
  _qaCat=cat;
  document.querySelectorAll('.qa-cat-btn').forEach(b=>b.classList.remove('on'));
  const btn=document.getElementById('qa_'+cat.replace(/[^a-z]/gi,'_'));if(btn)btn.classList.add('on');
}
async function saveQuickAdd(){
  const amt=parseFloat(document.getElementById('qa-amt').value);
  if(!amt||amt<=0){toast('⚠️ Ingresá el monto');return;}
  if(!_qaCat){toast('⚠️ Elegí una categoría');return;}
  const exp={id:newId(),type:'Egreso',date:new Date().toISOString().split('T')[0],category:_qaCat,description:_qaCat,amount:amt,myAmount:amt,notes:null,splits:null,recurring:false,shared:false,sharedPercent:100,createdAt:Date.now(),updatedAt:Date.now()};
  expenses.push(exp);haptic();closeQuickAdd();renderAll();toast(`✅ ${icon(_qaCat)} ${fmt(amt)} en ${_qaCat}`);
  skipNextArs=fbOnline;await persistArs(exp,null);
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
initFirebase();
setTimeout(checkMagicLink,500);
