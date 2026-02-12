import * as R from "ramda";

export function Modal({ isOpen, onClose, title, children }) {
  return R.when(
    R.identity,
    () => (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    ),
  )(isOpen);
}
