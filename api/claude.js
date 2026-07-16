// Vercel serverless function — proxies requests to the Claude API.
// The Anthropic API key lives only here, as a server-side environment
// variable (ANTHROPIC_API_KEY). It never reaches the browser.
//
// The frontend calls this endpoint at /api/claude instead of calling
// api.anthropic.com directly.

export default async function handler(req, res) {
  // Only allow requests from your own site in production.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Missing "messages" in request body' });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 300,
        system: system || undefined,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data.error?.message || 'Claude API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('claude proxy error', err);
    return res.status(500).json({ error: 'Something went wrong reaching Claude' });
  }
}
