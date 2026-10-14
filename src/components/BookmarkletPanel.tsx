import { useState } from 'react';
import type { SearchParams } from '../types';
import { generateBookmarklet } from '../services/afcaApi';

interface BookmarkletPanelProps {
  params: SearchParams;
}

export function BookmarkletPanel({ params }: BookmarkletPanelProps) {
  const [copied, setCopied] = useState(false);
  const bookmarkletUrl = generateBookmarklet(params);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = bookmarkletUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Build the direct URL with parameters for the AFCA portal
  const directUrl = `https://my.afca.org.au/searchpublisheddecisions/?dateFrom=${params.dateFrom}&dateTo=${params.dateTo}${params.keyword ? `&keyword=${encodeURIComponent(params.keyword)}` : ''}${params.financialFirm ? `&firm=${encodeURIComponent(params.financialFirm)}` : ''}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-2xl">📋</span>
        Bookmarklet Method (Most Reliable)
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Since the AFCA portal doesn't allow direct API access from external sites, 
        this method lets you extract data directly from your browser. Follow these steps:
      </p>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        <Step number={1} title="Open the AFCA Portal">
          <p>
            Open the{' '}
            <a
              href="https://my.afca.org.au/searchpublisheddecisions/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              AFCA Published Decisions search page
            </a>{' '}
            in a new tab.
          </p>
          <a
            href="https://my.afca.org.au/searchpublisheddecisions/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open AFCA Portal
          </a>
        </Step>

        <Step number={2} title="Set your search parameters on the portal">
          <p>On the AFCA portal, set these values:</p>
          <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm font-mono">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-500">Date From:</span>
              <span className="text-gray-800">{params.dateFrom}</span>
              <span className="text-gray-500">Date To:</span>
              <span className="text-gray-800">{params.dateTo}</span>
              {params.keyword && (
                <>
                  <span className="text-gray-500">Keyword:</span>
                  <span className="text-gray-800">{params.keyword}</span>
                </>
              )}
              {params.financialFirm && (
                <>
                  <span className="text-gray-500">Financial Firm:</span>
                  <span className="text-gray-800">{params.financialFirm}</span>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-gray-500 text-xs">Then click the "Search" button on the AFCA portal and wait for results to load.</p>
        </Step>

        <Step number={3} title="Run the extraction script">
          <p>
            After the results appear on the AFCA portal, open your browser's Developer Tools 
            (press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">F12</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Ctrl+Shift+I</kbd>), 
            go to the <strong>Console</strong> tab, and paste the script below:
          </p>
        </Step>
      </div>

      {/* Script */}
      <div className="mb-6">
        <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2">
          <span className="text-gray-400 text-xs font-mono">JavaScript (paste in browser console)</span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Script'}
          </button>
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-xs leading-relaxed max-h-64 overflow-y-auto">
          <code>{getExtractionScript(params)}</code>
        </pre>
      </div>

      {/* Alternative: Bookmarklet */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Alternative: Drag this bookmarklet to your bookmarks bar</h3>
        <p className="text-xs text-gray-500 mb-3">
          Drag the link below to your bookmarks bar. Then, when you're on the AFCA portal with results loaded, 
          click the bookmark to extract the data.
        </p>
        <a
          href={bookmarkletUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors cursor-grab"
          onClick={(e) => e.preventDefault()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          AFCA Extract Decisions
        </a>
      </div>

      {/* Manual URL */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Direct portal URL with your parameters:</h3>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={directUrl}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(directUrl);
            }}
            className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
          >
            Copy
          </button>
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
        <h3 className="font-medium text-gray-800 mb-1">{title}</h3>
        <div className="text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}

function getExtractionScript(params: SearchParams): string {
  return `// AFCA Decision Extractor - Paste this in the browser console
// on the AFCA portal after search results have loaded
(async function() {
  const results = [];
  const dateFrom = '${params.dateFrom}';
  const dateTo = '${params.dateTo}';
  
  // Wait for results to be loaded
  console.log('Waiting for results...');
  
  // Try to get results from the table
  const table = document.getElementById('kb-articles-table');
  if (table) {
    const rows = table.querySelectorAll('tr');
    console.log('Found ' + rows.length + ' rows');
    
    rows.forEach(function(row, index) {
      const cells = row.querySelectorAll('td');
      const link = row.querySelector('a[href*="/kb/article/"]');
      
      if (cells.length > 0) {
        const cellTexts = Array.from(cells).map(c => c.innerText.trim());
        const articleId = link ? link.href.split('/kb/article/')[1] : '';
        
        // Try to extract case number
        const caseMatch = row.innerText.match(/\\d{2}-\\d{2}-\\d{4,}/);
        
        results.push({
          caseNumber: caseMatch ? caseMatch[0] : '',
          financialFirm: cellTexts[1] || cellTexts[0] || '',
          resolutionDate: cellTexts.find(t => /\\d{1,2}\\/\\d{1,2}\\/\\d{4}/.test(t)) || '',
          knowledgeArticleId: articleId,
          decisionUrl: articleId ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + articleId : '',
          rawText: cellTexts.join(' | ')
        });
      }
    });
  }
  
  // Also try to get data from the page's JavaScript variables
  if (results.length === 0) {
    // Try to find data in script tags
    const scripts = document.querySelectorAll('script');
    scripts.forEach(function(script) {
      const text = script.textContent || '';
      if (text.includes('results') && text.includes('case_number')) {
        try {
          const match = text.match(/\\{[\\s\\S]*?"results"[\\s\\S]*?\\}/);
          if (match) {
            const data = JSON.parse(match[0]);
            if (data.results) {
              data.results.forEach(function(r) {
                results.push({
                  caseNumber: r.case_number || '',
                  financialFirm: r.financial_firm || '',
                  resolutionDate: r.resolution_date || '',
                  knowledgeArticleId: r.knowledge_article_id || '',
                  decisionUrl: r.knowledge_article_id ? 'https://my.afca.org.au/searchpublisheddecisions/kb/article/' + r.knowledge_article_id : ''
                });
              });
            }
          }
        } catch(e) {}
      }
    });
  }
  
  // Output results
  if (results.length > 0) {
    console.log('Extracted ' + results.length + ' decisions');
    console.table(results);
    
    // Download as CSV
    const csvHeader = 'Case Number,Financial Firm,Resolution Date,Decision URL\\n';
    const csvRows = results.map(r => 
      '"' + r.caseNumber + '","' + r.financialFirm + '","' + r.resolutionDate + '","' + r.decisionUrl + '"'
    ).join('\\n');
    
    const blob = new Blob([csvHeader + csvRows], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afca-decisions-${params.dateFrom}-to-${params.dateTo}.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    // Also download as JSON
    const jsonBlob = new Blob([JSON.stringify({
      metadata: {
        source: 'AFCA Published Decisions',
        dateFrom: dateFrom,
        dateTo: dateTo,
        scrapedAt: new Date().toISOString(),
        totalCount: results.length
      },
      decisions: results
    }, null, 2)], {type: 'application/json'});
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonA = document.createElement('a');
    jsonA.href = jsonUrl;
    jsonA.download = 'afca-decisions-${params.dateFrom}-to-${params.dateTo}.json';
    jsonA.click();
    URL.revokeObjectURL(jsonUrl);
    
    alert('✅ Extracted ' + results.length + ' decisions! CSV and JSON files downloaded.');
  } else {
    alert('❌ No results found. Make sure the search has completed and results are visible on the page.');
  }
})();`;
}
