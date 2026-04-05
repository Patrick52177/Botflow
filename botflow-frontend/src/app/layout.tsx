import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'BotFlow — Plateforme SaaS Chatbot',
  description: 'Créez et gérez vos chatbots intelligents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased bg-bg text-text">
        {children}
      </body>
    </html>
  )
}
