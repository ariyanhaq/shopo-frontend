/**
 * @file Card.jsx
 * @description Reusable Card container component.
 */
export default function Card({ children, className = '' }) {
  return (
    <div className={`p-4 border rounded-lg shadow-sm bg-white ${className}`}>
      {children}
    </div>
  );
}
