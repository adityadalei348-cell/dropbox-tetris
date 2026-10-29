import React, { useState } from 'react';
import { Plus, Settings, HelpCircle, Download, Disc } from 'lucide-react';

interface HeaderProps {
  onAddUrl: (url: string) => Promise<void>;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddUrl,
  onOpenSettings,
  onOpenHelp
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isResolving) return;
    const urlToSpawn = inputUrl.trim();
    setInputUrl('');
    setIsResolving(true);
    try {
      await onAddUrl(urlToSpawn);
    } finally {
      setIsResolving(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
      }
    } catch (e) {
      console.error('Failed to read clipboard', e);
    }
  };

  return (
    <header className="bg-[#e9b7c2] border-2 border-[#d099a5] rounded-2xl px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="bg-[#dca4b2] border border-[#c48d9a] p-2 rounded-xl flex items-center justify-center text-zinc-800">
          <Disc className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-xs text-zinc-800 tracking-wider">
            LINK_INPUT_PORT
          </h1>
          <p className="text-[10px] font-mono text-zinc-600">PASTE YOUTUBE / SPOTIFY URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full md:w-auto max-w-xl flex-1 px-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            disabled={isResolving}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-[#faeaee] border-2 border-[#d099a5] rounded-xl px-3.5 py-2 font-mono text-xs text-zinc-800 placeholder-zinc-500 focus:outline-none focus:border-[#4f86f7] transition shadow-inner disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handlePasteClipboard}
          disabled={isResolving}
          className="bg-[#dca4b2] hover:bg-[#cf95a3] text-zinc-800 px-3.5 py-2 rounded-xl font-mono text-xs font-bold border border-[#c48d9a] transition shadow disabled:opacity-50"
        >
          PASTE
        </button>
        <button
          type="submit"
          disabled={isResolving}
          className="retro-button-yellow px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-900 transition shadow disabled:opacity-50"
        >
          {isResolving ? 'RESOLVING...' : 'SPAWN'}
        </button>
      </form>
    </header>
  );
};
