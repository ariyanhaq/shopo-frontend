/**
 * @file EmptyState.jsx
 * @description Empty state placeholder component when no data exists.
 */
export default function EmptyState({ message }) {
  return (
    <div className="text-center p-8 border border-dashed rounded text-gray-500">
      {message || 'No items found.'}
    </div>
  );
}
