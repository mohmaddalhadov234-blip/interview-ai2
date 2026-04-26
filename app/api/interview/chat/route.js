import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages, profession } = await req.json();

    const systemPrompt = Ты опытный HR-менеджер, проводишь собеседование на позицию "${profession}". Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени и задай следующий вопрос. Максимум 10 вопросов.;

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
        system: systemPrompt,
        messages: messages,
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Ошибка AI';

    return NextResponse.json({ success: true, message: text });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}