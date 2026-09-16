import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export const AUFTRAG_LOGO_BUCKET = "auftrag-logos";

const signedUrlCache = new Map<string, Promise<string | null>>();

export async function resolveAuftragLogo(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) {
    return path;
  }

  let pending = signedUrlCache.get(path);
  if (!pending) {
    pending = supabase.storage
      .from(AUFTRAG_LOGO_BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => (error ? null : data.signedUrl));
    signedUrlCache.set(path, pending);
  }
  return pending;
}

type AuftragLogoProps = {
  value: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export function AuftragLogo({ value, alt, className, fallback = null }: AuftragLogoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setSrc(null);
    resolveAuftragLogo(value).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
