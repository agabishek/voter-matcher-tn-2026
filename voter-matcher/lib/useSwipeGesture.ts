'use client';

/**
 * useSwipeGesture — Custom React hook for horizontal swipe gesture detection
 * with keyboard/switch-access fallback.
 *
 * Swipe is a PROGRESSIVE ENHANCEMENT — keyboard navigation (ArrowLeft/ArrowRight)
 * is the baseline accessible interaction. Touch gestures layer on top for mobile.
 *
 * ARIA compliance:
 * - Keyboard is the primary navigation method (ArrowLeft = back, ArrowRight = next)
 * - Touch swipe is enhancement only — never the sole interaction path
 * - Does not add ARIA attributes itself (consumer is responsible for role/labels)
 * - Passive touch listeners for scroll performance
 *
 * @module lib/useSwipeGesture
 */

import { useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  /** Called on left swipe or ArrowRight key (navigate forward / next) */
  readonly onSwipeLeft?: () => void;
  /** Called on right swipe or ArrowLeft key (navigate back) */
  readonly onSwipeRight?: () => void;
  /** Minimum horizontal distance (px) to qualify as a swipe. Default: 50 */
  readonly threshold?: number;
}

interface SwipeGestureHandlers {
  /** Attach to the element's onTouchStart */
  readonly onTouchStart: (e: React.TouchEvent) => void;
  /** Attach to the element's onTouchEnd */
  readonly onTouchEnd: (e: React.TouchEvent) => void;
  /** Attach to the element's onKeyDown for keyboard fallback */
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
}

const DEFAULT_THRESHOLD = 50;

/**
 * Detect horizontal swipe gestures with keyboard arrow-key fallback.
 *
 * Returns event handlers to spread onto the target element:
 * ```tsx
 * const handlers = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goBack });
 * <div {...handlers} tabIndex={0}>...</div>
 * ```
 *
 * Swipe left → onSwipeLeft (next), Swipe right → onSwipeRight (back)
 * ArrowRight → onSwipeLeft (next), ArrowLeft → onSwipeRight (back)
 */
export function useSwipeGesture(options: SwipeGestureOptions): SwipeGestureHandlers {
  const { onSwipeLeft, onSwipeRight, threshold = DEFAULT_THRESHOLD } = options;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Store callbacks in refs so handlers stay referentially stable
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight });
  callbacksRef.current = { onSwipeLeft, onSwipeRight };

  const onTouchStart = useCallback((e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent): void => {
      if (touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Only trigger if horizontal movement exceeds threshold
      // AND horizontal movement is greater than vertical (avoid triggering on scroll)
      if (Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          callbacksRef.current.onSwipeLeft?.();
        } else {
          callbacksRef.current.onSwipeRight?.();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [threshold],
  );

  const onKeyDown = useCallback((e: React.KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        callbacksRef.current.onSwipeLeft?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        callbacksRef.current.onSwipeRight?.();
        break;
      default:
        break;
    }
  }, []);

  return { onTouchStart, onTouchEnd, onKeyDown };
}
