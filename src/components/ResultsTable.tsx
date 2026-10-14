import { useState } from 'react';
import type { Decision } from '../types';

interface ResultsTableProps {
  decisions: Decision[];
}

const PAGE_SIZE = 50;

export function ResultsTable({ decisions }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Decision>('resolutionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedDecisions = [...decisions].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedDecisions.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageDecisions = sortedDecisions.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSort = (field: keyof Decision) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: keyof Decision }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-12">
                #
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('caseNumber')}
              >
                <div className="flex items-center gap-1">
                  Case Number
                  <SortIcon field="caseNumber" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('financialFirm')}
              >
                <div className="flex items-center gap-1">
                  Financial Firm
                  <SortIcon field="financialFirm" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('resolutionDate')}
              >
                <div className="flex items-center gap-1">
                  Resolution Date
                  <SortIcon field="resolutionDate" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Decision PDF
              </th>
            </tr>
          </thead>
          <tbody>
            {pageDecisions.map((decision, index) => (
              <tr
                key={decision.knowledgeArticleId || index}
                className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-[#003366]">
                    {decision.caseNumber || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800 max-w-xs truncate">
                  {decision.financialFirm || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {decision.resolutionDate || '—'}
                </td>
                <td className="px-4 py-3">
                  {decision.decisionUrl ? (
                    <a
                      href={decision.decisionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View PDF
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, decisions.length)} of {decisions.length}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#003366] text-white border-[#003366]'
                      : 'border-gray-300 hover:bg-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
