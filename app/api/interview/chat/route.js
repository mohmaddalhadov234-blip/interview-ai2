import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { system, messages } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: system,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude error:', err);
      return NextResponse.json({ message: 'Ошибка AI' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Ошибка AI';

    return NextResponse.json({ success: true, message: text });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
