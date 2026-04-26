"use client";

import { useState, useRef, useEffect } from "react";

const JOBS = [
  { id: "frontend", icon: "⚡", title: "Frontend Dev", color: "#61DAFB", desc: "React, JS, CSS" },
  { id: "backend", icon: "🛠️", title: "Backend Dev", color: "#68D391", desc: "API, БД, серверы" },
  { id: "python", icon: "🐍", title: "Python Dev", color: "#F6E05E", desc: "Скрипты, ML, Django" },
  { id: "sales", icon: "💼", title: "Продавец-консультант", color: "#FC8181", desc: "DNS, М.Видео и др." },
  { id: "manager", icon: "📊", title: "Менеджер", color: "#B794F4", desc: "Проекты, команды" },
  { id: "designer", icon: "🎨", title: "Дизайнер", color: "#F6AD55", desc: "UI/UX, Figma" },
  { id: "cpp", icon: "⚙️", title: "C++ Dev", color: "#76E4F7", desc: "Системы, игры" },
  { id: "support", icon: "🎧", title: "Техподдержка", color: "#9AE6B4", desc: "IT, клиенты" },
];

const LEVELS = ["Джун", "Мидл", "Сеньор"];
const FREE_LIMIT = 3;

const SYSTEM_PROMPTS = {
  frontend: "Ты строгий HR-менеджер проводишь собеседование на Frontend разработчика. Задавай вопросы про React, JavaScript, CSS, HTML, производительность. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени его (1-2 предложения) и задай следующий вопрос.",
  backend: "Ты строгий HR-менеджер проводишь собеседование на Backend разработчика. Вопросы про REST API, базы данных, SQL, архитектуру. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени его и задай следующий.",
  python: "Ты строгий HR-менеджер проводишь собеседование на Python разработчика. Вопросы про синтаксис, ООП, библиотеки, алгоритмы. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
  sales: "Ты строгий менеджер DNS/М.Видео проводишь собеседование на продавца-консультанта электроники. Вопросы про работу с клиентами, знание техники, конфликтные ситуации, KPI. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
  manager: "Ты строгий HR проводишь собеседование на менеджера. Вопросы про управление, лидерство, стресс-ситуации, KPI. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
  designer: "Ты строгий арт-директор проводишь собеседование на UI/UX дизайнера. Вопросы про процесс дизайна, инструменты, кейсы. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
  cpp: "Ты строгий технический интервьюер проводишь собеседование на C++ разработчика. Вопросы про ООП, память, STL, алгоритмы. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
  support: "Ты строгий менеджер проводишь собеседование на специалиста техподдержки. Вопросы про работу с клиентами, IT знания, стресс. Говори только по-русски. Задавай по одному вопросу за раз. После ответа кратко оцени.",
};

const SCORE_PROMPT = `Ты оцениваешь прошедшее собеседование. Дай итоговую оценку строго в формате JSON (только JSON без markdown): 
{"score": число от 0 до 100, "grade": "Слабо / Неплохо / Хорошо / Отлично", "strong": ["сильная сторона 1", "сильная сторона 2"], "weak": ["слабая сторона 1", "слабая сторона 2"], "tip": "главный совет для улучшения"}`;

export default function InterviewAI() {
  const [screen, setScreen] = useState("home");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [attempts, setAttempts] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  const isDark = theme === "dark";

  useEffect(() => {
    const saved = localStorage.getItem("interview_attempts");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === new Date().toDateString()) {
        setAttempts(data.count || 0);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      handleTimeOut();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft]);

  const saveAttempts = (count) => {
    const today = new Date().toDateString();
    localStorage.setItem("interview_attempts", JSON.stringify({ date: today, count }));
    setAttempts(count);
  };

  const startTimer = () => { setTimeLeft(60); setTimerActive(true); };

  const stopTimer = () => {
    setTimerActive(false);
    setTimeLeft(60);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTimeOut = async () => {
    const newMessages = [...messages, { role: "user", content: "Время на ответ вышло." }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const systemPrompt = SYSTEM_PROMPTS[selectedJob] + ` Уровень: ${LEVELS[selectedLevel]}.`;
      const aiText = await sendToClaude(systemPrompt, newMessages);
      setMessages([...newMessages, { role: "assistant", content: aiText }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Время вышло." }]);
    }
    setLoading(false);
  };

  const startInterview = async () => {
    if (attempts >= FREE_LIMIT) { setShowPaywall(true); return; }
    saveAttempts(attempts + 1);
    setScreen("interview");
    setMessages([]);
    stopTimer();
    setLoading(true);
    try {
      const systemPrompt = SYSTEM_PROMPTS[selectedJob] + ` Уровень: ${LEVELS[selectedLevel]}.`;
      const text = await sendToClaude(systemPrompt, [
        { role: "user", content: "Начни собеседование. Представься как HR и задай первый вопрос." }
      ]);
      setMessages([{ role: "assistant", content: text }]);
    } catch {
      setMessages([{ role: "assistant", content: "Ошибка подключения к AI." }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    stopTimer();
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const systemPrompt = SYSTEM_PROMPTS[selectedJob] + ` Уровень: ${LEVELS[selectedLevel]}.`;
      const aiText = await sendToClaude(systemPrompt, newMessages);
      setMessages([...newMessages, { role: "assistant", content: aiText }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Ошибка соединения." }]);
    }
    setLoading(false);
  };

  const finishInterview = async () => {
    stopTimer();
    setLoading(true);
    try {
      const aiMsgs = messages.filter(m => m.role !== "system");
      const text = await sendToClaude(SCORE_PROMPT, [{ role: "user", content: JSON.stringify(aiMsgs) }]);
      let parsed;
      try {
        const cleaned = text.replace(/json|/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { score: 65, grade: "Неплохо", strong: ["Участвовал"], weak: ["Нужно больше практики"], tip: "Тренируйся регулярно!" };
      }
      setResult(parsed);
      setScreen("result");
    } catch {
      setResult({ score: 60, grade: "Неплохо", strong: ["Старался"], weak: ["Технические проблемы"], tip: "Продолжай практиковаться!" });
      setScreen("result");
    }
    setLoading(false);
  };

  const currentJob = JOBS.find(j => j.id === selectedJob);
  const attemptsLeft = FREE_LIMIT - attempts;

  // ===================== PAYWALL =====================
  if (showPaywall) {
    return (
      <div style={{ minHeight: "100vh", background: isDark ? "#070711" : "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "420px", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "70px", marginBottom: "24px" }}>🔒</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "28px" }}>Бесплатные попытки закончились</h2>
          <p style={{ opacity: 0.7, marginBottom: "32px" }}>Ты использовал все 3 бесплатных собеседования сегодня.</p>
          <div style={{ background: "linear-gradient(135deg, rgba(79,110,247,0.12), rgba(168,85,247,0.12))", borderRadius: "20px", padding: "28px", border: "1px solid rgba(79,110,247,0.3)" }}>
            <div style={{ fontSize: "42px", fontWeight: 800 }}>149 ₽</div>
            <p style={{ opacity: 0.6 }}>в месяц — безлимит</p>
            {["✅ Безлимитные собеседования", "✅ Все 8 профессий", "✅ Подробные оценки", "✅ Сохранение истории"].map((item, i) => (
              <div key={i} style={{ textAlign: "left", fontSize: "15px", marginBottom: "8px" }}>{item}</div>
            ))}
            <button style={{ width: "100%", marginTop: "24px", padding: "16px", background: "linear-gradient(135deg, #4F6EF7, #A855F7)", border: "none", borderRadius: "14px", color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>
              💳 Оплатить подписку
            </button>
          </div>
          <button onClick={() => setShowPaywall(false)} style={{ marginTop: "20px", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "14px" }}>← Вернуться</button>
        </div>
      </div>
    );
  }

  // ===================== HOME =====================
  if (screen === "home") {
    return (
      <div style={{ minHeight: "100vh", background: isDark ? "linear-gradient(135deg, #070711 0%, #0D0D1A 50%, #070711 100%)" : "linear-gradient(135deg, #F0F4FF 0%, #FAFBFF 50%, #F0F4FF 100%)", fontFamily: "'DM Sans', sans-serif", color: isDark ? "#E8E8F0" : "#1A1A2E", position: "relative", overflow: "hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}}</style>

        <div style={{ position: "fixed", width: "600px", height: "600px", borderRadius: "50%", background: "#4F6EF7", filter: "blur(120px)", opacity: 0.12, top: "-200px", left: "-200px" }} />
        <div style={{ position: "fixed", width: "600px", height: "600px", borderRadius: "50%", background: "#F5A623", filter: "blur(120px)", opacity: 0.12, bottom: "-200px", right: "-200px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #4F6EF7, #A855F7)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px" }}>InterviewAI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: attemptsLeft > 0 ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", border: 1px solid ${attemptsLeft > 0 ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: attemptsLeft > 0 ? "#10B981" : "#EF4444" }}>
              {attemptsLeft > 0 ? ${attemptsLeft} из ${FREE_LIMIT} бесплатных : "Лимит исчерпан"}
            </div>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", animation: "float 3s ease-in-out infinite" }}>🤖</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 6vw, 48px)", lineHeight: 1.1, letterSpacing: "-1px" }}>
              Пройди собеседование<br />
              <span style={{ background: "linear-gradient(90deg, #4F6EF7, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>с AI прямо сейчас</span>
            </h1>
            <p style={{ fontSize: "16px", opacity: 0.6, maxWidth: "400px", margin: "0 auto" }}>
              Реальные вопросы. Мгновенная обратная связь. Готовься к работе своей мечты.
            </p>
          </div>

          <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "2px", opacity: 0.4, textTransform: "uppercase", marginBottom: "16px" }}>Выбери профессию</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            {JOBS.map(job => (
              <div key={job.id} onClick={() => setSelectedJob(job.id)}
                style={{ background: selectedJob === job.id ? linear-gradient(135deg, ${job.color}22, ${job.color}11) : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: 1px solid ${selectedJob === job.id ? job.color + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}, borderRadius: "14px", padding: "16px", cursor: "pointer", transition: "all 0.2s ease" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{job.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{job.title}</div>
                <div style={{ fontSize: "11px", opacity: 0.5 }}>{job.desc}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "2px", opacity: 0.4, textTransform: "uppercase", marginBottom: "16px" }}>Твой уровень</p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
            {LEVELS.map((lvl, i) => (
              <button key={i} onClick={() => setSelectedLevel(i)}
                style={{ flex: 1, padding: "12px", background: selectedLevel === i ? "linear-gradient(135deg, #4F6EF7, #A855F7)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "12px", color: isDark ? "#E8E8F0" : "#1A1A2E", fontWeight: 600, cursor: "pointer" }}>
                {["🌱", "🔥", "💎"][i]} {lvl}
              </button>
            ))}
          </div>

          <button onClick={startInterview} disabled={!selectedJob}
            style={{ width: "100%", padding: "18px", background: selectedJob ? "linear-gradient(135deg, #4F6EF7, #A855F7)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "16px", color: selectedJob ? "#fff" : "#888", fontSize: "17px", fontWeight: 600, cursor: selectedJob ? "pointer" : "not-allowed" }}>
            {selectedJob ? 🚀 Начать собеседование — ${currentJob?.title} : "Выбери профессию выше"}
          </button>
        </div>
      </div>
    );
  }

  // ===================== INTERVIEW =====================
  if (screen === "interview") {
    const job = JOBS.find(j => j.id === selectedJob);
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: isDark ? "#070711" : "#F0F4FF", color: isDark ? "#E8E8F0" : "#1A1A2E", overflow: "hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{@keyframes dot{0%,80%,100%{opacity:0}40%{opacity:1}}}</style>

        <div style={{ padding: "14px 20px", borderBottom: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setScreen("home")} style={{ fontSize: "22px", background: "none", border: "none", cursor: "pointer" }}>←</button>
            <div style={{ width: "38px", height: "38px", background: linear-gradient(135deg, ${job?.color}44, ${job?.color}22), border: 1px solid ${job?.color}40, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{job?.icon}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{job?.title}</div>
              <div style={{ fontSize: "12px", opacity: 0.5 }}>{LEVELS[selectedLevel]}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {timerActive && (
              <div style={{ background: timeLeft < 10 ? "rgba(239,68,68,0.25)" : "rgba(79,110,247,0.15)", border: 1px solid ${timeLeft < 10 ? "#EF4444" : "#6366F1"}, borderRadius: "8px", padding: "6px 12px", fontWeight: 700, color: timeLeft < 10 ? "#F87171" : "#818CF8" }}>
                ⏱ {timeLeft}с
              </div>
            )}
            <button onClick={startTimer} style={{ padding: "6px 12px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: "pointer" }}>60с</button>
            {/* ✅ ИСПРАВЛЕНО: length < 2 вместо length < 3 */}
            <button onClick={finishInterview} disabled={messages.filter(m => m.role === "user").length < 2}
              style={{ padding: "6px 12px", background: messages.filter(m => m.role === "user").length >= 2 ? "linear-gradient(135deg, #10B981, #059669)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "8px", cursor: messages.filter(m => m.role === "user").length >= 2 ? "pointer" : "not-allowed", color: messages.filter(m => m.role === "user").length >= 2 ? "#fff" : "#888", fontWeight: 600 }}>
              📊 Результат
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #4F6EF7, #A855F7)", marginRight: "12px", flexShrink: 0, marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
              )}
              <div style={{ maxWidth: "72%", padding: "13px 17px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #4F6EF7, #A855F7)" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", color: msg.role === "user" ? "#fff" : isDark ? "#E8E8F0" : "#1A1A2E", lineHeight: 1.6 }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #4F6EF7, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
              <div style={{ padding: "12px 18px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: "20px", display: "flex", gap: "6px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "7px", height: "7px", background: "#4F6EF7", borderRadius: "50%", animation: dot 1.4s ${i*0.2}s infinite }} />)}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: "16px 20px", borderTop: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Напиши свой ответ... (Enter — отправить)"
              rows={2}
              style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: 1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}, borderRadius: "14px", padding: "14px 16px", color: isDark ? "#E8E8F0" : "#1A1A2E", fontSize: "15px", resize: "none", outline: "none", lineHeight: 1.5 }}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              style={{ width: "52px", height: "52px", background: input.trim() && !loading ? "linear-gradient(135deg, #4F6EF7, #A855F7)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", border: "none", borderRadius: "14px", color: "#fff", fontSize: "20px", cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all 0.2s ease" }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== RESULT =====================
  if (screen === "result" && result) {
    const sc = result.score;
    const scoreColor = sc >= 80 ? "#10B981" : sc >= 60 ? "#F59E0B" : "#EF4444";
    const C = 2 * Math.PI * 54;
    const dash = C - (sc / 100) * C;
    return (
      <div style={{ minHeight: "100vh", background: isDark ? "#070711" : "#F0F4FF", padding: "40px 20px", fontFamily: "'DM Sans', sans-serif", color: isDark ? "#E8E8F0" : "#1A1A2E" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "3px", opacity: 0.4, marginBottom: "24px" }}>Результат собеседования</div>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "30px" }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth="10" />
              <circle cx="70" cy="70" r="54" fill="none" stroke={scoreColor} strokeWidth="10" strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 70 70)" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "38px", color: scoreColor }}>{sc}</div>
              <div style={{ fontSize: "12px", opacity: 0.4 }}>из 100</div>
            </div>
          </div>
          <div style={{ marginBottom: "30px" }}>
            <span style={{ padding: "8px 26px", borderRadius: "30px", background: ${scoreColor}22, border: 1px solid ${scoreColor}44, color: scoreColor, fontWeight: 700 }}>{result.grade}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "30px" }}>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ color: "#10B981", fontWeight: 700, marginBottom: "10px" }}>✅ Сильные стороны</div>
              {result.strong?.map((s, i) => <div key={i} style={{ marginBottom: "6px", fontSize: "13px" }}>• {s}</div>)}
            </div>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ color: "#EF4444", fontWeight: 700, marginBottom: "10px" }}>❌ Слабые стороны</div>
              {result.weak?.map((w, i) => <div key={i} style={{ marginBottom: "6px", fontSize: "13px" }}>• {w}</div>)}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(79,110,247,0.12), rgba(168,85,247,0.12))", borderRadius: "16px", padding: "20px", marginBottom: "40px", border: "1px solid rgba(79,110,247,0.25)" }}>
            <div style={{ color: "#818CF8", fontWeight: 700, marginBottom: "10px" }}>💡 Главный совет</div>
            <div style={{ lineHeight: 1.6 }}>{result.tip}</div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => { setMessages([]); startInterview(); }} style={{ flex: 1, padding: "16px", background: "linear-gradient(135deg, #4F6EF7, #A855F7)", border: "none", borderRadius: "14px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}>
              🔄 Ещё раз
            </button>
            <button onClick={() => { setScreen("home"); setResult(null); }} style={{ flex: 1, padding: "16px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", border: 1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}, borderRadius: "14px", color: isDark ? "#E8E8F0" : "#1A1A2E", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}>
              🏠 На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

async function sendToClaude(system, messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Ошибка AI";
}