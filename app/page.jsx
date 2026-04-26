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
  frontend: "Ты строгий HR-менеджер, проводишь собеседование на Frontend разработчика. Вопросы про React, JavaScript, CSS. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  backend: "Ты строгий HR-менеджер, проводишь собеседование на Backend разработчика. Вопросы про API, базы данных. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  python: "Ты строгий HR-менеджер, проводишь собеседование на Python разработчика. Вопросы про ООП, библиотеки. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  sales: "Ты строгий менеджер DNS, проводишь собеседование на продавца-консультанта. Вопросы про клиентов, технику. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  manager: "Ты строгий HR, проводишь собеседование на менеджера. Вопросы про управление, лидерство. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  designer: "Ты строгий арт-директор, проводишь собеседование на дизайнера. Вопросы про дизайн, инструменты. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  cpp: "Ты строгий интервьюер, проводишь собеседование на C++ разработчика. Вопросы про ООП, память. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
  support: "Ты строгий менеджер, проводишь собеседование на техподдержку. Вопросы про клиентов, IT. Говори только по-русски. Задавай по одному вопросу. После ответа кратко оцени.",
};

const SCORE_PROMPT = `Оцени собеседование. Ответь строго в JSON без markdown: {"score":число 0-100,"grade":"Слабо/Неплохо/Хорошо/Отлично","strong":["сильная 1","сильная 2"],"weak":["слабая 1","слабая 2"],"tip":"главный совет"}`;

async function sendToClaude(system, messages) {
  const res = await fetch("/api/interview/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  
  if (!res.ok) {
    throw new Error("API error");
  }
  
  const data = await res.json();
  return data.message || "Ошибка AI";
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [attempts, setAttempts] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("interview_attempts");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.date === new Date().toDateString()) {
          setAttempts(data.count || 0);
        }
      } catch {
        setAttempts(0);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isDark = theme === "dark";
  const bg = isDark ? "#0a0a0a" : "#f5f5f5";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const textColor = isDark ? "#E8E8F0" : "#1A1A2E";
  const job = JOBS.find(j => j.id === selectedJob);
  const attemptsLeft = FREE_LIMIT - attempts;
  const userAnswers = messages.filter(m => m.role === "user").length;

  function saveAttempts(count) {
    const today = new Date().toDateString();
    localStorage.setItem("interview_attempts", JSON.stringify({ date: today, count }));
    setAttempts(count);
  }

  function goHome() {
    setMessages([]);
    setResult(null);
    setInput("");
    setScreen("home");
  }

  async function startInterview() {
    if (!selectedJob) return;
    if (attempts >= FREE_LIMIT) { 
      setShowPaywall(true); 
      return; 
    }
    saveAttempts(attempts + 1);
    setScreen("interview");
    setMessages([]);
    setLoading(true);
    try {
      const text = await sendToClaude(
        SYSTEM_PROMPTS[selectedJob] + " Уровень: " + LEVELS[selectedLevel],
        [{ role: "user", content: "Начни собеседование. Представься и задай первый вопрос." }]
      );
      setMessages([{ role: "assistant", content: text }]);
    } catch {
      setMessages([{ role: "assistant", content: "Ошибка подключения." }]);
    }
    setLoading(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const aiText = await sendToClaude(
        SYSTEM_PROMPTS[selectedJob] + " Уровень: " + LEVELS[selectedLevel],
        newMessages
      );
      setMessages([...newMessages, { role: "assistant", content: aiText }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Ошибка." }]);
    }
    setLoading(false);
  }

  async function finishInterview() {
    setLoading(true);
    try {
      const text = await sendToClaude(SCORE_PROMPT, [{ role: "user", content: JSON.stringify(messages) }]);
      try {
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const parsedResult = JSON.parse(cleanJson);
        setResult(parsedResult);
      } catch {
        setResult({ 
          score: 65, 
          grade: "Неплохо", 
          strong: ["Участвовал"], 
          weak: ["Нужно практики"], 
          tip: "Тренируйся!" 
        });
      }
    } catch {
      setResult({ 
        score: 65, 
        grade: "Неплохо", 
        strong: ["Участвовал"], 
        weak: ["Нужно практики"], 
        tip: "Тренируйся!" 
      });
    }
    setLoading(false);
    setScreen("result");
  }

  if (showPaywall) return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 420, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Бесплатные попытки закончились</h2>
        <p style={{ opacity: 0.6, marginBottom: 32 }}>Ты использовал все 3 бесплатных собеседования сегодня.</p>
        <div style={{ background: cardBg, border: "1px solid rgba(79,110,247,0.3)", borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <div style={{ fontSize: 42, fontWeight: 800 }}>149 ₽</div>
          <p style={{ opacity: 0.6 }}>в месяц — безлимит</p>
          <button onClick={() => alert("ЮКасса скоро!")} style={{ width: "100%", marginTop: 20, padding: 16, background: "linear-gradient(135deg,#4F6EF7,#A855F7)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            💳 Оплатить 149 ₽/месяц
          </button>
        </div>
        <button onClick={() => setShowPaywall(false)} style={{ background: "none", border: "none", color: textColor, opacity: 0.5, cursor: "pointer" }}>← Назад</button>
      </div>
    </div>
  );

  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4F6EF7,#A855F7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</div>
          <span style={{ fontWeight: 800, fontSize: 18 }}>InterviewAI</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, padding: "4px 12px", background: attemptsLeft > 0 ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", borderRadius: 20, color: attemptsLeft > 0 ? "#10B981" : "#EF4444" }}>
            {attemptsLeft > 0 ? attemptsLeft + " из " + FREE_LIMIT + " бесплатных" : "Лимит исчерпан"}
          </span>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: textColor }}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
          <h1 style={{ fontSize: "clamp(24px,6vw,46px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 14px" }}>
            Пройди собеседование<br />
            <span style={{ background: "linear-gradient(90deg,#4F6EF7,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>с AI прямо сейчас</span>
          </h1>
          <p style={{ opacity: 0.6, fontSize: 15 }}>Реальные вопросы. Мгновенная обратная связь.</p>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", opacity: 0.4, textTransform: "uppercase", marginBottom: 12 }}>Выбери профессию</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
          {JOBS.map(j => (
            <div key={j.id} onClick={() => setSelectedJob(j.id)}
              style={{ 
                background: selectedJob === j.id ? `linear-gradient(135deg,${j.color}22,${j.color}11)` : cardBg, 
                border: `1px solid ${selectedJob === j.id ? j.color + "66" : cardBorder}`, 
                borderRadius: 14, 
                padding: "14px 12px", 
                cursor: "pointer" 
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{j.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{j.title}</div>
              <div style={{ fontSize: 11, opacity: 0.45 }}>{j.desc}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", opacity: 0.4, textTransform: "uppercase", marginBottom: 12 }}>Твой уровень</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {LEVELS.map((lvl, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedLevel(i)} 
              style={{ 
                flex: 1, 
                padding: "12px 8px", 
                background: selectedLevel === i ? "linear-gradient(135deg,#4F6EF7,#A855F7)" : cardBg, 
                border: `1px solid ${selectedLevel === i ? "transparent" : cardBorder}`, 
                borderRadius: 12, 
                color: textColor, 
                fontWeight: 600, 
                cursor: "pointer", 
                fontSize: 14, 
                opacity: selectedLevel === i ? 1 : 0.55 
              }}
            >
              {["🌱", "🔥", "💎"][i]} {lvl}
            </button>
          ))}
        </div>

        <button onClick={startInterview} disabled={!selectedJob}
          style={{ 
            width: "100%", 
            padding: 17, 
            background: selectedJob ? "linear-gradient(135deg,#4F6EF7,#A855F7)" : cardBg, 
            border: "none", 
            borderRadius: 16, 
            color: selectedJob ? "#fff" : "rgba(128,128,128,0.5)", 
            fontSize: 16, 
            fontWeight: 700, 
            cursor: selectedJob ? "pointer" : "not-allowed" 
          }}>
          {attemptsLeft <= 0 ? "🔒 Купить подписку 149 ₽/мес" : selectedJob ? `🚀 Начать — ${job?.title} · ${LEVELS[selectedLevel]}` : "Выбери профессию выше"}
        </button>
      </div>
    </div>
  );

  if (screen === "interview") return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: bg, color: textColor, fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${cardBorder}`, flexShrink: 0, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={goHome} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: textColor }}>←</button>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${job?.color}44,${job?.color}22)`, border: `1px solid ${job?.color}44`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{job?.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{job?.title}</div>
            <div style={{ fontSize: 11, opacity: 0.4 }}>{LEVELS[selectedLevel]}</div>
          </div>
        </div>
        <button onClick={finishInterview} disabled={userAnswers < 2 || loading}
          style={{ 
            background: userAnswers >= 2 && !loading ? "linear-gradient(135deg,#10B981,#059669)" : cardBg, 
            border: "none", 
            borderRadius: 8, 
            padding: "6px 12px", 
            cursor: userAnswers >= 2 && !loading ? "pointer" : "not-allowed", 
            color: userAnswers >= 2 && !loading ? "#fff" : "rgba(128,128,128,0.4)", 
            fontSize: 12, 
            fontWeight: 700 
          }}>
          📊 Результат
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4F6EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 8, flexShrink: 0, marginTop: 4 }}>🤖</div>}
            <div style={{ 
              maxWidth: "74%", 
              padding: "10px 14px", 
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
              background: msg.role === "user" ? "linear-gradient(135deg,#4F6EF7,#A855F7)" : cardBg, 
              border: msg.role === "user" ? "none" : `1px solid ${cardBorder}`, 
              fontSize: 14, 
              lineHeight: 1.6, 
              color: msg.role === "user" ? "#fff" : textColor, 
              wordBreak: "break-word" 
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4F6EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px 18px 18px 4px", padding: "11px 16px" }}>AI думает...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "12px 14px", borderTop: `1px solid ${cardBorder}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Твой ответ... (Enter — отправить)" rows={2}
            style={{ 
              flex: 1, 
              background: cardBg, 
              border: `1px solid ${cardBorder}`, 
              borderRadius: 13, 
              padding: "10px 13px", 
              color: textColor, 
              fontSize: 14, 
              resize: "none", 
              outline: "none", 
              lineHeight: 1.5 
            }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            style={{ 
              width: 44, 
              height: 44, 
              flexShrink: 0, 
              background: input.trim() && !loading ? "linear-gradient(135deg,#4F6EF7,#A855F7)" : cardBg, 
              border: `1px solid ${cardBorder}`, 
              borderRadius: 13, 
              cursor: input.trim() && !loading ? "pointer" : "not-allowed", 
              fontSize: 17, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>➤</button>
        </div>
        <p style={{ fontSize: 11, opacity: 0.3, marginTop: 6, textAlign: "center" }}>2+ ответа → «📊 Результат»</p>
      </div>
    </div>
  );

  if (screen === "result" && result) {
    const sc = result.score || 0;
    const scoreColor = sc >= 80 ? "#10B981" : sc >= 55 ? "#F59E0B" : "#EF4444";
    const C = 2 * Math.PI * 54;
    const dash = C - (sc / 100) * C;
    return (
      <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: 570, margin: "0 auto", padding: "clamp(24px,5vw,48px) 16px" }}>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "3px", opacity: 0.35, textTransform: "uppercase", marginBottom: 22 }}>Результат собеседования</div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                <circle cx={70} cy={70} r={54} fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth={10} />
                <circle cx={70} cy={70} r={54} fill="none" stroke={scoreColor} strokeWidth={10} strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 70 70)" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 36, color: scoreColor }}>{sc}</div>
                <div style={{ fontSize: 11, opacity: 0.4 }}>из 100</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <span style={{ background: `${scoreColor}22`, border: `1px solid ${scoreColor}44`, borderRadius: 24, padding: "6px 22px", fontSize: 15, fontWeight: 700, color: scoreColor }}>{result.grade}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 15, padding: 17 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 10, textTransform: "uppercase" }}>✅ Сильные</div>
              {result.strong?.map((s, i) => <div key={i} style={{ fontSize: 13, marginBottom: 7, lineHeight: 1.4, opacity: 0.85 }}>· {s}</div>)}
            </div>
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 15, padding: 17 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 10, textTransform: "uppercase" }}>❌ Слабые</div>
              {result.weak?.map((w, i) => <div key={i} style={{ fontSize: 13, marginBottom: 7, lineHeight: 1.4, opacity: 0.85 }}>· {w}</div>)}
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(79,110,247,.12),rgba(168,85,247,.12))", border: "1px solid rgba(79,110,247,.25)", borderRadius: 15, padding: 18, marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8", marginBottom: 8, textTransform: "uppercase" }}>💡 Главный совет</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, opacity: 0.9 }}>{result.tip}</div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setMessages([]); startInterview(); }}
              style={{ flex: 1, padding: 16, background: "linear-gradient(135deg,#4F6EF7,#A855F7)", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>🔄 Ещё раз</button>
            <button onClick={goHome}
              style={{ flex: 1, padding: 16, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, color: textColor, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>🏠 Главная</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
