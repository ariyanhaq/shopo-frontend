/**
 * @file ProductImageUploader.jsx
 * @description Product image uploader with ImgBB integration, live preview, drag-and-drop, and Paste URL support.
 */
import { useState, useRef } from 'react';
import { uploadImageToImgBB } from '@/services/imageUpload';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  UploadCloud, X, Loader2, Link as LinkIcon
} from 'lucide-react';

export default function ProductImageUploader({
  value = '',
  onChange,
  className = '',
  label = 'Product Photo (Optional)',
  allowUrlPaste = true,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const handleFileSelected = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImageToImgBB(file);
      onChange(result.url);
      toast.success('Product image uploaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-800 dark:text-zinc-200 text-xs">
          {label}
        </label>
        
        {allowUrlPaste && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Upload Image File' : 'Paste Image URL'}</span>
          </button>
        )}
      </div>

      {/* URL Input Mode */}
      {showUrlInput ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://i.ibb.co/..."
            value={urlDraft || value}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              onChange(e.target.value);
            }}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00df89]"
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange('');
                setUrlDraft('');
              }}
              className="h-9 px-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : value ? (
        /* Image Preview Box */
        <div className="relative group rounded-2xl border border-slate-200 dark:border-zinc-800 p-3 bg-slate-50 dark:bg-[#09090b] flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0 shadow-2xs">
            <img
              src={value}
              alt="Product preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://placehold.co/100x100?text=No+Img';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
              Image attached
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{value}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs font-semibold px-3 rounded-xl"
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? 'border-[#00df89] bg-emerald-500/5'
              : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-[#09090b]/50'
          }`}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#00df89]" />
              <span className="text-sm font-medium">Uploading image...</span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400">
                <UploadCloud className="w-4.5 h-4.5" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Click or drag & drop image here
              </div>
              <p className="text-xs text-slate-400">
                Supported: JPG, PNG, WEBP (Max 10MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
