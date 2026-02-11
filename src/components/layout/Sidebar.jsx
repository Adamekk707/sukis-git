import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { useUsbDevices } from "../../hooks/useUsbDevices";
import { useRefs } from "../../hooks/useRefs";
import { useRepository } from "../../context/RepositoryContext";
import { DeviceList } from "../usb/DeviceList";
import { messages } from "../../i18n";

export function Sidebar() {
  const t = useStore(messages);
  const { devices, isLoading: devicesLoading, scanDevice } = useUsbDevices();
  const { selectedRepoPath, selectRepository, selectRef } = useRepository();
  const { branches, tags, isLoading: refsLoading } = useRefs(selectedRepoPath);

  const handleSelectRepository = (repo) => {
    selectRepository(R.prop("path", repo));
  };

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h2 className="sidebar-section-title">
          {R.pathOr("USB Devices", ["sidebar", "devices"], t)}
        </h2>
        <DeviceList
          devices={devices}
          isLoading={devicesLoading}
          onScanDevice={scanDevice}
          onSelectRepository={handleSelectRepository}
        />
      </section>

      {R.ifElse(
        R.isNil,
        R.always(null),
        () => (
          <>
            <section className="sidebar-section">
              <h2 className="sidebar-section-title">
                {R.pathOr("Branches", ["sidebar", "branches"], t)}
              </h2>
              {R.cond([
                [() => refsLoading, () => (
                  <div className="sidebar-loading">
                    {R.pathOr("Loading...", ["common", "loading"], t)}
                  </div>
                )],
                [() => R.isEmpty(branches), () => (
                  <div className="sidebar-empty">
                    {R.pathOr("No data available", ["common", "noData"], t)}
                  </div>
                )],
                [R.T, () => (
                  <ul className="ref-list">
                    {R.map(
                      (ref) => (
                        <li key={R.prop("full_name", ref)} className="ref-item">
                          <button
                            className="ref-btn branch-btn"
                            onClick={() => selectRef(ref)}
                          >
                            {R.prop("name", ref)}
                          </button>
                        </li>
                      ),
                      branches,
                    )}
                  </ul>
                )],
              ])()}
            </section>

            <section className="sidebar-section">
              <h2 className="sidebar-section-title">
                {R.pathOr("Tags", ["sidebar", "tags"], t)}
              </h2>
              {R.cond([
                [() => refsLoading, () => (
                  <div className="sidebar-loading">
                    {R.pathOr("Loading...", ["common", "loading"], t)}
                  </div>
                )],
                [() => R.isEmpty(tags), () => (
                  <div className="sidebar-empty">
                    {R.pathOr("No data available", ["common", "noData"], t)}
                  </div>
                )],
                [R.T, () => (
                  <ul className="ref-list">
                    {R.map(
                      (ref) => (
                        <li key={R.prop("full_name", ref)} className="ref-item">
                          <button
                            className="ref-btn tag-btn"
                            onClick={() => selectRef(ref)}
                          >
                            {R.prop("name", ref)}
                          </button>
                        </li>
                      ),
                      tags,
                    )}
                  </ul>
                )],
              ])()}
            </section>
          </>
        ),
      )(selectedRepoPath)}
    </aside>
  );
}
