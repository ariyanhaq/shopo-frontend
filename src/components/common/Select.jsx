/**
 * @file Select.jsx
 * @description Reusable Select dropdown component.
 */
export default function Select({ children, ...props }) {
  return (
    <select className="w-full px-3 py-2 border rounded-md" {...props}>
      {children}
    </select>
  );
}
