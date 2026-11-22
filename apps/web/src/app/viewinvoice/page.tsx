'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import whmcsData from '@/data/whmcs_sync.json';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id') || '464';
  const invoiceId = rawId.replace(/[^0-9]/g, '');

  const [paymentGateway, setPaymentGateway] = useState('piprapay');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Find invoice in synced data
  const invoice = (whmcsData?.invoices || []).find(
    (inv: any) => String(inv.id) === invoiceId || String(inv.invoicenum) === invoiceId
  );

  const client = invoice
    ? (whmcsData?.clients || []).find((c: any) => String(c.id) === String(invoice.userid))
    : null;

  const status = (invoice?.status || 'Unpaid').toUpperCase();
  const amount = parseFloat(String(invoice?.total || '1500.00'));

  const items = invoice?.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: `SoftCents Hosting & PBX Services (Invoice #${invoiceId})`,
          amount: amount,
        },
      ];

  const handlePayNow = async () => {
    try {
      setLoadingPay(true);
      setPayError(null);

      if (paymentGateway === 'piprapay') {
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoiceId || '0',
            amount: amount,
            fullName: client?.name || 'SoftCents Valued Client',
            email: client?.email || 'billing@softcents.com',
            phone: client?.phone || '01700000000',
          }),
        });

        const data = await res.json();
        if (data.pp_url) {
          window.location.href = data.pp_url;
        } else {
          setPayError(data.error || 'Failed to initiate PipraPay checkout. Please contact support.');
        }
      } else if (paymentGateway === 'uddoktapay') {
        const res = await fetch('/api/whmcs/gateways/uddoktapay/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoiceId || '0',
            amount: amount,
            fullName: client?.name || 'SoftCents Valued Client',
            email: client?.email || 'billing@softcents.com',
            returnUrl: window.location.href,
            cancelUrl: window.location.href,
            webhookUrl: `${window.location.origin}/api/whmcs/gateways/uddoktapay/webhook`,
          }),
        });

        const data = await res.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          setPayError(data.message || 'Failed to initiate UddoktaPay checkout.');
        }
      } else if (paymentGateway === 'reseller') {
        const res = await fetch('/api/whmcs/gateways/reseller/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client?.id || invoice?.userid || '177',
            invoiceId: invoiceId || '0',
            amount: amount,
          }),
        });

        const data = await res.json();
        if (data.success !== false) {
          alert('Invoice successfully paid using Account Wallet Balance!');
          window.location.reload();
        } else {
          setPayError(data.message || 'Insufficient wallet credit.');
        }
      } else if (paymentGateway === 'bank') {
        setShowBankInfo((prev) => !prev);
      }
    } catch (err: any) {
      setPayError(err.message || 'Payment initiation error');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="invoice-container">
      {/* Invoice Header Row */}
      <div className="row invoice-header mb-4">
        <div className="col-12 col-sm-6 text-left">
          <p>
            <img
              src="/whmcs/logo.png"
              alt="SoftCents Systems Ltd."
              style={{ maxHeight: '42px', width: 'auto' }}
            />
          </p>
          <h3 className="mt-2" style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Invoice #{invoice?.invoicenum || invoiceId}
          </h3>
        </div>

        <div className="col-12 col-sm-6 text-center text-sm-right">
          <div className="invoice-status">
            {status === 'UNPAID' ? (
              <span className="unpaid">Unpaid</span>
            ) : status === 'PAID' ? (
              <span className="paid">Paid</span>
            ) : status === 'CANCELLED' ? (
              <span className="cancelled">Cancelled</span>
            ) : (
              <span className="refunded">{status}</span>
            )}
          </div>

          {status === 'UNPAID' && (
            <div className="small-text text-muted mt-2">
              Due Date: <strong>{invoice?.duedate || '-'}</strong>
            </div>
          )}
        </div>
      </div>

      <hr className="my-4" />

      {/* Pay To / Invoiced To Row */}
      <div className="row justify-content-between mb-4">
        <div className="col-12 col-sm-6 text-left">
          <strong className="d-block mb-1 text-uppercase" style={{ fontSize: '12px', color: '#666' }}>
            Invoiced To
          </strong>
          <address style={{ fontSize: '13px', lineHeight: '1.6', fontStyle: 'normal' }}>
            <strong>{client?.name || invoice?.clientName || 'Valued Customer'}</strong><br />
            {client?.company && <>{client.company}<br /></>}
            {client?.address1 || 'Dhaka, Bangladesh'}<br />
            {client?.city || 'Dhaka'}, Bangladesh<br />
            {client?.phone && <span className="text-muted">{client.phone}<br /></span>}
            <span style={{ color: '#0d6efd' }}>{client?.email || ''}</span>
          </address>
        </div>

        <div className="col-12 col-sm-6 text-sm-right">
          <strong className="d-block mb-1 text-uppercase" style={{ fontSize: '12px', color: '#666' }}>
            Pay To
          </strong>
          <address style={{ fontSize: '13px', lineHeight: '1.6', fontStyle: 'normal' }}>
            <strong>SoftCents Systems Ltd.</strong><br />
            Suite #502, BDBL Bhaban, Kawran Bazar<br />
            Dhaka - 1215, Bangladesh<br />
            Hotline: +880 9617 510 510<br />
            <span style={{ color: '#0d6efd' }}>billing@softcents.com</span>
          </address>
        </div>
      </div>

      {/* Payment Method & Date Info */}
      <div className="row mb-4">
        <div className="col-12 col-sm-6 text-left">
          <strong>Invoice Date:</strong> {invoice?.date || '-'}<br />
          <strong>Due Date:</strong> {invoice?.duedate || '-'}
        </div>

        <div className="col-12 col-sm-6 text-sm-right">
          <strong>Payment Method:</strong><br />
          {status === 'UNPAID' ? (
            <div className="d-inline-flex flex-column align-items-sm-end mt-1">
              <select
                value={paymentGateway}
                onChange={(e) => setPaymentGateway(e.target.value)}
                className="form-control d-inline-block"
                style={{
                  maxWidth: '260px',
                  padding: '6px 10px',
                  fontSize: '13px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                }}
              >
                <option value="piprapay">PipraPay (bKash / Nagad / Cards)</option>
                <option value="uddoktapay">UddoktaPay (Auto QR / bKash / Rocket)</option>
                <option value="reseller">Reseller Account Wallet Balance</option>
                <option value="bank">Direct Bank Transfer (City Bank / Brac)</option>
              </select>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={loadingPay}
                className="btn btn-success mt-2"
                style={{ fontWeight: 'bold', padding: '8px 24px' }}
              >
                {loadingPay ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-credit-card mr-1"></i> Pay Now (৳{amount.toFixed(2)} BDT)
                  </>
                )}
              </button>
            </div>
          ) : (
            <span className="text-success font-weight-bold">
              <i className="fas fa-check-circle mr-1"></i> Paid ({invoice?.paymentmethod || 'PipraPay'})
            </span>
          )}
        </div>
      </div>

      {/* Bank Transfer Instructions Modal / Box */}
      {showBankInfo && (
        <div className="card mb-4 border-info">
          <div className="card-header bg-info text-white font-weight-bold">
            <i className="fas fa-university mr-1"></i> Bank Account Information
          </div>
          <div className="card-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <p className="mb-2"><strong>City Bank Ltd.</strong><br />Account Name: SoftCents Systems Ltd.<br />Account No: 1503847291001<br />Branch: Kawran Bazar Branch, Dhaka</p>
            <small className="text-muted">After transfer, email reference or deposit slip to billing@softcents.com.</small>
          </div>
        </div>
      )}

      {payError && (
        <div className="alert alert-danger mb-4 p-3 bg-red-100 text-red-800 rounded">
          <i className="fas fa-exclamation-triangle mr-1"></i> {payError}
        </div>
      )}

      {/* Line Items Table */}
      <div className="table-responsive mb-4">
        <table className="table table-list" style={{ margin: '15px 0' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right" style={{ width: '160px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ whiteSpace: 'pre-line' }}>
                  {item.description ? String(item.description).replace(/\\r\\n|\\n|\\r/g, '\n') : ''}
                </td>
                <td className="text-right font-weight-bold">
                  ৳{parseFloat(item.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subtotals Summary Table */}
      <div className="row justify-content-end mb-4">
        <div className="col-12 col-md-5">
          <table className="table" style={{ fontSize: '13px' }}>
            <tbody>
              <tr>
                <td className="text-right"><strong>Sub Total:</strong></td>
                <td className="text-right">৳{amount.toFixed(2)} BDT</td>
              </tr>
              <tr>
                <td className="text-right"><strong>Credit:</strong></td>
                <td className="text-right">৳0.00 BDT</td>
              </tr>
              <tr style={{ fontSize: '15px', borderTop: '2px solid #ddd' }}>
                <td className="text-right"><strong>Total:</strong></td>
                <td className={`text-right font-weight-bold ${status === 'UNPAID' ? 'text-danger' : 'text-success'}`}>
                  ৳{amount.toFixed(2)} BDT
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions History if Paid */}
      {status === 'PAID' && (
        <div className="mb-4">
          <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Transactions</h4>
          <table className="table table-list">
            <thead>
              <tr>
                <th>Transaction Date</th>
                <th>Gateway</th>
                <th>Transaction ID</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{invoice?.date || '-'}</td>
                <td>{invoice?.paymentmethod || 'PipraPay'}</td>
                <td>TXN-{invoiceId}-9982</td>
                <td className="text-right font-weight-bold">৳{amount.toFixed(2)} BDT</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <hr className="my-4" />

      {/* Print & Back buttons */}
      <div className="d-flex justify-content-between align-items-center d-print-none">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-default"
        >
          <i className="fas fa-print mr-1"></i> Print
        </button>

        <Link href="/clientarea/invoices" className="btn btn-default">
          &larr; Back to Client Area
        </Link>
      </div>

      <div className="text-center text-muted mt-4 d-print-block" style={{ fontSize: '11px' }}>
        Thank you for choosing SoftCents Systems Ltd. This is a computer-generated invoice and requires no physical signature.
      </div>
    </div>
  );
}

export default function ViewInvoicePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8 px-2 font-sans">
      <Suspense
        fallback={
          <div className="text-center py-20 text-muted">
            <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Invoice...
          </div>
        }
      >
        <InvoiceContent />
      </Suspense>
    </div>
  );
}
