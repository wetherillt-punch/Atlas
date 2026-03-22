'use client';
import { useState, useEffect, useRef } from 'react';

const ENTITIES = ['Findr Health','BHA','Cabin/STR','Personal','Shared'];
const CATEGORIES = ['Hosting','Software','Contractor','Legal','Legal/IP','Legal/Filing','Domain','Equipment','Capital Improvement','Utilities','Financing','Office','Insurance','Travel','Other'];
const CLIENTS = ['ATRIO Health Plans','P3 Health Partners','Other'];
const PROJECTS = ['Findr Health','BHA','Cabin/STR'];
const DEFAULT_RATE = 275;
const CABIN_MONTHLY = 3370;

const SERVICES = [
  { vendor:'Google Workspace', amount:105.60, entity:'Findr Health', day:31, desc:'Email + docs + drive under findrhealth.com (4 seats)' },
  { vendor:'Vercel (Findr)', amount:20, entity:'Findr Health', day:8, desc:'Hosts the provider portal' },
  { vendor:'Vercel (Tim)', amount:20, entity:'Findr Health', day:26, desc:'Hosts Quantum Detect + personal projects' },
  { vendor:'Railway', amount:6, entity:'Findr Health', day:8, desc:'Backend API server + MongoDB database' },
  { vendor:'Anthropic API', amount:4, entity:'Findr Health', day:0, desc:'Powers AI briefing, reply suggestions, Clarity AI' },
  { vendor:'Twilio', amount:10, entity:'Findr Health', day:0, desc:'SMS doorbell — notifies patients of provider messages' },
  { vendor:'Cloudinary', amount:0, entity:'Findr Health', day:0, desc:'Image CDN for provider logos and photos (free)' },
  { vendor:'Apple Developer', amount:8.25, entity:'Findr Health', day:0, desc:'TestFlight + App Store ($99/yr)' },
  { vendor:'Neon Postgres', amount:0.03, entity:'Findr Health', day:0, desc:'PEC Beta database via Vercel — may not need' },
  { vendor:'Stripe', amount:0, entity:'Findr Health', day:0, desc:'Booking payment processing (fees on transactions only)' },
  { vendor:'Firebase', amount:0, entity:'Findr Health', day:0, desc:'Push notification infra — configured, not yet active (free)' },
  { vendor:'GitHub', amount:0, entity:'Findr Health', day:0, desc:'Source repos at github.com/Findr-Health (verify free vs paid)' },
  { vendor:'Claude Max', amount:100, entity:'Shared', day:30, desc:'All Claude chat: Findr 40% / BHA 25% / Personal 35%' },
  { vendor:'Starlink', amount:120, entity:'Cabin/STR', day:1, desc:'Cabin internet — required for STR and remote work' },
  { vendor:'SBLOC Interest', amount:3250, entity:'Cabin/STR', day:1, desc:'Interest-only on $650K property loan @ ~6%' },
  { vendor:'Apple iCloud', amount:9.99, entity:'Personal', day:1, desc:'2TB cloud storage' },
];

export default function Home() {
  const [tab, setTab] = useState('dash');
  const [expenses, setExpenses] = useState([]);
  const [time, setTime] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [f, sf] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [e, t, i, tk] = await Promise.all([
        fetch('/api/expenses').then(r=>r.json()),
        fetch('/api/time').then(r=>r.json()),
        fetch('/api/invoices').then(r=>r.json()),
        fetch('/api/tasks').then(r=>r.json()),
      ]);
      setExpenses(e); setTime(t); setInvoices(i); setTasks(tk);
    } catch(err) { console.error(err); }
    setLoading(false);
  }

  async function addExpense(data) {
    const body = data || { date:f.date||today(), vendor:f.vendor, amount:parseFloat(f.amount), entity:f.entity||'Findr Health', category:f.category||'Other' };
    if (!body.vendor || !body.amount) return;
    const r = await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    setExpenses([await r.json(), ...expenses]);
    setModal(null); sf({});
  }

  async function editExpense() {
    if (!f.vendor || !f.amount || !f.editId) return;
    const body = { id:f.editId, date:f.date, vendor:f.vendor, amount:parseFloat(f.amount), entity:f.entity, category:f.category };
    const r = await fetch('/api/expenses', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const updated = await r.json();
    setExpenses(expenses.map(e => e.id === f.editId ? updated : e));
    setModal(null); sf({});
  }

  async function addTime() {
    if (!f.hours || !f.desc) return;
    const rate = parseFloat(f.rate) || DEFAULT_RATE;
    const r = await fetch('/api/time', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ date:f.date||today(), client:f.client||'ATRIO Health Plans', description:f.desc, hours:parseFloat(f.hours), rate }) });
    setTime([await r.json(), ...time]);
    setModal(null); sf({});
  }

  async function createInvoice() {
    const client = f.invClient || 'ATRIO Health Plans';
    const r = await fetch('/api/invoices', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ client }) });
    if (r.ok) await load();
    setModal(null); sf({});
  }

  async function markPaid(id) {
    await fetch(`/api/invoices/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:'paid' }) });
    await load();
  }

  async function delExpense(id) {
    await fetch(`/api/expenses?id=${id}`, { method:'DELETE' });
    setExpenses(expenses.filter(e => e.id !== id));
  }

  async function editTime() {
    if (!f.desc || !f.hours || !f.editTimeId) return;
    const body = { id:f.editTimeId, date:f.date, client:f.client, description:f.desc, hours:parseFloat(f.hours), rate:parseFloat(f.rate)||DEFAULT_RATE };
    const r = await fetch('/api/time', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const updated = await r.json();
    setTime(time.map(t => t.id === f.editTimeId ? updated : t));
    setModal(null); sf({});
  }

  async function delTime(id) {
    await fetch(`/api/time?id=${id}`, { method:'DELETE' });
    setTime(time.filter(t => t.id !== id));
  }

  function openEditTime(t) {
    sf({ editTimeId:t.id, date:(t.date||'').split('T')[0], client:t.client, desc:t.description, hours:parseFloat(t.hours), rate:parseFloat(t.rate||DEFAULT_RATE) });
    setModal('edit-time');
  }

  async function addTask(title, project) {
    if (!title.trim()) return;
    const r = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title, project: project || null }) });
    setTasks([...tasks, await r.json()]);
  }

  async function toggleTask(id, done) {
    await fetch('/api/tasks', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, done:!done }) });
    setTasks(tasks.map(t => t.id===id ? {...t, done:!done} : t));
  }

  async function clearDone() {
    await fetch('/api/tasks?id=completed', { method:'DELETE' });
    setTasks(tasks.filter(t => !t.done));
  }

  async function delTask(id) {
    await fetch(`/api/tasks?id=${id}`, { method:'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
  }

  function openEditExpense(e) {
    sf({ editId:e.id, date:(e.date||'').split('T')[0], vendor:e.vendor, amount:parseFloat(e.amount), entity:e.entity, category:e.category });
    setModal('edit-exp');
  }

  async function deleteInvoice(id) {
    await fetch(`/api/invoices/${id}`, { method:'DELETE' });
    await load();
  }

  async function updateInvoiceStatus(id, status) {
    await fetch(`/api/invoices/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status }) });
    await load();
  }

  const today = () => new Date().toISOString().split('T')[0];
  const exp2026 = expenses.filter(e=>(e.date||'').startsWith('2026'));
  const sumE26 = (ent) => exp2026.filter(e=>e.entity===ent).reduce((s,e)=>s+parseFloat(e.amount),0);
  const unbH = time.filter(t=>t.status==='unbilled').reduce((s,t)=>s+parseFloat(t.hours),0);
  const unbA = time.filter(t=>t.status==='unbilled').reduce((s,t)=>s+parseFloat(t.hours)*parseFloat(t.rate||DEFAULT_RATE),0);
  const outstandingAmt = invoices.filter(i=>i.status==='sent').reduce((s,i)=>s+parseFloat(i.amount),0);
  const collectedAmt = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+parseFloat(i.amount),0);
  const openTasks = tasks.filter(t => !t.done);
  const flaggedTasks = openTasks.filter(t => t.title.startsWith('⚑'));
  const now = new Date();
  const monthsSinceJan = Math.max((now.getFullYear() - 2026) * 12 + now.getMonth(), 1);
  const cabinCarryYTD = monthsSinceJan * CABIN_MONTHLY;

  if (loading) return <div style={{background:'#0c0c0c',color:'#aaa',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:15}}>Loading ATLAS...</div>;

  return (
    <div style={{background:'#0c0c0c',color:'#ccc',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',fontSize:15}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}button{cursor:pointer}input,select{font-family:inherit}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}`}</style>

      <nav style={{display:'flex',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #222',background:'#0a0a0a',flexWrap:'wrap',gap:8}}>
        <div style={{fontFamily:'monospace',fontWeight:700,fontSize:16,letterSpacing:5,marginRight:20,display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#e85d45'}}>▲</span><span style={{color:'#fff'}}>ATLAS</span>
        </div>
        {[['dash','DASHBOARD'],['exp','EXPENSES'],['bha','BHA HOURS'],['tasks','TASKS']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:'none',border:'none',fontFamily:'monospace',fontSize:12,letterSpacing:2,padding:'10px 16px',color:tab===k?'#fff':'#888',borderBottom:tab===k?'2px solid #e85d45':'2px solid transparent'}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        <Btn c="#2d6b45" onClick={()=>{setModal('exp');sf({date:today()})}}>+ EXPENSE</Btn>
        <Btn c="#8B6914" onClick={()=>{setModal('hrs');sf({date:today()})}}>+ HOURS</Btn>
        {unbH>0 && <Btn c="#b03a2e" onClick={()=>{setModal('inv');sf({})}}>INVOICE ${unbA.toFixed(0)}</Btn>}
      </nav>

      <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>

      {tab==='dash' && <>
        {flaggedTasks.length>0 && (
          <Card style={{borderLeft:'3px solid #e85d45',marginBottom:16}}>
            <Lbl>NEEDS ATTENTION</Lbl>
            {flaggedTasks.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',fontSize:14,borderBottom:'1px solid #1a1a1a'}}>
                <div onClick={()=>toggleTask(t.id,t.done)} style={{width:20,height:20,borderRadius:4,border:'2px solid #e85d45',cursor:'pointer',flexShrink:0}}/>
                <span style={{flex:1,color:'#ddd'}}>{t.title.replace('⚑ ','')}</span>
                <span style={{fontFamily:'monospace',fontSize:11,color:'#666'}}>{t.project}</span>
              </div>
            ))}
            <div onClick={()=>setTab('tasks')} style={{fontSize:13,color:'#888',marginTop:10,cursor:'pointer'}}>View all tasks →</div>
          </Card>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
          <Card style={{cursor:'pointer'}} onClick={()=>setTab('exp')}>
            <Lbl>FINDR HEALTH</Lbl>
            <Big>${(sumE26('Findr Health')+sumE26('Shared')*0.4).toFixed(0)} <Sm>2026</Sm></Big>
            <Sub>Dedicated ${sumE26('Findr Health').toFixed(0)} + shared ${(sumE26('Shared')*0.4).toFixed(0)}</Sub>
            <Sub>Recurring ~$160/mo • 12 connected services</Sub>
            {openTasks.filter(t=>t.project==='Findr Health'&&!t.title.startsWith('⚑')).slice(0,1).map((t,i)=>(
              <div key={i} style={{marginTop:12,fontSize:13,color:'#e85d45'}}>→ {t.title}</div>
            ))}
          </Card>
          <Card style={{cursor:'pointer'}} onClick={()=>setTab('bha')}>
            <Lbl>BLUNT HEALTH ADVISORY</Lbl>
            {(unbH > 0 || outstandingAmt > 0 || collectedAmt > 0) ? (
              <div style={{fontSize:14,color:'#bbb',lineHeight:2}}>
                {unbH > 0 && <><span style={{color:'#e2a832',fontWeight:700,fontFamily:'monospace',fontSize:18}}>${unbA.toFixed(0)}</span><span style={{color:'#888'}}> unbilled</span><span style={{color:'#333'}}> · </span></>}
                {outstandingAmt > 0 && <><span style={{color:'#6a9bd8',fontWeight:700,fontFamily:'monospace',fontSize:18}}>${outstandingAmt.toFixed(0)}</span><span style={{color:'#888'}}> outstanding</span><span style={{color:'#333'}}> · </span></>}
                {collectedAmt > 0 && <><span style={{color:'#5a9e6f',fontWeight:700,fontFamily:'monospace',fontSize:18}}>${collectedAmt.toFixed(0)}</span><span style={{color:'#888'}}> collected</span></>}
              </div>
            ) : <div style={{fontSize:15,color:'#777',padding:'8px 0'}}>{time.length > 0 ? 'No unbilled hours' : 'No hours logged'}</div>}
            {openTasks.filter(t=>t.project==='BHA'&&!t.title.startsWith('⚑')).slice(0,1).map((t,i)=>(
              <div key={i} style={{marginTop:12,fontSize:13,color:'#e85d45'}}>→ {t.title}</div>
            ))}
          </Card>
          <Card>
            <Lbl>WILSALL CABIN / STR</Lbl>
            <Big>${cabinCarryYTD.toLocaleString()} <Sm>YTD carry</Sm></Big>
            <Sub>$3,370/mo auto-debit (SBLOC $3,250 + Starlink $120)</Sub>
            <Sub>Remodel budget: $21-43K from cash</Sub>
            <Sub>Rental income: $0 — not yet listed</Sub>
            {openTasks.filter(t=>t.project==='Cabin/STR'&&!t.title.startsWith('⚑')).slice(0,1).map((t,i)=>(
              <div key={i} style={{marginTop:12,fontSize:13,color:'#e85d45'}}>→ {t.title}</div>
            ))}
          </Card>
          <Card>
            <Lbl>SUMMARY</Lbl>
            {[['All entities 2026',`$${Math.round(exp2026.reduce((s,e)=>s+parseFloat(e.amount),0)+cabinCarryYTD).toLocaleString()}`],['Startup costs/mo','~$209'],['Cabin carry/mo','$3,370']].map(([l,v],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:14,borderBottom:'1px solid #1a1a1a',color:'#ccc'}}>
                <span>{l}</span><span style={{fontWeight:600,fontFamily:'monospace'}}>{v}</span>
              </div>
            ))}
            <Lbl style={{marginTop:18}}>DEADLINES</Lbl>
            <div style={{display:'flex',alignItems:'center',gap:12,background:'#1a0505',borderRadius:6,padding:'10px 12px',marginTop:6}}>
              <Badge c="#e85d45">APR 15</Badge>
              <span style={{fontSize:14,color:'#ddd'}}>BHA quarterly tax — <b style={{color:'#e85d45'}}>NO CPA</b></span>
            </div>
          </Card>
        </div>
      </>}

      {tab==='exp' && <ExpensesTab expenses={expenses} del={delExpense} add={addExpense} edit={openEditExpense} />}
      {tab==='bha' && <BHATab time={time} invoices={invoices} unbH={unbH} unbA={unbA} setModal={setModal} sf={sf} markPaid={markPaid} updateStatus={updateInvoiceStatus} deleteInvoice={deleteInvoice} editEntry={openEditTime} today={today} />}
      {tab==='tasks' && <TasksTab tasks={tasks} toggle={toggleTask} add={addTask} clearDone={clearDone} del={delTask} />}

      </div>

      {/* MODALS */}
      {modal && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
        <div style={{background:'#111',border:'1px solid #282828',borderRadius:10,padding:28,width:'100%',maxWidth:480,maxHeight:'90vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
          {modal==='exp' && <>
            <Mtitle>Log Expense</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Minput placeholder="Vendor" value={f.vendor||''} onChange={e=>sf({...f,vendor:e.target.value})} autoFocus />
            <Minput placeholder="Amount" type="number" step="0.01" value={f.amount||''} onChange={e=>sf({...f,amount:e.target.value})} />
            <Mselect value={f.entity||'Findr Health'} onChange={e=>sf({...f,entity:e.target.value})} opts={ENTITIES} />
            <Mselect value={f.category||'Other'} onChange={e=>sf({...f,category:e.target.value})} opts={CATEGORIES} />
            <Mbtn c="#2d6b45" onClick={()=>addExpense()}>LOG EXPENSE</Mbtn>
          </>}
          {modal==='edit-exp' && <>
            <Mtitle>Edit Expense</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Minput placeholder="Vendor" value={f.vendor||''} onChange={e=>sf({...f,vendor:e.target.value})} autoFocus />
            <Minput placeholder="Amount" type="number" step="0.01" value={f.amount||''} onChange={e=>sf({...f,amount:e.target.value})} />
            <Mselect value={f.entity||'Findr Health'} onChange={e=>sf({...f,entity:e.target.value})} opts={ENTITIES} />
            <Mselect value={f.category||'Other'} onChange={e=>sf({...f,category:e.target.value})} opts={CATEGORIES} />
            <Mbtn c="#2d6b45" onClick={editExpense}>SAVE CHANGES</Mbtn>
            <button onClick={()=>{delExpense(f.editId);setModal(null);sf({})}} style={{width:'100%',padding:12,background:'none',border:'1px solid #333',color:'#888',borderRadius:6,fontFamily:'monospace',fontSize:12,letterSpacing:1,marginTop:8,cursor:'pointer'}}>DELETE EXPENSE</button>
          </>}
          {modal==='hrs' && <>
            <Mtitle>Log BHA Hours</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Mselect value={f.client||'ATRIO Health Plans'} onChange={e=>sf({...f,client:e.target.value})} opts={CLIENTS} />
            <Minput placeholder="Description of work" value={f.desc||''} onChange={e=>sf({...f,desc:e.target.value})} autoFocus />
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}><Minput placeholder="Hours" type="number" step="0.5" value={f.hours||''} onChange={e=>sf({...f,hours:e.target.value})} /></div>
              <div style={{width:130}}><Minput placeholder="Rate" type="number" step="1" value={f.rate||DEFAULT_RATE} onChange={e=>sf({...f,rate:e.target.value})} /></div>
            </div>
            <div style={{fontFamily:'monospace',fontSize:14,color:'#e2a832',textAlign:'right',padding:'4px 0 12px'}}>${f.rate||DEFAULT_RATE}/hr × {f.hours||0} = ${((f.hours||0)*(f.rate||DEFAULT_RATE)).toFixed(2)}</div>
            <Mbtn c="#8B6914" onClick={addTime}>LOG HOURS</Mbtn>
          </>}
          {modal==='edit-time' && <>
            <Mtitle>Edit Time Entry</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Mselect value={f.client||'ATRIO Health Plans'} onChange={e=>sf({...f,client:e.target.value})} opts={CLIENTS} />
            <Minput placeholder="Description of work" value={f.desc||''} onChange={e=>sf({...f,desc:e.target.value})} autoFocus />
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}><Minput placeholder="Hours" type="number" step="0.5" value={f.hours||''} onChange={e=>sf({...f,hours:e.target.value})} /></div>
              <div style={{width:130}}><Minput placeholder="Rate" type="number" step="1" value={f.rate||DEFAULT_RATE} onChange={e=>sf({...f,rate:e.target.value})} /></div>
            </div>
            <div style={{fontFamily:'monospace',fontSize:14,color:'#e2a832',textAlign:'right',padding:'4px 0 12px'}}>${f.rate||DEFAULT_RATE}/hr × {f.hours||0} = ${((f.hours||0)*(f.rate||DEFAULT_RATE)).toFixed(2)}</div>
            <Mbtn c="#8B6914" onClick={editTime}>SAVE CHANGES</Mbtn>
            <button onClick={()=>{delTime(f.editTimeId);setModal(null);sf({})}} style={{width:'100%',padding:12,background:'none',border:'1px solid #333',color:'#888',borderRadius:6,fontFamily:'monospace',fontSize:12,letterSpacing:1,marginTop:8,cursor:'pointer'}}>DELETE TIME ENTRY</button>
          </>}
          {modal==='inv' && <>
            <Mtitle>Generate Invoice</Mtitle>
            <Mselect value={f.invClient||'ATRIO Health Plans'} onChange={e=>sf({...f,invClient:e.target.value})} opts={CLIENTS} />
            <InvPreview time={time} invoices={invoices} client={f.invClient||'ATRIO Health Plans'} onCreate={createInvoice} />
          </>}
        </div>
      </div>}
    </div>
  );
}

/* ============ EXPENSES TAB ============ */
function ExpensesTab({ expenses, del, add, edit }) {
  const [filter, setFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('all');

  let filtered = filter==='All' ? expenses : expenses.filter(e=>e.entity===filter);
  if (yearFilter!=='all') filtered = filtered.filter(e=>(e.date||'').startsWith(yearFilter));

  const total = filtered.reduce((s,e)=>s+parseFloat(e.amount),0);

  // Category summary for current filtered view
  const catSummary = {};
  filtered.forEach(e => {
    const cat = e.category || 'Other';
    catSummary[cat] = (catSummary[cat] || 0) + parseFloat(e.amount);
  });
  const catRows = Object.entries(catSummary).sort((a,b) => b[1] - a[1]);

  function exportCSV() {
    const entityLabel = filter === 'All' ? 'All Entities' : filter;
    const yearLabel = yearFilter === 'all' ? 'All Time' : yearFilter;
    let csv = `${entityLabel} — ${yearLabel} Expenses\n\n`;
    csv += 'Date,Vendor,Amount,Entity,Category\n';
    csv += filtered.map(e =>
      `${(e.date||'').split('T')[0]},"${e.vendor}",${parseFloat(e.amount).toFixed(2)},${e.entity},${e.category}`
    ).join('\n');
    csv += '\n\n--- CATEGORY SUMMARY ---\nCategory,Total\n';
    csv += catRows.map(([cat, amt]) => `${cat},$${amt.toFixed(2)}`).join('\n');
    csv += `\n\nTOTAL,$${total.toFixed(2)}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fname = `${(filter === 'All' ? 'all-entities' : filter.replace(/[\s\/]/g, '-').toLowerCase())}-${yearFilter === 'all' ? 'all-time' : yearFilter}-expenses.csv`;
    a.href = url;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:18,flexWrap:'wrap',gap:8}}>
      <div>
        <span style={{fontSize:18,fontWeight:700,color:'#fff'}}>{filter === 'All' ? 'All Entities' : filter}</span>
        <span style={{fontSize:14,color:'#aaa',marginLeft:10}}>— {yearFilter === 'all' ? 'All Time' : yearFilter}</span>
        <span style={{fontSize:14,color:'#888',marginLeft:10}}>| {filtered.length} transactions | ${total.toFixed(2)}</span>
      </div>
      <button onClick={exportCSV} style={{background:'none',border:'1px solid #333',borderRadius:5,padding:'8px 16px',color:'#aaa',fontFamily:'monospace',fontSize:11,letterSpacing:1,cursor:'pointer'}}>EXPORT CSV ↓</button>
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      {['All','Findr Health','BHA','Cabin/STR','Personal','Shared'].map(f=>(
        <Fbtn key={f} active={filter===f} onClick={()=>setFilter(f)}>{f}</Fbtn>
      ))}
      <div style={{width:1,height:22,background:'#333',margin:'0 6px'}}/>
      {[['all','All'],['2025','2025'],['2026','2026']].map(([k,l])=>(
        <Fbtn key={k} active={yearFilter===k} onClick={()=>setYearFilter(k)}>{l}</Fbtn>
      ))}
    </div>

    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr>{['Date','Vendor','Amount','Entity','Category',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>{filtered.map(e=>(
        <tr key={e.id} onClick={()=>edit(e)} style={{borderBottom:'1px solid #1a1a1a',cursor:'pointer',transition:'background 0.1s'}} onMouseEnter={ev=>ev.currentTarget.style.background='#181818'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
          <Td>{(e.date||'').split('T')[0]}</Td>
          <Td c="#ddd">{e.vendor}</Td>
          <TdR>${parseFloat(e.amount).toFixed(2)}</TdR>
          <Td><Etag e={e.entity}/></Td>
          <Td>{e.category}</Td>
          <TdR><span style={{color:'#333',fontSize:13}}>edit</span></TdR>
        </tr>
      ))}</tbody>
    </table>
    {filtered.length>0 && <div style={{textAlign:'right',padding:'14px 0',fontWeight:700,fontFamily:'monospace',fontSize:16,color:'#fff'}}>Total: ${total.toFixed(2)}</div>}

    {/* Category summary — CPA view */}
    {catRows.length>0 && (
      <div style={{marginTop:20,marginBottom:36,borderTop:'1px solid #222',paddingTop:20}}>
        <Lbl>CATEGORY SUMMARY</Lbl>
        <table style={{width:'100%',maxWidth:400,borderCollapse:'collapse',marginTop:8}}>
          <thead><tr><Th>Category</Th><Th>Total</Th></tr></thead>
          <tbody>
            {catRows.map(([cat,amt],i)=>(
              <tr key={i} style={{borderBottom:'1px solid #1a1a1a'}}>
                <Td c="#ddd">{cat}</Td>
                <TdR>${amt.toFixed(2)}</TdR>
              </tr>
            ))}
            <tr style={{borderTop:'2px solid #333'}}>
              <td style={{padding:'11px 12px',fontSize:14,fontWeight:700,color:'#fff'}}>TOTAL</td>
              <TdR style={{fontWeight:700,color:'#fff'}}>${total.toFixed(2)}</TdR>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    <div style={{marginTop:20,borderTop:'1px solid #222',paddingTop:20}}>
      <Lbl>ALL SERVICES — WHAT YOU'RE PAYING FOR</Lbl>
      <table style={{width:'100%',borderCollapse:'collapse',marginTop:10}}>
        <thead><tr>{['Service','Cost','Entity','Purpose'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{SERVICES.map((s,i)=>(
          <tr key={i} style={{borderBottom:'1px solid #1a1a1a'}}>
            <Td c="#ddd">{s.vendor}</Td>
            <TdR>{s.amount>0?`$${s.amount.toFixed(2)}`:'Free'}</TdR>
            <Td><Etag e={s.entity}/></Td>
            <Td c="#aaa">{s.desc}</Td>
          </tr>
        ))}</tbody>
      </table>
      <div style={{fontSize:13,color:'#777',marginTop:14,fontFamily:'monospace'}}>
        Findr paid: ~$174/mo • Free: Cloudinary, Firebase, GitHub, Stripe (tx only)
      </div>
    </div>
  </>;
}

/* ============ BHA TAB ============ */
function BHATab({ time, invoices, unbH, unbA, setModal, sf, markPaid, updateStatus, deleteInvoice, editEntry, today }) {
  const outstandingAmt = invoices.filter(i=>i.status==='sent').reduce((s,i)=>s+parseFloat(i.amount),0);
  const collectedAmt = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+parseFloat(i.amount),0);
  const [editingInv, setEditingInv] = useState(null);

  function exportBHA() {
    let csv = 'Blunt Health Advisory LLC — Revenue Report\n\n';
    csv += '--- TIME ENTRIES ---\nDate,Client,Description,Hours,Rate,Amount,Status\n';
    csv += time.map(t => `${(t.date||'').split('T')[0]},${t.client},"${t.description}",${parseFloat(t.hours).toFixed(1)},${parseFloat(t.rate||DEFAULT_RATE)},${(parseFloat(t.hours)*parseFloat(t.rate||DEFAULT_RATE)).toFixed(2)},${t.status}`).join('\n');
    csv += '\n\n--- INVOICES ---\nNumber,Client,Hours,Amount,Date Sent,Due Date,Status\n';
    csv += invoices.map(i => `${i.number},${i.client},${parseFloat(i.hours).toFixed(1)},${parseFloat(i.amount).toFixed(2)},${(i.date_sent||'').split('T')[0]},${(i.due_date||'').split('T')[0]},${i.status}`).join('\n');
    csv += `\n\n--- SUMMARY ---\nTotal Hours,${time.reduce((s,t)=>s+parseFloat(t.hours),0).toFixed(1)}`;
    csv += `\nUnbilled,$${unbA.toFixed(2)}`;
    csv += `\nOutstanding,$${outstandingAmt.toFixed(2)}`;
    csv += `\nCollected,$${collectedAmt.toFixed(2)}`;
    csv += `\nTotal Billed,$${(outstandingAmt + collectedAmt).toFixed(2)}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bha-revenue-report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
      <div>
        {(unbH > 0 || outstandingAmt > 0 || collectedAmt > 0 || time.length > 0) ? (
          <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'baseline'}}>
            <div><span style={{fontSize:28,fontWeight:700,fontFamily:'monospace',color:'#e2a832'}}>${unbA.toFixed(0)}</span><div style={{fontSize:12,color:'#888',marginTop:2}}>unbilled</div></div>
            <div><span style={{fontSize:28,fontWeight:700,fontFamily:'monospace',color:'#6a9bd8'}}>${outstandingAmt.toFixed(0)}</span><div style={{fontSize:12,color:'#888',marginTop:2}}>outstanding</div></div>
            <div><span style={{fontSize:28,fontWeight:700,fontFamily:'monospace',color:'#5a9e6f'}}>${collectedAmt.toFixed(0)}</span><div style={{fontSize:12,color:'#888',marginTop:2}}>collected</div></div>
          </div>
        ) : <div style={{fontSize:16,color:'#888'}}>No hours logged yet</div>}
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={exportBHA} style={{background:'none',border:'1px solid #333',borderRadius:5,padding:'8px 16px',color:'#aaa',fontFamily:'monospace',fontSize:11,letterSpacing:1,cursor:'pointer'}}>EXPORT CSV ↓</button>
        <Btn c="#8B6914" onClick={()=>{setModal('hrs');sf({date:today()})}}>+ LOG HOURS</Btn>
        {unbH>0 && <Btn c="#b03a2e" onClick={()=>{setModal('inv');sf({})}}>GENERATE INVOICE</Btn>}
      </div>
    </div>
    <Lbl>TIME ENTRIES</Lbl>
    <table style={{width:'100%',borderCollapse:'collapse',marginTop:10}}>
      <thead><tr>{['Date','Client','Description','Hours','Rate','Amount','Status',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>
        {time.map(t=>(
          <tr key={t.id} onClick={()=>editEntry(t)} style={{borderBottom:'1px solid #1a1a1a',cursor:'pointer',transition:'background 0.1s'}} onMouseEnter={ev=>ev.currentTarget.style.background='#181818'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
            <Td>{(t.date||'').split('T')[0]}</Td><Td c="#ddd">{t.client}</Td><Td>{t.description}</Td>
            <TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${parseFloat(t.rate||DEFAULT_RATE).toFixed(0)}</TdR><TdR>${(parseFloat(t.hours)*parseFloat(t.rate||DEFAULT_RATE)).toFixed(2)}</TdR>
            <Td><Stag s={t.status}/></Td>
            <TdR><span style={{color:'#333',fontSize:13}}>edit</span></TdR>
          </tr>
        ))}
        {time.length===0 && <tr><td colSpan={8} style={{textAlign:'center',padding:48,color:'#777',fontSize:15}}>No hours logged. Click "+ LOG HOURS" to start tracking.</td></tr>}
      </tbody>
    </table>
    {invoices.length>0 && <>
      <Lbl style={{marginTop:36}}>INVOICES</Lbl>
      <table style={{width:'100%',borderCollapse:'collapse',marginTop:10}}>
        <thead><tr>{['Invoice','Client','Hours','Amount','Sent','Due','Status','Actions'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{invoices.map(inv=>(
          <tr key={inv.id} style={{borderBottom:'1px solid #1a1a1a'}}>
            <Td c="#ddd">{inv.number}</Td><Td>{inv.client}</Td>
            <TdR>{parseFloat(inv.hours).toFixed(1)}</TdR><TdR>${parseFloat(inv.amount).toFixed(2)}</TdR>
            <Td>{(inv.date_sent||'').split('T')[0]}</Td><Td>{(inv.due_date||'').split('T')[0]}</Td>
            <Td>
              {editingInv===inv.id ? (
                <select value={inv.status} onChange={e=>{updateStatus(inv.id,e.target.value);setEditingInv(null)}} onBlur={()=>setEditingInv(null)} autoFocus
                  style={{background:'#0a0a0a',border:'1px solid #333',borderRadius:4,padding:'4px 8px',color:'#ddd',fontSize:13,outline:'none'}}>
                  <option value="sent">sent</option>
                  <option value="paid">paid</option>
                </select>
              ) : (
                <span onClick={()=>setEditingInv(inv.id)} style={{cursor:'pointer'}}><Stag s={inv.status}/></span>
              )}
            </Td>
            <Td>
              <div style={{display:'flex',gap:10}}>
                <a href={`/invoice/${inv.id}`} style={{fontFamily:'monospace',fontSize:11,color:'#e2a832',letterSpacing:1,textDecoration:'none',fontWeight:600}}>VIEW →</a>
                <button onClick={()=>deleteInvoice(inv.id)} style={{background:'none',border:'none',fontFamily:'monospace',fontSize:11,color:'#e85d45',letterSpacing:1,cursor:'pointer',fontWeight:600}}>DELETE</button>
              </div>
            </Td>
          </tr>
        ))}</tbody>
      </table>
    </>}
  </>;
}

/* ============ TASKS ============ */
function TasksTab({ tasks, toggle, add, clearDone, del }) {
  const [input, setInput] = useState('');
  const [project, setProject] = useState('');
  const inputRef = useRef(null);
  const pending = tasks.filter(t=>!t.done);
  const done = tasks.filter(t=>t.done);

  function handleAdd() {
    if (!input.trim()) return;
    add(input, project || null);
    setInput('');
    inputRef.current?.focus();
  }

  return <>
    <div style={{display:'flex',gap:8,marginBottom:28,alignItems:'center'}}>
      <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()}
        placeholder="Add a task and press enter..."
        style={{flex:1,background:'#151515',border:'1px solid #282828',borderRadius:6,padding:'14px 18px',color:'#ddd',fontSize:15,outline:'none'}} />
      <select value={project} onChange={e=>setProject(e.target.value)} style={{background:'#151515',border:'1px solid #282828',borderRadius:6,padding:'14px 12px',color:'#aaa',fontSize:13,outline:'none',width:140}}>
        <option value="">No project</option>
        {PROJECTS.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
      {done.length>0 && <button onClick={clearDone} style={{background:'none',border:'1px solid #333',borderRadius:6,padding:'10px 18px',color:'#888',fontFamily:'monospace',fontSize:11,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap'}}>CLEAR DONE ({done.length})</button>}
    </div>
    {pending.map(t=>(
      <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid #1a1a1a'}}>
        <div onClick={()=>toggle(t.id,t.done)} style={{width:22,height:22,borderRadius:4,border:'2px solid #555',cursor:'pointer',flexShrink:0}} />
        <span style={{flex:1,fontSize:15,color:'#ddd'}}>{t.title}</span>
        {t.project && <span style={{fontFamily:'monospace',fontSize:11,color:'#666',letterSpacing:1}}>{t.project}</span>}
        <button onClick={()=>del(t.id)} style={{background:'none',border:'none',color:'#333',fontSize:18,cursor:'pointer',padding:'0 6px'}}>×</button>
      </div>
    ))}
    {done.length>0 && <>
      <div style={{marginTop:28,marginBottom:10,fontFamily:'monospace',fontSize:12,letterSpacing:2,color:'#666'}}>COMPLETED</div>
      {done.map(t=>(
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid #141414',opacity:0.35}}>
          <div onClick={()=>toggle(t.id,t.done)} style={{width:22,height:22,borderRadius:4,border:'2px solid #5a9e6f',background:'#5a9e6f',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff'}}>✓</div>
          <span style={{flex:1,fontSize:15,textDecoration:'line-through'}}>{t.title}</span>
          <button onClick={()=>del(t.id)} style={{background:'none',border:'none',color:'#333',fontSize:18,cursor:'pointer',padding:'0 6px'}}>×</button>
        </div>
      ))}
    </>}
    {pending.length===0 && done.length===0 && <div style={{textAlign:'center',padding:56,color:'#666',fontSize:16}}>No tasks. Type above and press enter.</div>}
  </>;
}

/* ============ INVOICE PREVIEW ============ */
function InvPreview({ time, invoices, client, onCreate }) {
  const ub = time.filter(t=>t.status==='unbilled'&&t.client===client);
  const th = ub.reduce((s,t)=>s+parseFloat(t.hours),0);
  const ta = ub.reduce((s,t)=>s+parseFloat(t.hours)*parseFloat(t.rate||DEFAULT_RATE),0);
  if (!ub.length) return <div style={{textAlign:'center',padding:24,color:'#777',fontSize:15}}>No unbilled hours for {client}</div>;
  return <div>
    <div style={{background:'#0a0a0a',border:'1px solid #222',borderRadius:8,padding:24,margin:'14px 0'}}>
      <div style={{fontFamily:'monospace',fontWeight:700,fontSize:15,color:'#fff',letterSpacing:2}}>BLUNT HEALTH ADVISORY LLC</div>
      <div style={{fontFamily:'monospace',fontSize:12,color:'#888',marginTop:6}}>Invoice BHA-{String(invoices.length+1).padStart(3,'0')} | {new Date().toLocaleDateString()} | Net 30</div>
      <div style={{fontSize:14,color:'#aaa',marginTop:10}}>Bill to: {client}</div>
      <table style={{width:'100%',marginTop:14,borderCollapse:'collapse'}}>
        <thead><tr>{['Date','Description','Hrs','Rate','Amount'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>
          {ub.map((t,i)=><tr key={i}><Td>{(t.date||'').split('T')[0]}</Td><Td>{t.description}</Td><TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${parseFloat(t.rate||DEFAULT_RATE).toFixed(0)}</TdR><TdR>${(parseFloat(t.hours)*parseFloat(t.rate||DEFAULT_RATE)).toFixed(2)}</TdR></tr>)}
          <tr style={{borderTop:'2px solid #333'}}><td colSpan={3} style={{padding:10,fontWeight:700,fontSize:14,color:'#fff'}}>TOTAL DUE</td><TdR style={{fontWeight:700}}>{th.toFixed(1)}</TdR><td style={{padding:10,textAlign:'right',fontWeight:700,fontFamily:'monospace',fontSize:18,color:'#e85d45'}}>${ta.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>
    <Mbtn c="#b03a2e" onClick={onCreate}>APPROVE & MARK INVOICED</Mbtn>
  </div>;
}

/* ============ SHARED ============ */
function Card({children,style={},onClick}) { return <div onClick={onClick} style={{background:'#111',border:'1px solid #222',borderRadius:8,padding:20,...style}}>{children}</div>; }
function Lbl({children,style={}}) { return <div style={{fontFamily:'monospace',fontSize:12,fontWeight:600,letterSpacing:2,color:'#888',marginBottom:12,...style}}>{children}</div>; }
function Big({children,style={}}) { return <div style={{fontSize:32,fontWeight:700,fontFamily:'monospace',color:'#fff',...style}}>{children}</div>; }
function Sm({children}) { return <span style={{fontSize:14,fontWeight:400,color:'#888'}}>{children}</span>; }
function Sub({children}) { return <div style={{fontSize:14,color:'#999',marginTop:4}}>{children}</div>; }
function Badge({children,c}) { return <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,letterSpacing:1,padding:'3px 10px',borderRadius:4,background:`${c}20`,color:c,flexShrink:0}}>{children}</span>; }
function Btn({children,c,onClick}) { return <button onClick={onClick} style={{background:c,border:'none',color:'#fff',fontFamily:'monospace',fontSize:11,fontWeight:600,letterSpacing:1,padding:'10px 18px',borderRadius:5}}>{children}</button>; }
function Fbtn({children,active,onClick}) { return <button onClick={onClick} style={{background:active?'#222':'transparent',border:'1px solid #282828',borderRadius:4,padding:'6px 14px',color:active?'#fff':'#888',fontFamily:'monospace',fontSize:10,letterSpacing:1,cursor:'pointer'}}>{children}</button>; }
function Th({children}) { return <th style={{fontFamily:'monospace',fontSize:11,fontWeight:600,letterSpacing:1,color:'#777',textAlign:'left',padding:'10px 12px',borderBottom:'1px solid #222'}}>{children}</th>; }
function Td({children,c='#ccc',style={}}) { return <td style={{fontSize:14,padding:'11px 12px',color:c,...style}}>{children}</td>; }
function TdR({children,style={}}) { return <td style={{fontSize:14,padding:'11px 12px',color:'#ddd',textAlign:'right',fontFamily:'monospace',...style}}>{children}</td>; }
function Etag({e}) { const c={'Findr Health':'#5a9e6f','BHA':'#e2a832','Cabin/STR':'#8B6914','Shared':'#999','Personal':'#999'}[e]||'#999'; return <span style={{fontFamily:'monospace',fontSize:11,padding:'3px 10px',borderRadius:4,background:`${c}20`,color:c}}>{e}</span>; }
function Stag({s}) { const c=s==='unbilled'?'#e2a832':s==='sent'?'#6a9bd8':s==='paid'?'#5a9e6f':'#888'; return <span style={{fontFamily:'monospace',fontSize:11,padding:'3px 10px',borderRadius:4,background:`${c}20`,color:c}}>{s}</span>; }
function Mtitle({children}) { return <div style={{fontFamily:'monospace',fontSize:15,fontWeight:700,color:'#fff',marginBottom:20,letterSpacing:2}}>{children}</div>; }
function Minput(props) { return <input {...props} style={{width:'100%',background:'#0a0a0a',border:'1px solid #222',borderRadius:6,padding:'12px 14px',color:'#ddd',fontSize:15,marginBottom:12,outline:'none'}} />; }
function Mselect({value,onChange,opts}) { return <select value={value} onChange={onChange} style={{width:'100%',background:'#0a0a0a',border:'1px solid #222',borderRadius:6,padding:'12px 14px',color:'#ddd',fontSize:15,marginBottom:12,outline:'none'}}>{opts.map(o=><option key={o}>{o}</option>)}</select>; }
function Mbtn({children,c,onClick}) { return <button onClick={onClick} style={{width:'100%',padding:14,background:c,border:'none',color:'#fff',borderRadius:6,fontFamily:'monospace',fontSize:13,fontWeight:700,letterSpacing:2,marginTop:6,cursor:'pointer'}}>{children}</button>; }
const qi = {background:'#0c0c0c',border:'1px solid #282828',borderRadius:4,padding:'10px 12px',color:'#ddd',fontSize:14,outline:'none',flex:1,minWidth:80};
