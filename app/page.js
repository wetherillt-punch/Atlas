'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const ENTITIES = ['Findr Health','BHA','Cabin/STR','Personal','Shared'];
const CATEGORIES = ['Hosting','Software','Contractor','Legal','Legal/IP','Legal/Filing','Domain','Equipment','Capital Improvement','Utilities','Financing','Office','Insurance','Travel','Other'];
const CLIENTS = ['ATRIO Health Plans','P3 Health Partners','Other'];
const RATE = 250;
const GAPS = [
  { item:'Twilio invoices', pri:'HIGH', action:'Pull from Twilio dashboard', entity:'Findr Health' },
  { item:'Find CPA', pri:'HIGH', action:'April 15 quarterly estimate — 28 days', entity:'BHA' },
  { item:'Cell phone bill', pri:'MED', action:'Need amount for business split', entity:'Shared' },
  { item:'DTeam status', pri:'MED', action:'Any invoices after Dec 2025?', entity:'Findr Health' },
  { item:'Cabin insurance $', pri:'MED', action:'On 6-mo plan, amount unknown', entity:'Cabin/STR' },
  { item:'Polaris price', pri:'MED', action:'Log purchase amount', entity:'Cabin/STR' },
  { item:'GitHub billing', pri:'LOW', action:'Free or paid?', entity:'Findr Health' },
  { item:'Stripe fees', pri:'LOW', action:'Track booking transaction fees', entity:'Findr Health' },
];
const RECURRING = [
  { vendor:'Google Workspace', amount:105.60, entity:'Findr Health', day:31 },
  { vendor:'Vercel (Findr)', amount:20, entity:'Findr Health', day:8 },
  { vendor:'Vercel (Tim)', amount:20, entity:'Findr Health', day:26 },
  { vendor:'Railway', amount:6, entity:'Findr Health', day:8 },
  { vendor:'Claude Max', amount:100, entity:'Shared', day:30 },
  { vendor:'Starlink', amount:120, entity:'Cabin/STR', day:1 },
  { vendor:'SBLOC Interest', amount:3250, entity:'Cabin/STR', day:1 },
  { vendor:'Apple iCloud', amount:9.99, entity:'Personal', day:1 },
];

export default function Home() {
  const [tab, setTab] = useState('dash');
  const [expenses, setExpenses] = useState([]);
  const [time, setTime] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [e, t, i, tk] = await Promise.all([
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/time').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
      ]);
      setExpenses(e); setTime(t); setInvoices(i); setTasks(tk);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function addExpense() {
    if (!form.vendor || !form.amount) return;
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date || today(),
        vendor: form.vendor,
        amount: parseFloat(form.amount),
        entity: form.entity || 'Findr Health',
        category: form.category || 'Other',
      }),
    });
    const exp = await res.json();
    setExpenses([exp, ...expenses]);
    setModal(null); setForm({});
  }

  async function addTime() {
    if (!form.hours || !form.desc) return;
    const res = await fetch('/api/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date || today(),
        client: form.client || 'ATRIO Health Plans',
        description: form.desc,
        hours: parseFloat(form.hours),
      }),
    });
    const entry = await res.json();
    setTime([entry, ...time]);
    setModal(null); setForm({});
  }

  async function createInvoice() {
    const client = form.invClient || 'ATRIO Health Plans';
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
    });
    if (!res.ok) return;
    await load(); // Refresh all data
    setModal(null); setForm({});
  }

  async function toggleTask(id, currentStatus) {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  }

  async function deleteExpense(id) {
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    setExpenses(expenses.filter(e => e.id !== id));
  }

  function today() { return new Date().toISOString().split('T')[0]; }
  const sumE = (entity) => expenses.filter(e => e.entity === entity).reduce((s, e) => s + parseFloat(e.amount), 0);
  const unbilledHrs = time.filter(t => t.status === 'unbilled').reduce((s, t) => s + parseFloat(t.hours), 0);
  const unbilledAmt = unbilledHrs * RATE;

  if (loading) return <div className="flex items-center justify-center h-screen" style={{ fontFamily: 'var(--mono)', color: '#444' }}>Loading ATLAS...</div>;

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="flex items-center px-5 py-2.5 border-b flex-wrap gap-3" style={{ borderColor: 'var(--border)', background: '#0a0a0a' }}>
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, letterSpacing: 5, marginRight: 24 }}>
          <span style={{ color: 'var(--red)' }}>▲</span> <span className="text-white">ATLAS</span>
        </div>
        {[['dash','DASHBOARD'],['exp','EXPENSES'],['bha','BHA HOURS'],['tasks','TASKS']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className="border-none" style={{ background:'none', fontFamily:'var(--mono)', fontSize:10, letterSpacing:2, padding:'8px 14px', color:tab===k?'#fff':'#555', borderBottom:tab===k?'2px solid var(--red)':'2px solid transparent', cursor:'pointer' }}>{l}</button>
        ))}
        <div className="flex-1" />
        <button onClick={() => { setModal('exp'); setForm({ date: today() }); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--green)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, letterSpacing:1 }}>+ EXPENSE</button>
        <button onClick={() => { setModal('hrs'); setForm({ date: today() }); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--amber)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, letterSpacing:1 }}>+ HOURS</button>
        {unbilledHrs > 0 && <button onClick={() => { setModal('inv'); setForm({}); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--red)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, letterSpacing:1 }}>INVOICE ${unbilledAmt.toFixed(0)}</button>}
      </nav>

      <div className="max-w-5xl mx-auto p-5">
        {/* DASHBOARD */}
        {tab === 'dash' && <>
          {/* Alerts */}
          {GAPS.filter(g => g.pri === 'HIGH').length > 0 && (
            <div className="rounded-lg p-4 mb-4" style={{ background:'var(--card)', border:'1px solid var(--border)', borderLeft:'3px solid var(--red)' }}>
              <Label>ACTION REQUIRED</Label>
              {GAPS.filter(g => g.pri === 'HIGH').map((g, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 text-sm" style={{ borderBottom:'1px solid #141414' }}>
                  <Badge color="var(--red)">{g.pri}</Badge>
                  <strong>{g.item}</strong>
                  <span style={{ color:'#888' }}>— {g.action}</span>
                  <span className="ml-auto" style={{ fontFamily:'var(--mono)', fontSize:9, color:'#555' }}>{g.entity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3.5" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Findr Card */}
            <Card>
              <Label>FINDR HEALTH</Label>
              <BigNum>${(sumE('Findr Health') + sumE('Shared') * 0.4).toFixed(0)}<Unit> YTD</Unit></BigNum>
              <Sub>Dedicated ${sumE('Findr Health').toFixed(0)} + shared ${(sumE('Shared') * 0.4).toFixed(0)}</Sub>
              <Sub>Recurring ~$160/mo</Sub>
              <div className="mt-3">
                {tasks.filter(t => t.project === 'Findr Health' && t.priority === 'critical' && t.status !== 'done').map((t, i) => (
                  <div key={i} style={{ fontSize:12, color:'var(--red)', padding:'3px 0' }}>→ {t.title}</div>
                ))}
              </div>
            </Card>

            {/* BHA Card */}
            <Card>
              <Label>BLUNT HEALTH ADVISORY</Label>
              {unbilledHrs > 0 ? <>
                <BigNum style={{ color:'var(--bha)' }}>${unbilledAmt.toFixed(0)}<Unit> unbilled</Unit></BigNum>
                <Sub>{unbilledHrs} hrs @ ${RATE}/hr</Sub>
                <button onClick={() => { setModal('inv'); setForm({}); }} className="w-full mt-2.5 py-2 rounded border-none text-white cursor-pointer" style={{ background:'var(--red)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, letterSpacing:1 }}>GENERATE INVOICE →</button>
              </> : <>
                <BigNum style={{ color:'var(--findr)' }}>$0<Unit> unbilled</Unit></BigNum>
                <Sub>No hours pending</Sub>
              </>}
              {invoices.reduce((s, i) => s + parseFloat(i.amount), 0) > 0 && <Sub className="mt-2">Invoiced YTD: ${invoices.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(0)}</Sub>}
              <div className="mt-3">
                {tasks.filter(t => t.project === 'BHA' && t.priority === 'critical' && t.status !== 'done').map((t, i) => (
                  <div key={i} style={{ fontSize:12, color:'var(--red)', padding:'3px 0' }}>→ {t.title}</div>
                ))}
              </div>
            </Card>

            {/* Cabin Card */}
            <Card>
              <Label>WILSALL CABIN / STR</Label>
              <BigNum>${sumE('Cabin/STR').toFixed(0)}<Unit> YTD</Unit></BigNum>
              <Sub>Monthly carry: $3,370 (SBLOC + Starlink)</Sub>
              <Sub>Remodel budget: $21-43K</Sub>
              <Sub>Rental income: $0</Sub>
            </Card>

            {/* Summary */}
            <Card>
              <Label>SUMMARY</Label>
              {[
                ['All entities YTD', `$${expenses.reduce((s,e) => s + parseFloat(e.amount), 0).toFixed(0)}`],
                ['Startup costs/mo', '~$209'],
                ['Cabin carry/mo', '$3,370'],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between py-1.5 text-sm" style={{ borderBottom:'1px solid #141414' }}>
                  <span>{l}</span>
                  <span style={{ fontWeight:600, fontFamily:'var(--mono)', fontSize:13 }}>{v}</span>
                </div>
              ))}
              <Label className="mt-4">DEADLINES</Label>
              <div className="flex items-center gap-2.5 rounded p-2 mt-1" style={{ background:'#1a0505' }}>
                <Badge color="var(--red)">28d</Badge>
                <span className="text-sm">BHA quarterly tax — <strong>NO CPA</strong></span>
              </div>
            </Card>
          </div>

          {/* Gaps */}
          <Card className="mt-3.5">
            <Label>RECEIPT GAPS & OPEN ITEMS</Label>
            {GAPS.map((g, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5 text-sm" style={{ borderBottom:'1px solid #141414' }}>
                <Badge color={g.pri === 'HIGH' ? 'var(--red)' : g.pri === 'MED' ? 'var(--bha)' : '#666'}>{g.pri}</Badge>
                <strong>{g.item}</strong>
                <span style={{ color:'#777' }}>— {g.action}</span>
                <span className="ml-auto" style={{ fontFamily:'var(--mono)', fontSize:9, color:'#555' }}>{g.entity}</span>
              </div>
            ))}
          </Card>
        </>}

        {/* EXPENSES TAB */}
        {tab === 'exp' && <ExpensesTab expenses={expenses} deleteExpense={deleteExpense} setModal={setModal} setForm={setForm} />}

        {/* BHA HOURS TAB */}
        {tab === 'bha' && <BHATab time={time} invoices={invoices} unbilledHrs={unbilledHrs} unbilledAmt={unbilledAmt} setModal={setModal} setForm={setForm} />}

        {/* TASKS TAB */}
        {tab === 'tasks' && <TasksTab tasks={tasks} toggleTask={toggleTask} />}
      </div>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background:'rgba(0,0,0,.85)' }} onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background:'var(--card)', border:'1px solid #222' }} onClick={e => e.stopPropagation()}>
            {modal === 'exp' && <>
              <ModalTitle>Log Expense</ModalTitle>
              <Input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
              <Input placeholder="Vendor" value={form.vendor || ''} onChange={e => setForm({...form, vendor: e.target.value})} autoFocus />
              <Input placeholder="Amount" type="number" step="0.01" value={form.amount || ''} onChange={e => setForm({...form, amount: e.target.value})} />
              <Select value={form.entity || 'Findr Health'} onChange={e => setForm({...form, entity: e.target.value})} options={ENTITIES} />
              <Select value={form.category || 'Other'} onChange={e => setForm({...form, category: e.target.value})} options={CATEGORIES} />
              <SubmitBtn color="var(--green)" onClick={addExpense}>LOG EXPENSE</SubmitBtn>
            </>}
            {modal === 'hrs' && <>
              <ModalTitle>Log BHA Hours</ModalTitle>
              <Input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
              <Select value={form.client || 'ATRIO Health Plans'} onChange={e => setForm({...form, client: e.target.value})} options={CLIENTS} />
              <Input placeholder="Description of work" value={form.desc || ''} onChange={e => setForm({...form, desc: e.target.value})} autoFocus />
              <Input placeholder="Hours" type="number" step="0.5" value={form.hours || ''} onChange={e => setForm({...form, hours: e.target.value})} />
              <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--bha)', textAlign:'right', padding:'4px 0 8px' }}>${RATE}/hr × {form.hours || 0} = ${((form.hours || 0) * RATE).toFixed(2)}</div>
              <SubmitBtn color="var(--amber)" onClick={addTime}>LOG HOURS</SubmitBtn>
            </>}
            {modal === 'inv' && <>
              <ModalTitle>Generate Invoice</ModalTitle>
              <Select value={form.invClient || 'ATRIO Health Plans'} onChange={e => setForm({...form, invClient: e.target.value})} options={CLIENTS} />
              <InvoicePreview time={time} invoices={invoices} client={form.invClient || 'ATRIO Health Plans'} onCreate={createInvoice} />
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ expenses, deleteExpense, setModal, setForm }) {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? expenses : expenses.filter(e => e.entity === filter);
  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
  
  return <>
    <div className="flex gap-1.5 mb-4 flex-wrap items-center">
      {['All','Findr Health','BHA','Cabin/STR','Personal','Shared'].map(f => (
        <button key={f} onClick={() => setFilter(f)} className="rounded px-3 py-1 cursor-pointer" style={{ background:filter===f?'#1e1e1e':'transparent', border:'1px solid #222', color:filter===f?'#fff':'#555', fontFamily:'var(--mono)', fontSize:9, letterSpacing:1 }}>{f}</button>
      ))}
      <div className="flex-1" />
      <button onClick={() => { setModal('exp'); setForm({ date: new Date().toISOString().split('T')[0] }); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--green)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600 }}>+ EXPENSE</button>
    </div>
    <table className="w-full" style={{ borderCollapse:'collapse' }}>
      <thead><tr>{['Date','Vendor','Amount','Entity','Category',''].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>{filtered.map(e => (
        <tr key={e.id} style={{ borderBottom:'1px solid #141414' }}>
          <Td>{e.date?.split('T')[0]}</Td>
          <Td>{e.vendor}</Td>
          <TdR>${parseFloat(e.amount).toFixed(2)}</TdR>
          <Td><EntityTag entity={e.entity} /></Td>
          <Td>{e.category}</Td>
          <TdR><button onClick={() => deleteExpense(e.id)} className="border-none cursor-pointer" style={{ background:'none', color:'#333', fontSize:14 }}>×</button></TdR>
        </tr>
      ))}</tbody>
    </table>
    {filtered.length > 0 && <div className="text-right py-3" style={{ fontWeight:700, fontFamily:'var(--mono)', fontSize:14, color:'#fff' }}>Total: ${total.toFixed(2)}</div>}
    
    <div className="mt-8 pt-4" style={{ borderTop:'1px solid var(--border)' }}>
      <Label>RECURRING — VERIFY MONTHLY</Label>
      <table className="w-full mt-2" style={{ borderCollapse:'collapse' }}>
        <thead><tr>{['Vendor','Expected','Entity','~Day'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{RECURRING.map((r, i) => <tr key={i}><Td>{r.vendor}</Td><TdR>${r.amount.toFixed(2)}</TdR><Td>{r.entity}</Td><Td>{r.day}</Td></tr>)}</tbody>
      </table>
    </div>
  </>;
}

function BHATab({ time, invoices, unbilledHrs, unbilledAmt, setModal, setForm }) {
  return <>
    <div className="flex justify-between items-center mb-5">
      <div>
        <span style={{ fontSize:28, fontWeight:700, fontFamily:'var(--mono)', color: unbilledHrs > 0 ? 'var(--bha)' : 'var(--findr)' }}>${unbilledAmt.toFixed(0)}</span>
        <span style={{ color:'#666', marginLeft:8, fontSize:13 }}>{unbilledHrs} hrs unbilled</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setModal('hrs'); setForm({ date: new Date().toISOString().split('T')[0] }); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--amber)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600 }}>+ LOG HOURS</button>
        {unbilledHrs > 0 && <button onClick={() => { setModal('inv'); setForm({}); }} className="text-white border-none rounded px-4 py-2 cursor-pointer" style={{ background:'var(--red)', fontFamily:'var(--mono)', fontSize:10, fontWeight:600 }}>GENERATE INVOICE</button>}
      </div>
    </div>
    <Label>TIME ENTRIES</Label>
    <table className="w-full mt-2" style={{ borderCollapse:'collapse' }}>
      <thead><tr>{['Date','Client','Description','Hours','Amount','Status'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>
        {time.map(t => (
          <tr key={t.id} style={{ borderBottom:'1px solid #141414' }}>
            <Td>{t.date?.split('T')[0]}</Td><Td>{t.client}</Td><Td>{t.description}</Td>
            <TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${(parseFloat(t.hours) * RATE).toFixed(2)}</TdR>
            <Td><StatusTag status={t.status} /></Td>
          </tr>
        ))}
        {time.length === 0 && <tr><td colSpan={6} className="text-center py-10" style={{ color:'#444', fontSize:13 }}>No hours logged yet.</td></tr>}
      </tbody>
    </table>
    {invoices.length > 0 && <>
      <Label className="mt-8">INVOICES</Label>
      <table className="w-full mt-2" style={{ borderCollapse:'collapse' }}>
        <thead><tr>{['Invoice','Client','Hours','Amount','Date','Status',''].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{invoices.map(inv => (
          <tr key={inv.id} style={{ borderBottom:'1px solid #141414' }}>
            <Td>{inv.number}</Td><Td>{inv.client}</Td><TdR>{parseFloat(inv.hours).toFixed(1)}</TdR>
            <TdR>${parseFloat(inv.amount).toFixed(2)}</TdR><Td>{inv.date_sent?.split('T')[0]}</Td>
            <Td><StatusTag status={inv.status} /></Td>
            <Td><Link href={`/invoice/${inv.id}`} className="no-underline" style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--bha)', letterSpacing:1 }}>VIEW →</Link></Td>
          </tr>
        ))}</tbody>
      </table>
    </>}
  </>;
}

function TasksTab({ tasks, toggleTask }) {
  return <>
    {['Findr Health','BHA','Cabin/STR'].map(p => {
      const pt = tasks.filter(t => t.project === p);
      if (!pt.length) return null;
      return (
        <div key={p} className="mb-7">
          <Label>{p.toUpperCase()}</Label>
          {pt.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id, t.status)} className="flex items-center gap-3 py-2.5 cursor-pointer" style={{ borderBottom:'1px solid #141414', opacity: t.status === 'done' ? 0.35 : 1 }}>
              <span className="flex items-center justify-center rounded" style={{ width:18, height:18, border:`2px solid ${t.status==='done'?'var(--findr)':'#333'}`, background:t.status==='done'?'var(--findr)':'transparent', fontSize:11, color:'#fff', flexShrink:0 }}>{t.status === 'done' ? '✓' : ''}</span>
              <span className="flex-1 text-sm" style={{ textDecoration:t.status==='done'?'line-through':'none' }}>{t.title}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:9, color:t.priority==='critical'?'var(--red)':t.priority==='high'?'var(--bha)':'#555' }}>{t.priority}</span>
            </div>
          ))}
        </div>
      );
    })}
  </>;
}

function InvoicePreview({ time, invoices, client, onCreate }) {
  const unbilled = time.filter(t => t.status === 'unbilled' && t.client === client);
  const totalHrs = unbilled.reduce((s, t) => s + parseFloat(t.hours), 0);
  if (!unbilled.length) return <div className="text-center py-8" style={{ color:'#555' }}>No unbilled hours for {client}</div>;
  
  return (
    <div>
      <div className="rounded-lg p-5 my-3" style={{ background:'#0a0a0a', border:'1px solid #1e1e1e' }}>
        <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:14, color:'#fff', letterSpacing:2 }}>BLUNT HEALTH ADVISORY LLC</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'#666', marginTop:4 }}>Invoice BHA-{String(invoices.length + 1).padStart(3, '0')} | {new Date().toLocaleDateString()} | Net 30</div>
        <div style={{ fontSize:12, color:'#888', marginTop:8 }}>Bill to: {client}</div>
        <table className="w-full mt-3" style={{ borderCollapse:'collapse' }}>
          <thead><tr>{['Date','Description','Hrs','Amount'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {unbilled.map((t, i) => (
              <tr key={i}><Td>{t.date?.split('T')[0]}</Td><Td>{t.description}</Td><TdR>{parseFloat(t.hours).toFixed(1)}</TdR><TdR>${(parseFloat(t.hours) * RATE).toFixed(2)}</TdR></tr>
            ))}
            <tr style={{ borderTop:'2px solid #333' }}>
              <td colSpan={2} className="font-bold text-sm p-2">TOTAL DUE</td>
              <TdR className="font-bold">{totalHrs.toFixed(1)}</TdR>
              <td className="font-bold text-right p-2" style={{ fontFamily:'var(--mono)', fontSize:15, color:'var(--red)' }}>${(totalHrs * RATE).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <SubmitBtn color="var(--red)" onClick={onCreate}>APPROVE & MARK INVOICED</SubmitBtn>
    </div>
  );
}

// Shared components
function Card({ children, className = '' }) {
  return <div className={`rounded-lg p-4 ${className}`} style={{ background:'var(--card)', border:'1px solid var(--border)' }}>{children}</div>;
}
function Label({ children, className = '' }) {
  return <div className={className} style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:600, letterSpacing:2, color:'#555', marginBottom:10 }}>{children}</div>;
}
function BigNum({ children, style = {} }) {
  return <div style={{ fontSize:30, fontWeight:700, fontFamily:'var(--mono)', color:'#fff', ...style }}>{children}</div>;
}
function Unit({ children }) {
  return <span style={{ fontSize:13, fontWeight:400, color:'#666' }}>{children}</span>;
}
function Sub({ children, className = '' }) {
  return <div className={className} style={{ fontSize:12, color:'#555', marginTop:3 }}>{children}</div>;
}
function Badge({ children, color }) {
  return <span style={{ fontFamily:'var(--mono)', fontSize:8, fontWeight:700, letterSpacing:1, padding:'2px 8px', borderRadius:3, background:`${color}18`, color, flexShrink:0 }}>{children}</span>;
}
function EntityTag({ entity }) {
  const colors = { 'Findr Health':'var(--findr)', 'BHA':'var(--bha)', 'Cabin/STR':'var(--cabin)', 'Personal':'#777', 'Shared':'#777' };
  const c = colors[entity] || '#777';
  return <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 8px', borderRadius:3, background:`${c}18`, color:c }}>{entity}</span>;
}
function StatusTag({ status }) {
  const c = status === 'unbilled' ? 'var(--bha)' : status === 'sent' ? '#6a9bd8' : 'var(--findr)';
  return <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 8px', borderRadius:3, background:`${c}18`, color:c }}>{status}</span>;
}
function Th({ children }) {
  return <th style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:600, letterSpacing:1, color:'#444', textAlign:'left', padding:'8px 10px', borderBottom:'1px solid #1e1e1e' }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ fontSize:12, padding:'9px 10px', color:'#bbb' }}>{children}</td>;
}
function TdR({ children, className = '' }) {
  return <td className={className} style={{ fontSize:12, padding:'9px 10px', color:'#bbb', textAlign:'right', fontFamily:'var(--mono)' }}>{children}</td>;
}
function ModalTitle({ children }) {
  return <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'#fff', marginBottom:18, letterSpacing:2 }}>{children}</div>;
}
function Input(props) {
  return <input {...props} className="w-full rounded mb-2.5 outline-none" style={{ background:'#0a0a0a', border:'1px solid #1e1e1e', padding:'10px 12px', color:'#ddd', fontSize:13 }} />;
}
function Select({ value, onChange, options }) {
  return <select value={value} onChange={onChange} className="w-full rounded mb-2.5 outline-none" style={{ background:'#0a0a0a', border:'1px solid #1e1e1e', padding:'10px 12px', color:'#ddd', fontSize:13 }}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>;
}
function SubmitBtn({ children, color, onClick }) {
  return <button onClick={onClick} className="w-full py-3 rounded border-none text-white cursor-pointer mt-1" style={{ background:color, fontFamily:'var(--mono)', fontSize:12, fontWeight:700, letterSpacing:2 }}>{children}</button>;
}
