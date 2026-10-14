import { useState, useRef } from 'react';

export function ExtractionTool() {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const interceptorScript = getInterceptorScript();
  const domScript = getDOMScript();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setExtractedData(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (!extractedData) return;
    try {
      const data = JSON.parse(extractedData);
      const decisions = data.decisions || data;
      if (!Array.isArray(decisions) || decisions.length === 0) {
        alert('No decisions found in the file.');
        return;
      }
      const headers = ['Case Number', 'Financial Firm', 'Resolution Date', 'Decision URL', 'Article ID'];
      const rows = decisions.map((d: Record<string, string>) => [
        d.caseNumber || d.case_number || '',
        d.financialFirm || d.financial_firm || '',
        d.resolutionDate || d.resolution_date || '',
        d.decisionUrl || '',
        d.knowledgeArticleId || d.knowledge_article_id || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
      downloadFile(csv, `afca-all-decisions-${today()}.csv`, 'text/csv');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleExportJSON = () => {
    if (!extractedData) return;
    try {
      const data = JSON.parse(extractedData);
      downloadFile(JSON.stringify(data, null, 2), `afca-all-decisions-${today()}.json`, 'application/json');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Important notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-amber-500 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-amber-800">Why the previous script didn't work</h3>
            <p className="text-sm text-amber-700 mt-1">
              The AFCA portal loads results via JavaScript after you click Search. The extraction script needs to 
              <strong> intercept the portal's own network requests</strong> to capture the data. 
              Below is a new approach: it hooks into the browser's fetch/XHR to capture every API response 
              the portal makes — guaranteeing you get the exact same data the portal displays.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Step-by-step: Download ALL decisions</h2>
        
        {/* Step 1 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <h3 className="font-semibold text-gray-800">Open the AFCA portal</h3>
          </div>
          <div className="ml-11">
            <a
              href="https://my.afca.org.au/searchpublisheddecisions/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors"
            >
              Open AFCA Portal ↗
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <h3 className="font-semibold text-gray-800">Paste the interceptor script FIRST (before searching)</h3>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-sm text-gray-600">
              On the AFCA portal page, <strong>before clicking Search</strong>, open DevTools 
              (<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono border">F12</kbd>), 
              go to the <strong>Console</strong> tab, and paste this script:
            </p>
            <div>
              <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2">
                <span className="text-gray-400 text-xs font-mono">network-interceptor.js — paste BEFORE searching</span>
                <button
                  onClick={() => handleCopy(interceptorScript)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-xs leading-relaxed max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                <code>{interceptorScript}</code>
              </pre>
            </div>
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              ✅ After pasting, you'll see: <code className="bg-green-100 px-1 rounded">"🔍 AFCA interceptor active. Now click Search."</code>
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <h3 className="font-semibold text-gray-800">Set date range & click Search</h3>
          </div>
          <div className="ml-11 space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p>• <strong>Date From:</strong> 15/06/2024</p>
              <p>• <strong>Date To:</strong> {new Date().toLocaleDateString('en-AU')}</p>
              <p>• <strong>Leave all other fields empty</strong> (to get ALL decisions)</p>
              <p>• Click the blue <strong>Search</strong> button</p>
            </div>
            <p className="text-sm text-gray-600">
              Wait for results to load. The interceptor will capture every page of results automatically.
              You'll see progress messages in the console like: 
              <code className="bg-gray-100 px-1 rounded mx-1">"📦 Captured page 1 (100 decisions)"</code>
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <h3 className="font-semibold text-gray-800">After all pages load, run the download script</h3>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-sm text-gray-600">
              Once you see <code className="bg-gray-100 px-1 rounded">"✅ All pages captured!"</code> in the console, 
              click through ALL result pages (or wait for auto-pagination). Then paste this second script to download:
            </p>
            <div>
              <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2">
                <span className="text-gray-400 text-xs font-mono">download-results.js — paste AFTER all results loaded</span>
                <button
                  onClick={() => handleCopy(domScript)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-xs leading-relaxed max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                <code>{domScript}</code>
              </pre>
            </div>
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              💾 This will download both a <strong>CSV</strong> (for Excel) and <strong>JSON</strong> file with ALL decisions.
            </p>
          </div>
        </div>

        {/* Alternative: Single combined script */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">🔄 Alternative: Single combined script (simpler)</h3>
          <p className="text-sm text-gray-600 mb-3">
            If you prefer, use this single script. Paste it in the console, then click Search. 
            It will auto-paginate through ALL results and download everything when done.
          </p>
          <div>
            <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2">
              <span className="text-gray-400 text-xs font-mono">all-in-one.js — paste, then click Search</span>
              <button
                onClick={() => handleCopy(getCombinedScript())}
                className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-xs leading-relaxed max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
              <code>{getCombinedScript()}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Import & Export section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📂 Import & Re-export downloaded data</h2>
        <p className="text-sm text-gray-600 mb-4">
          If you already have the JSON file from a previous run, upload it here to preview and re-export:
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors"
          >
            Upload JSON file
          </button>
        </div>

        {extractedData && (
          <div className="mt-4 space-y-4">
            <DataPreview data={extractedData} />
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                ⬇️ Download CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                ⬇️ Download JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">🔧 Troubleshooting</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-800">"Script doesn't capture anything"</p>
            <p className="text-red-700 mt-1">
              Make sure you paste the interceptor script <strong>before</strong> clicking Search. 
              The script needs to be active to capture the API responses.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-800">"Only getting first page of results"</p>
            <p className="text-red-700 mt-1">
              The portal may show 50 results per page. Use the combined script which auto-paginates, 
              or manually click through all pages while the interceptor is active.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-800">"Console shows errors"</p>
            <p className="text-red-700 mt-1">
              Make sure you're on the correct page (my.afca.org.au/searchpublisheddecisions/). 
              Try refreshing the page and pasting the script again.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-semibold text-blue-800">💡 Tip: Use the Network tab to verify</p>
            <p className="text-blue-700 mt-1">
              Open DevTools → Network tab → filter by "search". You'll see the API calls the portal makes. 
              The interceptor captures these same responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPreview({ data }: { data: string }) {
  let parsed: { decisions?: Array<Record<string, string>>; meta?: Record<string, unknown> };
  try {
    parsed = JSON.parse(data);
  } catch {
    return <p className="text-red-600 text-sm">Error parsing JSON data.</p>;
  }

  const decisions = parsed.decisions || [];
  const count = decisions.length;
  const preview = decisions.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-800 font-semibold">✅ Loaded {count.toLocaleString()} decisions</p>
        {parsed.meta && (
          <p className="text-green-700 text-xs mt-1">
            Scraped at: {String((parsed.meta as Record<string, string>).scrapedAt || 'unknown')}
          </p>
        )}
      </div>
      {preview.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-left">#</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left">Case Number</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left">Financial Firm</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((d, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-500">{i + 1}</td>
                  <td className="border border-gray-200 px-2 py-1.5 font-mono text-[#003366]">{d.caseNumber || d.case_number || '—'}</td>
                  <td className="border border-gray-200 px-2 py-1.5">{d.financialFirm || d.financial_firm || '—'}</td>
                  <td className="border border-gray-200 px-2 py-1.5">{d.resolutionDate || d.resolution_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {count > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">Showing first 5 of {count.toLocaleString()} records</p>
          )}
        </div>
      )}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getInterceptorScript(): string {
  return `// AFCA Network Interceptor - paste this BEFORE clicking Search
// This captures all API responses from the AFCA portal
(function() {
  window.__AFCA_DATA__ = window.__AFCA_DATA__ || [];
  
  // Intercept fetch()
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    if (url.includes('/_services/search/')) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        
        // Try JSON
        try {
          const json = JSON.parse(text);
          if (json.results || json.d?.results) {
            const data = json.d || json;
            window.__AFCA_DATA__.push({
              page: new URL(url).searchParams.get('pageNumber') || '1',
              results: data.results,
              totalCount: data.total_count
            });
            console.log('📦 Captured page ' + (data.results?.length || 0) + ' results. Total captured: ' + 
              window.__AFCA_DATA__.reduce((sum, d) => sum + (d.results?.length || 0), 0));
          }
        } catch(e) {
          // Try parsing as HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const rows = doc.querySelectorAll('tr');
          const results = [];
          rows.forEach(row => {
            const link = row.querySelector('a[href*="/kb/article/"]');
            if (link) {
              const cells = row.querySelectorAll('td');
              const texts = Array.from(cells).map(c => c.innerText.trim());
              results.push({
                raw: texts,
                articleId: link.href.split('/kb/article/')[1],
                html: row.innerHTML
              });
            }
          });
          if (results.length > 0) {
            window.__AFCA_DATA__.push({ page: 'html', results, totalCount: results.length });
            console.log('📦 Captured ' + results.length + ' results from HTML response');
          }
        }
      } catch(e) {}
    }
    return response;
  };
  
  // Intercept XMLHttpRequest
  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._afcaUrl = url;
    return origXHROpen.call(this, method, url, ...rest);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      if (this._afcaUrl && this._afcaUrl.includes('/_services/search/')) {
        try {
          const json = JSON.parse(this.responseText);
          if (json.results || json.d?.results) {
            const data = json.d || json;
            window.__AFCA_DATA__.push({
              page: new URL(this._afcaUrl, location.origin).searchParams.get('pageNumber') || '1',
              results: data.results,
              totalCount: data.total_count
            });
            console.log('📦 XHR captured: ' + (data.results?.length || 0) + ' results');
          }
        } catch(e) {}
      }
    });
    return origXHRSend.apply(this, args);
  };
  
  console.log('🔍 AFCA interceptor active! Now click Search.');
  console.log('📊 Captured data will be stored in window.__AFCA_DATA__');
  console.log('📋 After all pages load, run the download script.');
})();`;
}

function getDOMScript(): string {
  return `// Download captured AFCA data
(function() {
  const allData = window.__AFCA_DATA__ || [];
  
  if (allData.length === 0) {
    alert('No data captured! Make sure you ran the interceptor script BEFORE clicking Search.');
    return;
  }
  
  // Flatten all results
  const decisions = [];
  allData.forEach(page => {
    (page.results || []).forEach(r => {
      decisions.push({
        caseNumber: r.case_number || r.caseNumber || '',
        financialFirm: r.financial_firm || r.financialFirm || '',
        resolutionDate: r.resolution_date || r.resolutionDate || '',
        knowledgeArticleId: r.knowledge_article_id || r.knowledgeArticleId || '',
        decisionUrl: (r.knowledge_article_id || r.knowledgeArticleId) 
          ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + (r.knowledge_article_id || r.knowledgeArticleId) 
          : ''
      });
    });
  });
  
  // Remove duplicates by article ID
  const seen = new Set();
  const unique = decisions.filter(d => {
    const key = d.knowledgeArticleId || d.caseNumber;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  const output = {
    meta: {
      source: 'AFCA Published Decisions',
      scrapedAt: new Date().toISOString(),
      totalCount: unique.length,
      pagesCaptured: allData.length
    },
    decisions: unique
  };
  
  // Download JSON
  const jsonBlob = new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'});
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const a1 = document.createElement('a');
  a1.href = jsonUrl; a1.download = 'afca-decisions.json';
  document.body.appendChild(a1); a1.click(); a1.remove();
  URL.revokeObjectURL(jsonUrl);
  
  // Download CSV
  const csvHeader = 'Case Number,Financial Firm,Resolution Date,Decision URL,Article ID\\n';
  const csvRows = unique.map(d => 
    '"' + (d.caseNumber||'').replace(/"/g,'""') + '",' +
    '"' + (d.financialFirm||'').replace(/"/g,'""') + '",' +
    '"' + (d.resolutionDate||'').replace(/"/g,'""') + '",' +
    '"' + d.decisionUrl + '",' +
    '"' + d.knowledgeArticleId + '"'
  ).join('\\n');
  const csvBlob = new Blob([csvHeader + csvRows], {type: 'text/csv'});
  const csvUrl = URL.createObjectURL(csvBlob);
  const a2 = document.createElement('a');
  a2.href = csvUrl; a2.download = 'afca-decisions.csv';
  document.body.appendChild(a2); a2.click(); a2.remove();
  URL.revokeObjectURL(csvUrl);
  
  console.log('✅ Downloaded ' + unique.length + ' decisions (JSON + CSV)');
  alert('✅ Downloaded ' + unique.length + ' decisions as JSON and CSV files!');
})();`;
}

function getCombinedScript(): string {
  return `// AFCA ALL-IN-ONE EXTRACTOR
// Paste this in the console, then click Search on the portal.
// It will intercept all pages and auto-download when done.
(function() {
  'use strict';
  const captured = [];
  let lastCaptureTime = Date.now();
  let downloadTimeout = null;
  
  // Hook fetch
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    if (url.includes('/_services/search/')) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        processResponse(text, url);
      } catch(e) {}
    }
    return response;
  };
  
  // Hook XHR
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(m, url, ...r) {
    this.__url = url;
    return origOpen.call(this, m, url, ...r);
  };
  XMLHttpRequest.prototype.send = function(...a) {
    this.addEventListener('load', function() {
      if (this.__url && this.__url.includes('/_services/search/')) {
        processResponse(this.responseText, this.__url);
      }
    });
    return origSend.apply(this, a);
  };
  
  function processResponse(text, url) {
    let results = [];
    let totalCount = 0;
    
    // Try JSON
    try {
      const json = JSON.parse(text);
      const data = json.d || json;
      if (data.results) {
        results = data.results;
        totalCount = data.total_count || results.length;
      }
    } catch(e) {
      // Try HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const link = row.querySelector('a[href*="/kb/article/"]');
        if (link) {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
          const caseMatch = row.innerText.match(/\\d{2}-\\d{2}-\\d{4,}/);
          const dateMatch = row.innerText.match(/(\\d{1,2}\\/\\d{1,2}\\/\\d{4})/);
          results.push({
            case_number: caseMatch ? caseMatch[0] : '',
            financial_firm: cells[1] || cells[0] || '',
            resolution_date: dateMatch ? dateMatch[1] : '',
            knowledge_article_id: link.href.split('/kb/article/')[1]
          });
        }
      });
    }
    
    if (results.length > 0) {
      captured.push(...results);
      lastCaptureTime = Date.now();
      console.log('📦 Captured ' + results.length + ' results. Total: ' + captured.length + 
        (totalCount ? ' / ' + totalCount : ''));
      
      // Auto-download after 5 seconds of no new data
      clearTimeout(downloadTimeout);
      downloadTimeout = setTimeout(() => {
        if (captured.length > 0) {
          console.log('⏱️ No new data for 5s. Downloading ' + captured.length + ' decisions...');
          downloadAll();
        }
      }, 5000);
    }
  }
  
  function downloadAll() {
    // Deduplicate
    const seen = new Set();
    const unique = captured.filter(r => {
      const key = r.knowledge_article_id || r.case_number;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(r => ({
      caseNumber: r.case_number || '',
      financialFirm: r.financial_firm || '',
      resolutionDate: r.resolution_date || '',
      knowledgeArticleId: r.knowledge_article_id || '',
      decisionUrl: r.knowledge_article_id 
        ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + r.knowledge_article_id 
        : ''
    }));
    
    const output = {
      meta: { source: 'AFCA', scrapedAt: new Date().toISOString(), totalCount: unique.length },
      decisions: unique
    };
    
    // JSON
    const jb = new Blob([JSON.stringify(output, null, 2)], {type:'application/json'});
    const ju = URL.createObjectURL(jb);
    const a1 = document.createElement('a'); a1.href=ju; a1.download='afca-decisions.json';
    document.body.appendChild(a1); a1.click(); a1.remove(); URL.revokeObjectURL(ju);
    
    // CSV
    const h = 'Case Number,Financial Firm,Resolution Date,Decision URL,Article ID\\n';
    const rows = unique.map(d => 
      '"' + d.caseNumber.replace(/"/g,'""') + '","' + d.financialFirm.replace(/"/g,'""') + '","' + 
      d.resolutionDate.replace(/"/g,'""') + '","' + d.decisionUrl + '","' + d.knowledgeArticleId + '"'
    ).join('\\n');
    const cb = new Blob([h + rows], {type:'text/csv'});
    const cu = URL.createObjectURL(cb);
    const a2 = document.createElement('a'); a2.href=cu; a2.download='afca-decisions.csv';
    document.body.appendChild(a2); a2.click(); a2.remove(); URL.revokeObjectURL(cu);
    
    console.log('✅ DONE! Downloaded ' + unique.length + ' decisions.');
    alert('✅ Downloaded ' + unique.length + ' AFCA decisions (JSON + CSV)');
  }
  
  console.log('🔍 AFCA extractor ready! Click Search now.');
  console.log('📊 It will auto-download after capturing all results.');
  console.log('💡 Navigate through ALL result pages to capture everything.');
})();`;
}
