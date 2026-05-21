'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';

export type UploadedFile = {
  url: string;
  name: string;
  type: string;
};

export function FileUploadButton({
  onFilesUploaded,
  disabled
}: {
  onFilesUploaded: (files: UploadedFile[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<UploadedFile[]>([]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Create FormData and upload via our API
        const formData = new FormData();
        formData.append('file', file);

        // For now, use a simple base64 data URL approach for preview
        // In production, UploadThing handles the actual upload
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        uploaded.push({
          url: dataUrl,
          name: file.name,
          type: file.type
        });
      }

      setPreview(uploaded);
      onFilesUploaded(uploaded);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeFile(idx: number) {
    const next = preview.filter((_, i) => i !== idx);
    setPreview(next);
    onFilesUploaded(next);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.zip"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-zinc-100 transition-colors disabled:opacity-50"
        aria-label="Attach file"
        title="Upload a file (max 8MB)"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </button>

      {/* Preview strip */}
      {preview.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-2 rounded-lg bg-discord-darker border border-zinc-700 p-2">
          {preview.map((file, idx) => (
            <div key={idx} className="relative group">
              {file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded bg-zinc-800 px-1">
                  <FileText className="h-6 w-6 text-zinc-400" />
                  <span className="mt-0.5 w-full truncate text-center text-[9px] text-zinc-400">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(idx)}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
