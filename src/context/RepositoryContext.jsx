import { createContext, useContext, useState, useCallback } from "react";
import * as R from "ramda";

const RepositoryContext = createContext(null);

export function RepositoryProvider({ children }) {
  const [selectedRepoPath, setSelectedRepoPath] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);

  const selectRepository = useCallback((path) => {
    setSelectedRepoPath(path);
    setSelectedRef(null);
  }, []);

  const selectRef = useCallback((ref) => {
    setSelectedRef(ref);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRepoPath(null);
    setSelectedRef(null);
  }, []);

  const value = {
    selectedRepoPath,
    selectedRef,
    selectRepository,
    selectRef,
    clearSelection,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (R.isNil(context)) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}
