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

// Tidak perlu VIDEOS_JSON_URL statis di sini lagi, akan dikirim dari pemanggil
let cachedVideos: VideoData[] | null = null;

// --- PERUBAHAN DI SINI: Menerima baseUrl sebagai argumen ---
export async function getAllVideos(baseUrl: string): Promise<VideoData[]> {
// -----------------------------------------------------------
  if (cachedVideos) {
    console.log('[getAllVideos] Menggunakan data dari cache.');
    return cachedVideos;
  }

  // --- PERUBAHAN DI SINI: Buat URL absolut ---
  const absoluteUrl = `${baseUrl}/videos.json`; // SESUAIKAN PATH KE videos.json jika berbeda
  // ------------------------------------------

  console.log(`[getAllVideos] Mengambil data dari: ${absoluteUrl}`);
  let videosData: VideoData[] = [];

  try {
    const response = await globalThis.fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Gagal mengambil data video: ${response.statusText} (${response.status})`);
    }
    videosData = await response.json() as VideoData[];
    cachedVideos = videosData;
    console.log(`[getAllVideos] Data video berhasil diambil dan di-cache. Total video: ${videosData.length}`);
  } catch (error) {
    console.error(`[getAllVideos] Error saat mengambil atau mengurai data video:`, error);
    videosData = [];
  }

  return videosData as VideoData[];
}
