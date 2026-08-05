/**
 * @file CategoryCard.jsx
 * @description Shop category card component.
 */
export default function CategoryCard({ category }) {
  return (
    <div className="p-3 border rounded text-center">
      {category || 'Category Card'}
    </div>
  );
}
