import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.join(process.cwd(), 'src/data/whmcs_sync.json');

function loadSyncData() {
  if (!fs.existsSync(SYNC_FILE_PATH)) {
    return { servers: [], serverGroups: [] };
  }
  return JSON.parse(fs.readFileSync(SYNC_FILE_PATH, 'utf-8'));
}

function saveSyncData(data: any) {
  fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = loadSyncData();
    return NextResponse.json({
      success: true,
      serverGroups: data.serverGroups || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loadSyncData();
    if (!data.serverGroups) data.serverGroups = [];

    const existingIndex = data.serverGroups.findIndex((g: any) => String(g.id) === String(body.id));

    if (existingIndex !== -1) {
      data.serverGroups[existingIndex] = {
        ...data.serverGroups[existingIndex],
        name: body.name || data.serverGroups[existingIndex].name,
        filltype: body.filltype || data.serverGroups[existingIndex].filltype || '1',
        servers: Array.isArray(body.servers) ? body.servers : data.serverGroups[existingIndex].servers || [],
      };
    } else {
      const newGroup = {
        id: String(Date.now()),
        name: body.name || 'New Server Group',
        filltype: body.filltype || '1',
        servers: Array.isArray(body.servers) ? body.servers : [],
      };
      data.serverGroups.push(newGroup);
    }

    saveSyncData(data);

    return NextResponse.json({
      success: true,
      message: 'Server group saved successfully',
      serverGroups: data.serverGroups,
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
      return NextResponse.json({ success: false, error: 'Server Group ID required' }, { status: 400 });
    }

    const data = loadSyncData();
    data.serverGroups = (data.serverGroups || []).filter((g: any) => String(g.id) !== String(id));
    saveSyncData(data);

    return NextResponse.json({
      success: true,
      message: 'Server group removed successfully',
      serverGroups: data.serverGroups,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
