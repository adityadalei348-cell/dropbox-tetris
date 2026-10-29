import React from 'react';
import { X, Volume2, VolumeX, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  gameSpeed: number;
  onChangeSpeed: (speed: number) => void;
  bitrate: string;
  onChangeBitrate: (bitrate: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioEnabled,
  onToggleAudio,
  gameSpeed,
  onChangeSpeed,
  bitrate,
  onChangeBitrate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="retro-console border-4 border-[#e0a8b2] rounded-3xl w-full max-w-md p-6 flex flex-col gap-6 shadow-2xl relative text-zinc-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-900 transition font-mono font-bold text-sm"
        >
          [X]
        </button>

        <div className="flex items-center gap-3 border-b-2 border-[#e0a8b2] pb-3">
          <Sliders className="w-5 h-5 text-zinc-700" />
          <h2 className="font-mono text-sm font-bold tracking-wider">HARDWARE_SETTINGS</h2>
        </div>

        <div className="flex flex-col gap-5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-zinc-800">Sound Effects</h3>
              <p className="text-[10px] text-zinc-600">Chiptune arcade audio</p>
            </div>
            <button
              onClick={onToggleAudio}
              className={`px-4 py-2 rounded-xl font-bold transition shadow ${
                audioEnabled
                  ? 'retro-button-yellow text-zinc-900'
                  : 'bg-zinc-700 text-zinc-200'
              }`}
            >
              {audioEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-800">Gravity Speed</h3>
                <p className="text-[10px] text-zinc-600">Falling block speed multiplier</p>
              </div>
              <span className="font-bold text-blue-800 bg-[#faeaee] px-2.5 py-1 rounded-lg border border-[#d099a5]">
                {gameSpeed}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={gameSpeed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <h3 className="font-bold text-zinc-800">MP3 Audio Quality</h3>
              <p className="text-[10px] text-zinc-600">Default export bitrate</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['128k', '192k', '320k'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onChangeBitrate(rate)}
                  className={`py-2 rounded-xl font-bold border transition ${
                    bitrate === rate
                      ? 'retro-button-blue text-white shadow'
                      : 'bg-[#faeaee] border-[#d099a5] text-zinc-700 hover:bg-[#f2c4ce]'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-[#e0a8b2] flex justify-end">
          <button
            onClick={onClose}
            className="retro-button-yellow font-mono text-xs font-bold px-5 py-2.5 rounded-xl text-zinc-900 shadow"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
