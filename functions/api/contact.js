// POST /api/contact
// Validates an inquiry, verifies Turnstile, and emails it via the Cloudflare
// Email Service binding. No database; nothing is stored.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = (v, max) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: bots fill it, people never see it. Pretend success.
  if (clean(form.get('company'), 50)) return json({ ok: true });

  const name = clean(form.get('name'), 120);
  const email = clean(form.get('email'), 200);
  const project = clean(form.get('project'), 80);
  const when = clean(form.get('when'), 200);
  const message = clean(form.get('message'), 3000);

  if (!name || !message || !project || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please complete all required fields.' }, 400);
  }

  // Turnstile
  const token = form.get('cf-turnstile-response');
  if (!env.TURNSTILE_SECRET) return json({ error: 'Form is not configured yet.' }, 503);
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: String(token || ''),
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  }).then(r => r.json()).catch(() => null);
  if (!verify?.success) return json({ error: 'Verification failed. Please try again.' }, 400);

  if (!env.EMAIL) return json({ error: 'Email is not configured yet.' }, 503);

  const to = env.CONTACT_TO || 'cg@makeupbycg.com';
  const from = env.CONTACT_FROM || 'inquiries@makeupbycg.com';

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Project: ${project}`,
    `Date & location: ${when || '—'}`,
    '',
    message,
  ].join('\n');

  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5">
<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;</p>
<p>Project: ${esc(project)}<br>Date &amp; location: ${esc(when || '—')}</p>
<p style="white-space:pre-wrap">${esc(message)}</p></div>`;

  try {
    await env.EMAIL.send({
      to,
      from: { email: from, name: 'Makeup by CG website' },
      replyTo: email,
      subject: `New inquiry: ${project} (${name})`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      text,
      html,
    });
  } catch (err) {
    console.error('email send failed', err?.message || err);
    return json({ error: 'Could not send right now.' }, 502);
  }

  return json({ ok: true });
}

export const onRequest = () => json({ error: 'Method not allowed.' }, 405);
