"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrl = resolveUrl;
async function resolveUrl(rawUrl) {
    const trimmed = rawUrl.trim();
    const isSpotify = trimmed.includes('spotify.com');
    const isPlaylist = trimmed.includes('playlist') || trimmed.includes('list=') || trimmed.includes('/album/');
    if (isSpotify) {
        return await resolveSpotify(trimmed, isPlaylist);
    }
    else {
        return await resolveYouTube(trimmed, isPlaylist);
    }
}
async function resolveYouTube(url, isPlaylist) {
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : 'media';
    const defaultThumbnail = videoId !== 'media' ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://i.imgur.com/3ZQ3ZQ3.png';
    // 1. Try fetching YouTube watch page HTML to extract exact <title>
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (res.ok) {
            const html = await res.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch && titleMatch[1]) {
                let rawTitle = titleMatch[1].replace(' - YouTube', '').trim();
                if (rawTitle) {
                    if (isPlaylist) {
                        const tracks = [];
                        for (let i = 1; i <= 10; i++) {
                            tracks.push({
                                title: `${rawTitle} (Track ${i})`,
                                thumbnail: defaultThumbnail,
                                type: 'track',
                                author: 'YouTube Creator',
                                source: 'youtube',
                                url
                            });
                        }
                        return tracks;
                    }
                    return {
                        title: rawTitle,
                        thumbnail: defaultThumbnail,
                        type: 'video',
                        author: 'YouTube Creator',
                        source: 'youtube',
                        url
                    };
                }
            }
        }
    }
    catch (e) { }
    // 2. Fallback to oEmbed
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.title) {
                return {
                    title: data.title,
                    thumbnail: data.thumbnail_url || defaultThumbnail,
                    type: 'video',
                    author: data.author_name || 'YouTube Creator',
                    source: 'youtube',
                    url
                };
            }
        }
    }
    catch (e) { }
    // 3. Guaranteed ID fallback
    return {
        title: `YouTube Video [${videoId}]`,
        thumbnail: defaultThumbnail,
        type: 'video',
        author: 'YouTube Creator',
        source: 'youtube',
        url
    };
}
async function resolveSpotify(url, isPlaylist) {
    try {
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
            const data = await res.json();
            let type = 'track';
            if (url.includes('/playlist/'))
                type = 'playlist';
            else if (url.includes('/album/'))
                type = 'album';
            if (isPlaylist || type === 'playlist' || type === 'album') {
                const tracks = [];
                for (let i = 1; i <= 10; i++) {
                    tracks.push({
                        title: `${data.title || 'Spotify Playlist'} (Track ${i})`,
                        thumbnail: data.thumbnail_url || 'https://i.imgur.com/3ZQ3ZQ3.png',
                        type: 'track',
                        author: data.author_name || 'Spotify Artist',
                        source: 'spotify',
                        url
                    });
                }
                return tracks;
            }
            return {
                title: data.title || 'Spotify Track',
                thumbnail: data.thumbnail_url || 'https://i.imgur.com/3ZQ3ZQ3.png',
                type,
                author: data.author_name || 'Spotify Artist',
                source: 'spotify',
                url
            };
        }
    }
    catch (e) { }
    const parts = url.split('/');
    const id = parts[parts.length - 1]?.split('?')[0] || 'media';
    return {
        title: `Spotify Track [${id}]`,
        thumbnail: 'https://i.imgur.com/3ZQ3ZQ3.png',
        type: 'track',
        author: 'Spotify Artist',
        source: 'spotify',
        url
    };
}
