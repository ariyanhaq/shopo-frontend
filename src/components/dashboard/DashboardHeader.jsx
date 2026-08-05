/**
 * @file DashboardHeader.jsx
 * @description Dashboard header banner component.
 */
export default function DashboardHeader({ title }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">{title || 'Dashboard'}</h1>
    </header>
  );
}
