import React from 'react';
import { MediaMetadata } from '../../../server/src/types';
import { Layers, Youtube, Music } from 'lucide-react';

interface QueuePreviewProps {
  queue: MediaMetadata[];
}

export const QueuePreview: React.FC<QueuePreviewProps> = ({ queue }) => {
  return (
    <div className="bg-[#e9b7c2] border-2 border-[#d099a5] rounded-2xl p-4 w-full md:w-64 flex flex-col gap-3 shadow-inner">
      <div className="flex items-center justify-between border-b-2 border-[#d099a5]/60 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-700" />
          <h2 className="font-mono text-xs font-bold text-zinc-800 tracking-wider">QUEUE_LIST</h2>
        </div>
        <span className="font-mono text-xs bg-[#faeaee] text-zinc-800 px-2 py-0.5 rounded border border-[#d099a5] font-bold">
          {queue.length}
        </span>
      </div>

      <div className="retro-lcd rounded-xl p-3 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
        {queue.length === 0 ? (
          <div className="text-center py-6 font-mono text-xs text-[#3b5234]">
            [ QUEUE EMPTY ]
          </div>
        ) : (
          queue.map((item, index) => (
            <div
              key={index}
              className="bg-[#8faa7c] border border-[#4a5c43] rounded-lg p-2.5 flex items-center gap-2.5 shadow-sm"
            >
              <div className="relative w-9 h-9 rounded bg-[#4a5c43] flex-shrink-0 overflow-hidden border border-[#243120]">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale contrast-150"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.imgur.com/3ZQ3ZQ3.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-mono text-[11px] font-bold text-[#243120] truncate">{item.title}</h3>
                <p className="font-mono text-[9px] text-[#3b5234] uppercase">{item.source} • {item.type}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
