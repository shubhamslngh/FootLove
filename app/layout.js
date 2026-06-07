import "./globals.css";

export const metadata = {
  title: "FootLove",
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
