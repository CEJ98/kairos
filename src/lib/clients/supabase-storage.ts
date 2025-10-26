export type UploadParams = {
  bucket: string;
  path: string;
  mime: string;
  body: string | Uint8Array;
};

export async function uploadObject({ bucket, path, mime, body }: UploadParams): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase URL o clave de servicio no configuradas');

  const endpoint = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path}?upsert=true`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': mime
    },
    body: typeof body === 'string' ? body : Buffer.from(body)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Fallo subiendo ${path}: ${res.status} ${res.statusText} ${txt}`);
  }
}