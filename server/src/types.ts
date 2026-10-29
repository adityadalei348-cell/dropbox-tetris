export type SourceType = 'youtube' | 'spotify';
export type FormatType = 'mp3' | 'mp4' | 'flac' | 'opus' | 'm4a' | 'wav' | 'webm';

export interface MediaMetadata {
  title: string;
  thumbnail: string;
  duration?: number;
  type: 'video' | 'track' | 'playlist' | 'album';
  trackCount?: number;
  author?: string;
  source: SourceType;
  url: string;
}

export interface DownloadJob {
  id: string;
  url: string;
  format: FormatType;
  quality?: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  type?: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  progress: number;
  speed?: string;
  eta?: string;
  filePath?: string;
  filename?: string;
  error?: string;
  createdAt: number;
}

export interface LaneConfig {
  id: FormatType;
  label: string;
  color: string;
  supportedSources: SourceType[];
  supportsVideo: boolean;
}
