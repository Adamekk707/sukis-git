import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { RepositoryProvider, useRepository } from "./context/RepositoryContext";
import { AppShell } from "./components/layout/AppShell";
import { useCommitLog } from "./hooks/useCommitLog";
import { messages } from "./i18n";
import "./App.css";

function MainContent() {
  const t = useStore(messages);
  const { selectedRepoPath } = useRepository();
  const { commits, hasMore, isLoading } = useCommitLog(selectedRepoPath);

  return R.cond([
    [() => R.isNil(selectedRepoPath), () => (
      <div className="empty-state">
        <p>{R.pathOr("No data available", ["common", "noData"], t)}</p>
      </div>
    )],
    [() => isLoading, () => (
      <div className="loading-state">
        <p>{R.pathOr("Loading...", ["common", "loading"], t)}</p>
      </div>
    )],
    [R.T, () => (
      <div className="commit-list">
        <h2>{R.pathOr("Commit Log", ["commits", "log"], t)}</h2>
        {R.ifElse(
          R.isEmpty,
          () => <p>{R.pathOr("No commits found", ["commits", "noCommits"], t)}</p>,
          R.map((commit) => (
            <div key={R.prop("oid", commit)} className="commit-item">
              <span className="commit-oid">{R.prop("short_oid", commit)}</span>
              <span className="commit-message">
                {R.pipe(R.prop("message"), R.split("\n"), R.head)(commit)}
              </span>
              <span className="commit-author">{R.prop("author_name", commit)}</span>
            </div>
          )),
        )(commits)}
      </div>
    )],
  ])();
}

function App() {
  return (
    <RepositoryProvider>
      <AppShell>
        <MainContent />
      </AppShell>
    </RepositoryProvider>
  );
}

export default App;
