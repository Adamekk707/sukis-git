import { useAtom } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { sidebarOpenAtom } from "../../atoms/uiAtoms";
import { messages, localeSettingAtom } from "../../i18n";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "ko", label: "KO" },
  { code: "ja", label: "JA" },
];

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const t = useStore(messages);

  const toggleSidebar = () => setSidebarOpen(R.not);

  const handleLocaleChange = (code) => {
    localeSettingAtom.set(code);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={R.pathOr("Toggle Sidebar", ["header", "toggleSidebar"], t)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="app-title">{R.pathOr("すきすぎっ", ["header", "title"], t)}</h1>
      </div>
      <div className="header-right">
        <div className="locale-switcher">
          {R.map(
            (loc) => (
              <button
                key={R.prop("code", loc)}
                className="locale-btn"
                onClick={() => handleLocaleChange(R.prop("code", loc))}
              >
                {R.prop("label", loc)}
              </button>
            ),
            LOCALES,
          )}
        </div>
      </div>
    </header>
  );
}
