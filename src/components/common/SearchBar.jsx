/**
 * @file SearchBar.jsx
 * @description Search bar component.
 */
export default function SearchBar(props) {
  return (
    <input type="text" placeholder="Search..." className="border rounded-md px-3 py-1.5" {...props} />
  );
}
