import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { RepositoryProvider, useRepository } from "./context/RepositoryContext";
import { AppShell } from "./components/layout/AppShell";
import { DagView } from "./components/dag/DagView";
import { CloneModal } from "./components/clone/CloneModal";
import { AddRepoModal } from "./components/clone/AddRepoModal";
import { messages } from "./i18n";
import "./styles/dag.css";
import "./App.css";

function MainContent() {
  const t = useStore(messages);
  const { selectedRepoPath } = useRepository();

  return R.ifElse(
    R.isNil,
    () => (
      <div className="empty-state">
        <p>{R.pathOr("No data available", ["common", "noData"], t)}</p>
      </div>
    ),
    () => <DagView />,
  )(selectedRepoPath);
}

function App() {
  return (
    <RepositoryProvider>
      <AppShell>
        <MainContent />
      </AppShell>
      <CloneModal />
      <AddRepoModal />
    </RepositoryProvider>
  );
}

export default App;
