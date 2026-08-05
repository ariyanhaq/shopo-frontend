/**
 * @file Avatar.jsx
 * @description Avatar image or fallback component.
 */
export default function Avatar({ src, alt }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
      {src ? <img src={src} alt={alt || 'Avatar'} /> : <span>U</span>}
    </div>
  );
}
