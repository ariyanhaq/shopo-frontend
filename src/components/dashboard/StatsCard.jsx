/**
 * @file StatsCard.jsx
 * @description KPI statistics card component.
 */
export default function StatsCard({ label, value }) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-sm text-gray-500">{label || 'Stat'}</div>
      <div className="text-2xl font-bold">{value || '0'}</div>
    </div>
  );
}
