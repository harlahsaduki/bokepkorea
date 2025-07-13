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

    const match = url.pathname.match(/^\/v\/([\w-]+)\/?$/);

    if (match) {
        const videoId = match[1];

        const videoInfo = await getVideoTitleAndSlug(videoId);

        if (videoInfo) {
            const newPath = `/${videoInfo.slug}-${videoInfo.id}/`;

            const rewrittenResponse = await context.rewrite(newPath);
            return rewrittenResponse;
 
        } else {
             return next();
        }
    }

    return next();
});
