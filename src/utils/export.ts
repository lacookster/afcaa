import type { Decision } from '../types';

export function exportToCSV(decisions: Decision[], filename: string): void {
  const headers = ['Case Number', 'Financial Firm', 'Resolution Date', 'Decision URL'];
  const rows = decisions.map((d) => [
    d.caseNumber,
    d.financialFirm,
    d.resolutionDate,
    d.decisionUrl,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportToJSON(decisions: Decision[], filename: string): void {
  const jsonContent = JSON.stringify(
    {
      metadata: {
        source: 'AFCA Published Decisions',
        scrapedAt: new Date().toISOString(),
        totalCount: decisions.length,
      },
      decisions: decisions.map((d) => ({
        caseNumber: d.caseNumber,
        financialFirm: d.financialFirm,
        resolutionDate: d.resolutionDate,
        knowledgeArticleId: d.knowledgeArticleId,
        decisionUrl: d.decisionUrl,
      })),
    },
    null,
    2
  );

  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
