'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const professions = [
  'Frontend', 'Backend', 'Python', 'Продавец-консультант',
  'Менеджер', 'Дизайнер', 'C++', 'Техподдержка'
];

const MAX_QUESTIONS = 10;

export default function InterviewPage() {
  const [step, setStep] = useState('start');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState('');

  const [freeAttemptsLeft, setFreeAttemptsLeft] = useState(3);
  const [lastAttemptDate, setLastAttemptDate] = useState('');

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Счётчик попыток
  useEffect(() => {
    const savedAttempts = localStorage.getItem('freeAttemptsLeft');
    const savedDate = localStorage.getItem('lastAttemptDate');
    const today = new Date().toISOString().split('T')[0];

    if (savedDate !== today) {
      localStorage.setItem('freeAttemptsLeft', '3');
      localStorage.setItem('lastAttemptDate', today);
      setFreeAttemptsLeft(3);
    } else if (savedAttempts) {
      setFreeAttemptsLeft(parseInt(savedAttempts));
    }
    setLastAttemptDate(today);
  }, []);

  const updateAttempts = () => {
    const newAttempts = Math.max(0, freeAttemptsLeft - 1);
    const today = new Date().toISOString().split('T')[0];
    setFreeAttemptsLeft(newAttempts);
    localStorage.setItem('freeAttemptsLeft', newAttempts.toString());
    localStorage.setItem('lastAttemptDate', today);
  };

  const questionCount = Math.floor(messages.filter(m => m.role === 'assistant').length);
  const progress = Math.min(Math.round((questionCount / MAX_QUESTIONS) * 100), 100);

  const startInterview = async () => {
    if (!selectedProfession || freeAttemptsLeft <= 0) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profession: selectedProfession }),
      });

      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setMessages([data.firstMessage]);
        setStep('interviewing');
        updateAttempts();
        localStorage.setItem('interviewSession', JSON.stringify(data.sessionData));
      }
    } catch (error) {
      alert('Не удалось запустить собеседование');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          profession: selectedProfession,
          sessionId,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantResponse += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantResponse };
          return updated;
        });
      }
    } catch (error) {
      alert('Ошибка при получении ответа');
    } finally {
      setIsLoading(false);
    }
  };

  const finishInterview = async () => {
    setStep('evaluating');
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, profession: selectedProfession }),
      });

      const data = await res.json();
      if (data.success) {
        setEvaluation(data.evaluation);
        setStep('result');
        localStorage.removeItem('interviewSession');
      }
    } catch (error) {
      alert('Ошибка оценки');
      setStep('interviewing');
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setStep('start');
    setSelectedProfession('');
    setMessages([]);
    setEvaluation('');
    setInputMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-black to-blue-950/30 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        
        {/* Шапка с кнопкой подписки */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl">
              🎯
            </div>
            <h1 className="text-3xl font-bold tracking-tight">InterviewAI</h1>
          </div>

          <Link 
            href="/subscribe"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
          >
            Купить подписку
            <span className="text-sm opacity-75">149 ₽/мес</span>
          </Link>
        </div>

        {/* Основной контент */}
        <div className="text-center mb-12">
          <p className="text-gray-400 text-lg">Подготовься к реальному собеседованию с помощью ИИ</p>
        </div>

        {/* Счётчик попыток */}
        {step === 'start' && (
          <div className="flex justify-center mb-10">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-8 py-4 flex items-center gap-5 backdrop-blur-xl">
              <span className="text-gray-400">Бесплатных попыток сегодня:</span>
              <div className="flex gap-2">
                {[1,2,3].map(i => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      i <= freeAttemptsLeft 
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 scale-110' 
                        : 'bg-zinc-800 text-gray-600'
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ... (весь остальной код страницы остаётся без изменений) ... */}
        {/* Шаг 1: Выбор профессии */}
        {step === 'start' && (
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-10 backdrop-blur-2xl">
            <h2 className="text-3xl font-semibold text-center mb-10">Выберите профессию</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {professions.map((prof) => (
                <button
                  key={prof}
                  onClick={() => setSelectedProfession(prof)}
                  className={`p-8 rounded-2xl border transition-all duration-300 text-lg font-medium
                    ${selectedProfession === prof 
                      ? 'border-purple-500 bg-zinc-800 shadow-xl shadow-purple-500/30 scale-105' 
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-950'}`}
                >
                  {prof}
                </button>
              ))}
            </div>

            <button
              onClick={startInterview}
              disabled={!selectedProfession || isLoading || freeAttemptsLeft <= 0}
              className="w-full py-5 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/40"
            >
              {freeAttemptsLeft <= 0 ? 'Попытки закончились • Приходите завтра' : 'Начать собеседование'}
            </button>
          </div>
        )}

        {/* Шаг 2: Собеседование (оставляем как было) */}
        {step === 'interviewing' && (
          <div className="bg-zinc-900/90 border border-zinc-700 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 flex justify-between items-center">
              <div>
                <p className="text-purple-400 text-sm">Собеседование • {selectedProfession}</p>
                <p className="font-semibold text-xl">Вопрос {questionCount} из {MAX_QUESTIONS}</p>
              </div>

              <div className="w-48">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{progress}% завершено</p>
              </div>

              <button
                onClick={finishInterview}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-sm font-medium transition"
              >
                Завершить
              </button>
            </div>

            <div 
              ref={chatContainerRef}
              className="h-[520px] overflow-y-auto p-8 space-y-8 bg-black/30"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`max-w-[78%] px-6 py-4 rounded-3xl transition-all duration-300 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-zinc-800 border border-zinc-700 text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-3xl px-6 py-4 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300" />
                    </div>
                    <span className="text-sm text-gray-400">Claude отвечает...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-700 bg-zinc-900">
              <div className="flex gap-4">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ваш ответ..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-purple-500 rounded-2xl px-6 py-4 min-h-[56px] max-h-[130px] resize-y outline-none text-white placeholder-gray-500"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 disabled:opacity-50 rounded-2xl font-medium transition-all"
                >
                  Отправить
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Напишите «завершить», чтобы закончить собеседование
              </p>
            </div>
          </div>
        )}

        {/* Шаги evaluating и result оставляем без изменений (как в предыдущей версии) */}
        {step === 'evaluating' && (
          <div className="text-center py-28">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-3xl font-semibold mb-3">Готовим подробную оценку...</h3>
            <p className="text-gray-400">Анализируем ваши ответы</p>
          </div>
        )}

        {step === 'result' && (
          <div className="bg-zinc-900/90 border border-zinc-700 rounded-3xl p-12 backdrop-blur-2xl">
            <div className="text-center mb-10">
              <div className="text-7xl mb-6">🏆</div>
              <h2 className="text-4xl font-bold">Ваша оценка</h2>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-10 text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">
              {evaluation}
            </div>

            <div className="flex justify-center mt-12">
              <button
                onClick={resetInterview}
                className="px-12 py-5 bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 rounded-2xl font-semibold text-lg transition-all"
              >
                Пройти ещё одно собеседование
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
}