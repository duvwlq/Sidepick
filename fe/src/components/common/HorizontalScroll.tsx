import {
  useEffect,
  useRef,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from 'react';

type Props = {
  children: ReactNode;
  wrapperClassName?: string;
  scrollerClassName?: string;
  contentClassName?: string;
};

export default function HorizontalScroll({
  children,
  wrapperClassName = '',
  scrollerClassName = '',
  contentClassName = '',
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    dragging: boolean;
  } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = scrollerRef.current;
    if (!wrapper || !scroller) {
      return undefined;
    }

    const nativeWheelHandler = (event: globalThis.WheelEvent) => {
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const nextDelta = absX > absY ? event.deltaX : event.deltaY;

      event.preventDefault();
      event.stopPropagation();

      if (nextDelta !== 0) {
        scroller.scrollLeft += nextDelta;
      }
    };

    const nativeTouchMoveHandler = (event: globalThis.TouchEvent) => {
      const touch = event.touches[0];
      const state = touchStateRef.current;
      if (!touch || !state) {
        return;
      }

      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      event.preventDefault();
      event.stopPropagation();

      if (!state.dragging) {
        if (Math.abs(deltaX) <= Math.abs(deltaY)) {
          scroller.scrollLeft = state.scrollLeft;
          return;
        }
        state.dragging = true;
      }

      scroller.scrollLeft = state.scrollLeft - deltaX;
    };

    wrapper.addEventListener('wheel', nativeWheelHandler, {
      passive: false,
      capture: true,
    });
    wrapper.addEventListener('touchmove', nativeTouchMoveHandler, {
      passive: false,
      capture: true,
    });

    return () => {
      wrapper.removeEventListener('wheel', nativeWheelHandler, true);
      wrapper.removeEventListener('touchmove', nativeTouchMoveHandler, true);
    };
  }, []);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const hasHorizontalOverflow = scroller.scrollWidth > scroller.clientWidth;
    if (!hasHorizontalOverflow) {
      return;
    }

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    const nextDelta = absX > absY ? event.deltaX : event.deltaY;

    if (nextDelta === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    scroller.scrollLeft += nextDelta;
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const touch = event.touches[0];
    if (!scroller || !touch) {
      return;
    }

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      scrollLeft: scroller.scrollLeft,
      dragging: false,
    };
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const touch = event.touches[0];
    const state = touchStateRef.current;
    if (!scroller || !touch || !state) {
      return;
    }

    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    if (!state.dragging) {
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }
      state.dragging = true;
    }

    event.preventDefault();
    event.stopPropagation();
    scroller.scrollLeft = state.scrollLeft - deltaX;
  }

  function handleTouchEnd() {
    touchStateRef.current = null;
  }

  return (
    <div
      ref={wrapperRef}
      className={`horizontal-scroll-wrapper ${wrapperClassName}`.trim()}
    >
      <div
        ref={scrollerRef}
        className={`horizontal-scroll ${scrollerClassName}`.trim()}
        onWheelCapture={handleWheel}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className={`horizontal-scroll-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}
