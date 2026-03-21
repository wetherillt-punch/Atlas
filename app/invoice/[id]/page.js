'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function InvoicePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) return <div style={{ padding: 40, color: '#666' }}>Loading...</div>;

  const { invoice, items } = data;
  const rate = 250;

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh' }}>
      {/* Print button */}
      <div className="no-print" style={{ padding: '16px 40px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => window.print()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, letterSpacing: 2, cursor: 'pointer' }}>PRINT / SAVE PDF</button>
        <button onClick={() => window.history.back()} style={{ background: 'transparent', color: '#666', border: '1px solid #ddd', padding: '10px 24px', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, cursor: 'pointer' }}>← BACK</button>
        <span style={{ color: '#999', fontSize: 13 }}>Use "Save as PDF" in your print dialog to generate the PDF file</span>
      </div>

      {/* Invoice */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 60px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>BLUNT <span style={{ fontWeight: 400 }}>HEALTH</span></div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>ADVISORY</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#c0392b' }}>INVOICE</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{invoice.number}</div>
          </div>
        </div>

        {/* Meta + Addresses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#c0392b', letterSpacing: 2, marginBottom: 8 }}>FROM</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Blunt Health Advisory LLC</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
              Tim Wetherill<br />
              311 North Willson Avenue, Apt 602<br />
              Bozeman, MT 59715<br />
              wetherillt@gmail.com
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#c0392b', letterSpacing: 2, marginBottom: 8 }}>BILL TO</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{invoice.client}</div>
            <div style={{ fontSize: 12, color: '#666' }}>[Client Address]</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#999' }}>
              <div>Invoice Date: <strong style={{ color: '#333' }}>{new Date(invoice.date_sent).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              <div style={{ marginTop: 4 }}>Due Date: <strong style={{ color: '#333' }}>{new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              <div style={{ marginTop: 4 }}>Terms: <strong style={{ color: '#333' }}>Net 30</strong></div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#1a1a1a' }}>
              {['DATE', 'DESCRIPTION', 'HOURS', 'RATE', 'AMOUNT'].map(h => (
                <th key={h} style={{ color: '#fff', fontSize: 9, fontWeight: 600, letterSpacing: 1, padding: '10px 12px', textAlign: h === 'HOURS' || h === 'RATE' || h === 'AMOUNT' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{new Date(item.date).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{item.description}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{parseFloat(item.hours).toFixed(1)}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>${parseFloat(item.rate).toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>${(parseFloat(item.hours) * parseFloat(item.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#666' }}>
              <span>Total Hours:</span>
              <span>{parseFloat(invoice.hours).toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#666' }}>
              <span>Subtotal:</span>
              <span>${parseFloat(invoice.amount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#666' }}>
              <span>Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: 8, background: '#1a1a1a', borderRadius: 4 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>TOTAL DUE:</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>${parseFloat(invoice.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#c0392b', letterSpacing: 2, marginBottom: 12 }}>PAYMENT DETAILS</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            <strong>Payment by check or ACH transfer:</strong><br />
            Blunt Health Advisory LLC<br />
            [Bank Name]<br />
            Routing: [Routing Number]<br />
            Account: [Account Number]<br /><br />
            <strong>Or mail check to:</strong><br />
            311 North Willson Avenue, Apt 602<br />
            Bozeman, MT 59715
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb' }}>
          <span>Blunt Health Advisory LLC | Bozeman, MT | wetherillt@gmail.com</span>
          <span>Thank you for your business.</span>
        </div>
      </div>
    </div>
  );
}
