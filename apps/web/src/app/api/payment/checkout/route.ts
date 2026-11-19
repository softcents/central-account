import { NextRequest, NextResponse } from 'next/server';

const PIPRAPAY_API_KEY = 'b3e91bb98e0d874acb860272f240000b48a47368010ed81017';
const PIPRAPAY_BASE_URL = 'https://epay.softcents.com/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amount, fullName, email, phone } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // PipraPay endpoint for V3+
    const targetUrl = `${PIPRAPAY_BASE_URL}/checkout/redirect`;

    const postData = {
      full_name: fullName || 'SoftCents Customer',
      email_address: email || 'billing@softcents.com',
      mobile_number: phone || '01700000000',
      amount: Number(amount),
      metadata: { invoiceid: String(invoiceId || '0') },
      return_url: `https://billing.softcents.com/viewinvoice.php?id=${invoiceId || '0'}`,
      webhook_url: `https://billing.softcents.com/modules/gateways/callback/piprapay.php`,
      currency: 'BDT',
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'MHS-PIPRAPAY-API-KEY': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (data.pp_url) {
      return NextResponse.json({
        success: true,
        pp_id: data.pp_id,
        pp_url: data.pp_url,
      });
    } else {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to generate PipraPay URL', details: data },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
