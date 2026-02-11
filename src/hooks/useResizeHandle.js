import { useRef, useEffect, useCallback } from "react";
import * as R from "ramda";

const HANDLE_SIZE = 5;

export function useResizeHandle({ direction, containerRef, targetRef, freezeRef, initialSize, minSize = 120 }) {
  const isHorizontal = R.equals(direction, "horizontal");
  const cursor = isHorizontal ? "col-resize" : "row-resize";
  const prop = isHorizontal ? "width" : "height";

  const draggingRef = useRef(false);
  const sizeRef = useRef(initialSize);

  useEffect(() => {
    const el = targetRef.current;
    if (R.isNil(el)) return;
    el.style[prop] = `${initialSize}px`;
  }, []);

  const calcSize = useCallback((e) => {
    const container = containerRef.current;
    if (R.isNil(container)) return sizeRef.current;
    const rect = container.getBoundingClientRect();

    return isHorizontal
      ? R.clamp(minSize, rect.width - minSize - HANDLE_SIZE, e.clientX - rect.left)
      : R.clamp(minSize, rect.height - minSize - HANDLE_SIZE, rect.height - (e.clientY - rect.top) - HANDLE_SIZE);
  }, [containerRef, isHorizontal, minSize]);

  const freezeSibling = useCallback(() => {
    const el = R.path(["current"], freezeRef);
    if (R.isNil(el)) return;
    const sizePx = isHorizontal ? el.offsetWidth : el.offsetHeight;
    el.style.flex = "none";
    el.style[prop] = `${sizePx}px`;
  }, [freezeRef, isHorizontal, prop]);

  const unfreezeSibling = useCallback(() => {
    const el = R.path(["current"], freezeRef);
    if (R.isNil(el)) return;
    el.style.flex = "";
    el.style[prop] = "";
  }, [freezeRef, prop]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
    freezeSibling();
  }, [cursor, freezeSibling]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (R.not(draggingRef.current)) return;
      const el = targetRef.current;
      if (R.isNil(el)) return;

      const newSize = calcSize(e);
      sizeRef.current = newSize;
      el.style[prop] = `${newSize}px`;
    };

    const handlePointerUp = () => {
      if (R.not(draggingRef.current)) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      unfreezeSibling();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [targetRef, calcSize, prop, unfreezeSibling]);

  return { handlePointerDown };
}
