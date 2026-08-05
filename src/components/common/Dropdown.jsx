/**
 * @file Dropdown.jsx
 * @description Action dropdown menu component.
 */
export default function Dropdown({ children }) {
  return (
    <div className="relative inline-block border rounded p-2">{children || 'Dropdown Menu'}</div>
  );
}
