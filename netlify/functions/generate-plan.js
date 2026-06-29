exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, {
      error: "Invalid JSON body.",
    });
  }

  const { system, user } = payload;

  if (!system || !user) {
    return jsonResponse(400, {
      error: 'Missing "system" or "user".',
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse(500, {
      error: "Missing GROQ_API_KEY environment variable.",
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 2048,
          response_format: {
            type: "json_object",
          },
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
        }),
      }
    );

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data.error?.message || "Groq API Error",
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse(502, {
        error: "No content returned from Groq.",
      });
    }

    return jsonResponse(200, {
      content,
    });

  } catch (err) {
    console.error(err);

    return jsonResponse(500, {
      error: err.message,
    });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
