'use client';
import { useState, useEffect, useRef } from 'react';

const ENTITIES = ['Findr Health','BHA','Cabin/STR','Personal','Shared'];
const CATEGORIES = ['Hosting','Software','Contractor','Legal','Legal/IP','Legal/Filing','Domain','Equipment','Capital Improvement','Utilities','Financing','Office','Insurance','Travel','Other'];
const CLIENTS = ['ATRIO Health Plans','P3 Health Partners','Other'];
const RATE = 250;

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

const GAPS = [
  { item:'Twilio invoices', pri:'HIGH', action:'Pull from Twilio dashboard', entity:'Findr Health' },
  { item:'Find CPA', pri:'HIGH', action:'April 15 quarterly estimate — 28 days', entity:'BHA' },
  { item:'Cell phone bill', pri:'MED', action:'Need amount for business split', entity:'Shared' },
  { item:'DTeam status', pri:'MED', action:'Any invoices after Dec 2025?', entity:'Findr Health' },
  { item:'Cabin insurance $', pri:'MED', action:'On 6-mo plan, amount unknown', entity:'Cabin/STR' },
  { item:'Polaris price', pri:'MED', action:'Log purchase amount', entity:'Cabin/STR' },
  { item:'GitHub billing', pri:'LOW', action:'Free or paid?', entity:'Findr Health' },
  { item:'Stripe fees', pri:'LOW', action:'Track booking fees', entity:'Findr Health' },
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

  async function addTime() {
    if (!f.hours || !f.desc) return;
    const r = await fetch('/api/time', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ date:f.date||today(), client:f.client||'ATRIO Health Plans', description:f.desc, hours:parseFloat(f.hours) }) });
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

  async function addTask(title) {
    if (!title.trim()) return;
    const r = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title }) });
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

  const today = () => new Date().toISOString().split('T')[0];
  const sumE = (ent) => expenses.filter(e=>e.entity===ent).reduce((s,e)=>s+parseFloat(e.amount),0);
  const unbH = time.filter(t=>t.status==='unbilled').reduce((s,t)=>s+parseFloat(t.hours),0);
  const unbA = unbH * RATE;

  if (loading) return <div style={{background:'#0c0c0c',color:'#999',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:14}}>Loading ATLAS...</div>;

  return (
    <div style={{background:'#0c0c0c',color:'#ccc',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}button{cursor:pointer}input,select{font-family:inherit}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}`}</style>

      {/* NAV */}
      <nav style={{display:'flex',alignItems:'center',padding:'10px 20px',borderBottom:'1px solid #222',background:'#0a0a0a',flexWrap:'wrap',gap:8}}>
        <div style={{fontFamily:'monospace',fontWeight:700,fontSize:15,letterSpacing:5,marginRight:20,display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#e85d45'}}>▲</span><span style={{color:'#fff'}}>ATLAS</span>
        </div>
        {[['dash','DASHBOARD'],['exp','EXPENSES'],['bha','BHA HOURS'],['tasks','TASKS']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:'none',border:'none',fontFamily:'monospace',fontSize:10,letterSpacing:2,padding:'8px 14px',color:tab===k?'#fff':'#777',borderBottom:tab===k?'2px solid #e85d45':'2px solid transparent'}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        <Btn c="#2d6b45" onClick={()=>{setModal('exp');sf({date:today()})}}>+ EXPENSE</Btn>
        <Btn c="#8B6914" onClick={()=>{setModal('hrs');sf({date:today()})}}>+ HOURS</Btn>
        {unbH>0 && <Btn c="#b03a2e" onClick={()=>{setModal('inv');sf({})}}>INVOICE ${unbA.toFixed(0)}</Btn>}
      </nav>

      <div style={{maxWidth:1100,margin:'0 auto',padding:20}}>

      {/* ========== DASHBOARD ========== */}
      {tab==='dash' && <>
        {GAPS.filter(g=>g.pri==='HIGH').length>0 && (
          <Card style={{borderLeft:'3px solid #e85d45',marginBottom:14}}>
            <Lbl>ACTION REQUIRED</Lbl>
            {GAPS.filter(g=>g.pri==='HIGH').map((g,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',fontSize:13,borderBottom:'1px solid #1a1a1a'}}>
                <Badge c="#e85d45">{g.pri}</Badge>
                <b style={{color:'#eee'}}>{g.item}</b>
                <span style={{color:'#999'}}>— {g.action}</span>
                <span style={{marginLeft:'auto',fontFamily:'monospace',fontSize:9,color:'#666'}}>{g.entity}</span>
              </div>
            ))}
          </Card>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
          {/* Findr */}
          <Card style={{cursor:'pointer'}} onClick={()=>setTab('exp')}>
            <Lbl>FINDR HEALTH</Lbl>
            <Big>${(sumE('Findr Health')+sumE('Shared')*0.4).toFixed(0)} <Sm>YTD</Sm></Big>
            <Sub>Dedicated ${sumE('Findr Health').toFixed(0)} + shared ${(sumE('Shared')*0.4).toFixed(0)}</Sub>
            <Sub>Recurring ~$160/mo • 12 connected services</Sub>
          </Card>

          {/* BHA */}
          <Card style={{cursor:'pointer'}} onClick={()=>setTab('bha')}>
            <Lbl>BLUNT HEALTH ADVISORY</Lbl>
            {unbH>0 ? <>
              <Big style={{color:'#e2a832'}}>${unbA.toFixed(0)} <Sm>unbilled</Sm></Big>
              <Sub>{unbH} hrs @ ${RATE}/hr</Sub>
            </> : <>
              <Big style={{color:'#5a9e6f'}}>$0 <Sm>unbilled</Sm></Big>
              <Sub>No hours pending</Sub>
            </>}
            {invoices.reduce((s,i)=>s+parseFloat(i.amount),0)>0 && <Sub>Invoiced YTD: ${invoices.reduce((s,i)=>s+parseFloat(i.amount),0).toFixed(0)}</Sub>}
          </Card>

          {/* Cabin */}
          <Card>
            <Lbl>WILSALL CABIN / STR</Lbl>
            <Big>${sumE('Cabin/STR').toFixed(0)} <Sm>YTD</Sm></Big>
            <Sub>Monthly carry: $3,370 (SBLOC + Starlink)</Sub>
            <Sub>Remodel budget: $21-43K</Sub>
            <Sub>Rental income: $0</Sub>
          </Card>

          {/* Summary */}
          <Card>
            <Lbl>SUMMARY</Lbl>
            {[['All entities YTD',`$${expenses.reduce((s,e)=>s+parseFloat(e.amount),0).toFixed(0)}`],['Startup costs/mo','~$209'],['Cabin carry/mo','$3,370']].map(([l,v],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',fontSize:13,borderBottom:'1px solid #1a1a1a',color:'#ccc'}}>
                <span>{l}</span><span style={{fontWeight:600,fontFamily:'monospace'}}>{v}</span>
              </div>
            ))}
            <Lbl style={{marginTop:16}}>DEADLINES</Lbl>
            <div style={{display:'flex',alignItems:'center',gap:10,background:'#1a0505',borderRadius:4,padding:'8px 10px',marginTop:4}}>
              <Badge c="#e85d45">28d</Badge>
              <span style={{fontSize:13,color:'#ddd'}}>BHA quarterly tax — <b style={{color:'#e85d45'}}>NO CPA</b></span>
            </div>
          </Card>
        </div>

        <Card style={{marginTop:14}}>
          <Lbl>RECEIPT GAPS & OPEN ITEMS</Lbl>
          {GAPS.map((g,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',fontSize:12,borderBottom:'1px solid #1a1a1a'}}>
              <Badge c={g.pri==='HIGH'?'#e85d45':g.pri==='MED'?'#e2a832':'#666'}>{g.pri}</Badge>
              <b style={{color:'#ddd'}}>{g.item}</b>
              <span style={{color:'#999'}}>— {g.action}</span>
              <span style={{marginLeft:'auto',fontFamily:'monospace',fontSize:9,color:'#666'}}>{g.entity}</span>
            </div>
          ))}
        </Card>
      </>}

      {/* ========== EXPENSES ========== */}
      {tab==='exp' && <ExpensesTab expenses={expenses} del={delExpense} add={addExpense} />}

      {/* ========== BHA ========== */}
      {tab==='bha' && <BHATab time={time} invoices={invoices} unbH={unbH} unbA={unbA} setModal={setModal} sf={sf} markPaid={markPaid} today={today} />}

      {/* ========== TASKS ========== */}
      {tab==='tasks' && <TasksTab tasks={tasks} toggle={toggleTask} add={addTask} clearDone={clearDone} del={delTask} />}

      </div>

      {/* ========== MODALS ========== */}
      {modal && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
        <div style={{background:'#111',border:'1px solid #282828',borderRadius:10,padding:24,width:'100%',maxWidth:460,maxHeight:'90vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
          {modal==='exp' && <>
            <Mtitle>Log Expense</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Minput placeholder="Vendor" value={f.vendor||''} onChange={e=>sf({...f,vendor:e.target.value})} autoFocus />
            <Minput placeholder="Amount" type="number" step="0.01" value={f.amount||''} onChange={e=>sf({...f,amount:e.target.value})} />
            <Mselect value={f.entity||'Findr Health'} onChange={e=>sf({...f,entity:e.target.value})} opts={ENTITIES} />
            <Mselect value={f.category||'Other'} onChange={e=>sf({...f,category:e.target.value})} opts={CATEGORIES} />
            <button onClick={()=>addExpense()} style={{width:'100%',padding:12,background:'#2d6b45',border:'none',color:'#fff',borderRadius:6,fontFamily:'monospace',fontSize:12,fontWeight:700,letterSpacing:2,marginTop:4}}>LOG EXPENSE</button>
          </>}
          {modal==='hrs' && <>
            <Mtitle>Log BHA Hours</Mtitle>
            <Minput type="date" value={f.date||''} onChange={e=>sf({...f,date:e.target.value})} />
            <Mselect value={f.client||'ATRIO Health Plans'} onChange={e=>sf({...f,client:e.target.value})} opts={CLIENTS} />
            <Minput placeholder="Description of work" value={f.desc||''} onChange={e=>sf({...f,desc:e.target.value})} autoFocus />
            <Minput placeholder="Hours" type="number" step="0.5" value={f.hours||''} onChange={e=>sf({...f,hours:e.target.value})} />
            <div style={{fontFamily:'monospace',fontSize:13,color:'#e2a832',textAlign:'right',padding:'4px 0 8px'}}>${RATE}/hr × {f.hours||0} = ${((f.hours||0)*RATE).toFixed(2)}</div>
            <button onClick={addTime} style={{width:'100%',padding:12,background:'#8B6914',border:'none',color:'#fff',borderRadius:6,fontFamily:'monospace',fontSize:12,fontWeight:700,letterSpacing:2}}>LOG HOURS</button>
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
function ExpensesTab({ expenses, del, add }) {
  const [filter, setFilter] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [qv, setQv] = useState('');
  const [qa, setQa] = useState('');
  const [qe, setQe] = useState('Findr Health');
  const [qc, setQc] = useState('Other');
  const inputRef = useRef(null);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const lastMonth = now.getMonth()===0 ? `${now.getFullYear()-1}-12` : `${now.getFullYear()}-${String(now.getMonth()).padStart(2,'0')}`;

  let filtered = filter==='All' ? expenses : expenses.filter(e=>e.entity===filter);
  if (dateRange==='this') filtered = filtered.filter(e=>(e.date||'').startsWith(thisMonth));
  if (dateRange==='last') filtered = filtered.filter(e=>(e.date||'').startsWith(lastMonth));

  const total = filtered.reduce((s,e)=>s+parseFloat(e.amount),0);
  const monthTotal = expenses.filter(e=>(e.date||'').startsWith(thisMonth)).reduce((s,e)=>s+parseFloat(e.amount),0);

  function quickAdd() {
    if (!qv.trim()||!qa) return;
    add({ date:new Date().toISOString().split('T')[0], vendor:qv.trim(), amount:parseFloat(qa), entity:qe, category:qc });
    setQv(''); setQa('');
    inputRef.current?.focus();
  }

  return <>
    {/* Monthly summary */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <div style={{fontSize:13,color:'#aaa'}}>
        <b style={{color:'#fff',fontSize:15}}>{now.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</b> — ${monthTotal.toFixed(2)} across {expenses.filter(e=>(e.date||'').startsWith(thisMonth)).length} transactions
      </div>
    </div>

    {/* Quick-log bar */}
    <div style={{display:'flex',gap:6,marginBottom:16,padding:12,background:'#151515',borderRadius:8,border:'1px solid #222',alignItems:'center',flexWrap:'wrap'}}>
      <input ref={inputRef} placeholder="Vendor" value={qv} onChange={e=>setQv(e.target.value)} style={qi} onKeyDown={e=>e.key==='Enter'&&quickAdd()} />
      <input placeholder="$" type="number" step="0.01" value={qa} onChange={e=>setQa(e.target.value)} style={{...qi,width:90}} onKeyDown={e=>e.key==='Enter'&&quickAdd()} />
      <select value={qe} onChange={e=>setQe(e.target.value)} style={{...qi,width:130}}>{ENTITIES.map(e=><option key={e}>{e}</option>)}</select>
      <select value={qc} onChange={e=>setQc(e.target.value)} style={{...qi,width:130}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
      <Btn c="#2d6b45" onClick={quickAdd}>ADD</Btn>
    </div>

    {/* Filters */}
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      {['All','Findr Health','BHA','Cabin/STR','Personal','Shared'].map(f=>(
        <Fbtn key={f} active={filter===f} onClick={()=>setFilter(f)}>{f}</Fbtn>
      ))}
      <div style={{width:1,height:20,background:'#222',margin:'0 4px'}}/>
      {[['all','All Time'],['this','This Month'],['last','Last Month']].map(([k,l])=>(
        <Fbtn key={k} active={dateRange===k} onClick={()=>setDateRange(k)}>{l}</Fbtn>
      ))}
    </div>

    {/* Expense table */}
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr>{['Date','Vendor','Amount','Entity','Category',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>{filtered.map(e=>(
        <tr key={e.id} style={{borderBottom:'1px solid #1a1a1a'}}>
          <Td>{(e.date||'').split('T')[0]}</Td>
          <Td c="#ddd">{e.vendor}</Td>
          <TdR>${parseFloat(e.amount).toFixed(2)}</TdR>
          <Td><Etag e={e.entity}/></Td>
          <Td>{e.category}</Td>
          <TdR><button onClick={()=>del(e.id)} style={{background:'none',border:'none',color:'#444',fontSize:14,cursor:'pointer',padding:'2px 6px'}}>×</button></TdR>
        </tr>
      ))}</tbody>
    </table>
    {filtered.length>0 && <div style={{textAlign:'right',padding:'12px 0',fontWeight:700,fontFamily:'monospace',fontSize:14,color:'#fff'}}>Total: ${total.toFixed(2)}</div>}

    {/* Services inventory */}
    <div style={{marginTop:32,borderTop:'1px solid #222',paddingTop:16}}>
      <Lbl>ALL SERVICES — WHAT YOU'RE PAYING FOR</Lbl>
      <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
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
      <div style={{fontSize:12,color:'#666',marginTop:12,fontFamily:'monospace'}}>
        Findr paid services: ~$174/mo • Free services: Cloudinary, Firebase, GitHub, Stripe (tx only)
      </div>
    </div>
  </>;
}

/* ============ BHA TAB ============ */
function BHATab({ time, invoices, unbH, unbA, setModal, sf, markPaid, today }) {
  const thisWeekHrs = time.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7*86400000);
    return d >= weekAgo && t.status === 'unbilled';
  }).reduce((s,t)=>s+parseFloat(t.hours),0);

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div>
        <span style={{fontSize:28,fontWeight:700,fontFamily:'monospace',color:unbH>0?'#e2a832':'#5a9e6f'}}>${unbA.toFixed(0)}</span>
        <span style={{color:'#aaa',marginLeft:8,fontSize:13}}>{unbH} hrs unbilled @ $250/hr</span>
        {thisWeekHrs>0 && <div style={{fontSize:12,color:'#999',marginTop:4}}>This week: {thisWeekHrs} hrs / ${(thisWeekHrs*RATE).toFixed(0)}</div>}
      </div>
      <div style={{display:'flex',gap:8}}>
        <Btn c="#8B6914" onClick={()=>{setModal('hrs');sf({date:today()})}}>+ LOG HOURS</Btn>
        {unbH>0 && <Btn c="#b03a2e" onClick={()=>{setModal('inv');sf({})}}>GENERATE INVOICE</Btn>}
      </div>
    </div>

    <Lbl>TIME ENTRIES</Lbl>
    <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
      <thead><tr>{['Date','Client','Description','Hours','Amount','Status'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>
        {time.map(t=>(
          <tr key={t.id} style={{borderBottom:'1px solid #1a1a1a'}}>
            <Td>{(t.date||'').split('T')[0]}</Td><Td c="#ddd">{t.client}</Td><Td>{t.description}</Td>
            <TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${(parseFloat(t.hours)*RATE).toFixed(2)}</TdR>
            <Td><Stag s={t.status}/></Td>
          </tr>
        ))}
        {time.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'#666',fontSize:13}}>No hours logged yet. Click "+ LOG HOURS" to start.</td></tr>}
      </tbody>
    </table>

    {invoices.length>0 && <>
      <Lbl style={{marginTop:32}}>INVOICES</Lbl>
      <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
        <thead><tr>{['Invoice','Client','Hours','Amount','Sent','Due','Status',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{invoices.map(inv=>(
          <tr key={inv.id} style={{borderBottom:'1px solid #1a1a1a'}}>
            <Td c="#ddd">{inv.number}</Td><Td>{inv.client}</Td>
            <TdR>{parseFloat(inv.hours).toFixed(1)}</TdR><TdR>${parseFloat(inv.amount).toFixed(2)}</TdR>
            <Td>{(inv.date_sent||'').split('T')[0]}</Td><Td>{(inv.due_date||'').split('T')[0]}</Td>
            <Td><Stag s={inv.status}/></Td>
            <Td>
              <div style={{display:'flex',gap:6}}>
                <a href={`/invoice/${inv.id}`} style={{fontFamily:'monospace',fontSize:9,color:'#e2a832',letterSpacing:1,textDecoration:'none'}}>VIEW</a>
                {inv.status==='sent' && <button onClick={()=>markPaid(inv.id)} style={{background:'none',border:'none',fontFamily:'monospace',fontSize:9,color:'#5a9e6f',letterSpacing:1,cursor:'pointer'}}>MARK PAID</button>}
              </div>
            </Td>
          </tr>
        ))}</tbody>
      </table>
    </>}
  </>;
}

/* ============ TASKS TAB — PAPER LIST ============ */
function TasksTab({ tasks, toggle, add, clearDone, del }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const pending = tasks.filter(t=>!t.done);
  const done = tasks.filter(t=>t.done);

  function handleAdd() {
    if (!input.trim()) return;
    add(input);
    setInput('');
    inputRef.current?.focus();
  }

  return <>
    {/* Add input */}
    <div style={{display:'flex',gap:8,marginBottom:24}}>
      <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()}
        placeholder="Add a task and press enter..." 
        style={{flex:1,background:'#151515',border:'1px solid #282828',borderRadius:6,padding:'12px 16px',color:'#ddd',fontSize:14,outline:'none'}} />
      {done.length>0 && <button onClick={clearDone} style={{background:'none',border:'1px solid #333',borderRadius:6,padding:'8px 16px',color:'#888',fontFamily:'monospace',fontSize:10,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap'}}>CLEAR DONE ({done.length})</button>}
    </div>

    {/* Pending tasks */}
    {pending.map(t=>(
      <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #1a1a1a'}}>
        <div onClick={()=>toggle(t.id,t.done)} style={{width:20,height:20,borderRadius:4,border:'2px solid #444',cursor:'pointer',flexShrink:0}} />
        <span style={{flex:1,fontSize:14,color:'#ddd'}}>{t.title}</span>
        <button onClick={()=>del(t.id)} style={{background:'none',border:'none',color:'#333',fontSize:16,cursor:'pointer',padding:'0 4px'}}>×</button>
      </div>
    ))}

    {/* Done tasks */}
    {done.length>0 && <>
      <div style={{marginTop:24,marginBottom:8,fontFamily:'monospace',fontSize:10,letterSpacing:2,color:'#555'}}>COMPLETED</div>
      {done.map(t=>(
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #141414',opacity:0.4}}>
          <div onClick={()=>toggle(t.id,t.done)} style={{width:20,height:20,borderRadius:4,border:'2px solid #5a9e6f',background:'#5a9e6f',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff'}}>✓</div>
          <span style={{flex:1,fontSize:14,textDecoration:'line-through'}}>{t.title}</span>
          <button onClick={()=>del(t.id)} style={{background:'none',border:'none',color:'#333',fontSize:16,cursor:'pointer',padding:'0 4px'}}>×</button>
        </div>
      ))}
    </>}

    {pending.length===0 && done.length===0 && <div style={{textAlign:'center',padding:48,color:'#555',fontSize:14}}>No tasks yet. Type above and press enter.</div>}
  </>;
}

/* ============ INVOICE PREVIEW ============ */
function InvPreview({ time, invoices, client, onCreate }) {
  const ub = time.filter(t=>t.status==='unbilled'&&t.client===client);
  const th = ub.reduce((s,t)=>s+parseFloat(t.hours),0);
  if (!ub.length) return <div style={{textAlign:'center',padding:20,color:'#666'}}>No unbilled hours for {client}</div>;
  return <div>
    <div style={{background:'#0a0a0a',border:'1px solid #222',borderRadius:8,padding:20,margin:'12px 0'}}>
      <div style={{fontFamily:'monospace',fontWeight:700,fontSize:14,color:'#fff',letterSpacing:2}}>BLUNT HEALTH ADVISORY LLC</div>
      <div style={{fontFamily:'monospace',fontSize:10,color:'#888',marginTop:4}}>Invoice BHA-{String(invoices.length+1).padStart(3,'0')} | {new Date().toLocaleDateString()} | Net 30</div>
      <div style={{fontSize:12,color:'#aaa',marginTop:8}}>Bill to: {client}</div>
      <table style={{width:'100%',marginTop:12,borderCollapse:'collapse'}}>
        <thead><tr>{['Date','Description','Hrs','Amount'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>
          {ub.map((t,i)=><tr key={i}><Td>{(t.date||'').split('T')[0]}</Td><Td>{t.description}</Td><TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${(parseFloat(t.hours)*RATE).toFixed(2)}</TdR></tr>)}
          <tr style={{borderTop:'2px solid #333'}}><td colSpan={2} style={{padding:8,fontWeight:700,fontSize:13,color:'#fff'}}>TOTAL DUE</td><TdR style={{fontWeight:700}}>{th.toFixed(1)}</TdR><td style={{padding:8,textAlign:'right',fontWeight:700,fontFamily:'monospace',fontSize:16,color:'#e85d45'}}>${(th*RATE).toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>
    <button onClick={onCreate} style={{width:'100%',padding:14,background:'#b03a2e',border:'none',color:'#fff',borderRadius:6,fontFamily:'monospace',fontSize:12,fontWeight:700,letterSpacing:2}}>APPROVE & MARK INVOICED</button>
  </div>;
}

/* ============ SHARED COMPONENTS ============ */
function Card({children,style={},onClick}) { return <div onClick={onClick} style={{background:'#111',border:'1px solid #222',borderRadius:8,padding:18,...style}}>{children}</div>; }
function Lbl({children,style={}}) { return <div style={{fontFamily:'monospace',fontSize:9,fontWeight:600,letterSpacing:2,color:'#888',marginBottom:10,...style}}>{children}</div>; }
function Big({children,style={}}) { return <div style={{fontSize:30,fontWeight:700,fontFamily:'monospace',color:'#fff',...style}}>{children}</div>; }
function Sm({children}) { return <span style={{fontSize:13,fontWeight:400,color:'#888'}}>{children}</span>; }
function Sub({children}) { return <div style={{fontSize:12,color:'#888',marginTop:3}}>{children}</div>; }
function Badge({children,c}) { return <span style={{fontFamily:'monospace',fontSize:8,fontWeight:700,letterSpacing:1,padding:'2px 8px',borderRadius:3,background:`${c}20`,color:c,flexShrink:0}}>{children}</span>; }
function Btn({children,c,onClick}) { return <button onClick={onClick} style={{background:c,border:'none',color:'#fff',fontFamily:'monospace',fontSize:10,fontWeight:600,letterSpacing:1,padding:'8px 16px',borderRadius:5}}>{children}</button>; }
function Fbtn({children,active,onClick}) { return <button onClick={onClick} style={{background:active?'#222':'transparent',border:'1px solid #282828',borderRadius:4,padding:'5px 12px',color:active?'#fff':'#777',fontFamily:'monospace',fontSize:9,letterSpacing:1,cursor:'pointer'}}>{children}</button>; }
function Th({children}) { return <th style={{fontFamily:'monospace',fontSize:9,fontWeight:600,letterSpacing:1,color:'#666',textAlign:'left',padding:'8px 10px',borderBottom:'1px solid #222'}}>{children}</th>; }
function Td({children,c='#bbb',style={}}) { return <td style={{fontSize:12,padding:'9px 10px',color:c,...style}}>{children}</td>; }
function TdR({children,style={}}) { return <td style={{fontSize:12,padding:'9px 10px',color:'#ccc',textAlign:'right',fontFamily:'monospace',...style}}>{children}</td>; }
function Etag({e}) { const c={'Findr Health':'#5a9e6f','BHA':'#e2a832','Cabin/STR':'#8B6914','Shared':'#888','Personal':'#888'}[e]||'#888'; return <span style={{fontFamily:'monospace',fontSize:9,padding:'2px 8px',borderRadius:3,background:`${c}20`,color:c}}>{e}</span>; }
function Stag({s}) { const c=s==='unbilled'?'#e2a832':s==='sent'?'#6a9bd8':s==='paid'?'#5a9e6f':'#888'; return <span style={{fontFamily:'monospace',fontSize:9,padding:'2px 8px',borderRadius:3,background:`${c}20`,color:c}}>{s}</span>; }
function Mtitle({children}) { return <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#fff',marginBottom:18,letterSpacing:2}}>{children}</div>; }
function Minput(props) { return <input {...props} style={{width:'100%',background:'#0a0a0a',border:'1px solid #222',borderRadius:6,padding:'10px 12px',color:'#ddd',fontSize:13,marginBottom:10,outline:'none'}} />; }
function Mselect({value,onChange,opts}) { return <select value={value} onChange={onChange} style={{width:'100%',background:'#0a0a0a',border:'1px solid #222',borderRadius:6,padding:'10px 12px',color:'#ddd',fontSize:13,marginBottom:10,outline:'none'}}>{opts.map(o=><option key={o}>{o}</option>)}</select>; }
const qi = {background:'#0c0c0c',border:'1px solid #282828',borderRadius:4,padding:'8px 10px',color:'#ddd',fontSize:12,outline:'none',flex:1,minWidth:80};
