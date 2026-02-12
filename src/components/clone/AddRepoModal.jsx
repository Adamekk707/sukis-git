import { useState } from "react";
import { useAtom } from "jotai";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { mutate } from "swr";
import { addRepoModalOpenAtom } from "../../atoms/uiAtoms";
import { messages } from "../../i18n";
import { SWR_KEYS } from "../../lib/swr";
import { Modal } from "../common/Modal";

const IDLE = "idle";
const DETECTING = "detecting";
const READY = "ready";
const ADDING = "adding";
const SUCCESS = "success";
const ERROR = "error";

export function AddRepoModal() {
  const t = useStore(messages);
  const [isOpen, setIsOpen] = useAtom(addRepoModalOpenAtom);

  const [sourcePath, setSourcePath] = useState("");
  const [detection, setDetection] = useState(null);
  const [repoName, setRepoName] = useState("");
  const [destinationDir, setDestinationDir] = useState("");
  const [addState, setAddState] = useState(IDLE);
  const [errorMessage, setErrorMessage] = useState("");
  const [addResult, setAddResult] = useState(null);

  const handleClose = () => {
    setIsOpen(false);
    setSourcePath("");
    setDetection(null);
    setRepoName("");
    setDestinationDir("");
    setAddState(IDLE);
    setErrorMessage("");
    setAddResult(null);
  };

  const handlePickSource = async () => {
    const selected = await open({ directory: true, multiple: false });
    R.when(R.complement(R.isNil), async (dir) => {
      setSourcePath(dir);
      setAddState(DETECTING);
      try {
        const result = await invoke("detect_source_directory", { sourcePath: dir });
        setDetection(result);
        setRepoName(R.prop("suggested_name", result));
        setAddState(READY);
      } catch (err) {
        setErrorMessage(String(err));
        setAddState(ERROR);
      }
    })(selected);
  };

  const handlePickDestination = async () => {
    const selected = await open({ directory: true, multiple: false });
    R.when(
      R.complement(R.isNil),
      (dir) => setDestinationDir(dir),
    )(selected);
  };

  const handleAdd = async () => {
    setAddState(ADDING);
    setErrorMessage("");
    try {
      const result = await invoke("add_repository_to_usb", {
        sourcePath,
        destinationDir,
        repoName,
      });
      setAddResult(result);
      setAddState(SUCCESS);
      mutate(SWR_KEYS.USB_DEVICES);
    } catch (err) {
      setErrorMessage(String(err));
      setAddState(ERROR);
    }
  };

  const isGitRepo = R.pathOr(false, ["is_git_repo"], detection);

  const canAdd = R.allPass([
    () => R.equals(READY, addState),
    () => R.complement(R.isEmpty)(repoName),
    () => R.complement(R.isEmpty)(destinationDir),
  ])();

  const actionLabel = R.ifElse(
    R.always(isGitRepo),
    () => R.pathOr("Fork to USB", ["addRepo", "forkAction"], t),
    () => R.pathOr("Create on USB", ["addRepo", "createAction"], t),
  )();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={R.pathOr("Add Repository to USB", ["addRepo", "title"], t)}
    >
      <div className="clone-field">
        <label className="clone-label">
          {R.pathOr("Source Directory", ["addRepo", "sourceLabel"], t)}
        </label>
        <div className="clone-destination-picker">
          <input
            className="clone-destination-input"
            type="text"
            value={sourcePath}
            readOnly
            placeholder={R.pathOr("Browse", ["addRepo", "pickSource"], t)}
          />
          <button
            className="clone-pick-btn"
            onClick={handlePickSource}
            disabled={R.includes(addState, [DETECTING, ADDING])}
          >
            {R.pathOr("Browse", ["addRepo", "pickSource"], t)}
          </button>
        </div>
      </div>

      {R.when(
        R.complement(R.isNil),
        (det) => (
          <div className="clone-field">
            <span className={R.concat("add-repo-badge ", R.ifElse(
              R.prop("is_git_repo"),
              R.always("add-repo-badge-git"),
              R.always("add-repo-badge-plain"),
            )(det))}>
              {R.ifElse(
                R.prop("is_git_repo"),
                () => R.pathOr("Git Repository (Fork)", ["addRepo", "badgeGitRepo"], t),
                () => R.pathOr("Plain Directory (New Repo)", ["addRepo", "badgePlainDir"], t),
              )(det)}
            </span>
          </div>
        ),
      )(detection)}

      {R.when(
        R.complement(R.isNil),
        () => (
          <>
            <div className="clone-field">
              <label className="clone-label">
                {R.pathOr("Repository Name", ["addRepo", "repoNameLabel"], t)}
              </label>
              <input
                className="clone-destination-input"
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(R.path(["target", "value"], e))}
                disabled={R.includes(addState, [ADDING, SUCCESS])}
              />
            </div>

            <div className="clone-field">
              <label className="clone-label">
                {R.pathOr("Destination", ["addRepo", "destinationLabel"], t)}
              </label>
              <div className="clone-destination-picker">
                <input
                  className="clone-destination-input"
                  type="text"
                  value={destinationDir}
                  readOnly
                  placeholder={R.pathOr("Browse", ["addRepo", "pickDestination"], t)}
                />
                <button
                  className="clone-pick-btn"
                  onClick={handlePickDestination}
                  disabled={R.includes(addState, [ADDING, SUCCESS])}
                >
                  {R.pathOr("Browse", ["addRepo", "pickDestination"], t)}
                </button>
              </div>
            </div>

            <div className="clone-actions">
              <button
                className="clone-action-btn"
                onClick={handleAdd}
                disabled={R.not(canAdd)}
              >
                {actionLabel}
              </button>
            </div>
          </>
        ),
      )(detection)}

      {R.cond([
        [R.equals(DETECTING), () => (
          <div className="clone-status clone-status-cloning">
            <span className="clone-spinner" />
            {R.pathOr("Detecting...", ["addRepo", "detecting"], t)}
          </div>
        )],
        [R.equals(ADDING), () => (
          <div className="clone-status clone-status-cloning">
            <span className="clone-spinner" />
            {R.pathOr("Adding...", ["addRepo", "adding"], t)}
          </div>
        )],
        [R.equals(SUCCESS), () => (
          <div className="clone-status clone-status-success">
            <span className="clone-status-icon">&#10003;</span>
            {R.pathOr("Added successfully!", ["addRepo", "success"], t)}
            <div className="clone-result-path">
              {R.pathOr("Added to:", ["addRepo", "addedTo"], t)}{" "}
              {R.pathOr("", ["destination_path"], addResult)}
            </div>
          </div>
        )],
        [R.equals(ERROR), () => (
          <div className="clone-status clone-status-error">
            <span className="clone-status-icon">&#10007;</span>
            {R.pathOr("Error", ["addRepo", "errorTitle"], t)}: {errorMessage}
            <button
              className="clone-retry-btn"
              onClick={() => setAddState(R.isNil(detection) ? IDLE : READY)}
            >
              {R.pathOr("Retry", ["addRepo", "retry"], t)}
            </button>
          </div>
        )],
        [R.T, R.always(null)],
      ])(addState)}
    </Modal>
  );
}
