"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { Eye } from "lucide-react";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQueryList.addEventListener("change", callback);
      return () => mediaQueryList.removeEventListener("change", callback);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false),
    () => false
  );
}

export interface SmoothSliderItem {
  id?: string;
  src?: string;
  alt?: string;
  label?: string;
  title?: string;
  description?: string;
  badge?: string;
  previewNode?: React.ReactNode;
}

export interface ArcFlowCarouselCompProps {
  items: SmoothSliderItem[];
  radiusRatio?: number;
  cardRatio?: number;
  minCardWidth?: number;
  maxCardWidth?: number;
  cardAspect?: number;
  overlap?: number;
  arcOffset?: number;
  smoothing?: number;
  dragSensitivity?: number;
  momentum?: number;
  snap?: boolean;
  wheelControl?: "horizontal" | "both" | "off";
  autoRotateSpeed?: number;
  pauseOnHover?: boolean;
  surfaceColor?: string;
  onSelectCard?: (item: SmoothSliderItem, index: number) => void;
  className?: string;
}

const DRAG_SMOOTHING = 14;
const VELOCITY_WINDOW = 90;
const MAX_FLICK = 9;
const STAGGER_LAG_STRENGTH = 0.85;
const MIN_FOLLOW_FRACTION = 0.6;

export default function ArcFlowCarousel({
  items,
  radiusRatio = 0.95,
  cardRatio = 0.19,
  minCardWidth = 170,
  maxCardWidth = 265,
  cardAspect = 0.7,
  overlap = -0.05,
  arcOffset = 0.56,
  smoothing = 5.5,
  dragSensitivity = 1.2,
  momentum = 1,
  snap = true,
  wheelControl = "horizontal",
  autoRotateSpeed = 0.08,
  pauseOnHover = true,
  surfaceColor = "transparent",
  onSelectCard,
  className = "",
}: ArcFlowCarouselCompProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const discRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reduceMotion = usePrefersReducedMotion();
  const total = items.length;
  const [slotCount, setSlotCount] = useState(() => Math.max(total, 15));

  const layoutRef = useRef({
    radius: 900,
    cardWidth: 220,
    cardHeight: 314,
    step: 0.14,
    centerX: 0,
    centerY: 0,
    maxAngle: 1,
  });

  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const slotOffsetsRef = useRef<number[]>([]);
  const draggingRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const samplesRef = useRef<{ t: number; value: number }[]>([]);
  const revealRef = useRef(reduceMotion ? 1 : 0);
  const revealStartRef = useRef(0);
  const wheelSettleRef = useRef(0);
  const hoveredRef = useRef(false);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !total) return;

    const width = stage.offsetWidth || 1024;
    const height = stage.offsetHeight || 480;

    const cardWidth = gsap.utils.clamp(minCardWidth, maxCardWidth, width * cardRatio);
    const cardHeight = cardWidth / cardAspect;
    const radius = Math.max(width * radiusRatio, cardWidth * 4.2);
    const step = (cardWidth * (1 - gsap.utils.clamp(-0.5, 0.85, overlap))) / radius;

    const centerX = width / 2;
    const centerY = height * arcOffset + radius;
    const discRadius = radius - cardHeight * 0.66;

    const reach = Math.min(1, (width / 2 + cardWidth * 1.2) / radius);
    const maxAngle = Math.asin(reach) + 0.12;

    layoutRef.current = { radius, cardWidth, cardHeight, step, centerX, centerY, maxAngle };

    const disc = discRef.current;
    if (disc) {
      disc.style.width = `${discRadius * 2}px`;
      disc.style.height = `${discRadius * 2}px`;
      disc.style.left = `${centerX}px`;
      disc.style.top = `${centerY - discRadius}px`;
    }

    const needed = Math.ceil((maxAngle * 2) / step) + 2;
    setSlotCount((prev) => {
      const next = Math.max(total, Math.ceil(needed / total) * total);
      return next === prev ? prev : next;
    });
  }, [arcOffset, cardAspect, cardRatio, maxCardWidth, minCardWidth, overlap, radiusRatio, total]);

  useLayoutEffect(() => {
    measure();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!total) return;

    const draw = (dt: number) => {
      const { radius, cardWidth, cardHeight, step, centerX, centerY, maxAngle } = layoutRef.current;
      const span = slotCount * step;
      const half = span / 2;
      const reveal = revealRef.current;
      const rate = draggingRef.current ? DRAG_SMOOTHING : reduceMotion ? DRAG_SMOOTHING : smoothing;

      const slotOffsets = slotOffsetsRef.current;
      if (slotOffsets.length !== slotCount) {
        slotOffsets.length = slotCount;
        slotOffsets.fill(currentRef.current);
      }

      for (let i = 0; i < slotCount; i += 1) {
        const card = cardRefs.current[i];
        if (!card) continue;

        if (reduceMotion) {
          slotOffsets[i] = currentRef.current;
        } else {
          let rankAngle = (i * step - slotOffsets[i]) % span;
          if (rankAngle < -half) rankAngle += span;
          else if (rankAngle >= half) rankAngle -= span;
          const distanceFactor = gsap.utils.clamp(0, 1, Math.abs(rankAngle) / maxAngle);

          const followRate = Math.max(
            rate * (1 - distanceFactor * STAGGER_LAG_STRENGTH),
            rate * MIN_FOLLOW_FRACTION
          );
          const followLerp = 1 - Math.exp(-followRate * dt);
          slotOffsets[i] += (currentRef.current - slotOffsets[i]) * followLerp;
        }

        let baseAngle = (i * step - slotOffsets[i]) % span;
        if (baseAngle < -half) baseAngle += span;
        else if (baseAngle >= half) baseAngle -= span;

        if (Math.abs(baseAngle) > maxAngle) {
          if (card.style.visibility !== "hidden") card.style.visibility = "hidden";
          continue;
        }
        if (card.style.visibility === "hidden") card.style.visibility = "visible";

        const x = centerX + radius * Math.sin(baseAngle) - cardWidth / 2;
        const y = centerY - radius * Math.cos(baseAngle) - cardHeight / 2;

        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${baseAngle}rad)`;
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        card.style.zIndex = `${Math.round((baseAngle + half) * 1000)}`;

        const inner = innerRefs.current[i];
        if (inner && reveal < 1) {
          const delay = Math.min(1, Math.abs(baseAngle) / maxAngle) * 0.45;
          const p = gsap.utils.clamp(0, 1, (reveal - delay) / (1 - delay || 1));
          const eased = 1 - Math.pow(1 - p, 3);
          inner.style.opacity = `${eased}`;
          inner.style.transform = `translate3d(0, ${(1 - eased) * cardHeight * 0.35}px, 0)`;
        } else if (inner && inner.style.opacity !== "1") {
          inner.style.opacity = "1";
          inner.style.transform = "translate3d(0, 0, 0)";
        }
      }
    };

    const tick = (_time: number, deltaTime: number) => {
      const dt = Math.min(deltaTime, 50) / 1000;
      const rate = draggingRef.current ? DRAG_SMOOTHING : reduceMotion ? DRAG_SMOOTHING : smoothing;
      const lerp = 1 - Math.exp(-rate * dt);

      const delta = targetRef.current - currentRef.current;
      currentRef.current += delta * lerp;
      if (Math.abs(delta) < 0.00002) currentRef.current = targetRef.current;

      if (revealRef.current < 1) {
        const now = performance.now();
        if (!revealStartRef.current) revealStartRef.current = now;
        revealRef.current = Math.min(1, (now - revealStartRef.current) / 1100);
      }

      if (autoRotateSpeed && !reduceMotion && !draggingRef.current && !(pauseOnHover && hoveredRef.current)) {
        targetRef.current += autoRotateSpeed * dt;
      }

      draw(dt);
    };

    draw(1);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [autoRotateSpeed, pauseOnHover, reduceMotion, slotCount, smoothing, total]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !total) return;

    const pushSample = () => {
      const now = performance.now();
      const samples = samplesRef.current;
      samples.push({ t: now, value: targetRef.current });
      while (samples.length > 2 && now - samples[0].t > VELOCITY_WINDOW) samples.shift();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      draggingRef.current = true;
      pointerMovedRef.current = false;
      pointerIdRef.current = e.pointerId;
      lastXRef.current = e.clientX;
      samplesRef.current = [{ t: performance.now(), value: targetRef.current }];
      targetRef.current = currentRef.current;
      stage.setPointerCapture?.(e.pointerId);
      stage.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
      const dx = e.clientX - lastXRef.current;
      if (Math.abs(dx) > 3) pointerMovedRef.current = true;
      lastXRef.current = e.clientX;
      targetRef.current -= (dx * dragSensitivity) / layoutRef.current.radius;
      pushSample();
    };

    const endDrag = (e: PointerEvent) => {
      if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
      stage.style.cursor = "grab";
      if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture?.(e.pointerId);

      pushSample();
      const { step } = layoutRef.current;
      let projected = targetRef.current;

      if (!reduceMotion) {
        const samples = samplesRef.current;
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = last && first ? (last.t - first.t) / 1000 : 0;
        if (dt > 0.008) {
          const velocity = (last.value - first.value) / dt;
          const throw_ = gsap.utils.clamp(-MAX_FLICK, MAX_FLICK, velocity / smoothing) * momentum;
          projected = targetRef.current + throw_;
        }
      }

      targetRef.current = snap ? gsap.utils.snap(step, projected) : projected;
      samplesRef.current = [];
    };

    const onWheel = (e: WheelEvent) => {
      if (wheelControl === "off") return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (wheelControl === "horizontal" && !horizontal) return;

      const delta = horizontal ? e.deltaX : e.deltaY;
      e.preventDefault();
      targetRef.current += (delta * dragSensitivity) / layoutRef.current.radius;

      if (snap) {
        window.clearTimeout(wheelSettleRef.current);
        wheelSettleRef.current = window.setTimeout(() => {
          targetRef.current = gsap.utils.snap(layoutRef.current.step, targetRef.current);
        }, 140);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const { step } = layoutRef.current;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        targetRef.current += step;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        targetRef.current -= step;
      }
    };

    const onPointerEnter = () => { hoveredRef.current = true; };
    const onPointerLeave = () => { hoveredRef.current = false; };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerenter", onPointerEnter);
    stage.addEventListener("pointerleave", onPointerLeave);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKeyDown);

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      stage.removeEventListener("pointerenter", onPointerEnter);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(wheelSettleRef.current);
    };
  }, [dragSensitivity, momentum, reduceMotion, smoothing, snap, total, wheelControl]);

  if (!total) return null;

  const slots = Array.from({ length: slotCount }, (_, i) => items[i % total]);

  return (
    <section
      className={`relative h-[380px] sm:h-[430px] md:h-[470px] w-full overflow-hidden z-10 select-none ${className}`}
      style={{ backgroundColor: surfaceColor }}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-label="Carrossel interativo de modelos de currículo"
        className="absolute inset-0 cursor-grab outline-none"
        style={{ touchAction: "pan-y" }}
      >
        <div
          ref={discRef}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 rounded-full"
          style={{ backgroundColor: surfaceColor }}
        />

        {slots.map((item, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            onClick={() => {
              if (!pointerMovedRef.current && onSelectCard) {
                onSelectCard(item, i % total);
              }
            }}
            className="group absolute top-0 left-0 will-change-transform"
            style={{ visibility: "hidden" }}
          >
            <div
              ref={(el) => { innerRefs.current[i] = el; }}
              className="relative h-full w-full overflow-hidden rounded-[12px] border border-neutral-200/80 bg-white transition-transform duration-300 group-hover:-translate-y-1"
              style={{
                opacity: reduceMotion ? 1 : 0,
                boxShadow: "0 18px 40px -12px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              {/* Badge Superior */}
              {item.badge && (
                <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                  <span className="inline-block rounded-full bg-slate-900/85 text-white px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase backdrop-blur-md shadow-xs border border-white/20">
                    {item.badge}
                  </span>
                </div>
              )}

              {/* Prévia Limpa do Currículo */}
              {item.previewNode ? (
                <div className="pointer-events-none h-full w-full select-none">
                  {item.previewNode}
                </div>
              ) : item.src ? (
                <img
                  src={item.src}
                  alt={item.alt ?? item.title ?? `Modelo ${(i % total) + 1}`}
                  draggable={false}
                  className="pointer-events-none block h-full w-full object-cover select-none"
                />
              ) : null}

              {/* Barra Inferior Integrada: Rótulo da Profissão e Botão "Ver exemplo" */}
              {item.title && (
                <div
                  className="absolute inset-x-0 bottom-0 z-20 p-2 sm:p-2.5 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent pt-6 flex items-center justify-between gap-1.5 text-white transition-all duration-200"
                >
                  <p className="text-[11px] sm:text-xs font-bold tracking-tight text-white truncate drop-shadow-sm">
                    {item.title}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectCard) {
                        onSelectCard(item, i % total);
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ver exemplo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
