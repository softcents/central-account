import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.join(process.cwd(), 'src/data/whmcs_sync.json');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = String(body.id || body.clientId || body.userid || '');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!fs.existsSync(SYNC_FILE_PATH)) {
      return NextResponse.json({ error: 'WHMCS sync file not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const index = (data.clients || []).findIndex(
      (c: any) => String(c.id) === clientId || String(c.whmcsId) === clientId
    );

    if (index === -1) {
      return NextResponse.json({ error: `Client #${clientId} not found` }, { status: 404 });
    }

    const existing = data.clients[index];

    const updatedClient = {
      ...existing,
      firstname: body.firstname !== undefined ? body.firstname : existing.firstname,
      lastname: body.lastname !== undefined ? body.lastname : existing.lastname,
      name: `${body.firstname ?? existing.firstname} ${body.lastname ?? existing.lastname}`.trim(),
      company: body.companyname !== undefined ? body.companyname : (existing.companyname || existing.company),
      companyname: body.companyname !== undefined ? body.companyname : (existing.companyname || existing.company),
      email: body.email !== undefined ? body.email : existing.email,
      phonenumber: body.phonenumber !== undefined ? body.phonenumber : (existing.phonenumber || existing.phone),
      phone: body.phonenumber !== undefined ? body.phonenumber : (existing.phonenumber || existing.phone),
      address1: body.address1 !== undefined ? body.address1 : existing.address1,
      address2: body.address2 !== undefined ? body.address2 : existing.address2,
      city: body.city !== undefined ? body.city : existing.city,
      state: body.state !== undefined ? body.state : existing.state,
      postcode: body.postcode !== undefined ? body.postcode : existing.postcode,
      country: body.country !== undefined ? body.country : existing.country,
      status: body.status !== undefined ? body.status : (existing.status || 'Active'),
      defaultgateway: body.defaultgateway !== undefined ? body.defaultgateway : existing.defaultgateway,
      billingcid: body.billingcid !== undefined ? body.billingcid : (existing.billingcid || '0'),
      language: body.language !== undefined ? body.language : (existing.language || 'english'),
      taxexempt: body.taxexempt !== undefined ? body.taxexempt : existing.taxexempt,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      customfields: {
        ...(existing.customfields || {}),
        ...(body.customfields || {}),
      },
    };

    data.clients[index] = updatedClient;

    // Save back to whmcs_sync.json
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Client profile successfully updated and saved in system.',
      client: updatedClient,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 });
  }
}
