// Cloudflare Pages Function: receives contact-form submissions and emails
// them via Resend. RESEND_API_KEY / TURNSTILE_SECRET are Pages secrets —
// they never appear in page source.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TO = 'natsurii@protonmail.com';
const FROM = 'Natsurii Portfolio <onboarding@resend.dev>';
const BODY_LIMIT = 10 * 1024;

export function normalize(input) {
  return {
    name: typeof input.name === 'string' ? input.name.trim() : '',
    email: typeof input.email === 'string' ? input.email.trim() : '',
    message: typeof input.message === 'string' ? input.message.trim() : '',
  };
}

export function validate({ name, email, message }) {
  if (!name || name.length > 200) return 'Name is required (max 200 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return 'A valid email address is required.';
  if (!message || message.length > 2000) return 'Message is required (max 2000 characters).';
  return null;
}

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildResendPayload({ name, email, message }) {
  return {
    from: FROM,
    reply_to: email,
    to: [TO],
    subject: `[portfolio] contact from ${name}`,
    html:
      `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` +
      `<p style="color:#666;font-size:12px">&mdash; ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>${new Date().toISOString()}</p>`,
  };
}

async function verifyTurnstile(token, secret, remoteIp) {
  if (!token) return false;
  const body = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}` +
    (remoteIp ? `&remoteip=${encodeURIComponent(remoteIp)}` : '');
  const res = await fetch(TURNSTILE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return false;
  return Boolean((await res.json()).success);
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

    const len = Number(request.headers.get('content-length') || 0);
    if (len > BODY_LIMIT) return json({ ok: false, error: 'payload too large' }, 413);

    let input;
    try {
      input = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'invalid JSON body' }, 400);
    }
    if (typeof input !== 'object' || input === null) input = {};

    // Honeypot: bots fill the hidden "website" field — pretend success, drop it.
    if (typeof input.website === 'string' && input.website.length > 0) return json({ ok: true });

    const fields = normalize(input);
    const err = validate(fields);
    if (err) return json({ ok: false, error: err }, 400);

    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(input.turnstile, env.TURNSTILE_SECRET, request.headers.get('cf-connecting-ip'));
      if (!ok) return json({ ok: false, error: 'captcha verification failed' }, 403);
    }

    let resent;
    try {
      resent = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(buildResendPayload(fields)),
      });
    } catch (e) {
      return json({ ok: false, error: 'could not reach email service. Try again later.' }, 502);
    }
    if (!resent.ok) {
      console.error('resend failed:', resent.status, await resent.text());
      return json({ ok: false, error: 'email service failed. Try again later.' }, 502);
    }
    return json({ ok: true });
  },
};
