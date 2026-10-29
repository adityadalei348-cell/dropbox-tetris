import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { QueuePreview } from './components/QueuePreview';
import { CompletedPanel } from './components/CompletedPanel';
import { GameCanvas } from './components/GameCanvas';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { MediaMetadata } from '../../server/src/types';
import { LockedBlock } from './gameEngine';
import { soundEngine } from './audio';
import { Volume2, VolumeX, Settings, HelpCircle, Disc, ArrowLeft, ArrowRight, X, Check } from 'lucide-react';

export default function App() {
  const [queue, setQueue] = useState<MediaMetadata[]>([]);
  const [lockedBlocks, setLockedBlocks] = useState<LockedBlock[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [bitrate, setBitrate] = useState('192k');

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEngine.enabled = next;
  };

  const handleAddUrl = async (url: string) => {
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (res.ok) {
        const metadata: MediaMetadata | MediaMetadata[] = await res.json();
        if (Array.isArray(metadata)) {
          setQueue((prev) => [...prev, ...metadata]);
        } else {
          setQueue((prev) => [...prev, metadata]);
        }
      } else {
        alert('Failed to resolve URL metadata');
      }
    } catch (e: any) {
      alert(`Error resolving URL: ${e.message}`);
    }
  };

  const handleDequeue = useCallback(() => {
    if (queue.length === 0) return undefined;
    const item = queue[0];
    setQueue((prev) => prev.slice(1));
    return item;
  }, [queue]);

  const handleJobStarted = (jobId: string, format: string, metadata: MediaMetadata, laneCol: number) => {
    setActiveCount((prev) => prev + 1);
  };

  const triggerKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  };

  const completedCount = lockedBlocks.filter((b) => b.status === 'completed').length;
  const score = completedCount * 100 + activeCount * 20;

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 md:p-8">
      {/* Handheld Console Casing */}
      <div className="retro-console w-full max-w-6xl rounded-3xl p-6 md:p-8 border-4 border-[#e0a8b2] flex flex-col gap-6 relative">

        {/* Console Top Bezel / Brand */}
        <div className="flex items-center justify-between px-4 border-b-2 border-[#e0a8b2]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-inner border border-red-600 animate-pulse"></div>
            <span className="font-mono text-xs tracking-widest text-zinc-700 font-bold uppercase">RETRO GAMES • TETRIS DOWNLOADER</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-700">
            <span>HI-SCORE: 3300</span>
            <span>SCORE: {score}</span>
          </div>
        </div>

        {/* Header URL Input Bar */}
        <Header
          onAddUrl={handleAddUrl}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Main Console Play Area */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full">
          {/* Left: Queue Preview & Touch Controls D-Pad */}
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <QueuePreview queue={queue} />

            {/* Retro Handheld D-Pad & Touch Buttons Pod */}
            <div className="bg-[#e2b0bc] p-4 rounded-2xl border-2 border-[#d099a5] flex flex-col items-center gap-3 shadow-inner">
              <span className="font-mono text-[10px] font-bold text-zinc-700 tracking-wider">TOUCH_CONTROLS</span>

              <div className="grid grid-cols-2 gap-2 w-36">
                <button
                  onClick={() => triggerKey('ArrowLeft')}
                  className="bg-[#dca4b2] hover:bg-[#cf95a3] active:scale-95 border border-[#c48d9a] rounded-xl py-2.5 flex items-center justify-center text-zinc-800 shadow"
                  title="Move Left"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => triggerKey('ArrowRight')}
                  className="bg-[#dca4b2] hover:bg-[#cf95a3] active:scale-95 border border-[#c48d9a] rounded-xl py-2.5 flex items-center justify-center text-zinc-800 shadow"
                  title="Move Right"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => triggerKey(' ')}
                  className="retro-button-yellow rounded-xl py-2 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-900 shadow"
                  title="Drop"
                >
                  DROP
                </button>
                <button
                  onClick={() => triggerKey('Escape')}
                  className="bg-rose-800 hover:bg-rose-900 active:scale-95 border border-rose-950 rounded-xl py-2 flex items-center justify-center text-[10px] font-mono font-bold text-white shadow"
                  title="Cancel Drop"
                >
                  ESC
                </button>
              </div>

              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  onClick={handleToggleAudio}
                  className="flex-1 retro-button-yellow px-2 py-1.5 rounded-lg text-[10px] font-mono text-zinc-900 font-bold uppercase shadow active:translate-y-0.5"
                >
                  {audioEnabled ? 'SOUND: ON' : 'SOUND: OFF'}
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex-1 retro-button-blue px-2 py-1.5 rounded-lg text-[10px] font-mono text-white font-bold uppercase shadow active:translate-y-0.5"
                >
                  SETTINGS
                </button>
              </div>
            </div>
          </div>

          {/* Center: Tetris Game LCD Canvas */}
          <div className="flex-1 flex justify-center w-full">
            <GameCanvas
              queue={queue}
              onDequeue={handleDequeue}
              onJobStarted={handleJobStarted}
              lockedBlocks={lockedBlocks}
              onUpdateLockedBlocks={setLockedBlocks}
              gameSpeed={gameSpeed}
              audioEnabled={audioEnabled}
              bitrate={bitrate}
            />
          </div>

          {/* Right: Completed Panel */}
          <div className="w-full lg:w-auto flex flex-col gap-6">
            <CompletedPanel completedBlocks={lockedBlocks} />
          </div>
        </div>

        {/* Console Bottom Bezel */}
        <div className="text-center font-mono text-[10px] text-zinc-600 tracking-widest pt-2">
          MODEL NO. PB-2026 • 2-BIT RETRO DOWNLOAD PROCESSOR
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        gameSpeed={gameSpeed}
        onChangeSpeed={setGameSpeed}
        bitrate={bitrate}
        onChangeBitrate={setBitrate}
      />

      <HowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
