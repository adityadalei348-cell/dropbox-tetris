import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LANES, FallingBlock, LockedBlock, getShapeForMetadata } from '../gameEngine';
import { MediaMetadata } from '../../../server/src/types';
import { soundEngine } from '../audio';
import { AlertCircle } from 'lucide-react';

interface GameCanvasProps {
  queue: MediaMetadata[];
  onDequeue: () => MediaMetadata | undefined;
  onJobStarted: (jobId: string, format: string, metadata: MediaMetadata, laneCol: number) => void;
  lockedBlocks: LockedBlock[];
  onUpdateLockedBlocks: React.Dispatch<React.SetStateAction<LockedBlock[]>>;
  gameSpeed: number;
  audioEnabled: boolean;
  bitrate: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  queue,
  onDequeue,
  onJobStarted,
  lockedBlocks,
  onUpdateLockedBlocks,
  gameSpeed,
  audioEnabled,
  bitrate
}) => {
  const [currentBlock, setCurrentBlock] = useState<FallingBlock | null>(null);
  const [shakeLane, setShakeLane] = useState<number | null>(null);
  const [bounceMessage, setBounceMessage] = useState<string | null>(null);
  const isLockingRef = useRef(false);

  useEffect(() => {
    if (!currentBlock && queue.length > 0) {
      const nextMeta = onDequeue();
      if (nextMeta) {
        isLockingRef.current = false;
        const shape = getShapeForMetadata(nextMeta);
        setCurrentBlock({
          id: Math.random().toString(36).substring(2, 10),
          metadata: nextMeta,
          col: 1,
          row: 0,
          shape,
          rotation: 0
        });
      }
    }
  }, [queue, currentBlock, onDequeue]);

  const lockBlock = useCallback(async (block: FallingBlock) => {
    if (isLockingRef.current) return;
    isLockingRef.current = true;

    const lane = LANES[block.col];

    if (!lane.supportedSources.includes(block.metadata.source) || (block.metadata.source === 'spotify' && lane.id === 'mp4')) {
      soundEngine.playError();
      setShakeLane(block.col);
      setBounceMessage(`Incompatible: ${block.metadata.source} cannot use ${lane.label}`);
      setTimeout(() => {
        setShakeLane(null);
        setBounceMessage(null);
        isLockingRef.current = false;
      }, 1500);

      const validCol = lane.id === 'mp4' && block.metadata.source === 'spotify' ? 0 : block.col;
      setCurrentBlock({
        ...block,
        col: validCol,
        row: 0
      });
      return;
    }

    soundEngine.playLock();
    soundEngine.playClear();

    const lockedId = Math.random().toString(36).substring(2, 10);
    const newLocked: LockedBlock = {
      id: lockedId,
      metadata: block.metadata,
      col: block.col,
      row: 14,
      format: lane.id,
      status: 'downloading',
      progress: 0
    };

    onUpdateLockedBlocks((prev) => [...prev, newLocked]);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: block.metadata.url,
          format: lane.id,
          quality: bitrate,
          title: block.metadata.title,
          author: block.metadata.author,
          thumbnail: block.metadata.thumbnail,
          type: block.metadata.type
        })
      });

      if (res.ok) {
        const job = await res.json();
        onJobStarted(job.id, lane.id, block.metadata, block.col);

        const eventSource = new EventSource(`/api/jobs/${job.id}/events`);
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          onUpdateLockedBlocks((prev) =>
            prev.map((b) =>
              b.id === lockedId
                ? {
                    ...b,
                    progress: data.progress,
                    status: data.status,
                    downloadId: data.status === 'completed' ? job.id : undefined,
                    filename: data.filename,
                    error: data.error
                  }
                : b
            )
          );
          if (data.status === 'completed' || data.status === 'failed') {
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
        };
      } else {
        onUpdateLockedBlocks((prev) =>
          prev.map((b) => (b.id === lockedId ? { ...b, status: 'failed', error: 'API Error' } : b))
        );
      }
    } catch (e: any) {
      onUpdateLockedBlocks((prev) =>
        prev.map((b) => (b.id === lockedId ? { ...b, status: 'failed', error: e.message } : b))
      );
    }
  }, [bitrate, onJobStarted, onUpdateLockedBlocks]);

  useEffect(() => {
    if (!currentBlock) return;

    const intervalTime = Math.max(200, 1000 / gameSpeed);
    const timer = setInterval(() => {
      setCurrentBlock((prev) => {
        if (!prev) return null;
        if (prev.row >= 14) {
          if (!isLockingRef.current) {
            lockBlock(prev);
          }
          return null;
        }
        return { ...prev, row: prev.row + 1 };
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentBlock, gameSpeed, lockBlock]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentBlock || isLockingRef.current) return;

      if (e.key === 'ArrowLeft') {
        soundEngine.playMove();
        setCurrentBlock((prev) => (prev ? { ...prev, col: Math.max(0, prev.col - 1) } : null));
      } else if (e.key === 'ArrowRight') {
        soundEngine.playMove();
        setCurrentBlock((prev) => (prev ? { ...prev, col: Math.min(LANES.length - 1, prev.col + 1) } : null));
      } else if (e.key === 'ArrowDown') {
        soundEngine.playDrop();
        setCurrentBlock((prev) => (prev ? { ...prev, row: Math.min(14, prev.row + 2) } : null));
      } else if (e.key === ' ') {
        e.preventDefault();
        soundEngine.playDrop();
        if (currentBlock && !isLockingRef.current) {
          lockBlock({ ...currentBlock, row: 14 });
          setCurrentBlock(null);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        soundEngine.playError();
        setCurrentBlock(null);
        isLockingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBlock, lockBlock]);

  const laneConfigs = [
    { id: 'mp3', border: 'border-[#3b5234]', bgGlass: 'bg-[#6a8759]/20', text: 'text-[#243120]', bar: 'bg-[#3b5234]' },
    { id: 'mp4', border: 'border-[#3b5234]', bgGlass: 'bg-[#6a8759]/20', text: 'text-[#243120]', bar: 'bg-[#3b5234]' },
    { id: 'flac', border: 'border-[#3b5234]', bgGlass: 'bg-[#6a8759]/20', text: 'text-[#243120]', bar: 'bg-[#3b5234]' },
    { id: 'opus', border: 'border-[#3b5234]', bgGlass: 'bg-[#6a8759]/20', text: 'text-[#243120]', bar: 'bg-[#3b5234]' }
  ];

  return (
    <div className="relative bg-[#dca4b2] border-2 border-[#c48d9a] rounded-3xl p-5 shadow-inner flex flex-col items-center select-none overflow-hidden w-full max-w-lg">
      {bounceMessage && (
        <div className="absolute top-4 z-20 bg-[#3b5234] text-[#9bb88f] font-mono text-xs px-3 py-1.5 rounded-lg border border-[#243120] flex items-center gap-2 shadow">
          <AlertCircle className="w-3.5 h-3.5" /> {bounceMessage}
        </div>
      )}

      {/* Retro LCD Screen Board */}
      <div className="retro-lcd relative w-full h-[480px] rounded-2xl grid grid-cols-4 overflow-hidden">
        {laneConfigs.map((lane, index) => {
          const isActiveCol = currentBlock && currentBlock.col === index;
          return (
            <div
              key={lane.id}
              className={`relative border-r border-[#6a8759]/50 flex flex-col items-center justify-end pb-4 transition-all ${
                isActiveCol ? lane.bgGlass : ''
              } ${shakeLane === index ? 'animate-subtle-shake bg-red-950/20' : ''}`}
            >
              <div className={`absolute top-0 inset-x-0 py-2 text-center border-b border-[#6a8759]/50 font-mono text-xs font-bold uppercase tracking-wider bg-[#8faa7c]/40 ${lane.text}`}>
                {lane.id}
              </div>

              {currentBlock && currentBlock.col === index && (
                <div
                  className={`absolute w-[85%] bg-[#8faa7c] rounded-lg border-2 ${lane.border} p-2 flex flex-col items-center gap-1.5 shadow-md`}
                  style={{ top: `${(currentBlock.row / 15) * 80}%` }}
                >
                  <div className="relative w-10 h-10 rounded bg-[#4a5c43] overflow-hidden border border-[#243120]">
                    <img
                      src={currentBlock.metadata.thumbnail}
                      alt={currentBlock.metadata.title}
                      className="w-full h-full object-cover grayscale contrast-150"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://i.imgur.com/3ZQ3ZQ3.png';
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold truncate w-full text-center text-[#243120]">
                    {currentBlock.metadata.title}
                  </span>
                </div>
              )}

              {lockedBlocks
                .filter((b) => b.col === index)
                .map((block) => (
                  <div
                    key={block.id}
                    className={`w-[90%] bg-[#8faa7c] border ${lane.border} rounded-lg p-2 flex flex-col gap-1.5 my-1 shadow-sm`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold text-[#243120] truncate max-w-[80px]">
                        {block.metadata.title}
                      </span>
                      <span className="text-[#3b5234] font-bold">
                        {block.status === 'completed' ? 'DONE' : `${Math.round(block.progress)}%`}
                      </span>
                    </div>
                    {block.status === 'downloading' && (
                      <div className="w-full bg-[#4a5c43] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#243120] h-full transition-all duration-300"
                          style={{ width: `${Math.max(5, block.progress)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-3 font-mono text-[11px] text-zinc-700 font-bold flex-wrap justify-center">
        <span>← → MOVE</span>
        <span>↓ SOFT</span>
        <span>SPACE: DROP</span>
        <span>ESC: CANCEL DROP</span>
      </div>
    </div>
  );
};
