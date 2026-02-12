import { useState } from "react";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { messages } from "../../i18n";

export function DeviceList({ devices, isLoading, onScanDevice, onSelectRepository, onCloneRepository }) {
  const t = useStore(messages);
  const [scanning, setScanning] = useState({});

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
                  <div key={R.prop("path", repo)} className="repo-item-row">
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
