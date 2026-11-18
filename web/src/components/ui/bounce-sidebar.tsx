"use client";

/*
 * From Rare UI (https://rareui.com) by Swami Malode.
 * Copyright (c) 2026 Swami Malode. MIT + Commons Clause License Condition v1.0 + Attribution:
 * the credit and this copyright notice must stay in this file. See THIRD_PARTY_NOTICES.md.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { motion, useAnimate } from "motion/react";
import { arc } from "motion";
import { cn } from "@/lib/utils";

// Sibilla runs on Vite, not Next: a plain anchor instead of next/link.
const MotionLink = motion.a;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type BounceSidebarItem =
  | string
  | { label: string; href?: string; trailing?: ReactNode }
  | { label: string; heading: true };

export type BounceSidebarProps = Omit<ComponentProps<"ul">, "onChange"> & {
  items: BounceSidebarItem[];
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  dotColor?: string;
};

export function BounceSidebar({
  items,
  value,
  defaultValue = 0,
  onChange,
  dotColor = "#FC4C01",
  className,
  ...props
}: BounceSidebarProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeIndex = value ?? internalValue;
  // Sibilla: the rows can load late or move (a conversation updated today jumps up), so the dot follows the layout too
  const layoutKey = items.map((item) => (typeof item === "string" ? item : item.label)).join("\u0000");

  const [dot, animate] = useAnimate<HTMLSpanElement>();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const prevY = useRef<number | null>(null);

  const [dotSize, setDotSize] = useState(6);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    setDotSize(Math.round(6 * dpr) / dpr);
  }, []);

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;
    const snap = () => {
      const el = itemRefs.current[activeIndex];
      if (cancelled || !el || !dot.current) return;
      const dpr = window.devicePixelRatio || 1;
      const size = Math.round(6 * dpr) / dpr;
      const toY =
        Math.round((el.offsetTop + el.offsetHeight / 2 - size / 2) * dpr) / dpr;
      animate(dot.current, { x: 0, y: toY }, { duration: 0 });
      prevY.current = toY;
      setReady(true);
    };

    snap();
    const raf = requestAnimationFrame(snap);
    document.fonts?.ready.then(snap);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (!el || !dot.current) return;

    const dpr = window.devicePixelRatio || 1;
    const toY =
      Math.round((el.offsetTop + el.offsetHeight / 2 - dotSize / 2) * dpr) /
      dpr;

    if (prevY.current === null) {
      animate(dot.current, { x: 0, y: toY }, { duration: 0 });
      prevY.current = toY;
      setReady(true); // Sibilla: the list may have been empty at mount, when the first snap found nothing
      return;
    }

    const fromY = prevY.current;
    const delta = toY - fromY;
    prevY.current = toY;
    if (delta === 0) return;

    const distance = Math.abs(delta);
    const path = arc({
      strength: Math.min(0.8, 14 / distance),
      direction: delta > 0 ? "ccw" : "cw",
    });

    animate(
      dot.current,
      { x: 0, y: toY },
      { duration: 0.25, ease: "easeOut", path },
    );
  }, [activeIndex, animate, dot, dotSize, layoutKey]);

  const select = (index: number) => {
    if (value === undefined) setInternalValue(index);
    onChange?.(index);
  };

  return (
    <ul
      data-slot="bounce-sidebar"
      className={cn("relative flex flex-col gap-1 pl-6", className)}
      {...props}
    >
      <span
        ref={dot}
        aria-hidden
        className="absolute left-2 top-0 rounded-full transition-opacity duration-150"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: dotColor,
          // Sibilla: no dot when nothing in this list is active (value -1)
          opacity: ready && activeIndex >= 0 ? 1 : 0,
        }}
      />

      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;

        if (typeof item !== "string" && "heading" in item) {
          return (
            <li
              key={`${index}-${label}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="presentation"
              data-slot="bounce-sidebar-heading"
              className="px-1 pt-4 pb-1 text-xs text-muted-foreground first:pt-0"
            >
              {label}
            </li>
          );
        }

        const href = typeof item === "string" ? undefined : item.href;
        const trailing = typeof item === "string" ? undefined : item.trailing;
        const content = trailing === undefined ? label : (
          <>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">{trailing}</span>
          </>
        );
        const isActive = index === activeIndex;
        const itemClassName = cn(
          // Sibilla: row height and readable contrast of the app sidebar (foreground/50 was below 4.5:1)
          "flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors duration-200 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
          isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
        );

        return (
          <li
            key={`${index}-${label}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            {href ? (
              <MotionLink
                href={href}
                data-slot="bounce-sidebar-item"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => select(index)}
                className={itemClassName}
              >
                {content}
              </MotionLink>
            ) : (
              <motion.button
                type="button"
                data-slot="bounce-sidebar-item"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => select(index)}
                className={itemClassName}
              >
                {content}
              </motion.button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
