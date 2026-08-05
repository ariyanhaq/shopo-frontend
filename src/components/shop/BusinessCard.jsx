/**
 * @file BusinessCard.jsx
 * @description Business info card component.
 */
export default function BusinessCard({ title }) {
  return (
    <div className="p-4 border rounded bg-white">
      <h3>{title || 'Business Card'}</h3>
    </div>
  );
}
