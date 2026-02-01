export default function Drawer({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
