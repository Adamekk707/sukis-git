import { useRef, useEffect } from "react";
import { useStore } from "@nanostores/react";
import * as R from "ramda";
import { messages } from "../../i18n";

function resolveStepMessage(t, step) {
  const keys = R.split(".", step);
  return R.pathOr(step, keys, t);
}

function ProgressLogEntry({ entry, t }) {
  const detail = R.prop("detail", entry);
  const stepMessage = R.ifElse(
    R.complement(R.isNil),
    R.identity,
    () => resolveStepMessage(t, R.prop("step", entry)),
  )(detail);
  const isError = R.prop("is_error", entry);
  const hasDetail = R.complement(R.isNil)(detail);

  return (
    <div className={R.cond([
      [R.always(isError), R.always("progress-log-entry progress-log-entry-error")],
      [R.always(hasDetail), R.always("progress-log-entry progress-log-entry-detail")],
      [R.T, R.always("progress-log-entry")],
    ])()}>
      <span className={R.ifElse(
        R.always(isError),
        R.always("progress-log-dot progress-log-dot-error"),
        R.always("progress-log-dot"),
      )()} />
      {stepMessage}
    </div>
  );
}

export function ProgressLog({ entries }) {
  const t = useStore(messages);
  const containerRef = useRef(null);

  useEffect(() => {
    R.when(
      R.complement(R.isNil),
      (el) => { el.scrollTop = el.scrollHeight; },
    )(R.prop("current", containerRef));
  }, [entries]);

  return R.when(
    R.complement(R.isEmpty),
    (list) => (
      <div className="progress-log" ref={containerRef}>
        {R.addIndex(R.map)(
          (entry, idx) => (
            <ProgressLogEntry
              key={idx}
              entry={entry}
              t={t}
            />
          ),
          list,
        )}
      </div>
    ),
  )(entries);
}
