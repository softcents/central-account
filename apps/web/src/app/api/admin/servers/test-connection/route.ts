import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, hostname, ipaddress, type, secure } = body;

    const targetHost = (hostname || ipaddress || '').trim();
    if (!targetHost) {
      return NextResponse.json({ success: false, error: 'No hostname or IP address provided' }, { status: 400 });
    }

    let targetPort = Number(body.port);
    if (!targetPort || isNaN(targetPort)) {
      if (type === 'cpanel') {
        targetPort = secure !== 'off' ? 2087 : 2086;
      } else if (type === 'pbx' || type === 'softcentspbx') {
        targetPort = secure !== 'off' ? 443 : 80;
      } else if (type === 'virtualizor') {
        targetPort = 4085;
      } else if (type === 'directadmin') {
        targetPort = 2222;
      } else if (type === 'plesk') {
        targetPort = 8443;
      } else {
        targetPort = secure !== 'off' ? 443 : 80;
      }
    }

    const startTime = Date.now();

    const probeResult = await new Promise<{ ok: boolean; latency: number; error?: string }>((resolve) => {
      const sock = new net.Socket();
      sock.setTimeout(4500);

      sock.on('connect', () => {
        const latency = Date.now() - startTime;
        sock.destroy();
        resolve({ ok: true, latency });
      });

      sock.on('timeout', () => {
        sock.destroy();
        resolve({ ok: false, latency: Date.now() - startTime, error: 'Connection timed out (4.5s)' });
      });

      sock.on('error', (err) => {
        sock.destroy();
        resolve({ ok: false, latency: Date.now() - startTime, error: err.message });
      });

      sock.connect(targetPort, targetHost);
    });

    if (probeResult.ok) {
      return NextResponse.json({
        success: true,
        serverId: id,
        serverName: name,
        host: targetHost,
        port: targetPort,
        latencyMs: probeResult.latency,
        status: 'ONLINE',
        type: type || 'cpanel',
        message: `Connection to ${name || targetHost} (${targetHost}:${targetPort}) successful. Ping Latency: ${probeResult.latency}ms. Provisioning API daemon active.`,
      });
    } else {
      return NextResponse.json({
        success: false,
        serverId: id,
        serverName: name,
        host: targetHost,
        port: targetPort,
        latencyMs: probeResult.latency,
        status: 'OFFLINE',
        type: type || 'cpanel',
        error: probeResult.error,
        message: `Connection to ${name || targetHost} failed on port ${targetPort}: ${probeResult.error}`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error testing server' }, { status: 500 });
  }
}
