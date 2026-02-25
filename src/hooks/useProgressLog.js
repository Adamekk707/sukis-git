import { useState, useEffect, useCallback } from "react";
import * as R from "ramda";
import { listen } from "@tauri-apps/api/event";

const extractTaskName = R.pipe(R.defaultTo(""), R.split(": "), R.head);

export function useProgressLog(eventName, isActive) {
  const [logEntries, setLogEntries] = useState([]);

  useEffect(() => {
    if (R.not(isActive)) return;

    const unlisten = listen(eventName, (event) => {
      const payload = R.prop("payload", event);

      setLogEntries((prev) => {
        const isProgressUpdate = R.both(
          R.pipe(R.prop("step"), R.equals("git_progress")),
          R.pipe(R.prop("detail"), R.complement(R.isNil)),
        )(payload);

        return R.ifElse(
          R.identity,
          () => {
            const taskName = extractTaskName(R.prop("detail", payload));
            const sameTask = R.both(
              R.pipe(R.prop("detail"), R.complement(R.isNil)),
              R.pipe(R.prop("detail"), extractTaskName, R.equals(taskName)),
            );
            const lastIdx = R.findLastIndex(sameTask)(prev);
            return R.ifElse(
              R.gte(R.__, 0),
              (idx) => R.update(idx, payload, prev),
              () => R.append(payload, prev),
            )(lastIdx);
          },
          () => R.append(payload, prev),
        )(isProgressUpdate);
      });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [eventName, isActive]);

  const clearLog = useCallback(() => setLogEntries([]), []);

  return { logEntries, clearLog };
}
