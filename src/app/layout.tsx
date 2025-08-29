// En app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

// 1. Añade la propiedad "variable"
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Nombra la variable CSS
});

export const metadata: Metadata = {
  title: 'RifaSystem - Sistema de Rifas',
  description: 'Sistema profesional de rifas con panel de administración',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. Aplica la variable al HTML o al BODY
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}