/**
 * @file Button.jsx
 * @description Reusable Button component.
 */
export default function Button({ children, ...props }) {
  return (
    <button className="px-4 py-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition" {...props}>
      {children || 'Button'}
    </button>
  );
}
