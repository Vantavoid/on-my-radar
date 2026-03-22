import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'On My Radar',
  description: 'Daily aviation news for air traffic controllers — Cape Town ACC',
  openGraph: {
    title: 'On My Radar',
    description: 'Daily aviation news for air traffic controllers',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} h-full`}>
      <body className="scanlines min-h-full bg-deep-black text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
