/**
 * @file DashboardCard.jsx
 * @description Dashboard widget card component.
 */
export default function DashboardCard({ title, children }) {
  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h4 className="font-semibold mb-2">{title || 'Dashboard Card'}</h4>
      {children}
    </div>
  );
}
