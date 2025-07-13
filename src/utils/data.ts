// src/utils/data.ts
export interface VideoData {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  datePublished?: string;
  dateModified?: string;
  embedUrl: string;
  tags: string;
  previewUrl?: string;
  duration?: string;
}

const VIDEOS_JSON_URL = '/videos.json';

let cachedVideos: VideoData[] | null = null;

export async function getAllVideos(): Promise<VideoData[]> {
  if (cachedVideos) {
    console.log('[getAllVideos] Menggunakan data dari cache.');
    return cachedVideos;
  }

  console.log(`[getAllVideos] Mengambil data dari: ${VIDEOS_JSON_URL}`);
  let videosData: VideoData[] = [];

  try {
    const response = await globalThis.fetch(VIDEOS_JSON_URL);
    if (!response.ok) {
      throw new Error(`Gagal mengambil data video: ${response.statusText} (${response.status})`);
    }
    videosData = await response.json() as VideoData[]; // Isi videosData dari hasil fetch
    cachedVideos = videosData;
    console.log(`[getAllVideos] Data video berhasil diambil dan di-cache. Total video: ${videosData.length}`);
  } catch (error) {
    console.error(`[getAllVideos] Error saat mengambil atau mengurai data video:`, error);
    videosData = [];
  }

  return videosData as VideoData[];
}
