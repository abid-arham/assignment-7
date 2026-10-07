"use client";

import { useCallback, useRef, useState } from "react";
import { refreshSession } from "@/lib/api/client";
import { parseResponse } from "@/lib/api/core";
import type { User } from "@/lib/api/types";

/** One multipart upload through the BFF proxy with byte-level progress (fetch can't report upload progress). */
function send(file: File, onProgress: (percent: number) => void, register: (xhr: XMLHttpRequest) => void) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("PATCH", "/api/proxy/users/me/avatar");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      resolve(new Response(xhr.responseText, { status: xhr.status, headers: { "content-type": "application/json" } }));
    xhr.onerror = () => reject(new TypeError("Network error while uploading"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    const body = new FormData();
    body.append("avatar", file);
    xhr.send(body);
  });
}

export function useAvatarUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const current = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File): Promise<User> => {
    setUploading(true);
    setProgress(0);
    const track = (xhr: XMLHttpRequest) => (current.current = xhr);
    try {
      let res = await send(file, setProgress, track);
      if (res.status === 401 && (await refreshSession())) {
        setProgress(0);
        res = await send(file, setProgress, track);
      }
      return await parseResponse<User>(res);
    } finally {
      setUploading(false);
      current.current = null;
    }
  }, []);

  const cancel = useCallback(() => current.current?.abort(), []);

  return { upload, cancel, progress, uploading };
}
