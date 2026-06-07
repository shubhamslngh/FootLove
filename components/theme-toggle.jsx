"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "footlove-theme";

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const animationTimer = useRef(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const nextTheme = storedTheme || preferredTheme;

    setTheme(nextTheme);
    applyTheme(nextTheme);

    return () => window.clearTimeout(animationTimer.current);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);

    const root = document.documentElement;
    window.clearTimeout(animationTimer.current);
    root.classList.remove("theme-switching");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        root.classList.add("theme-switching");
        animationTimer.current = window.setTimeout(() => {
          root.classList.remove("theme-switching");
        }, 1400);
      });
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
