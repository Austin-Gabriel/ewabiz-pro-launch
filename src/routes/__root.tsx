import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/auth/auth-context";
import { OnboardingProvider } from "@/onboarding/onboarding-context";
import { KycProvider } from "@/onboarding-states/kyc/kyc-context";
import { DevStateProvider } from "@/dev-state/dev-state-context";
import { DevStateToggle } from "@/dev-state/dev-state-toggle";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EWABIZ_V2" },
      { name: "description", content: "Ewà Pro Welcome is a mobile app's initial screen for barbers and stylists." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "EWABIZ_V2" },
      { property: "og:description", content: "Ewà Pro Welcome is a mobile app's initial screen for barbers and stylists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "EWABIZ_V2" },
      { name: "twitter:description", content: "Ewà Pro Welcome is a mobile app's initial screen for barbers and stylists." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/87472376-000e-4b85-93b2-29291de1c781/id-preview-db2dc70f--3fcb9d58-4269-43d7-a6d9-87fcf51603d4.lovable.app-1776923319876.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/87472376-000e-4b85-93b2-29291de1c781/id-preview-db2dc70f--3fcb9d58-4269-43d7-a6d9-87fcf51603d4.lovable.app-1776923319876.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <DevStateProvider>
      <AuthProvider>
        <OnboardingProvider>
          <KycProvider>
            <Outlet />
            <DevStateToggle />
          </KycProvider>
        </OnboardingProvider>
      </AuthProvider>
    </DevStateProvider>
  );
}
