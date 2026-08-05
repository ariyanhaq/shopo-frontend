/**
 * @file Modal.jsx
 * @description Reusable Modal dialog component.
 */
export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        {children}
      </div>
    </div>
  );
}
