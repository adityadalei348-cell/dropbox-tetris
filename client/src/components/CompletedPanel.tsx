import React from 'react';
import { LockedBlock } from '../gameEngine';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface CompletedPanelProps {
  completedBlocks: LockedBlock[];
}

export const CompletedPanel: React.FC<CompletedPanelProps> = ({ completedBlocks }) => {
  return (
    <div className="bg-[#e9b7c2] border-2 border-[#d099a5] rounded-2xl p-4 w-full md:w-80 flex flex-col gap-3 shadow-inner">
      <div className="flex items-center justify-between border-b-2 border-[#d099a5]/60 pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-700" />
          <h2 className="font-mono text-xs font-bold text-zinc-800 tracking-wider">DOWNLOADS_LOG</h2>
        </div>
        <span className="font-mono text-xs bg-[#faeaee] text-zinc-800 px-2 py-0.5 rounded border border-[#d099a5] font-bold">
          {completedBlocks.filter((b) => b.status === 'completed').length}
        </span>
      </div>

      <div className="retro-lcd rounded-xl p-3 flex flex-col gap-2.5 max-h-[350px] overflow-y-auto">
        {completedBlocks.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-[#3b5234]">
            [ NO DOWNLOADS YET ]
          </div>
        ) : (
          completedBlocks.map((block) => (
            <div
              key={block.id}
              className="bg-[#8faa7c] border border-[#4a5c43] rounded-lg p-3 flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#4a5c43] text-[#9bb88f] border border-[#243120]">
                    {block.format}
                  </span>
                  <h3 className="font-mono text-[11px] font-bold text-[#243120] truncate">{block.metadata.title}</h3>
                </div>
                {block.status === 'completed' ? (
                  <span className="font-mono text-[10px] text-[#243120] font-bold flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-[#243120]" /> READY
                  </span>
                ) : block.status === 'failed' ? (
                  <span className="font-mono text-[10px] text-rose-900 font-bold flex items-center gap-1 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" /> FAIL
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[#3b5234] font-bold flex-shrink-0">
                    {Math.round(block.progress)}%
                  </span>
                )}
              </div>

              {block.status === 'downloading' && (
                <div className="w-full bg-[#4a5c43] h-1.5 rounded-full overflow-hidden border border-[#243120]">
                  <div
                    className="bg-[#243120] h-full transition-all duration-300"
                    style={{ width: `${Math.max(5, block.progress)}%` }}
                  ></div>
                </div>
              )}

              {block.status === 'completed' && block.downloadId && (
                <div className="flex items-center justify-between pt-1 border-t border-[#6a8759]/50">
                  <span className="font-mono text-[9px] text-[#3b5234] truncate max-w-[140px]">
                    {block.filename || 'File ready'}
                  </span>
                  <a
                    href={`/api/files/${block.downloadId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-button-yellow font-mono text-[10px] font-bold px-3 py-1 rounded text-zinc-900 flex items-center gap-1 shadow"
                  >
                    <Download className="w-3 h-3" /> SAVE
                  </a>
                </div>
              )}

              {block.status === 'failed' && (
                <div className="font-mono text-[10px] text-rose-900 bg-[#7a6452] p-2 rounded border border-[#4a2e25]">
                  {block.error || 'Download failed'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
