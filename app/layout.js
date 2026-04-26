export const metadata = {
  title: 'InterviewAI — Подготовка к собеседованию',
  description: 'Пройди собеседование с AI. Реальные вопросы, мгновенная обратная связь.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  )
}