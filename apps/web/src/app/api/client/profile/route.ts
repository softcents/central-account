import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.join(process.cwd(), 'src/data/whmcs_sync.json');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || searchParams.get('userid') || '177';

    if (!fs.existsSync(SYNC_FILE_PATH)) {
      return NextResponse.json({ error: 'Data store not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const client = (data.clients || []).find((c: any) => String(c.id) === String(clientId));

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client, customFields: data.clientCustomFields || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch client' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = String(body.id || body.clientId || '177');

    let data: any = { clients: [] };
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
      data = JSON.parse(raw);
    }

    const index = (data.clients || []).findIndex((c: any) => String(c.id) === clientId);

    const updatedClient = {
      ...(index !== -1 ? data.clients[index] : {}),
      id: clientId,
      firstname: body.firstname || body.firstName || '',
      lastname: body.lastname || body.lastName || '',
      name: `${body.firstname || body.firstName || ''} ${body.lastname || body.lastName || ''}`.trim(),
      company: body.companyname || body.companyName || '',
      companyname: body.companyname || body.companyName || '',
      email: body.email || (index !== -1 ? data.clients[index].email : ''),
      phonenumber: body.phonenumber || body.phoneNumber || '',
      phone: body.phonenumber || body.phoneNumber || '',
      address1: body.address1 || '',
      address2: body.address2 || '',
      city: body.city || '',
      state: body.state || '',
      postcode: body.postcode || '',
      country: body.country || 'BD',
      tax_id: body.tax_id || body.taxId || '',
      defaultgateway: body.defaultgateway || body.paymentmethod || '',
      billingcid: body.billingcid || '0',
      language: body.language || body.accountLanguage || '',
      marketing_emails_opt_in: Boolean(body.marketing_emails_opt_in ?? body.marketingoptin),
      email_preferences: body.email_preferences || {
        general: 1,
        invoice: 1,
        support: 1,
        product: 1,
        domain: 1,
        affiliate: 1,
      },
      customfields: {
        ...(index !== -1 && data.clients[index].customfields ? data.clients[index].customfields : {}),
        ...(body.customfields || {}),
      },
    };

    if (index !== -1) {
      data.clients[index] = updatedClient;
    } else {
      data.clients.push(updatedClient);
    }

    // Persist to JSON file
    try {
      fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Could not write to whmcs_sync.json directly:', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Changes Saved Successfully',
      client: updatedClient,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
