import { createI18n, localeFrom, browser } from "@nanostores/i18n";
import { persistentAtom } from "@nanostores/persistent";

export const localeSettingAtom = persistentAtom("locale", "");

export const locale = localeFrom(localeSettingAtom, browser({ available: ["en", "ko", "ja"] }));

export const i18n = createI18n(locale, {
  async get(code) {
    return (await import(`./locales/${code}.json`)).default;
  },
});

export const messages = i18n("app", {
  sidebar: {
    devices: "USB Devices",
    repositories: "Repositories",
    branches: "Branches",
    tags: "Tags",
    noDevices: "No USB devices detected",
    noRepos: "No repositories found",
    scanDevice: "Scan Device",
  },
  header: {
    title: "すきすぎっ",
    toggleSidebar: "Toggle Sidebar",
  },
  common: {
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    noData: "No data available",
  },
  commits: {
    log: "Commit Log",
    loadMore: "Load More",
    noCommits: "No commits found",
  },
  diff: {
    unified: "Unified",
    split: "Split",
    noDiff: "No changes",
  },
  dag: {
    graphView: "Commit Graph",
    noSelection: "Click a commit to view details",
    closeDetail: "Close",
    colDescription: "Description",
    colAuthor: "Author",
    colDate: "Date",
    colHash: "Hash",
  },
});
