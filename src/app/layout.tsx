// En app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// --- 👇 INICIO DE LA MEJORA SEO ---

const siteUrl = 'https://www.llevateloconjorvi.com';

export const metadata: Metadata = {
  // Título base y plantilla para páginas internas
  title: {
    default: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    template: '%s | Llevatelo con Jorvi',
  },
  description: 'Participa en rifas exclusivas con Jorvi y gana premios asombrosos. Compra tu ticket y sé el próximo afortunado. ¡La suerte te espera en Venezuela!',
  
  // Palabras clave relevantes para tu negocio
  keywords: ['rifas online', 'sorteos', 'premios', 'ganar', 'suerte', 'Llevatelo con Jorvi', 'Venezuela'],
  
  // Íconos para diferentes dispositivos
  icons: {
    icon: '/jorvi.png',
    apple: '/jorvi.png', 
  },

  // URL canónica base del sitio
  metadataBase: new URL(siteUrl),

  // Metadatos para Robots de Búsqueda
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph (para Facebook, WhatsApp, etc.)
  openGraph: {
    title: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    description: '¡Tu oportunidad de ganar está aquí! Participa en nuestras rifas y llévate premios fantásticos.',
    url: siteUrl,
    siteName: 'Llevatelo con Jorvi',
    images: [
      {
        url: `${siteUrl}/jorvi.png`, // Crea una imagen de vista previa (1200x630px)
        width: 1200,
        height: 630,
        alt: 'Logo de Llevatelo con Jorvi con premios de fondo',
      },
    ],
    locale: 'es_VE',
    type: 'website',
  },

  // Twitter Card (para cuando se comparte en Twitter)
  twitter: {
    card: 'summary_large_image',
    title: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    description: '¡No dejes pasar la suerte! Participa en rifas exclusivas y gana premios asombrosos con Jorvi.',
    images: [`${siteUrl}/jorvi.png`], // Reutilizamos la imagen de Open Graph
  },
};

// --- 🔼 FIN DE LA MEJORA SEO ---


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}