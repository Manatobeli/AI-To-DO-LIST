// netlify/functions/generate-plan.js
//
// Server-side proxy to the xAI Grok API. Keeps XAI_API_KEY off the client.
// The frontend POSTs { system, user } prompt strings; this returns { content }.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return jsonResponse(400, { error: 'Invalid JSON in request body' });
  }

  const { system, user } = payload;
  if (!system || !user) {
    return jsonResponse(400, { error: 'Missing "system" or "user" prompt' });
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'Server is missing GROK_API_KEY. Set it in Netlify > Site configuration > Environment variables.' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${API_KEY}
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await groqRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return jsonResponse(502, { error: 'Grok returned no content' });
    }

    return jsonResponse(200, { content });
  } catch (err) {
    console.error('generate-plan function error', err);
    return jsonResponse(500, { error: err.message || 'Unknown server error' });
  }
};

function jsonResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj)
  };
}
