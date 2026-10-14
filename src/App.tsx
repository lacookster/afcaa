import { ExtractionTool } from './components/ExtractionTool';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <h1 className="text-2xl font-bold">AFCA Decisions — Bulk Downloader</h1>
              <p className="text-blue-200 text-sm">Download ALL published decisions (15 June 2024 → today)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-5 shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">~13,000+</div>
              <div className="text-blue-200 text-xs">Total decisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15 Jun 2024 → Today</div>
              <div className="text-blue-200 text-xs">Date range</div>
            </div>
            <div>
              <div className="text-2xl font-bold">CSV + JSON</div>
              <div className="text-blue-200 text-xs">Export formats</div>
            </div>
          </div>
        </div>

        {/* Extraction Tool */}
        <ExtractionTool />
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>Data from <a href="https://my.afca.org.au/searchpublisheddecisions/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AFCA Customer Self-Service Portal</a></p>
          <p className="mt-1">For personal/research use per AFCA's copyright terms.</p>
        </div>
      </footer>
    </div>
  );
}
