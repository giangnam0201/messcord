import { io as ioClient } from 'socket.io-client';

const ORIGIN = 'http://localhost:3000';

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  if (headers.raw) return headers.raw()['set-cookie'] ?? [];
  const v = headers.get('set-cookie');
  return v ? [v] : [];
}
function pickCookie(cookies, name) {
  for (const c of cookies) {
    const head = c.split(';')[0];
    const eq = head.indexOf('=');
    if (eq > 0 && head.slice(0, eq) === name) return head;
  }
  return null;
}
function mergeCookies(...cookies) {
  return cookies.filter(Boolean).join('; ');
}

async function login(email, password) {
  const csrfRes = await fetch(`${ORIGIN}/api/auth/csrf`, { redirect: 'manual' });
  const csrfBody = await csrfRes.json();
  const csrfSet = getSetCookies(csrfRes.headers);
  console.log('csrf set-cookie:', csrfSet);
  const csrfCookie = pickCookie(csrfSet, 'next-auth.csrf-token');
  const callbackCookie = pickCookie(csrfSet, 'next-auth.callback-url');
  console.log('csrf token:', csrfBody.csrfToken);

  const body = new URLSearchParams({ csrfToken: csrfBody.csrfToken, email, password, json: 'true' }).toString();
  const loginRes = await fetch(`${ORIGIN}/api/auth/callback/credentials`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: mergeCookies(csrfCookie, callbackCookie) },
    body
  });
  const loginSet = getSetCookies(loginRes.headers);
  console.log(`login(${email}) status=${loginRes.status} set-cookie=`, loginSet);
  const sessionCookie = pickCookie(loginSet, 'next-auth.session-token');
  return { full: mergeCookies(csrfCookie, callbackCookie, sessionCookie), sessionCookie };
}

async function main() {
  const a = await login('alice@demo.dev', 'password123');
  const b = await login('bob@demo.dev', 'password123');
  console.log('alice cookie:', a.sessionCookie);
  console.log('bob   cookie:', b.sessionCookie);

  const sock = ioClient(ORIGIN, {
    path: '/socket.io',
    transports: ['websocket'],
    extraHeaders: { Cookie: a.full },
    reconnection: false,
    timeout: 5000
  });
  sock.on('connect', () => console.log('alice connected id=', sock.id));
  sock.on('disconnect', (r) => console.log('alice disconnect reason=', r));
  sock.on('connect_error', (e) => console.log('alice connect_error=', e.message));
  await new Promise((r) => setTimeout(r, 1500));
  console.log('alice still connected:', sock.connected, 'id:', sock.id);
  sock.disconnect();
}

main().catch(console.error);
