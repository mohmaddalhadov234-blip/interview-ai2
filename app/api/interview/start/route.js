import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { profession } = await req.json();

    const sessionId = `session_${Date.now()}`;

    const initialMessage = {
      role: 'assistant',
      content: `Здравствуйте! Я Senior Recruiter. Сегодня проводим собеседование на позицию "${profession}". Расскажите кратко о себе и своём опыте.`,
    };

    const sessionData = {
      sessionId,
      profession,
      messages: [initialMessage],
    };

    return NextResponse.json({
      success: true,
      sessionId,
      profession,
      firstMessage: initialMessage,
      sessionData,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}