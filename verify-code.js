// Vercel serverless function — checks a signup access code against the
// real value, which lives only here as an environment variable
// (ACCESS_CODE). The real code never reaches the browser, so it can't
// be found by viewing the page's source.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const realCode = process.env.ACCESS_CODE;
  if (!realCode) {
    console.error('Server is missing ACCESS_CODE');
    return res.status(500).json({ error: 'Server is missing ACCESS_CODE' });
  }

  const { code } = req.body || {};
  const submitted = (code || '').trim().toUpperCase();
  const valid = submitted.length > 0 && submitted === realCode.trim().toUpperCase();

  return res.status(200).json({ valid });
}
