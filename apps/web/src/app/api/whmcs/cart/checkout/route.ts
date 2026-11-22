import { NextRequest, NextResponse } from 'next/server';

const PIPRAPAY_API_KEY = 'b3e91bb98e0d874acb860272f240000b48a47368010ed81017';
const PIPRAPAY_BASE_URL = 'https://epay.softcents.com/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      productId,
      billingCycle,
      domain,
      paymentMethod,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    const invoiceId = Date.now().toString().slice(-6);
    const payAmount = Number(amount) || 1500;

    if (paymentMethod === 'piprapay') {
      try {
        const postData = {
          full_name: customerName || 'SoftCents Customer',
          email_address: customerEmail || 'billing@softcents.com',
          mobile_number: customerPhone || '01700000000',
          amount: payAmount,
          metadata: { invoiceid: String(invoiceId), productId: String(productId || '1') },
          return_url: `https://account.softcents.com/viewinvoice?id=${invoiceId}&payment=success`,
          webhook_url: `https://billing.softcents.com/modules/gateways/callback/piprapay.php`,
          currency: 'BDT',
        };

        const response = await fetch(`${PIPRAPAY_BASE_URL}/checkout/redirect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'MHS-PIPRAPAY-API-KEY': PIPRAPAY_API_KEY,
          },
          body: JSON.stringify(postData),
        });

        const data = await response.json();
        if (data.pp_url) {
          return NextResponse.json({
            success: true,
            invoiceId,
            paymentUrl: data.pp_url,
          });
        }
      } catch (e) {
        console.warn('PipraPay initiation fallback:', e);
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      message: 'Order created successfully! Invoice #' + invoiceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Checkout error' },
      { status: 500 }
    );
  }
}
