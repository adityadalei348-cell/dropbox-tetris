import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { FormatType, SourceType } from './types.js';

const DOWNLOAD_DIR = path.resolve('/tmp/dropbox-tetris-downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function getYtDlpCommand(): { cmd: string; argsPrefix: string[] } {
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' });
    return { cmd: 'yt-dlp', argsPrefix: [] };
  } catch {
    return { cmd: 'python3', argsPrefix: ['-m', 'yt_dlp'] };
  }
}

interface DownloadOptions {
  jobId: string;
  url: string;
  format: FormatType;
  source: SourceType;
  quality?: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  type?: string;
  onProgress: (progress: number, speed?: string, eta?: string) => void;
  onComplete: (filePath: string, filename: string) => void;
  onError: (error: string) => void;
}

export async function startDownload(options: DownloadOptions) {
  let targetUrl = options.url;
  const isPlaylist = options.type === 'playlist' || options.type === 'album' || options.url.includes('playlist') || options.url.includes('list=') || options.url.includes('/album/');

  if (options.source === 'spotify') {
    if (options.title) {
      targetUrl = isPlaylist
        ? `ytsearch10:${options.title} ${options.author || ''} full album playlist`
        : `ytsearch1:${options.title} ${options.author || ''}`;
    } else {
      try {
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(options.url)}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data: any = await res.json();
          if (data.title) {
            targetUrl = isPlaylist
              ? `ytsearch10:${data.title} full album playlist`
              : `ytsearch1:${data.title} ${data.author_name || ''}`;
          } else {
            const parts = options.url.split('/');
            const id = parts[parts.length - 1]?.split('?')[0] || 'media';
            targetUrl = isPlaylist ? `ytsearch10:spotify playlist ${id}` : `ytsearch1:spotify track ${id}`;
          }
        } else {
          const parts = options.url.split('/');
          const id = parts[parts.length - 1]?.split('?')[0] || 'media';
          targetUrl = isPlaylist ? `ytsearch10:spotify playlist ${id}` : `ytsearch1:spotify track ${id}`;
        }
      } catch (e) {
        const parts = options.url.split('/');
        const id = parts[parts.length - 1]?.split('?')[0] || 'media';
        targetUrl = isPlaylist ? `ytsearch10:spotify playlist ${id}` : `ytsearch1:spotify track ${id}`;
      }
    }
  } else if (options.source === 'youtube' && !isPlaylist) {
    const videoIdMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (videoIdMatch) {
      targetUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    }
  }

  const fileId = options.jobId;

  // Download thumbnail cover art for embedding
  let coverPath = '';
  try {
    let thumbUrl = options.thumbnail;
    if (!thumbUrl || thumbUrl.includes('imgur.com')) {
      const videoIdMatch = options.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      if (videoId) {
        thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    if (thumbUrl && !thumbUrl.includes('imgur.com')) {
      const thumbRes = await fetch(thumbUrl);
      if (thumbRes.ok) {
        const buffer = Buffer.from(await thumbRes.arrayBuffer());
        coverPath = path.join(DOWNLOAD_DIR, `${fileId}_cover.jpg`);
        fs.writeFileSync(coverPath, buffer);
      }
    }
  } catch (e) {}

  const outputTemplate = isPlaylist
    ? path.join(DOWNLOAD_DIR, `${fileId}_%(playlist_index)s_%(title)s.%(ext)s`)
    : path.join(DOWNLOAD_DIR, `${fileId}_%(title)s.%(ext)s`);

  const { cmd, argsPrefix } = getYtDlpCommand();
  const dlpArgs: string[] = [
    ...argsPrefix,
    isPlaylist ? '--yes-playlist' : '--no-playlist',
    '--newline',
    '--no-check-certificates',
    '--geo-bypass',
    '--no-warnings',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '--extractor-args',
    'youtube:player_client=android,web',
    '-o',
    outputTemplate
  ];

  if (['mp3', 'flac', 'opus', 'm4a', 'mp4'].includes(options.format)) {
    dlpArgs.push('--embed-thumbnail', '--add-metadata');
    if (options.format === 'mp3') {
      dlpArgs.push('--ppa', 'EmbedThumbnail+ffmpeg_o:-id3v2_version 3');
    }
  } else {
    dlpArgs.push('--add-metadata');
  }

  switch (options.format) {
    case 'mp3':
      dlpArgs.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', options.quality || '192k');
      break;
    case 'flac':
      dlpArgs.push('--extract-audio', '--audio-format', 'flac');
      break;
    case 'opus':
      dlpArgs.push('--extract-audio', '--audio-format', 'opus');
      break;
    case 'mp4':
      dlpArgs.push('--format', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
      break;
    case 'm4a':
      dlpArgs.push('--extract-audio', '--audio-format', 'm4a');
      break;
    case 'wav':
      dlpArgs.push('--extract-audio', '--audio-format', 'wav');
      break;
    case 'webm':
      dlpArgs.push('--format', 'bestvideo+bestaudio/best', '--merge-output-format', 'webm');
      break;
  }

  dlpArgs.push(targetUrl);

  const child = spawn(cmd, dlpArgs);

  let downloadedFilePath = '';
  let filename = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    const progressMatch = text.match(/\[download\]\s+(\d+\.\d+)%/);
    const speedMatch = text.match(/at\s+([^\s]+)/);
    const etaMatch = text.match(/ETA\s+([^\s]+)/);

    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      const speed = speedMatch ? speedMatch[1] : undefined;
      const eta = etaMatch ? etaMatch[1] : undefined;
      options.onProgress(progress, speed, eta);
    }

    const extractMatch = text.match(/\[ExtractAudio\]\s+Destination:\s+(.+)/);
    if (extractMatch) {
      downloadedFilePath = extractMatch[1].trim();
      filename = path.basename(downloadedFilePath);
    }

    const mergeMatch = text.match(/Merging formats into "(.+)"/);
    if (mergeMatch) {
      downloadedFilePath = mergeMatch[1].trim();
      filename = path.basename(downloadedFilePath);
    }

    const destMatch = text.match(/Destination:\s+(.+)/);
    if (destMatch && !downloadedFilePath) {
      downloadedFilePath = destMatch[1].trim();
      filename = path.basename(downloadedFilePath);
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
    const text = data.toString();
    const progressMatch = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      options.onProgress(progress);
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      try {
        const files = fs.readdirSync(DOWNLOAD_DIR);
        const matchedFiles = files.filter(f => f.startsWith(fileId) && !f.endsWith('.zip') && !f.endsWith('_cover.jpg'));

        if (matchedFiles.length > 1 || (isPlaylist && matchedFiles.length > 0)) {
          const zipName = `Playlist_${fileId}.zip`;
          const zipPath = path.join(DOWNLOAD_DIR, `${fileId}_${zipName}`);
          const filePathsArg = matchedFiles.map(f => `"${path.join(DOWNLOAD_DIR, f)}"`).join(' ');

          execSync(`zip -j "${zipPath}" ${filePathsArg}`);
          downloadedFilePath = zipPath;
          filename = zipName;
        } else if (matchedFiles.length === 1) {
          downloadedFilePath = path.join(DOWNLOAD_DIR, matchedFiles[0]);
          filename = matchedFiles[0].substring(matchedFiles[0].indexOf('_') + 1);
        }
      } catch (e) {}
    }

    if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
      try { if (coverPath && fs.existsSync(coverPath)) fs.unlinkSync(coverPath); } catch (e) {}
      options.onComplete(downloadedFilePath, filename || path.basename(downloadedFilePath));
    } else {
      const errLine = errorOutput.trim().split('\n').filter(l => l.includes('ERROR:') || l.includes('error')).pop() || errorOutput.trim().split('\n').pop() || `Exit code ${code}`;
      options.onError(`Download failed: ${errLine}`);
    }
  });

  child.on('error', (err) => {
    options.onError(`Failed to start yt-dlp: ${err.message}`);
  });
}
