import { useState } from 'react';
import type { SearchParams } from '../types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

// Product line options from the AFCA portal
const PRODUCT_LINES = [
  { id: '', name: 'All Product Lines' },
  { id: '719de0b0-93c1-ed11-b597-00224892f893', name: 'Credit' },
  { id: '779de0b0-93c1-ed11-b597-00224892f893', name: 'Deposit Taking' },
  { id: '739de0b0-93c1-ed11-b597-00224892f893', name: 'General Insurance' },
  { id: '759de0b0-93c1-ed11-b597-00224892f893', name: 'Investments' },
  { id: '7f9de0b0-93c1-ed11-b597-00224892f893', name: 'Life Insurance' },
  { id: '7b9de0b0-93c1-ed11-b597-00224892f893', name: 'Non rules' },
  { id: '799de0b0-93c1-ed11-b597-00224892f893', name: 'Payment Systems' },
  { id: '7d9de0b0-93c1-ed11-b597-00224892f893', name: 'Superannuation' },
  { id: '819de0b0-93c1-ed11-b597-00224892f893', name: 'Traditional Trustee Services' },
];

// Issue type options from the AFCA portal
const ISSUE_TYPES = [
  { id: '', name: 'All Issue Types' },
  { id: 'b3b1f969-afc1-ed11-83fe-000d3a6ad49b', name: 'Advice' },
  { id: 'a379125d-afc1-ed11-83fe-000d3a6ad49b', name: 'Charges' },
  { id: '0f42fb75-afc1-ed11-83fe-000d3a6ad49b', name: 'Consumer Data Right' },
  { id: '33b6f37b-afc1-ed11-83fe-000d3a6ad49b', name: 'Credit Reporting' },
  { id: 'f5e14f63-afc1-ed11-83fe-000d3a6ad49b', name: 'Disclosure' },
  { id: 'd4d6fb6f-afc1-ed11-83fe-000d3a6ad49b', name: 'FF Decision' },
  { id: 'b9b1f969-afc1-ed11-83fe-000d3a6ad49b', name: 'Financial Difficulty' },
  { id: 'a8e3b749-afc1-ed11-83fe-000d3a6ad49b', name: 'Instructions' },
  { id: 'fe41fb75-afc1-ed11-83fe-000d3a6ad49b', name: 'Non rules' },
  { id: '4e60feb6-20e8-ed11-8848-000d3a6ad5b3', name: 'Other Complaint' },
  { id: '32ff8356-afc1-ed11-83fe-000d3a6ad49b', name: 'Privacy & Confidentiality' },
  { id: '59056350-afc1-ed11-83fe-000d3a6ad49b', name: 'Service' },
  { id: '9579125d-afc1-ed11-83fe-000d3a6ad49b', name: 'Transactions' },
];

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  // Default dates: June 15, 2024 to today
  const today = new Date().toISOString().split('T')[0];
  const defaultDateFrom = '2024-06-15';

  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(today);
  const [keyword, setKeyword] = useState('');
  const [financialFirm, setFinancialFirm] = useState('');
  const [productLine, setProductLine] = useState('');
  const [issueType, setIssueType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      dateFrom,
      dateTo,
      keyword: keyword || undefined,
      financialFirm: financialFirm || undefined,
      productLine: productLine || undefined,
      issueType: issueType || undefined,
    });
  };

  const handleClear = () => {
    setDateFrom(defaultDateFrom);
    setDateTo(today);
    setKeyword('');
    setFinancialFirm('');
    setProductLine('');
    setIssueType('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Parameters
      </h2>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Keyword & Firm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keyword / Case Number
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. insurance, 12-25-328044"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Financial Firm
          </label>
          <input
            type="text"
            value={financialFirm}
            onChange={(e) => setFinancialFirm(e.target.value)}
            placeholder="e.g. AAI Limited, CBA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Advanced Search Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-[#003366] hover:text-[#004080] font-medium mb-4 flex items-center gap-1"
      >
        <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Advanced Filters
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Line
            </label>
            <select
              value={productLine}
              onChange={(e) => setProductLine(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all bg-white"
            >
              {PRODUCT_LINES.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all bg-white"
            >
              {ISSUE_TYPES.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#003366] text-white font-medium rounded-lg hover:bg-[#004080] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Decisions
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
