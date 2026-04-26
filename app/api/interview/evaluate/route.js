import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages, profession } = await req.json();

    const systemPrompt = `Ты строгий эксперт. Оцени собеседование на позицию "${profession}". Дай честную оценку по 5 критериям, итоговый балл 0-100 и советы по улучшению. Отвечай на русском языке.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Вот история собеседования: ${JSON.stringify(messages)}. Дай подробную оценку.`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Ошибка оценки';

    return NextResponse.json({ success: true, evaluation: text });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}