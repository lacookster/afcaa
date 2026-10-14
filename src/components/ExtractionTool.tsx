import { useState, useRef } from 'react';

export function ExtractionTool() {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const script = getFullExtractionScript();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = script;
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
      const headers = ['Case Number', 'Financial Firm', 'Resolution Date', 'Decision URL', 'Knowledge Article ID'];
      const rows = decisions.map((d: Record<string, string>) => [
        d.caseNumber || d.case_number || '',
        d.financialFirm || d.financial_firm || '',
        d.resolutionDate || d.resolution_date || '',
        d.decisionUrl || '',
        d.knowledgeArticleId || d.knowledge_article_id || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
      downloadFile(csv, `afca-all-decisions-2024-06-15-to-${today()}.csv`, 'text/csv');
    } catch (err) {
      alert('Error parsing file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExportJSON = () => {
    if (!extractedData) return;
    try {
      const data = JSON.parse(extractedData);
      downloadFile(JSON.stringify(data, null, 2), `afca-all-decisions-2024-06-15-to-${today()}.json`, 'application/json');
    } catch (err) {
      alert('Error parsing file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? 'bg-[#003366] text-white shadow-md'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 rounded ${step > s ? 'bg-[#003366]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-500">
          <span className={step >= 1 ? 'text-[#003366] font-semibold' : ''}>Open Portal</span>
          <span className={step >= 2 ? 'text-[#003366] font-semibold' : ''}>Search</span>
          <span className={step >= 3 ? 'text-[#003366] font-semibold' : ''}>Run Script</span>
          <span className={step >= 4 ? 'text-[#003366] font-semibold' : ''}>Download</span>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <StepCard
          number={1}
          title="Open the AFCA Portal"
          description="Open the AFCA published decisions search page in a new tab."
        >
          <a
            href="https://my.afca.org.au/searchpublisheddecisions/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003366] text-white font-medium rounded-lg hover:bg-[#004080] transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open AFCA Portal ↗
          </a>
          <button
            onClick={() => setStep(2)}
            className="ml-3 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            I've opened it →
          </button>
        </StepCard>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <StepCard
          number={2}
          title="Set Date Range & Search"
          description="On the AFCA portal, set the date range and click Search. Wait for ALL results to load."
        >
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <p><strong>Date from:</strong> 15/06/2024</p>
            <p><strong>Date to:</strong> {new Date().toLocaleDateString('en-AU')}</p>
            <p><strong>Keyword:</strong> Leave empty (to get ALL decisions)</p>
            <p><strong>Financial Firm:</strong> Leave empty (to get ALL firms)</p>
            <p className="text-amber-700 mt-2">⚠️ Click the blue <strong>"Search"</strong> button and wait for results to fully load before proceeding.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">← Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-2 bg-[#003366] text-white font-medium rounded-lg hover:bg-[#004080] text-sm">Results loaded →</button>
          </div>
        </StepCard>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <StepCard
          number={3}
          title="Run the Extraction Script"
          description="Copy the script below, open your browser's Developer Console (F12 → Console tab) on the AFCA portal page, paste it, and press Enter."
        >
          <div className="space-y-4">
            {/* Keyboard shortcuts */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Open Console:</strong>{' '}
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">F12</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Ctrl+Shift+J</kbd> (Windows) /{' '}
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Cmd+Option+J</kbd> (Mac)
            </div>

            {/* Script box */}
            <div>
              <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2">
                <span className="text-gray-400 text-xs font-mono">extraction-script.js — paste in Console</span>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Script'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-xs leading-relaxed max-h-80 overflow-y-auto font-mono">
                <code>{script}</code>
              </pre>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <strong>What happens:</strong> The script will automatically paginate through ALL results, 
              extract case numbers, financial firms, dates, and PDF links, then download a JSON file 
              with all decisions. This may take 1-3 minutes for ~13,000+ decisions.
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">← Back</button>
              <button onClick={() => setStep(4)} className="px-6 py-2 bg-[#003366] text-white font-medium rounded-lg hover:bg-[#004080] text-sm">I have the JSON file →</button>
            </div>
          </div>
        </StepCard>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <StepCard
          number={4}
          title="Import & Export Your Data"
          description="Upload the JSON file that was downloaded by the script, then export as CSV or JSON."
        >
          <div className="space-y-4">
            {/* File upload */}
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
                Upload JSON file from extraction script
              </button>
              <p className="text-xs text-gray-500 mt-2">The script downloads a file named like "afca-decisions-*.json"</p>
            </div>

            {/* Data preview & export */}
            {extractedData && (
              <div className="space-y-4">
                <DataPreview data={extractedData} />
                <div className="flex gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download CSV (Excel)
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">← Back to Script</button>
            </div>
          </div>
        </StepCard>
      )}
    </div>
  );
}

function StepCard({ number, title, description, children }: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-[#003366] text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
          {number}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </div>
      <div className="ml-14">{children}</div>
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

function getFullExtractionScript(): string {
  return `// =============================================
// AFCA DECISIONS BULK EXTRACTOR
// Run this in the Console (F12) on the AFCA portal
// after search results are loaded.
// It will auto-paginate and download ALL decisions.
// =============================================
(async function() {
  'use strict';
  
  const DATE_FROM = '15/06/2024';
  const DATE_TO = '${new Date().toLocaleDateString('en-AU')}';
  const PAGE_SIZE = 100;
  const DELAY_MS = 1500; // delay between page requests
  
  console.log('🚀 AFCA Bulk Extractor starting...');
  console.log('📅 Date range: ' + DATE_FROM + ' to ' + DATE_TO);
  
  // Get anti-forgery token
  function getAntiForgeryToken() {
    const tokenEl = document.querySelector('#antiforgerytoken');
    if (tokenEl) {
      const url = tokenEl.getAttribute('data-url');
      return fetch(url || '/_layout/tokenhtml')
        .then(r => r.text())
        .catch(() => '');
    }
    return Promise.resolve('');
  }
  
  // Extract results from the current page DOM
  function extractFromDOM() {
    const results = [];
    const table = document.getElementById('kb-articles-table');
    if (!table) return results;
    
    // Try table rows
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const link = row.querySelector('a[href*="/kb/article/"]');
      const cells = row.querySelectorAll('td');
      
      if (cells.length > 0) {
        const cellTexts = Array.from(cells).map(c => c.innerText.trim());
        const articleId = link ? link.href.split('/kb/article/')[1] : '';
        const caseMatch = row.innerText.match(/\\d{2}-\\d{2}-\\d{4,}/);
        
        results.push({
          caseNumber: caseMatch ? caseMatch[0] : '',
          financialFirm: cellTexts[1] || cellTexts[0] || '',
          resolutionDate: cellTexts.find(t => /\\d{1,2}\\/\\d{1,2}\\/\\d{4}/.test(t)) || '',
          knowledgeArticleId: articleId,
          decisionUrl: articleId ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + articleId : ''
        });
      }
    });
    
    return results;
  }
  
  // Call the search API directly for a specific page
  async function fetchPage(pageNumber) {
    const searchConfigId = '618b41fb-bdc0-ed11-83fe-000d3a6ad49b';
    const params = new URLSearchParams({
      searchTerm: '',
      pageNumber: String(pageNumber),
      pageSize: String(PAGE_SIZE),
      dateFrom: DATE_FROM,
      dateTo: DATE_TO
    });
    
    const url = '/_services/search/' + searchConfigId + '?' + params.toString();
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      
      const text = await response.text();
      
      // Try JSON parse first
      try {
        const json = JSON.parse(text);
        if (json.results) return json;
        if (json.d && json.d.results) return json.d;
      } catch(e) {}
      
      // Parse HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const results = [];
      const rows = doc.querySelectorAll('tr');
      
      rows.forEach(row => {
        const link = row.querySelector('a[href*="/kb/article/"]');
        const cells = row.querySelectorAll('td');
        
        if (cells.length > 0) {
          const cellTexts = Array.from(cells).map(c => c.innerText.trim());
          const articleId = link ? link.href.split('/kb/article/')[1] : '';
          const caseMatch = row.innerText.match(/\\d{2}-\\d{2}-\\d{4,}/);
          
          results.push({
            case_number: caseMatch ? caseMatch[0] : '',
            financial_firm: cellTexts[1] || cellTexts[0] || '',
            resolution_date: cellTexts.find(t => /\\d{1,2}\\/\\d{1,2}\\/\\d{4}/.test(t)) || '',
            knowledge_article_id: articleId
          });
        }
      });
      
      return { results: results, total_count: results.length };
    } catch(e) {
      console.error('Error fetching page ' + pageNumber + ':', e);
      return { results: [], total_count: 0 };
    }
  }
  
  // Main extraction loop
  let allDecisions = [];
  let page = 1;
  let hasMore = true;
  let totalCount = 0;
  
  // First, try the API approach
  console.log('📡 Trying API approach...');
  
  while (hasMore) {
    console.log('📄 Fetching page ' + page + '...');
    const data = await fetchPage(page);
    
    if (data.total_count && page === 1) {
      totalCount = data.total_count;
      console.log('📊 Total decisions found: ' + totalCount);
    }
    
    const results = data.results || [];
    
    if (results.length === 0) {
      hasMore = false;
    } else {
      results.forEach(r => {
        allDecisions.push({
          caseNumber: r.case_number || r.caseNumber || '',
          financialFirm: r.financial_firm || r.financialFirm || '',
          resolutionDate: r.resolution_date || r.resolutionDate || '',
          knowledgeArticleId: r.knowledge_article_id || r.knowledgeArticleId || '',
          decisionUrl: (r.knowledge_article_id || r.knowledgeArticleId) 
            ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + (r.knowledge_article_id || r.knowledgeArticleId)
            : ''
        });
      });
      
      console.log('  ✅ Page ' + page + ': got ' + results.length + ' results (total: ' + allDecisions.length + ')');
      
      if (results.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    // Safety limit
    if (page > 200) {
      console.log('⚠️ Reached page limit (200). Stopping.');
      hasMore = false;
    }
  }
  
  // If API didn't work, try DOM extraction
  if (allDecisions.length === 0) {
    console.log('🔄 API returned no results. Trying DOM extraction...');
    allDecisions = extractFromDOM();
  }
  
  // Build output
  const output = {
    meta: {
      source: 'AFCA Published Decisions',
      dateFrom: DATE_FROM,
      dateTo: DATE_TO,
      scrapedAt: new Date().toISOString(),
      totalCount: allDecisions.length
    },
    decisions: allDecisions
  };
  
  console.log('\\n✅ EXTRACTION COMPLETE!');
  console.log('📊 Total decisions extracted: ' + allDecisions.length);
  console.table(allDecisions.slice(0, 10));
  
  // Download JSON file
  const jsonStr = JSON.stringify(output, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'afca-decisions-${new Date().toISOString().split('T')[0]}.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Also generate CSV
  const csvHeader = 'Case Number,Financial Firm,Resolution Date,Decision URL,Knowledge Article ID\\n';
  const csvRows = allDecisions.map(d => 
    '"' + (d.caseNumber||'').replace(/"/g,'""') + '",' +
    '"' + (d.financialFirm||'').replace(/"/g,'""') + '",' +
    '"' + (d.resolutionDate||'').replace(/"/g,'""') + '",' +
    '"' + (d.decisionUrl||'') + '",' +
    '"' + (d.knowledgeArticleId||'') + '"'
  ).join('\\n');
  
  const csvBlob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvA = document.createElement('a');
  csvA.href = csvUrl;
  csvA.download = 'afca-decisions-${new Date().toISOString().split('T')[0]}.csv';
  document.body.appendChild(csvA);
  csvA.click();
  document.body.removeChild(csvA);
  URL.revokeObjectURL(csvUrl);
  
  console.log('\\n💾 Both JSON and CSV files have been downloaded!');
  console.log('📋 You can also copy the data: copy(JSON.stringify(output))');
  
  return output;
})();`;
}
