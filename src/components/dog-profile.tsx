"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDogProfileAction } from "@/app/actions";

const MAX_DIMENSION = 480;

interface Dog {
  id: string;
  name: string;
  weightLbs: number;
  photoUrl: string | null;
  bio: string | null;
}

function resizeImage(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function DogProfile({ dog }: { dog: Dog }) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(dog.photoUrl);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [bio, setBio] = useState(dog.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeImage(file, MAX_DIMENSION);
      setPreview(dataUrl);
      setPendingPhoto(dataUrl);
    } catch {
      setError("Couldn't process that image — try a different file.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateDogProfileAction(dog.id, { bio, photoDataUrl: pendingPhoto });
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        setPendingPhoto(null);
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
    setPreview(dog.photoUrl);
    setPendingPhoto(null);
    setBio(dog.bio ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
        <Avatar photoUrl={dog.photoUrl} name={dog.name} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">
              {dog.name} <span className="font-normal text-muted">· {dog.weightLbs} lbs</span>
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-brand underline"
            >
              Edit
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">
            {dog.bio || "No bio yet — click Edit to add one."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        <Avatar photoUrl={preview} name={dog.name} />
        <div className="flex-1 space-y-3">
          <label className="block text-sm font-medium text-muted">
            Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-muted"
            />
          </label>
          <label className="block text-sm font-medium text-muted">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={`A few words about ${dog.name}...`}
              className="field-input mt-1"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={handleCancel} className="text-sm text-muted underline">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- data: URLs aren't supported by next/image
    return <img src={photoUrl} alt={name} className="h-16 w-16 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-border text-lg font-semibold text-muted">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
