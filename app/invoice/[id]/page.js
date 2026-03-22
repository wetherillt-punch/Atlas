'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function InvoicePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => { fetch(`/api/invoices/${id}`).then(r=>r.json()).then(setData); }, [id]);
  if (!data) return <div style={{padding:40,color:'#999'}}>Loading...</div>;

  const { invoice:inv, items } = data;

  return (
    <div style={{background:'#fff',color:'#000',minHeight:'100vh'}}>
      <div className="no-print" style={{padding:'16px 40px',background:'#f5f5f5',borderBottom:'1px solid #ddd',display:'flex',gap:12,alignItems:'center'}}>
        <button onClick={()=>window.print()} style={{background:'#1a1a1a',color:'#fff',border:'none',padding:'10px 24px',borderRadius:6,fontFamily:'monospace',fontSize:12,fontWeight:600,letterSpacing:2,cursor:'pointer'}}>PRINT / SAVE PDF</button>
        <button onClick={()=>window.history.back()} style={{background:'transparent',color:'#666',border:'1px solid #ddd',padding:'10px 24px',borderRadius:6,fontFamily:'monospace',fontSize:12,cursor:'pointer'}}>← BACK</button>
        <span style={{color:'#999',fontSize:13}}>Use "Save as PDF" in print dialog</span>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'48px 60px',fontFamily:'Helvetica,Arial,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:40}}>
          <div>
            <div style={{fontSize:24,fontWeight:700,letterSpacing:1}}>BLUNT <span style={{fontWeight:400}}>HEALTH</span></div>
            <div style={{fontSize:12,color:'#666',marginTop:2}}>ADVISORY</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:28,fontWeight:700,color:'#c0392b'}}>INVOICE</div>
            <div style={{fontSize:11,color:'#999',marginTop:2}}>{inv.number}</div>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',marginBottom:40}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#c0392b',letterSpacing:2,marginBottom:8}}>FROM</div>
            <div style={{fontSize:13,fontWeight:600}}>Blunt Health Advisory LLC</div>
            <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>Tim Wetherill<br/>311 North Willson Avenue, Apt 602<br/>Bozeman, MT 59715<br/>wetherillt@gmail.com</div>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#c0392b',letterSpacing:2,marginBottom:8}}>BILL TO</div>
            <div style={{fontSize:13,fontWeight:600}}>{inv.client}</div>
          </div>
          <div style={{textAlign:'right',fontSize:11,color:'#999'}}>
            <div>Invoice Date: <b style={{color:'#333'}}>{new Date(inv.date_sent).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</b></div>
            <div style={{marginTop:4}}>Due Date: <b style={{color:'#333'}}>{new Date(inv.due_date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</b></div>
            <div style={{marginTop:4}}>Terms: <b style={{color:'#333'}}>Net 30</b></div>
          </div>
        </div>

        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:24}}>
          <thead><tr style={{background:'#1a1a1a'}}>
            {['DATE','DESCRIPTION','HOURS','RATE','AMOUNT'].map(h=><th key={h} style={{color:'#fff',fontSize:9,fontWeight:600,letterSpacing:1,padding:'10px 12px',textAlign:['HOURS','RATE','AMOUNT'].includes(h)?'right':'left'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {items.map((t,i)=>(
              <tr key={i} style={{background:i%2===0?'#f9f9f9':'#fff'}}>
                <td style={{padding:'10px 12px',fontSize:12}}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{padding:'10px 12px',fontSize:12}}>{t.description}</td>
                <td style={{padding:'10px 12px',fontSize:12,textAlign:'right'}}>{parseFloat(t.hours).toFixed(1)}</td>
                <td style={{padding:'10px 12px',fontSize:12,textAlign:'right'}}>${parseFloat(t.rate).toFixed(2)}</td>
                <td style={{padding:'10px 12px',fontSize:12,textAlign:'right',fontWeight:600}}>${(parseFloat(t.hours)*parseFloat(t.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:40}}>
          <div style={{width:280}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12,color:'#666'}}><span>Total Hours:</span><span>{parseFloat(inv.hours).toFixed(1)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12,color:'#666'}}><span>Subtotal:</span><span>${parseFloat(inv.amount).toFixed(2)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'12px 16px',marginTop:8,background:'#1a1a1a',borderRadius:4}}>
              <span style={{color:'#fff',fontWeight:700,fontSize:13}}>TOTAL DUE:</span>
              <span style={{color:'#fff',fontWeight:700,fontSize:18}}>${parseFloat(inv.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{borderTop:'1px solid #eee',paddingTop:24}}>
          <div style={{fontSize:9,fontWeight:700,color:'#c0392b',letterSpacing:2,marginBottom:12}}>PAYMENT DETAILS</div>
          <div style={{fontSize:12,color:'#666',lineHeight:1.8}}>
            <b>Payment by ACH transfer:</b><br/>Blunt Health Advisory LLC<br/>First Security Bank, Bozeman MT<br/>Routing: 292970825<br/>Account: 3300002899064<br/><br/>
            <b>Or mail check to:</b><br/>Blunt Health Advisory LLC<br/>311 North Willson Avenue, Apt 602<br/>Bozeman, MT 59715
          </div>
        </div>

        <div style={{marginTop:48,paddingTop:16,borderTop:'1px solid #eee',display:'flex',justifyContent:'space-between',fontSize:11,color:'#bbb'}}>
          <span>Blunt Health Advisory LLC | Bozeman, MT | wetherillt@gmail.com</span>
          <span>Thank you for your business.</span>
        </div>
      </div>
    </div>
  );
}
