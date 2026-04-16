import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, headers: customHeaders, payload } = body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
    }

    // Only allow known API domains
    const url = new URL(targetUrl);
    const allowedHosts = [
      'www.dialagram.me',
      'dialagram.me',
      'api.openai.com',
      'generativelanguage.googleapis.com',
      'api.anthropic.com',
    ];

    if (!allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
      // Allow any custom host too (user-configured)
      // but log for awareness
      console.log(`[AI Proxy] Proxying to custom host: ${url.hostname}`);
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText, status: response.status },
        { status: response.status }
      );
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return NextResponse.json({ text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
