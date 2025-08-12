import React from 'react';

export default function ElementModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <span>{title}</span>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}
