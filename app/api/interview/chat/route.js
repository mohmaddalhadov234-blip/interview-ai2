import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { system, messages } = await req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ message: 'Ошибка AI' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Ошибка AI';

    return NextResponse.json({ success: true, message: text });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
