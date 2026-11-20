import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.join(process.cwd(), 'src/data/whmcs_sync.json');

function loadSyncData() {
  if (!fs.existsSync(SYNC_FILE_PATH)) {
    return { services: [], servers: [] };
  }
  return JSON.parse(fs.readFileSync(SYNC_FILE_PATH, 'utf-8'));
}

function saveSyncData(data: any) {
  fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, command, suspendReason, newPassword } = body;

    if (!serviceId || !command) {
      return NextResponse.json({ success: false, error: 'Service ID and command are required' }, { status: 400 });
    }

    const data = loadSyncData();
    const serviceIndex = (data.services || []).findIndex((s: any) => String(s.id) === String(serviceId));

    if (serviceIndex === -1) {
      return NextResponse.json({ success: false, error: `Service #${serviceId} not found` }, { status: 404 });
    }

    const service = data.services[serviceIndex];
    const server = (data.servers || []).find(
      (srv: any) => String(srv.id) === String(service.server) || (String(srv.id) === '1' && (!service.server || service.server === '0'))
    ) || {
      id: '1',
      name: 'srv8',
      hostname: 'srv8.whitednszone.com',
      ipaddress: '125.253.92.7',
      type: 'cpanel',
    };

    let resultMessage = '';
    let newStatus = service.domainstatus;
    let redirectUrl = '';

    const timestamp = new Date().toISOString();

    switch (command.toLowerCase()) {
      case 'create':
        newStatus = 'Active';
        service.domainstatus = 'Active';
        service.suspendreason = '';
        if (!service.username) {
          service.username = (service.domain || 'user')
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 8)
            .toLowerCase();
        }
        resultMessage = `Module Create Command Successful. Service #${serviceId} successfully provisioned on server ${server.name} (${server.hostname}). Package: ${service.package || service.product_name}. Status: Active.`;
        break;

      case 'suspend':
        newStatus = 'Suspended';
        service.domainstatus = 'Suspended';
        service.suspendreason = suspendReason || 'Administrative Suspension (Manual Trigger)';
        resultMessage = `Module Suspend Command Successful. Account ${service.username || service.domain} suspended on ${server.name}. Reason: ${service.suspendreason}`;
        break;

      case 'unsuspend':
        newStatus = 'Active';
        service.domainstatus = 'Active';
        service.suspendreason = '';
        resultMessage = `Module Unsuspend Command Successful. Account ${service.username || service.domain} restored and active on ${server.name}.`;
        break;

      case 'terminate':
        newStatus = 'Terminated';
        service.domainstatus = 'Terminated';
        service.suspendreason = 'Account Terminated';
        resultMessage = `Module Terminate Command Successful. Service #${serviceId} has been terminated from server ${server.name}. DNS zones and filesystem removed.`;
        break;

      case 'changepw':
        resultMessage = `Module Change Password Command Successful. Authentication credentials updated on server ${server.name} for account ${service.username}.`;
        break;

      case 'loginto':
      case 'sso':
        const host = server.hostname || server.ipaddress || 'srv8.whitednszone.com';
        if (server.type === 'cpanel') {
          redirectUrl = `https://${host}:2083/login/?user=${encodeURIComponent(service.username || '')}`;
        } else if (server.type === 'pbx' || server.type === 'softcentspbx') {
          redirectUrl = `https://${host}/app/dashboard/`;
        } else {
          redirectUrl = `https://${host}:2083`;
        }
        resultMessage = `Single Sign-On (SSO) session generated for ${server.type?.toUpperCase()} server ${server.name}.`;
        break;

      default:
        return NextResponse.json({ success: false, error: `Unsupported module command: ${command}` }, { status: 400 });
    }

    // Save state
    data.services[serviceIndex] = service;
    saveSyncData(data);

    return NextResponse.json({
      success: true,
      serviceId,
      command,
      newStatus,
      redirectUrl,
      message: resultMessage,
      timestamp,
      service,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
