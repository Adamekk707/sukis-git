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
    title: "Suki's Git",
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
  clone: {
    title: "Clone Repository",
    sourceLabel: "Source",
    destinationLabel: "Destination",
    pickDirectory: "Browse",
    cloneAction: "Clone",
    cloning: "Cloning...",
    success: "Clone complete!",
    clonedTo: "Cloned to:",
    errorTitle: "Error",
    retry: "Retry",
    close: "Close",
  },
  removeRepo: {
    confirm: "Are you sure you want to remove this repository?",
    description: "This will permanently delete the bare repository from the USB device.",
    remove: "Remove",
    cancel: "Cancel",
  },
  addRepo: {
    title: "Add Repository to USB",
    sourceLabel: "Source Directory",
    pickSource: "Browse",
    repoNameLabel: "Repository Name",
    destinationLabel: "Destination Directory",
    pickDestination: "Browse",
    badgeGitRepo: "Git Repository (Fork)",
    badgePlainDir: "Plain Directory (New Repo)",
    detecting: "Detecting...",
    forkAction: "Fork to USB",
    createAction: "Create on USB",
    adding: "Adding...",
    success: "Added successfully!",
    addedTo: "Added to:",
    errorTitle: "Error",
    retry: "Retry",
    close: "Close",
  },
});
