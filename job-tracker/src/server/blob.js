import { put, del } from '@vercel/blob';

export async function uploadResumeBlob(pathname, file, contentType) {
  return put(pathname, file, { access: 'public', contentType, addRandomSuffix: false });
}
export async function fetchResumeBuffer(blobUrl) {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
export async function deleteResumeBlob(blobUrl) { await del(blobUrl); }
