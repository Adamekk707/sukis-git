import { useState } from "react";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { messages } from "../../i18n";

export function DeviceList({ devices, isLoading, onScanDevice, onSelectRepository, onCloneRepository, onRemoveRepository }) {
  const t = useStore(messages);
  const [scanning, setScanning] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);

  const handleScan = async (mountPoint) => {
    setScanning(R.assoc(mountPoint, true));
    try {
      await onScanDevice(mountPoint);
    } finally {
      setScanning(R.assoc(mountPoint, false));
    }
  };

  return R.cond([
    [() => isLoading, () => (
      <div className="device-list-loading">
        {R.pathOr("Loading...", ["common", "loading"], t)}
      </div>
    )],
    [() => R.isEmpty(devices), () => (
      <div className="device-list-empty">
        {R.pathOr("No USB devices detected", ["sidebar", "noDevices"], t)}
      </div>
    )],
    [R.T, () => (
      <ul className="device-list">
        {R.map(
          (device) => (
            <li key={R.prop("mount_point", device)} className="device-item">
              <div className="device-info">
                <span className="device-label">
                  {R.pipe(
                    R.prop("label"),
                    R.when(R.isEmpty, R.always("USB")),
                  )(device)}
                </span>
                <span className="device-mount">{R.prop("mount_point", device)}</span>
              </div>
              <button
                className="scan-btn"
                onClick={() => handleScan(R.prop("mount_point", device))}
                disabled={R.propOr(false, R.prop("mount_point", device), scanning)}
              >
                {R.pathOr("Scan", ["sidebar", "scanDevice"], t)}
              </button>
              {R.ifElse(
                R.isEmpty,
                R.always(null),
                R.map((repo) => (
                  <div key={R.prop("path", repo)}>
                    <div className="repo-item-row">
                      <button
                        className="repo-item"
                        onClick={() => onSelectRepository(repo)}
                      >
                        {R.prop("name", repo)}
                      </button>
                      <button
                        className="repo-clone-btn"
                        onClick={() => onCloneRepository(repo)}
                        title={R.pathOr("Clone", ["clone", "cloneAction"], t)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
                          <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
                        </svg>
                      </button>
                      <button
                        className="repo-remove-btn"
                        onClick={() => setConfirmRemove(R.prop("path", repo))}
                        title={R.pathOr("Remove", ["removeRepo", "remove"], t)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25ZM4.997 6.178a.75.75 0 1 0-1.493.144L4.2 12.3a2.75 2.75 0 0 0 2.733 2.45h2.134a2.75 2.75 0 0 0 2.733-2.45l.697-5.978a.75.75 0 1 0-1.493-.144l-.697 5.977a1.25 1.25 0 0 1-1.24 1.113H6.933a1.25 1.25 0 0 1-1.24-1.113l-.696-5.977Z" />
                        </svg>
                      </button>
                    </div>
                    {R.when(
                      R.equals(R.prop("path", repo)),
                      () => (
                        <div className="repo-remove-confirm">
                          <p className="repo-remove-confirm-text">
                            {R.pathOr("Are you sure?", ["removeRepo", "confirm"], t)}
                          </p>
                          <p className="repo-remove-confirm-desc">
                            {R.pathOr("", ["removeRepo", "description"], t)}
                          </p>
                          <div className="repo-remove-confirm-actions">
                            <button
                              className="repo-remove-cancel-btn"
                              onClick={() => setConfirmRemove(null)}
                            >
                              {R.pathOr("Cancel", ["removeRepo", "cancel"], t)}
                            </button>
                            <button
                              className="repo-remove-confirm-btn"
                              onClick={() => {
                                onRemoveRepository(R.prop("path", repo));
                                setConfirmRemove(null);
                              }}
                            >
                              {R.pathOr("Remove", ["removeRepo", "remove"], t)}
                            </button>
                          </div>
                        </div>
                      ),
                    )(confirmRemove)}
                  </div>
                )),
              )(R.propOr([], "repositories", device))}
            </li>
          ),
          devices,
        )}
      </ul>
    )],
  ])();
}
