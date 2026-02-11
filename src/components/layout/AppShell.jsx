import { useAtomValue } from "jotai";
import * as R from "ramda";
import { sidebarOpenAtom } from "../../atoms/uiAtoms";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }) {
  const sidebarOpen = useAtomValue(sidebarOpenAtom);

  const shellClassName = R.join(" ", R.filter(R.identity, [
    "app-shell",
    R.when(R.always(sidebarOpen), R.always("sidebar-open"))(null),
  ]));

  return (
    <div className={shellClassName}>
      <Header />
      <div className="app-body">
        {R.when(R.always(sidebarOpen), () => <Sidebar />)(null)}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
