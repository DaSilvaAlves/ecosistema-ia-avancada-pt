import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Frusoal InovCitrus',
  description:
    'Polo de Investigação e Desenvolvimento da Frusoal — citricultura do Algarve.',
  metadataBase: new URL('https://inovcitrus.vercel.app')
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
