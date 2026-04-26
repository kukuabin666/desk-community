import { useCallback, useMemo, useRef } from 'react';

/**
 * 长按手势：用 ref 持有最新 onLongPress，避免调用方传入内联函数时导致 handlers 引用每帧变化。
 * 返回对象用 useMemo 稳定，便于展开到 DOM（如 NavBar 内 <span {...handlers}>）。
 */
export function useLongPress(onLongPress: () => void, opts?: { ms?: number }) {
  const t = useRef<number | null>(null);
  // 渲染期同步写入：定时器触发时永远调用「当前」回调，无需把 onLongPress 放进 useCallback 依赖链
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;
  const ms = opts?.ms ?? 500;

  const start = useCallback(() => {
    window.clearTimeout(t.current!);
    t.current = window.setTimeout(() => {
      onLongPressRef.current();
      t.current = null;
    }, ms);
  }, [ms]);

  const clear = useCallback(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = null;
  }, []);

  return useMemo(
    () => ({
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchCancel: clear,
    }),
    [start, clear]
  );
}
