import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retro-console border-4 border-[#e0a8b2] rounded-3xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl relative text-zinc-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-900 transition font-mono font-bold text-sm"
        >
          [X]
        </button>

        <div className="flex items-center gap-3 border-b-2 border-[#e0a8b2] pb-3">
          <HelpCircle className="w-5 h-5 text-zinc-700" />
          <h2 className="font-mono text-sm font-bold tracking-wider">GAME_MANUAL.TXT</h2>
        </div>

        <div className="flex flex-col gap-4 font-mono text-xs text-zinc-700 leading-relaxed">
          <p>
            Welcome to <strong className="text-zinc-900">DropBox Tetris</strong>! Paste YouTube or Spotify links into the top port. Steer falling media blocks into format lanes to trigger high-speed downloads with embedded album art.
          </p>

          <div className="retro-lcd p-4 rounded-xl flex flex-col gap-2">
            <h3 className="font-bold text-[#243120]">CONTROLS_MAP</h3>
            <div className="grid grid-cols-2 gap-2 text-[#3b5234] text-[11px]">
              <div>← / → : MOVE LANE</div>
              <div>↓ : SOFT DROP</div>
              <div>SPACE : DROP</div>
              <div>ESC : CANCEL</div>
            </div>
          </div>

          <div className="retro-lcd p-4 rounded-xl flex flex-col gap-2">
            <h3 className="font-bold text-[#243120]">FORMAT_LANES</h3>
            <ul className="list-disc pl-4 flex flex-col gap-1 text-[#3b5234] text-[11px]">
              <li><strong>MP3 / FLAC / OPUS:</strong> Audio formats (YouTube & Spotify).</li>
              <li><strong>MP4:</strong> Video format (YouTube videos only).</li>
              <li><strong>Album Art:</strong> Automatically embedded into audio files!</li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-[#e0a8b2] flex justify-end">
          <button
            onClick={onClose}
            className="retro-button-yellow font-mono text-xs font-bold px-5 py-2.5 rounded-xl text-zinc-900 shadow"
          >
            LET'S PLAY
          </button>
        </div>
      </div>
    </div>
  );
};
