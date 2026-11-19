import { NextRequest, NextResponse } from 'next/server';

const PIPRAPAY_API_KEY = 'b3e91bb98e0d874acb860272f240000b48a47368010ed81017';
const PIPRAPAY_BASE_URL = 'https://epay.softcents.com/api';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const invoiceId = data.metadata?.invoiceid;
    const ppId = data.pp_id;
    const status = data.status;

    if (!invoiceId || !ppId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify payment with PipraPay
    const verifyRes = await fetch(`${PIPRAPAY_BASE_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'MHS-PIPRAPAY-API-KEY': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify({ pp_id: ppId }),
    });

    const verifyResult = await verifyRes.json();

    if (verifyResult && String(verifyResult.status).toLowerCase() === 'completed') {
      console.log(`✓ PipraPay payment verified for Invoice #${invoiceId}, Txn: ${ppId}`);
      return NextResponse.json({ success: true, message: 'Payment verified and credited' });
    } else {
      console.warn(`Payment verification failed for ${ppId}:`, verifyResult);
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
