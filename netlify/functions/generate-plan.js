exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return jsonResponse(400, {
      error: "Invalid JSON in request body",
    });
  }

  const { system, user } = payload;

  if (!system || !user) {
    return jsonResponse(400, {
      error: 'Missing "system" or "user" prompt',
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse(500, {
      error:
        "Missing GROQ_API_KEY environment variable in Netlify.",
    });
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: system,
            },
            {
              role: "user",
              content: user,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    const data = await groqRes.json();

    console.log("Groq Status:", groqRes.status);
    console.log("Groq Response:", JSON.stringify(data, null, 2));

    if (!groqRes.ok) {
      return jsonResponse(groqRes.status, {
        error:
          data.error?.message ||
          "Groq API returned an error.",
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse(502, {
        error: "Groq returned no content.",
      });
    }

    return jsonResponse(200, {
      content,
    });

  } catch (err) {
    console.error("Function Error:", err);

    return jsonResponse(500, {
      error: err.message || "Unknown server error",
    });
  }
};

function jsonResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObj),
  };
}
