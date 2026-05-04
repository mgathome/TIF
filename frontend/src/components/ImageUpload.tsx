'use client';

/**
 * Composant d'upload d'image vers Cloudinary.
 * - Stockage chez Cloudinary (gratuit jusqu'a 25 Go), CDN global
 * - Upload direct depuis le navigateur (pas besoin de backend dedie)
 * - Preview en direct + suppression possible
 *
 * Variables d'env requises sur Vercel :
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=votre-cloud
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=votre-preset (unsigned)
 */

import { useState, useRef } from 'react';
import Image from 'next/image';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  /** carré (ratio 1:1) ou paysage (ratio 16:9) */
  shape?: 'square' | 'wide';
  /** Taille en px du composant. Defaut 160. */
  size?: number;
  /** Folder Cloudinary (ex. "tif/restaurants" ou "tif/menu-items") */
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Photo',
  shape = 'square',
  size = 160,
  folder = 'tif',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = shape === 'wide' ? 'aspect-[16/9]' : 'aspect-square';
  const widthStyle = shape === 'wide' ? size * 1.78 : size;

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return (
      <div className="rounded-tif border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-xs text-amber-800">
        ⚠ Upload d'images non configuré. Demandez à l'admin d'ajouter les variables Cloudinary sur Vercel.
      </div>
    );
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image doit faire moins de 5 Mo.');
      return;
    }

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET!);
    fd.append('folder', folder);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Échec de l\'upload');
      onChange(data.secure_url as string);
    } catch (e: any) {
      setError(e.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset pour pouvoir reuploader le meme fichier ensuite
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {label && <label className="text-sm font-medium block mb-2">{label}</label>}

      <div
        className={`relative ${aspectClass} rounded-tif border-2 border-dashed
          ${value ? 'border-tif-gray-200' : 'border-tif-violet/40 bg-tif-violet/5 hover:bg-tif-violet/10'}
          transition cursor-pointer overflow-hidden`}
        style={{ width: widthStyle, maxWidth: '100%' }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill className="object-cover" sizes="200px" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-sm font-medium">Cliquez pour changer</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute top-1 right-1 bg-white/90 text-red-600 w-6 h-6 rounded-full text-xs font-bold hover:bg-white"
              aria-label="Supprimer l'image"
            >
              ×
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            {uploading ? (
              <>
                <div className="animate-spin w-6 h-6 border-2 border-tif-violet border-t-transparent rounded-full mb-2" />
                <span className="text-xs text-tif-gray-700">Upload en cours…</span>
              </>
            ) : (
              <>
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs text-tif-gray-700 font-medium">Cliquez ou glissez une image</span>
                <span className="text-[10px] text-tif-gray-500 mt-1">JPG, PNG, WebP (max 5 Mo)</span>
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
          disabled={uploading}
        />
      </div>

      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </div>
  );
}
