/**
 * @file SidebarItem.jsx
 * @description Sidebar navigation item link component.
 */
export default function SidebarItem({ label }) {
  return (
    <div className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
      {label || 'Sidebar Item'}
    </div>
  );
}
