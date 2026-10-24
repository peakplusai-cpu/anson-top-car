"use client";

import { useEffect, useState } from "react";
import type { Car } from "@/lib/types";

const FALLBACK = [
  { src: "/hero/lamborghini.jpg", label: "01" },
  { src: "/hero/ferrari.jpg", label: "02" },
  { src: "/hero/rolls-royce.jpg", label: "03" },
  { src: "/hero/maybach.jpg", label: "04" },
];

export function HeroReel({ cars }: { cars: Car[] }) {
  const slides =
    cars.filter((car) => car.photos[0]).slice(0, 5).map((car, i) => ({
      src: car.photos[0].url,
      label: String(i + 1).padStart(2, "0"),
    })) || FALLBACK;
  const list = slides.length ? slides : FALLBACK;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || list.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [list.length]);

  return (
    <>
      <div className="hero-reel" aria-hidden>
        {list.map((slide, i) => (
          <div key={`${slide.src}-${i}`} className={`hero-slide${i === index ? " on" : ""}`}>
            <img src={slide.src} alt="" />
          </div>
        ))}
      </div>
      <div className="hero-reel-ticks" aria-hidden>
        {list.map((slide, i) => (
          <button
            key={`${slide.src}-t-${i}`}
            type="button"
            data-on={i === index}
            onClick={() => setIndex(i)}
            aria-label={slide.label}
          />
        ))}
      </div>
    </>
  );
}
