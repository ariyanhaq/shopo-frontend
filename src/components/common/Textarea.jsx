/**
 * @file Textarea.jsx
 * @description Reusable Textarea component.
 */
export default function Textarea(props) {
  return (
    <textarea className="w-full px-3 py-2 border rounded-md focus:outline-none" {...props} />
  );
}
