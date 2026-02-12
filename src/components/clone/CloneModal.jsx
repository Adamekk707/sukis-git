import { useState } from "react";
import { useAtom } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { cloneModalRepoAtom } from "../../atoms/uiAtoms";
import { messages } from "../../i18n";
import { Modal } from "../common/Modal";

const IDLE = "idle";
const CLONING = "cloning";
const SUCCESS = "success";
const ERROR = "error";

export function CloneModal() {
  const t = useStore(messages);
  const [repo, setRepo] = useAtom(cloneModalRepoAtom);
  const [destinationDir, setDestinationDir] = useState("");
  const [cloneState, setCloneState] = useState(IDLE);
  const [errorMessage, setErrorMessage] = useState("");
  const [cloneResult, setCloneResult] = useState(null);

  const isOpen = R.complement(R.isNil)(repo);

  const handleClose = () => {
    setRepo(null);
    setDestinationDir("");
    setCloneState(IDLE);
    setErrorMessage("");
    setCloneResult(null);
  };

  const handlePickDirectory = async () => {
    const selected = await open({ directory: true, multiple: false });
    R.when(
      R.complement(R.isNil),
      (dir) => setDestinationDir(dir),
    )(selected);
  };

  const handleClone = async () => {
    setCloneState(CLONING);
    setErrorMessage("");
    try {
      const result = await invoke("clone_repository", {
        sourcePath: R.prop("path", repo),
        destinationDir,
        repoName: null,
      });
      setCloneResult(result);
      setCloneState(SUCCESS);
    } catch (err) {
      setErrorMessage(String(err));
      setCloneState(ERROR);
    }
  };

  const canClone = R.allPass([
    () => R.complement(R.isEmpty)(destinationDir),
    () => R.equals(IDLE, cloneState),
  ])();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={R.pathOr("Clone Repository", ["clone", "title"], t)}
    >
      <div className="clone-field">
        <label className="clone-label">
          {R.pathOr("Source", ["clone", "sourceLabel"], t)}
        </label>
        <div className="clone-source-path">{R.pathOr("", ["path"], repo)}</div>
      </div>

      <div className="clone-field">
        <label className="clone-label">
          {R.pathOr("Destination", ["clone", "destinationLabel"], t)}
        </label>
        <div className="clone-destination-picker">
          <input
            className="clone-destination-input"
            type="text"
            value={destinationDir}
            readOnly
            placeholder={R.pathOr("Select a folder...", ["clone", "pickDirectory"], t)}
          />
          <button
            className="clone-pick-btn"
            onClick={handlePickDirectory}
            disabled={R.equals(CLONING, cloneState)}
          >
            {R.pathOr("Browse", ["clone", "pickDirectory"], t)}
          </button>
        </div>
      </div>

      <div className="clone-actions">
        <button
          className="clone-action-btn"
          onClick={handleClone}
          disabled={R.not(canClone)}
        >
          {R.pathOr("Clone", ["clone", "cloneAction"], t)}
        </button>
      </div>

      {R.cond([
        [R.equals(CLONING), () => (
          <div className="clone-status clone-status-cloning">
            <span className="clone-spinner" />
            {R.pathOr("Cloning...", ["clone", "cloning"], t)}
          </div>
        )],
        [R.equals(SUCCESS), () => (
          <div className="clone-status clone-status-success">
            <span className="clone-status-icon">&#10003;</span>
            {R.pathOr("Clone complete!", ["clone", "success"], t)}
            <div className="clone-result-path">
              {R.pathOr("Cloned to:", ["clone", "clonedTo"], t)}{" "}
              {R.pathOr("", ["destination_path"], cloneResult)}
            </div>
          </div>
        )],
        [R.equals(ERROR), () => (
          <div className="clone-status clone-status-error">
            <span className="clone-status-icon">&#10007;</span>
            {R.pathOr("Error", ["clone", "errorTitle"], t)}: {errorMessage}
            <button className="clone-retry-btn" onClick={() => setCloneState(IDLE)}>
              {R.pathOr("Retry", ["clone", "retry"], t)}
            </button>
          </div>
        )],
        [R.T, R.always(null)],
      ])(cloneState)}
    </Modal>
  );
}
