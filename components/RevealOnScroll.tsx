"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay in milliseconds before the reveal triggers after intersection */
  delay?: number;
  /** Margin around root for IntersectionObserver — default reveals slightly before fully on-screen */
  rootMargin?: string;
};

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  rootMargin = "0px 0px -80px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => el.classList.add("in"), delay);
            observer.unobserve(el);
          }
        });
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, rootMargin]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
