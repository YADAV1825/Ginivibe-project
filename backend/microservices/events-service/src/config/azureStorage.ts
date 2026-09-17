import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'event-images';

let containerClient: ContainerClient | null = null;

// Lazily create (and cache) the container client, and make sure the
// container exists with public read access on the blobs themselves
// (not the whole container listing) so image URLs work directly in <img>/<Image> tags.
const getContainerClient = async (): Promise<ContainerClient> => {
  if (containerClient) return containerClient;

  if (!CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is required to upload images');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
  const client = blobServiceClient.getContainerClient(CONTAINER_NAME);
  await client.createIfNotExists({ access: 'blob' });

  containerClient = client;
  return client;
};

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const extensionForMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const isAllowedImageMimeType = (mimeType: string): boolean => ALLOWED_MIME_TYPES.has(mimeType);

/**
 * Uploads a single image buffer to Azure Blob Storage and returns its public URL.
 */
export const uploadEventImage = async (
  buffer: Buffer,
  mimeType: string,
  ownerId: string
): Promise<string> => {
  if (!isAllowedImageMimeType(mimeType)) {
    throw new Error('Unsupported image type. Allowed types: JPEG, PNG, WEBP, GIF');
  }

  const client = await getContainerClient();
  const extension = extensionForMimeType[mimeType] ?? 'jpg';
  const blobName = `${ownerId}/${randomUUID()}.${extension}`;
  const blockBlobClient = client.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  return blockBlobClient.url;
};

/**
 * Best-effort delete, used when an event's banner image is replaced or the event is removed.
 * Never throws — a failed cleanup shouldn't block the primary request.
 */
export const deleteEventImageIfManaged = async (imageUrl: string | null | undefined): Promise<void> => {
  if (!imageUrl) return;

  try {
    const client = await getContainerClient();
    if (!imageUrl.includes(client.url)) return; // not one of ours (e.g. externally set URL)

    const blobName = imageUrl.slice(client.url.length).replace(/^\//, '');
    if (!blobName) return;

    await client.getBlockBlobClient(blobName).deleteIfExists();
  } catch (error) {
    console.error('Failed to delete event image blob', error);
  }
};