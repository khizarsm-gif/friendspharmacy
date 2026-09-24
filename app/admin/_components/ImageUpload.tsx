"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // matches the bucket's 5 MB limit
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Uploads a product photo straight from the browser to Supabase Storage
 * (bypasses Vercel's ~4.5 MB request limit for server actions), then puts
 * the public URL in a hidden `name` field for the form to submit.
 * Storage policies only accept uploads from admins.
 */
export default function ImageUpload({
  name,
  defaultValue,
  slugHint,
  onUploadingChange,
}: {
  name: string;
  defaultValue?: string;
  slugHint: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  async function upload(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 5 MB. Please use a smaller photo.");
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const base = slugHint || "product";
      const path = `${base}-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      console.error("[ImageUpload]", err);
      setError(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          dragging ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        {url ? (
          <>
            {/* Plain img: the URL may be any https host the admin pasted. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Product preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrl("")}
              aria-label="Remove photo"
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-8 w-8 text-gray-400" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {uploading ? "Uploading…" : "Click or drag a photo here"}
            </span>
            <span className="text-xs text-gray-500">JPG, PNG, WebP or GIF, up to 5 MB</span>
          </button>
        )}
        {uploading && url && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        {url && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Replace photo
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          {showUrlInput ? "Hide link option" : "Use an image link instead"}
        </button>
      </div>
      {showUrlInput && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
          placeholder="https://…"
          aria-label="Image URL"
          className="input mt-2"
        />
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
