import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.join(process.cwd(), 'src/data/whmcs_sync.json');

function loadSyncData() {
  if (!fs.existsSync(SYNC_FILE_PATH)) {
    return { servers: [], serverGroups: [], services: [] };
  }
  return JSON.parse(fs.readFileSync(SYNC_FILE_PATH, 'utf-8'));
}

function saveSyncData(data: any) {
  fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = loadSyncData();
    const servers = data.servers || [];
    const serverGroups = data.serverGroups || [];
    const services = data.services || [];

    // Recalculate live accounts distribution
    const enriched = servers.map((s: any) => {
      const assigned = services.filter(
        (srv: any) => String(srv.server) === String(s.id) || (String(s.id) === '1' && (!srv.server || srv.server === '0'))
      );
      return {
        ...s,
        activeAccounts: assigned.length,
      };
    });

    return NextResponse.json({
      success: true,
      servers: enriched,
      serverGroups,
      totalServers: enriched.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loadSyncData();
    if (!data.servers) data.servers = [];

    const existingIndex = data.servers.findIndex((s: any) => String(s.id) === String(body.id));

    if (existingIndex !== -1) {
      // Update existing server
      data.servers[existingIndex] = {
        ...data.servers[existingIndex],
        ...body,
        id: String(data.servers[existingIndex].id),
        maxaccounts: body.maxaccounts || data.servers[existingIndex].maxaccounts || '200',
        port: body.port || data.servers[existingIndex].port || '2087',
      };
    } else {
      // Add new server
      const newId = String(Date.now());
      const newServer = {
        id: newId,
        name: body.name || 'New Server',
        ipaddress: body.ipaddress || '',
        hostname: body.hostname || '',
        assignedips: body.assignedips || '',
        monthlycost: body.monthlycost || '0.00',
        noc: body.noc || 'Primary Datacenter',
        statusaddress: body.statusaddress || '',
        nameserver1: body.nameserver1 || '',
        nameserver1ip: body.nameserver1ip || '',
        nameserver2: body.nameserver2 || '',
        nameserver2ip: body.nameserver2ip || '',
        nameserver3: body.nameserver3 || '',
        nameserver3ip: body.nameserver3ip || '',
        nameserver4: body.nameserver4 || '',
        nameserver4ip: body.nameserver4ip || '',
        nameserver5: body.nameserver5 || '',
        nameserver5ip: body.nameserver5ip || '',
        maxaccounts: body.maxaccounts || '200',
        type: body.type || 'cpanel',
        username: body.username || 'root',
        secure: body.secure || 'on',
        port: body.port || (body.type === 'cpanel' ? '2087' : '443'),
        active: body.active ? '1' : '0',
        disabled: '0',
        activeAccounts: 0,
      };
      data.servers.push(newServer);
    }

    saveSyncData(data);

    return NextResponse.json({
      success: true,
      message: 'Server configuration saved successfully',
      servers: data.servers,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Server ID required' }, { status: 400 });
    }

    const data = loadSyncData();
    data.servers = (data.servers || []).filter((s: any) => String(s.id) !== String(id));
    saveSyncData(data);

    return NextResponse.json({
      success: true,
      message: 'Server removed successfully',
      servers: data.servers,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
