import * as R from "ramda";

export function Modal({ isOpen, onClose, closeable = true, title, children }) {
  return R.when(
    R.identity,
    () => (
      <div
        className="modal-backdrop"
        onClick={R.when(R.always(closeable), onClose)}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {R.when(
              R.identity,
              () => (
                <button className="modal-close-btn" onClick={onClose}>
                  &times;
                </button>
              ),
            )(closeable)}
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    ),
  )(isOpen);
}
