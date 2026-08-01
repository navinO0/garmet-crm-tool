"use client";

import React, { useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, Eye } from 'lucide-react';

interface CloudinaryUploadProps {
  label: string;
  description?: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  label,
  description,
  images = [],
  onChange,
  maxFiles = 15,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzapdxkgc';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'demo_store';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      onChange([...images, ...uploadedUrls].slice(0, maxFiles));
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setError(err.message || 'Image upload failed. Try again.');
    } finally {
      setIsUploading(false);
      // Reset input value so same files can be uploaded if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            {label}
          </label>
          {description && <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full font-semibold">
          {images.length} / {maxFiles} Uploaded
        </span>
      </div>

      {/* Uploaded Thumbnails Grid */}
      <div className="flex flex-wrap items-center gap-3">
        {images.map((url, idx) => (
          <div
            key={idx}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm group bg-gray-100 dark:bg-zinc-800"
          >
            <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewImage(url)}
                className="p-1.5 bg-white/90 text-gray-800 rounded-full hover:bg-white transition"
                title="View image"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                title="Delete image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {images.length < maxFiles && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-zinc-800/80 hover:bg-indigo-50/50 transition p-2 text-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 mt-1">Upload Multiple</span>
                <span className="text-[9px] text-gray-400">Images</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
