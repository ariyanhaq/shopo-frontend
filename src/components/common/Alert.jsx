/**
 * @file Alert.jsx
 * @description Alert box message component.
 */
export default function Alert({ children, type = 'info' }) {
  return (
    <div className={`p-3 rounded border text-sm bg-blue-50 text-blue-700 border-blue-200`}>
      {children || 'Alert Message'}
    </div>
  );
}
