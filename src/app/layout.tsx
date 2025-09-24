// En app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import Script from 'next/script'; // Importa el componente Script de Next.js

// Configuración de la fuente
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// --- 👇 INICIO DE LA MEJORA SEO COMPLETA ---

const siteUrl = 'https://www.llevateloconjorvi.com';

export const metadata: Metadata = {
  // Título base y plantilla para que las demás páginas lo hereden
  // Ejemplo: "Rifa del iPhone 15 | Llevatelo con Jorvi"
  title: {
    default: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    template: '%s | Llevatelo con Jorvi',
  },

  // Descripción optimizada para motores de búsqueda
  description: 'Participa en rifas exclusivas con Jorvi y gana premios asombrosos. Compra tu ticket y sé el próximo afortunado. ¡La suerte te espera en Venezuela!',

  // Palabras clave relevantes para tu negocio
  keywords: ['rifas online', 'sorteos', 'premios', 'ganar', 'suerte', 'Llevatelo con Jorvi', 'Venezuela'],

  // Íconos para navegadores y dispositivos Apple
  icons: {
    icon: '/jorvi.png',
    apple: '/jorvi.png',
  },

  // Establece la URL canónica base para todo el sitio
  metadataBase: new URL(siteUrl),

  // Metadatos para Robots de Búsqueda (Google, Bing, etc.)
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

  // Metadatos de Open Graph para compartir en redes (Facebook, WhatsApp)
  openGraph: {
    title: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    description: '¡Tu oportunidad de ganar está aquí! Participa en nuestras rifas y llévate premios fantásticos.',
    url: siteUrl,
    siteName: 'Llevatelo con Jorvi',
    images: [
      {
        url: `${siteUrl}/jorvi.png`,
        width: 1200,
        height: 630,
        alt: 'Logo de Llevatelo con Jorvi con premios de fondo',
      },
    ],
    locale: 'es_VE',
    type: 'website',
  },

  // Metadatos de Twitter Card para compartir en Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Llevatelo con Jorvi - Rifas Exclusivas y Premios Increíbles',
    description: '¡No dejes pasar la suerte! Participa en rifas exclusivas y gana premios asombrosos con Jorvi.',
    images: [`${siteUrl}/jorvi.png`], // Reutilizamos la imagen de Open Graph
    // creator: '@tuUsuarioDeTwitter', // ❗️
  },
};

// --- 🔼 FIN DE LA MEJORA SEO COMPLETA ---

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Objeto JSON-LD para los datos estructurados de la organización
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Llevatelo con Jorvi',
    url: siteUrl,
    logo: `${siteUrl}/jorvi.png`, // URL completa y absoluta a tu logo
    description: 'Sitio de rifas exclusivas en Venezuela para ganar premios increíbles.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      // email: 'contacto@llevateloconjorvi.com', // ❗️
      // telephone: '+58-XXX-XXXXXXX', // ❗️
    },
    sameAs: [
      // ❗️
      // 'https://www.instagram.com/tu_usuario',
      // 'https://www.facebook.com/tu_pagina'
    ]
  };

  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* --- Simple Analytics --- */}
        <Script
          strategy="afterInteractive"
          src="https://scripts.simpleanalyticscdn.com/latest.js"
        />
        <noscript>
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
        {/* --- Fin de Simple Analytics --- */}

        {/* --- Meta Pixel Code (ACTUALIZADO) --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1307727311140659');
              fbq('track', 'PageView');
            `
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1307727311140659&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* --- Fin de Meta Pixel Code --- */}
      </head>
      <body>
        {/* --- Script de Datos Estructurados (JSON-LD) --- */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}