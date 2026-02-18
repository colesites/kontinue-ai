import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kontinue AI",
  description: "Continue your AI conversations from any platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var rawTheme = localStorage.getItem('ui-theme');
                  var theme = rawTheme === 'chelsea-blue' ? 'chelsea' : rawTheme;
                  if (theme && theme !== 'default') {
                    document.documentElement.classList.add('theme-' + theme);
                    document.documentElement.setAttribute('data-color-theme', theme);
                  } else {
                    document.documentElement.removeAttribute('data-color-theme');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<LoadingFallback />}>
            <Providers>{children}</Providers>
          </Suspense>
          <Toaster richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
