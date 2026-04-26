'use client';

export default function SubscribePage() {
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", fontFamily:"sans-serif" }}>
      <div style={{ maxWidth:"500px", width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:"60px", marginBottom:"20px" }}>🚀</div>
        <h1 style={{ fontSize:"32px", fontWeight:800, marginBottom:"12px" }}>InterviewAI Pro</h1>
        <p style={{ opacity:.6, marginBottom:"40px", lineHeight:1.6 }}>Безлимитные собеседования каждый день</p>

        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"24px", padding:"40px", marginBottom:"20px" }}>
          <div style={{ fontSize:"48px", fontWeight:800, marginBottom:"8px" }}>149 ₽</div>
          <div style={{ opacity:.5, marginBottom:"30px" }}>в месяц</div>

          {["✅ Безлимитные собеседования", "✅ Все 8 профессий", "✅ Подробные оценки", "✅ Приоритетная поддержка"].map((item, i) => (
            <div key={i} style={{ textAlign:"left", marginBottom:"12px", fontSize:"16px" }}>{item}</div>
          ))}

          <button
            onClick={() => alert('Оплата через ЮКассу — скоро!')}
            style={{ width:"100%", marginTop:"24px", padding:"18px", background:"linear-gradient(135deg,#7C3AED,#2563EB)", border:"none", borderRadius:"16px", color:"#fff", fontSize:"18px", fontWeight:700, cursor:"pointer" }}>
            💳 Оплатить 149 ₽/месяц
          </button>
        </div>

        <a href="/interview" style={{ color:"#818CF8", fontSize:"14px" }}>← Вернуться к собеседованию</a>
      </div>
    </div>
  );
}