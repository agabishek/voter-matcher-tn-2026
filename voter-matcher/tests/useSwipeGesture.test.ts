/**
 * Tests for useSwipeGesture — swipe detection + keyboard fallback (task 8.4)
 *
 * Tests the hook's returned handlers directly by simulating
 * React-style touch and keyboard events.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeGesture } from '@/lib/useSwipeGesture';
import type React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTouchEvent(touches: Array<{ clientX: number; clientY: number }>): React.TouchEvent {
  return {
    touches: touches.map((t) => ({ clientX: t.clientX, clientY: t.clientY })),
    changedTouches: touches.map((t) => ({ clientX: t.clientX, clientY: t.clientY })),
  } as unknown as React.TouchEvent;
}

function makeKeyboardEvent(key: string): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSwipeGesture', () => {
  let onSwipeLeft: ReturnType<typeof vi.fn>;
  let onSwipeRight: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSwipeLeft = vi.fn();
    onSwipeRight = vi.fn();
  });

  describe('hook return shape', () => {
    it('returns onTouchStart, onTouchEnd, and onKeyDown handlers', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      expect(typeof result.current.onTouchStart).toBe('function');
      expect(typeof result.current.onTouchEnd).toBe('function');
      expect(typeof result.current.onKeyDown).toBe('function');
    });
  });

  describe('swipe left detection (next)', () => {
    it('calls onSwipeLeft when swiped left beyond default threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('calls onSwipeLeft at exactly the threshold distance', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 50 }),
      );

      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 150, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('swipe right detection (back)', () => {
    it('calls onSwipeRight when swiped right beyond threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('threshold enforcement', () => {
    it('does not trigger when swipe distance is below threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 50 }),
      );

      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 130, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('respects custom threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 100 }),
      );

      // 80px swipe — below 100px threshold
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 120, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();

      // 120px swipe — above 100px threshold
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 80, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('vertical scroll protection', () => {
    it('does not trigger when vertical movement exceeds horizontal', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      // Mostly vertical movement (deltaY=120 > deltaX=60)
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 140, clientY: 220 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles onTouchEnd without prior onTouchStart gracefully', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      act(() => {
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('handles empty changedTouches gracefully', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd({ changedTouches: [], touches: [] } as unknown as React.TouchEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('works with undefined callbacks', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({}),
      );

      // Should not throw
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 50, clientY: 100 }]));
      });

      act(() => {
        result.current.onKeyDown(makeKeyboardEvent('ArrowRight'));
        result.current.onKeyDown(makeKeyboardEvent('ArrowLeft'));
      });
    });
  });

  describe('keyboard fallback (ARIA baseline)', () => {
    it('calls onSwipeLeft on ArrowRight key', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      const event = makeKeyboardEvent('ArrowRight');

      act(() => {
        result.current.onKeyDown(event);
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('calls onSwipeRight on ArrowLeft key', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      const event = makeKeyboardEvent('ArrowLeft');

      act(() => {
        result.current.onKeyDown(event);
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores non-arrow keys', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      const event = makeKeyboardEvent('Enter');

      act(() => {
        result.current.onKeyDown(event);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('ignores ArrowUp and ArrowDown keys', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, onSwipeRight }),
      );

      act(() => {
        result.current.onKeyDown(makeKeyboardEvent('ArrowUp'));
        result.current.onKeyDown(makeKeyboardEvent('ArrowDown'));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('default threshold', () => {
    it('uses 50px as default threshold', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft }),
      );

      // 49px swipe — just below default 50px
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 149, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();

      // 50px swipe — exactly at default threshold
      act(() => {
        result.current.onTouchStart(makeTouchEvent([{ clientX: 150, clientY: 100 }]));
        result.current.onTouchEnd(makeTouchEvent([{ clientX: 100, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });
});
