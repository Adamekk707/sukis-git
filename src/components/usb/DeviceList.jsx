import { useState } from "react";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { messages } from "../../i18n";

export function DeviceList({ devices, isLoading, onScanDevice, onSelectRepository }) {
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
                  <button
                    key={R.prop("path", repo)}
                    className="repo-item"
                    onClick={() => onSelectRepository(repo)}
                  >
                    {R.prop("name", repo)}
                  </button>
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
