/**
 * @file ConfirmDialog.jsx
 * @description Confirmation modal dialog component.
 */
export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <h3>{title || 'Are you sure?'}</h3>
      </div>
    </div>
  );
}
