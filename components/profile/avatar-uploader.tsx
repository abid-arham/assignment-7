"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { CameraIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/components/dashboard/auth-provider";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/queries";
import { avatarFileSchema } from "@/lib/validations/profile";

export function AvatarUploader() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { upload, cancel, progress, uploading } = useAvatarUpload();

  // Revoke the object URL when the preview changes or the component unmounts.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const choose = (picked: File | undefined) => {
    if (!picked) return;
    const result = avatarFileSchema.safeParse(picked);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "That file can't be used.");
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    try {
      const updated = await upload(file);
      queryClient.setQueryData(queryKeys.me, updated);
      toast.success("Profile photo updated");
      reset();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return toast.info("Upload cancelled");
      toast.error("Upload failed", { description: getErrorMessage(e) });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative">
        {preview ? (
          <span className="relative block size-24 overflow-hidden rounded-full ring-2 ring-primary">
            {/* Local blob preview — next/image can't optimise object URLs, so it's served as-is. */}
            <Image src={preview} alt="New profile photo preview" fill unoptimized className="object-cover" />
          </span>
        ) : (
          <UserAvatar name={user.name} src={user.avatarUrl} size="xl" />
        )}
        <label
          htmlFor={inputId}
          className="absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
          aria-label="Choose a new photo"
        >
          <CameraIcon className="size-4" />
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {file ? (
        <div className="w-full space-y-3">
          <p className="truncate text-sm text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
          {uploading && (
            <div className="space-y-1" aria-live="polite">
              <Progress value={progress} aria-label="Upload progress" />
              <p className="text-xs text-muted-foreground tabular-nums">
                {progress < 100 ? `Uploading… ${progress}%` : "Processing on Cloudinary…"}
              </p>
            </div>
          )}
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={submit} disabled={uploading}>
              <UploadCloudIcon /> {uploading ? "Uploading…" : "Save photo"}
            </Button>
            <Button size="sm" variant="ghost" onClick={uploading ? cancel : reset}>
              <XIcon /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF, up to 2 MB.</p>
      )}
    </div>
  );
}
