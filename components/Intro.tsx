"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "atc-intro-seen";

export function Intro() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const forced = new URLSearchParams(window.location.search).has("intro");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = !forced && (root.classList.contains("intro-seen") || sessionStorage.getItem(STORAGE_KEY));
    if (seen || reduce) {
      root.classList.remove("intro-lock");
      root.classList.add("intro-seen");
      setMounted(false);
      return;
    }
    root.classList.add("intro-lock");
    root.classList.remove("intro-seen");
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      root.classList.remove("intro-lock");
      root.classList.add("intro-seen");
      setMounted(false);
    }, 2300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="intro"
      onClick={() => {
        sessionStorage.setItem(STORAGE_KEY, "1");
        document.documentElement.classList.remove("intro-lock");
        document.documentElement.classList.add("intro-seen");
        setMounted(false);
      }}
    >
      <div className="intro-mark">
        <b>安森頂車</b>
        <span>Anson Top Car</span>
      </div>
    </div>
  );
}
