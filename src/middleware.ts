// src/middleware.ts
import { defineMiddleware, type APIContext } from 'astro/middleware';
import { slugify } from '../src/utils/slugify';
import { getAllVideos, type VideoData } from '../src/utils/data';

let videoMap: Map<string, { title: string; slug: string; id: string }>; // Adjusted type to include 'id'
let isDataLoaded = false;

async function loadVideoData() {
  if (isDataLoaded) return;
  console.log('[Middleware] Memulai inisialisasi data video...');
  try {
    const allVideos: VideoData[] = await getAllVideos(); // This will now perform the fetch
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
  } catch (error) {
    console.error('[Middleware] Gagal memuat data video saat startup:', error);
    // Potentially set isDataLoaded to false or handle the error gracefully if data is critical
  }
}

// Load data as soon as the middleware is imported/initialized
loadVideoData().catch(error => {
  console.error('[Middleware] Kesalahan tak terduga saat memuat data video di startup:', error);
});

async function getVideoTitleAndSlug(videoId: string): Promise<{ title: string; slug: string; id: string } | null> {
  // Ensure data is loaded if not already
  if (!isDataLoaded) {
    await loadVideoData();
  }
  return videoMap.get(videoId) || null;
}

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  const { url, redirect } = context;
  console.log(`[Middleware] Mencegat URL: ${url.pathname}`);

  // This is the crucial part: the regular expression to match /v/${videoId}
  // It captures the videoId into the first group (match[1])
  const match = url.pathname.match(/^\/v\/([a-zA-Z0-9_-]+)$/);

  if (match) {
    const videoId = match[1]; // The captured video ID
    console.log(`[Middleware] URL cocok! ID ditemukan: ${videoId}`);

    const videoInfo = await getVideoTitleAndSlug(videoId);

    if (videoInfo) {
      // Construct the new SEO-friendly path
      const newPath = `/${videoInfo.slug}-${videoInfo.id}/`;
      console.log(`[Middleware] Video ditemukan. Melakukan REDIRECT 301 dari ${url.pathname} ke ${newPath}`);
      return redirect(newPath, 301); // 301 for permanent redirect (good for SEO)
    } else {
      console.warn(`[Middleware] Video dengan ID "${videoId}" tidak ditemukan dalam data. Mengarahkan ke /404.`);
      return redirect('/404', 302); // 302 for temporary redirect to 404
    }
  }

  console.log(`[Middleware] URL ${url.pathname} tidak cocok dengan pola. Melanjutkan.`);
  return next(); // Continue to the next middleware or Astro page/route
});
