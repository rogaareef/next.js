// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Pro Scholar Tools | AI-Powered Academic Research',
    template: '%s | Pro Scholar Tools'
  },
  description: 'Ultimate AI tools for PhD researchers and legal scholars. Paraphrasing, summarizing, and legal AI assistant.',
  keywords: ['AI research tools', 'PhD assistant', 'legal AI', 'academic paraphrasing'],
  authors: [{ name: 'Mohamed Rabie Areef', url: 'https://www.proscholartools.com' }],
  creator: 'Mohamed Rabie Areef',
  alternates: {
    canonical: 'https://www.proscholartools.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.proscholartools.com',
    siteName: 'Pro Scholar Tools',
  },
}
