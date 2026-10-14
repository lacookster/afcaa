import { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'requests' | 'playwright'>('playwright');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              🐍
            </div>
            <div>
              <h1 className="text-2xl font-bold">AFCA Decisions Scraper — Python</h1>
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
              <div className="text-blue-200 text-xs">Output formats</div>
            </div>
          </div>
        </div>

        {/* Method selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Choose your method:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('playwright')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeTab === 'playwright'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌐</span>
                <h3 className="font-bold text-gray-800">Playwright (Recommended)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Uses a real browser. Most reliable — handles JavaScript, cookies, and anti-bot measures automatically.
              </p>
              {activeTab === 'playwright' && (
                <div className="mt-2 text-xs text-green-700 font-semibold">✓ SELECTED</div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeTab === 'requests'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-gray-800">Requests (Faster)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Direct HTTP requests. Faster but may not work if the portal requires JavaScript rendering.
              </p>
              {activeTab === 'requests' && (
                <div className="mt-2 text-xs text-blue-700 font-semibold">✓ SELECTED</div>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        {activeTab === 'playwright' ? <PlaywrightInstructions /> : <RequestsInstructions />}

        {/* Download section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📥 Download the script</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/afca_scraper_playwright.py"
              download
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Playwright Script
            </a>
            <a
              href="/afca_scraper.py"
              download
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Requests Script
            </a>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔧 Troubleshooting</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-800">"Module not found: playwright"</p>
              <p className="text-red-700 mt-1 font-mono text-xs">
                pip install playwright<br />
                playwright install chromium
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-800">"No results found"</p>
              <p className="text-red-700 mt-1">
                The portal may be down or blocking requests. Try again later, or check if you can access the portal manually in your browser.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-800">"Timeout error"</p>
              <p className="text-red-700 mt-1">
                Increase the timeout in the script: change <code className="bg-red-100 px-1 rounded">SEARCH_TIMEOUT = 60_000</code> to a higher value.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-semibold text-blue-800">💡 Tip: Run headless</p>
              <p className="text-blue-700 mt-1">
                To run without opening a browser window, change <code className="bg-blue-100 px-1 rounded">headless=False</code> to <code className="bg-blue-100 px-1 rounded">headless=True</code> in the Playwright script.
              </p>
            </div>
          </div>
        </div>
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

function PlaywrightInstructions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Setup Instructions (Playwright)</h2>
      <div className="space-y-4">
        <Step number={1} title="Install Python 3.8 or higher">
          <p>Download from <a href="https://python.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">python.org</a> if you don't have it.</p>
        </Step>

        <Step number={2} title="Install dependencies">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <code>pip install playwright</code>
          </div>
        </Step>

        <Step number={3} title="Install Chromium browser">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <code>playwright install chromium</code>
          </div>
          <p className="text-xs text-gray-500 mt-2">This downloads a Chromium browser (~150MB) that the script will control.</p>
        </Step>

        <Step number={4} title="Download and run the script">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <code>python afca_scraper_playwright.py</code>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The script will open a browser window, navigate to the AFCA portal, search for all decisions from 15 June 2024 to today, and download them as CSV and JSON files.
          </p>
        </Step>

        <Step number={5} title="Check the output files">
          <p>After the script finishes, you'll have:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">afca_decisions.csv</code> — Open in Excel or Google Sheets</li>
            <li><code className="bg-gray-100 px-1 rounded">afca_decisions.json</code> — Structured data for programming</li>
          </ul>
        </Step>
      </div>
    </div>
  );
}

function RequestsInstructions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Setup Instructions (Requests)</h2>
      <div className="space-y-4">
        <Step number={1} title="Install Python 3.8 or higher">
          <p>Download from <a href="https://python.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">python.org</a> if you don't have it.</p>
        </Step>

        <Step number={2} title="Install dependencies">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <code>pip install requests beautifulsoup4</code>
          </div>
        </Step>

        <Step number={3} title="Download and run the script">
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
            <code>python afca_scraper.py</code>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The script will try multiple API endpoints to find one that works, then paginate through all results.
          </p>
        </Step>

        <Step number={4} title="Check the output files">
          <p>After the script finishes, you'll have:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">afca_decisions.csv</code> — Open in Excel or Google Sheets</li>
            <li><code className="bg-gray-100 px-1 rounded">afca_decisions.json</code> — Structured data for programming</li>
          </ul>
        </Step>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Note:</strong> The Requests version may not work if the AFCA portal requires JavaScript rendering. 
            If you get "Could not find a working API endpoint", use the Playwright version instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}
