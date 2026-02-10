"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "@/lib/convex";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeOnboarding } from "@/components/ThemeOnboarding";
import { ThemeInit } from "@/components/ThemeInit";
import { useClerkTheme } from "@/components/ClerkThemeProvider";

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const clerkTheme = useClerkTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: clerkTheme.variables,
        elements: clerkTheme.elements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkWrapper>
      <QueryProvider>
        <ConvexClientProvider>
          <ThemeInit />
          <ThemeOnboarding />
          {children}
        </ConvexClientProvider>
      </QueryProvider>
    </ClerkWrapper>
  );
}

