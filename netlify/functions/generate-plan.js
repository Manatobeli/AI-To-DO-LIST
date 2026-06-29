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

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'Server is missing XAI_API_KEY. Set it in Netlify > Site configuration > Environment variables.' });
  }

  try {
    const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!xaiResponse.ok) {
      const errText = await xaiResponse.text();
      return jsonResponse(xaiResponse.status, { error: `xAI API error (${xaiResponse.status}): ${errText.slice(0, 500)}` });
    }

    const data = await xaiResponse.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return jsonResponse(502, { error: 'Grok returned no content' });
    }

    return jsonResponse(200, { content });
  } catch (err) {
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
