// src/middleware.ts
import { defineMiddleware, type APIContext } from 'astro/middleware';
import { slugify } from '../src/utils/slugify';
// Import getAllVideos, tapi kita akan ubah panggilannya untuk menerima baseUrl
import { getAllVideos, type VideoData } from '../src/utils/data';

let videoMap: Map<string, { title: string; slug: string }>;
let isDataLoaded = false;
let appBaseUrl: string; // Tambahkan variabel untuk menyimpan base URL

async function loadVideoData() {
  if (isDataLoaded) return;
  console.log('[Middleware] Memulai inisialisasi data video...');
  // --- PERUBAHAN DI SINI: Teruskan appBaseUrl ke getAllVideos ---
  const allVideos: VideoData[] = await getAllVideos(appBaseUrl);
  // -------------------------------------------------------------
  videoMap = new Map();
  allVideos.forEach(video => {
    const videoSlug = slugify(video.title);
    videoMap.set(video.id, {
      id: video.id,
      title: video.title,
      slug: videoSlug,
    });
  });
  isDataLoaded = true;
  console.log(`[Middleware] Data video berhasil dimuat dan diproses. Total entries: ${videoMap.size}`);
}

loadVideoData().catch(error => {
  console.error('[Middleware] Gagal memuat data video saat startup:', error);
});

async function getVideoTitleAndSlug(videoId: string): Promise<{ title: string; slug: string } | null> {
  if (!isDataLoaded) {
    await loadVideoData();
  }
  return videoMap.get(videoId) || null;
}

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  const { url, redirect } = context;

  // --- PERUBAHAN DI SINI: Set appBaseUrl dari context.url.origin ---
  if (!appBaseUrl) { // Set hanya sekali
    appBaseUrl = url.origin;
    console.log(`[Middleware] Base URL aplikasi disetel: ${appBaseUrl}`);
    // Panggil ulang loadVideoData jika belum dimuat dan appBaseUrl baru disetel
    if (!isDataLoaded) {
        await loadVideoData();
    }
  }
  // -----------------------------------------------------------------

  console.log(`[Middleware] Mencegat URL: ${url.pathname}`);

  const match = url.pathname.match(/^\/v\/([\w-]+)\/?$/);

  if (match) {
    const videoId = match[1];
    console.log(`[Middleware] URL cocok! ID ditemukan: ${videoId}`);

    const videoInfo = await getVideoTitleAndSlug(videoId);

    if (videoInfo) {
      const newPath = `/${videoInfo.slug}-${videoInfo.id}/`;
      console.log(`[Middleware] Video ditemukan. Melakukan REDIRECT 301 dari /v/${videoId} ke ${newPath}`);
      return redirect(newPath, 301);
    } else {
      console.warn(`[Middleware] Video dengan ID "${videoId}" tidak ditemukan dalam data. Mengarahkan ke /404.`);
      return redirect('/404', 302);
    }
  }

  console.log(`[Middleware] URL ${url.pathname} tidak cocok dengan pola. Melanjutkan.`);
  return next();
});
