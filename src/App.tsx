import { useState } from 'react';
import { ExtractionTool } from './components/ExtractionTool';

export default function App() {
  const [activeTab, setActiveTab] = useState<'extract' | 'info'>('extract');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <h1 className="text-2xl font-bold">AFCA Decisions Bulk Downloader</h1>
              <p className="text-blue-200 text-sm">Download ALL published decisions from 15 June 2024 to today</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-5 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">~13,000+</div>
              <div className="text-blue-200 text-sm">Total decisions (est.)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15 Jun 2024</div>
              <div className="text-blue-200 text-sm">Date from</div>
            </div>
            <div className="text-3xl font-bold">
              {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-blue-200 text-sm">Date to (today)</div>
            <div>
              <div className="text-3xl font-bold">CSV + JSON</div>
              <div className="text-blue-200 text-sm">Export formats</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('extract')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'extract'
                ? 'bg-[#003366] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🚀 Extraction Tool
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'info'
                ? 'bg-[#003366] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            ℹ️ How It Works
          </button>
        </div>

        {activeTab === 'extract' ? <ExtractionTool /> : <InfoPanel />}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>Data from <a href="https://my.afca.org.au/searchpublisheddecisions/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AFCA Customer Self-Service Portal</a></p>
          <p className="mt-1">For personal/research use. See AFCA's copyright notice for reproduction terms.</p>
        </div>
      </footer>
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">How to Download ALL AFCA Decisions</h2>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          <strong>Why can't this tool download directly?</strong> The AFCA portal requires browser authentication 
          (session cookies + anti-forgery tokens) that can only be obtained by visiting the site directly. 
          No external tool can bypass this. The extraction script below runs <em>inside</em> your browser 
          session on the AFCA portal, so it has full access.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">What you'll get:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
          <li><strong>CSV file</strong> — Open in Excel/Google Sheets with columns: Case Number, Financial Firm, Resolution Date, Decision URL</li>
          <li><strong>JSON file</strong> — Structured data for programmatic use</li>
          <li><strong>All decisions</strong> from 15 June 2024 to today (estimated 13,000+ records)</li>
          <li><strong>Direct PDF links</strong> to each decision document on the AFCA portal</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">AFCA Published Decision Volumes (from public reporting):</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Period</th>
                <th className="border border-gray-200 px-3 py-2 text-right">Decisions</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-2">Jan – Jun 2024 (partial, from 15 Jun)</td><td className="border border-gray-200 px-3 py-2 text-right">~1,100</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-2">Jul – Dec 2024</td><td className="border border-gray-200 px-3 py-2 text-right">2,087</td></tr>
              <tr><td className="border border-gray-200 px-3 py-2">Jan – Jun 2025</td><td className="border border-gray-200 px-3 py-2 text-right">2,690</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-2">Jul – Dec 2025</td><td className="border border-gray-200 px-3 py-2 text-right">3,015</td></tr>
              <tr><td className="border border-gray-200 px-3 py-2">Jan – Jun 2026</td><td className="border border-gray-200 px-3 py-2 text-right">3,737</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-2">Jul – Aug 2026 (est.)</td><td className="border border-gray-200 px-3 py-2 text-right">~1,200</td></tr>
              <tr className="font-bold bg-blue-50"><td className="border border-gray-200 px-3 py-2">TOTAL (estimated)</td><td className="border border-gray-200 px-3 py-2 text-right">~13,800</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
