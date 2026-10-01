// Vercel serverless function — creates a user account that's already
// marked as confirmed, so it never depends on Supabase's project-wide
// "Confirm email" setting. Uses the Supabase service role key, which
// has full admin rights and must never reach the browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ACCESS_CODE = process.env.ACCESS_CODE;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  try {
    const { email, password, code } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const submitted = (code || '').trim().toUpperCase();
    const codeValid = ACCESS_CODE && submitted.length > 0 && submitted === ACCESS_CODE.trim().toUpperCase();

    let approved = codeValid;

    // Fallback: check the manual allowed_emails list, same as before.
    if (!approved) {
      const allowRes = await fetch(
        `${SUPABASE_URL}/rest/v1/allowed_emails?email=ilike.${encodeURIComponent(email)}&select=email`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
      );
      const allowRows = await allowRes.json();
      if (Array.isArray(allowRows) && allowRows.length > 0) approved = true;
    }

    if (!approved) {
      return res.status(403).json({
        error: "That access code didn't match, and this email isn't on the approved list. Check your confirmation email, or reach out to marcortiz.ai@gmail.com."
      });
    }

    // Create the account already confirmed — this is the part that no
    // longer depends on the project's Confirm Email setting at all.
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      const msg = createData?.msg || createData?.error_description || createData?.message || 'Could not create account';
      return res.status(createRes.status).json({ error: msg });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('create-account error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
