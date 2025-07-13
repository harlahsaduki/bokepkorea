// src/middleware.ts
import { defineMiddleware, type APIContext } from 'astro/middleware';
import { slugify } from './utils/slugify';
import { getAllVideos, type VideoData } from './utils/data';

let videoMap: Map<string, { title: string; slug: string }>;
let isDataLoaded = false;

async function loadVideoData() {
    if (isDataLoaded) return;
    const allVideos: VideoData[] = await getAllVideos();
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
    console.log(`[Middleware] Video data loaded from getAllVideos. Total entries: ${videoMap.size}`);
}

loadVideoData().catch(error => {
    console.error('[Middleware] Failed to load video data at startup:', error);
});

async function getVideoTitleAndSlug(videoId: string): Promise<{ title: string; slug: string } | null> {
    if (!isDataLoaded) {
        await loadVideoData();
    }
    return videoMap.get(videoId) || null;
}

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
    const { url, request } = context;

    console.log(`[Middleware] Mencegat URL: ${url.pathname}`);

    const match = url.pathname.match(/^\/v\/([\w-]+)\/?$/);

    if (match) {
        const videoId = match[1];
        console.log(`[Middleware] URL cocok! ID ditemukan: ${videoId}`);

        const videoInfo = await getVideoTitleAndSlug(videoId);

        if (videoInfo) {
            const newPath = `/${videoInfo.slug}-${videoInfo.id}/`;
            console.log(`[Middleware] Video ditemukan. Melakukan REWRITE dari /v/${videoId} ke ${newPath}`);

            const rewrittenResponse = await context.rewrite(newPath);
            return rewrittenResponse;
 
        } else {
            console.warn(`[Middleware] Video dengan ID "${videoId}" tidak ditemukan dalam data getAllVideos. Melanjutkan ke /404.`);
            return next();
        }
    }

    console.log(`[Middleware] URL ${url.pathname} tidak cocok dengan pola. Melanjutkan.`);
    return next();
});
