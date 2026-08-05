/**
 * @file Checkbox.jsx
 * @description Reusable Checkbox component.
 */
export default function Checkbox(props) {
  return (
    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300" {...props} />
  );
}
