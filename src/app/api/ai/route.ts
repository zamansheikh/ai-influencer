import { NextRequest, NextResponse } from 'next/server';

// Parse SSE streaming response into a single assembled message
function parseSSEResponse(sseText: string): Record<string, unknown> | null {
  const lines = sseText.split('\n');
  let role = '';
  let content = '';
  let finishReason = '';
  let id = '';
  let model = '';

  for (const line of lines) {
    if (!line.startsWith('data: ') || line.trim() === 'data: [DONE]') continue;

    try {
      const chunk = JSON.parse(line.slice(6));
      if (chunk.id) id = chunk.id;
      if (chunk.model) model = chunk.model;

      const delta = chunk.choices?.[0]?.delta;
      if (delta?.role) role = delta.role;
      if (delta?.content) content += delta.content;

      const fr = chunk.choices?.[0]?.finish_reason;
      if (fr) finishReason = fr;
    } catch {
      // skip unparseable lines
    }
  }

  if (!content && !role) return null;

  // Return in standard OpenAI non-streaming format
  return {
    id,
    object: 'chat.completion',
    model,
    choices: [
      {
        index: 0,
        message: { role: role || 'assistant', content },
        finish_reason: finishReason || 'stop',
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, headers: customHeaders, payload } = body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText, status: response.status },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';

    // Handle SSE / streaming responses (text/event-stream)
    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      const text = await response.text();

      // Try to parse as assembled SSE chunks
      const assembled = parseSSEResponse(text);
      if (assembled) {
        return NextResponse.json(assembled);
      }

      return NextResponse.json({ text });
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback: read as text, check if it looks like SSE
    const text = await response.text();

    if (text.includes('data: {') && text.includes('"choices"')) {
      const assembled = parseSSEResponse(text);
      if (assembled) {
        return NextResponse.json(assembled);
      }
    }

    // Try JSON parse
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
