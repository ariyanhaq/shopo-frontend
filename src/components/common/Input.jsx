/**
 * @file Input.jsx
 * @description Reusable Input component.
 */
export default function Input(props) {
  return (
    <input className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2" {...props} />
  );
}
