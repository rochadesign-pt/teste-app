import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Envolve cada página web. É aqui que ligamos o manifest e as meta tags que
 * tornam a app instalável no ecrã principal do iPhone (PWA).
 * Este ficheiro só afeta a web — não tem efeito no iOS/Android nativos.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* PWA / instalável */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0B" />

        {/* iOS: comportamento de "app" no ecrã principal */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Custos" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.png" />

        {/* Fundo escuro enquanto o JS carrega, para não "piscar" branco. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { background-color: #0A0A0B; }`,
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
