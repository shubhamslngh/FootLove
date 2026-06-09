import "./globals.css";

function getMetadataBase() {
  const configuredUrl = process.env.APP_URL?.trim();
  const fallbackUrl =
    process.env.NODE_ENV === "production"
      ? "https://soccersesh.app"
      : "http://localhost:3000";
  const url = configuredUrl || fallbackUrl;

  return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
}

export const metadata = {
  metadataBase: getMetadataBase(),
  title: "SoccerSesh",
  description: "Find nearby football matches and book your slot.",
};

export default function RootLayout({ children }) {
  const themeScript = `
    try {
      const storedTheme = localStorage.getItem("footlove-theme");
      const theme = storedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {}
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
