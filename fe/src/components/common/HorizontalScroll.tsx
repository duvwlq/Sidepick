import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  wrapperClassName?: string;
  scrollerClassName?: string;
  contentClassName?: string;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  dragging: boolean;
};

export default function HorizontalScroll({
  children,
  wrapperClassName = '',
  scrollerClassName = '',
  contentClassName = '',
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) {
      return;
    }
    const scroller = element;

    let dragState: DragState | undefined;

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: scroller.scrollLeft,
        dragging: false,
      };

      scroller.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (!dragState.dragging) {
        if (Math.abs(deltaX) < 6 || Math.abs(deltaX) <= Math.abs(deltaY)) {
          return;
        }
        dragState.dragging = true;
      }

      event.preventDefault();
      scroller.scrollLeft = dragState.scrollLeft - deltaX;
    }

    function resetPointer(event?: PointerEvent) {
      if (event && scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
      dragState = undefined;
    }

    function handleWheel(event: WheelEvent) {
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

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft + nextDelta));

      if (nextScrollLeft === scroller.scrollLeft) {
        return;
      }

      scroller.scrollLeft = nextScrollLeft;
    }

    scroller.addEventListener('pointerdown', handlePointerDown);
    scroller.addEventListener('pointermove', handlePointerMove);
    scroller.addEventListener('pointerup', resetPointer);
    scroller.addEventListener('pointercancel', resetPointer);
    scroller.addEventListener('lostpointercapture', resetPointer);
    scroller.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scroller.removeEventListener('pointerdown', handlePointerDown);
      scroller.removeEventListener('pointermove', handlePointerMove);
      scroller.removeEventListener('pointerup', resetPointer);
      scroller.removeEventListener('pointercancel', resetPointer);
      scroller.removeEventListener('lostpointercapture', resetPointer);
      scroller.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className={`horizontal-scroll-wrapper ${wrapperClassName}`.trim()}>
      <div ref={scrollerRef} className={`horizontal-scroll ${scrollerClassName}`.trim()}>
        <div className={`horizontal-scroll-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}
