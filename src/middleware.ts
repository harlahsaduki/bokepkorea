// src/middleware.ts
import { defineMiddleware, type APIContext } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
    // Ini harus selalu muncul di log jika middleware dieksekusi
    console.log(`[DEBUG MIDDLEWARE] Permintaan masuk: ${context.url.pathname}`);

    // Coba redirect semua traffic ke halaman home (sementara)
    // HANYA UNTUK DEBUGGING - JANGAN DIBIARKAN DI PRODUKSI
    // return context.redirect('/', 302); 
    
    // Atau hanya lanjutkan untuk melihat apakah log muncul
    return next();
});
