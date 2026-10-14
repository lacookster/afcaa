import { useState, useCallback } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsTable } from './components/ResultsTable';
import { StatusBanner } from './components/StatusBanner';
import { BookmarkletPanel } from './components/BookmarkletPanel';
import { exportToCSV, exportToJSON } from './utils/export';
import type { Decision, SearchParams, FetchStatus } from './types';
import { searchDecisions } from './services/afcaApi';

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [status, setStatus] = useState<FetchStatus>({ state: 'idle' });
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);
  const [showBookmarklet, setShowBookmarklet] = useState(false);

  const handleSearch = useCallback(async (params: SearchParams) => {
    setStatus({ state: 'loading', message: 'Searching AFCA portal via CORS proxy...' });
    setHasSearched(true);
    setDecisions([]);
    setTotalCount(0);
    setLastParams(params);
    setShowBookmarklet(false);

    try {
      const result = await searchDecisions(params);
      setDecisions(result.decisions);
      setTotalCount(result.totalCount);
      if (result.decisions.length > 0) {
        setStatus({
          state: 'success',
          message: `Found ${result.totalCount} decisions`,
        });
      } else {
        setStatus({
          state: 'success',
          message: 'Search completed — no results found with these criteria. Try the bookmarklet method below for more reliable access.',
        });
        setShowBookmarklet(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus({ state: 'error', message: `Search failed: ${message}` });
      setShowBookmarklet(true);
    }
  }, []);

  const handleExportCSV = () => {
    exportToCSV(decisions, 'afca-decisions');
  };

  const handleExportJSON = () => {
    exportToJSON(decisions, 'afca-decisions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AFCA Published Decisions Scraper</h1>
              <p className="text-blue-200 text-sm">Search and export Australian Financial Complaints Authority determinations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About this tool</p>
              <p>
                This tool scrapes published decisions from the{' '}
                <a href="https://my.afca.org.au/searchpublisheddecisions/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600">
                  AFCA Customer Self-Service portal
                </a>
                . Decisions published from <strong>14 June 2024</strong> onwards are available through this search.
                Results include case number, financial firm, resolution date, and a link to the full determination PDF.
              </p>
              <p className="mt-2 text-blue-700">
                <strong>Two methods available:</strong> Direct API search (via CORS proxy) or the bookmarklet method 
                (open the AFCA portal directly and extract data from your browser).
              </p>
            </div>
          </div>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowBookmarklet(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !showBookmarklet
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🔍 Direct API Search
          </button>
          <button
            onClick={() => setShowBookmarklet(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showBookmarklet
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📋 Bookmarklet Method (Recommended)
          </button>
        </div>

        {/* Search Form */}
        {!showBookmarklet && (
          <SearchForm onSearch={handleSearch} isLoading={status.state === 'loading'} />
        )}

        {/* Bookmarklet Panel */}
        {showBookmarklet && lastParams && (
          <BookmarkletPanel params={lastParams} />
        )}
        {showBookmarklet && !lastParams && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">
              Please use the <strong>Direct API Search</strong> tab first to set your search parameters, 
              then switch to this tab to get the bookmarklet.
            </p>
            <button
              onClick={() => setShowBookmarklet(false)}
              className="px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors"
            >
              Go to API Search
            </button>
          </div>
        )}

        {/* Status Banner */}
        {!showBookmarklet && status.state !== 'idle' && <StatusBanner status={status} />}

        {/* Fallback suggestion when API fails */}
        {!showBookmarklet && status.state === 'error' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">API search unavailable</p>
                <p>
                  The direct API search couldn't reach the AFCA portal. This is common due to CORS restrictions.
                  Switch to the <button onClick={() => setShowBookmarklet(true)} className="underline font-medium text-amber-900 hover:text-amber-700">Bookmarklet Method</button> for a more reliable approach.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && decisions.length > 0 && !showBookmarklet && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Search Results
                </h2>
                <p className="text-sm text-gray-500">
                  Showing {decisions.length} of {totalCount} decisions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON
                </button>
              </div>
            </div>
            <ResultsTable decisions={decisions} />
          </div>
        )}

        {/* No Results */}
        {hasSearched && decisions.length === 0 && status.state === 'success' && !showBookmarklet && (
          <div className="mt-8 text-center py-12 bg-white rounded-xl border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No decisions found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or use the bookmarklet method.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>Data sourced from the <a href="https://my.afca.org.au/searchpublisheddecisions/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AFCA Customer Self-Service Portal</a></p>
          <p className="mt-1">This tool is for personal/research use. See AFCA's copyright notice on their portal for reproduction terms.</p>
        </div>
      </footer>
    </div>
  );
}
