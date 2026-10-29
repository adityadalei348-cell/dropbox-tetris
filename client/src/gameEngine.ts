import { FormatType, MediaMetadata, LaneConfig } from '../../server/src/types';

export const LANES: LaneConfig[] = [
  { id: 'mp3', label: 'MP3 Audio', color: '#06b6d4', supportedSources: ['youtube', 'spotify'], supportsVideo: false },
  { id: 'mp4', label: 'MP4 Video', color: '#22c55e', supportedSources: ['youtube'], supportsVideo: true },
  { id: 'flac', label: 'FLAC Lossless', color: '#a855f7', supportedSources: ['youtube', 'spotify'], supportsVideo: false },
  { id: 'opus', label: 'OPUS Audio', color: '#eab308', supportedSources: ['youtube', 'spotify'], supportsVideo: false },
];

export interface FallingBlock {
  id: string;
  metadata: MediaMetadata;
  col: number; // Lane index (0 to LANES.length - 1)
  row: number; // Current row from top
  shape: number[][]; // e.g. [[1]] or [[1, 1], [1, 1]]
  rotation: number;
}

export interface LockedBlock {
  id: string;
  metadata: MediaMetadata;
  col: number;
  row: number;
  format: FormatType;
  status: 'downloading' | 'completed' | 'failed';
  progress: number;
  speed?: string;
  eta?: string;
  downloadId?: string;
  filename?: string;
  error?: string;
}

export const SHAPES = [
  [[1]], // Single track
  [[1, 1]], // Small album/playlist
  [[1, 1], [1, 1]], // Medium playlist (square 2x2)
  [[1, 1, 1]], // Large playlist line
];

export function getShapeForMetadata(metadata: MediaMetadata): number[][] {
  if (metadata.type === 'video' || metadata.type === 'track') {
    return [[1]];
  } else if (metadata.type === 'album') {
    return [[1, 1]];
  } else {
    // playlist
    const count = metadata.trackCount || 5;
    if (count > 10) return [[1, 1], [1, 1]];
    return [[1, 1]];
  }
}
