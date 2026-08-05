/**
 * @file Toast.jsx
 * @description Toast notification item component.
 */
export default function Toast({ message }) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded">
      {message || 'Notification Toast'}
    </div>
  );
}
