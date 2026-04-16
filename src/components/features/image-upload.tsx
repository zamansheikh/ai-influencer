'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string | null;
  onClear?: () => void;
}

export function ImageUpload({ onImageSelect, currentImage, onClear }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelect(base64);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const clear = () => {
    setPreview(null);
    onClear?.();
  };

  return (
    <AnimatePresence mode="wait">
      {preview ? (
        <motion.div
          key="preview"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative group rounded-2xl overflow-hidden border border-border"
        >
          <img
            src={preview}
            alt="Uploaded reference"
            className="w-full h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <button
              onClick={clear}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-destructive rounded-full cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="upload"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop your image here' : 'Drag & drop a reference photo'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, or WebP up to 20MB
            </p>
          </div>
          {!isDragActive && (
            <span className="text-xs text-primary font-medium px-4 py-1.5 rounded-lg bg-primary/10">
              Browse Files
            </span>
          )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
