// This runs on the SERVER, never in the browser — so the API key stays hidden from users.
export async function POST(request) {
  const { messages } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it in your .env.local or hosting provider's env settings." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data?.error?.message || "Anthropic API error" }, { status: response.status });
    }

    // Combine all text blocks (there can be several when web search is used)
    const reply = (data?.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n\n") || "Sorry, I couldn't get a response.";
    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: "Failed to reach Anthropic API" }, { status: 500 });
  }
}
