import { useRef } from "react";
import { useAtomValue } from "jotai";
import * as R from "ramda";
import { sidebarOpenAtom } from "../../atoms/uiAtoms";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 180;

export function AppShell({ children }) {
  const sidebarOpen = useAtomValue(sidebarOpenAtom);

  const bodyRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const { handlePointerDown } = useResizeHandle({
    direction: "horizontal",
    containerRef: bodyRef,
    targetRef: sidebarRef,
    freezeRef: mainRef,
    initialSize: DEFAULT_SIDEBAR_WIDTH,
    minSize: MIN_SIDEBAR_WIDTH,
  });

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body" ref={bodyRef}>
        {sidebarOpen && (
          <>
            <aside className="sidebar" ref={sidebarRef}>
              <Sidebar />
            </aside>
            <div className="resize-handle resize-handle-vertical" onPointerDown={handlePointerDown} />
          </>
        )}
        <main className="main-content" ref={mainRef}>
          {children}
        </main>
      </div>
    </div>
  );
}
