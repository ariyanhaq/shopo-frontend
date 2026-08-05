/**
 * @file Badge.jsx
 * @description Status badge tag component.
 */
export default function Badge({ children }) {
  return (
    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
      {children || 'Badge'}
    </span>
  );
}
