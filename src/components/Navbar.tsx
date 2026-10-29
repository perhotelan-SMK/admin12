import React from 'react';
import { SCHOOL_INFO } from '../constants/defaults';
import { Sparkles, Layers, BookOpen, BarChart3, Database, FileCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  generatedCount: number;
  onGenerateAll: () => void;
  isGeneratingAll: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  generatedCount,
  onGenerateAll,
  isGeneratingAll,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-blue-900/40">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-4 py-2 text-xs border-b border-blue-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-blue-200">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">{SCHOOL_INFO.name}</span>
            <span className="text-blue-400/60 hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline text-blue-300">{SCHOOL_INFO.year}</span>
          </div>
          <div className="flex items-center space-x-3 text-blue-200 text-[11px]">
            <span className="bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700/50">
              Kurikulum Merdeka SMK
            </span>
            <span className="bg-amber-950/70 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50">
              Fase E & F (Deep Learning)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('form')}>
          <div className="relative">
            <img
              src={SCHOOL_INFO.logoUrl}
              alt="Logo SMK Negeri 1 Bebandem"
              className="w-11 h-11 object-contain drop-shadow bg-white rounded-lg p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                SI GURU <span className="text-amber-400 text-xs px-1.5 py-0.5 bg-amber-500/20 rounded font-semibold border border-amber-400/30">AI PRO</span>
              </span>
            </div>
            <p className="text-xs text-blue-200/90 font-medium tracking-wide">
              Smart Administration Generator &bull; SMKN 1 Bebandem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateAll}
            disabled={isGeneratingAll}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Generate seluruh 12 jenis administrasi pembelajaran secara otomatis"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAll ? 'Sedang Memproses 12 Dokumen...' : 'Generate Semua (12 Dokumen)'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/95 border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex overflow-x-auto space-x-1 py-1 no-scrollbar text-sm">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-300" />
            <span>1. Identitas & Kurikulum</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'menu'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>2. Dashboard 12 Administrasi</span>
            {generatedCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold text-xs px-1.5 py-0.2 rounded-full">
                {generatedCount}/12
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-300" />
            <span>3. Editor & Ekspor Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'assessment'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-orange-300" />
            <span>4. Analisis Penilaian & TP</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'database'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-300" />
            <span>5. Database & Google Sheets</span>
          </button>
        </div>
      </div>
    </header>
  );
};
