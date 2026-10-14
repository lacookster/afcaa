import type { Decision, SearchParams } from '../types';

const AFCA_BASE_URL = 'https://my.afca.org.au';
const AFCA_SEARCH_CONFIG_ID = '618b41fb-bdc0-ed11-83fe-000d3a6ad49b';
const AFCA_ARTICLE_BASE_URL = 'https://my.afca.org.au/searchpublisheddecisions/kb/article/';

// CORS proxy options - we try multiple in case one is down
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

export interface AFCAApiResult {
  case_number: string;
  financial_firm: string;
  resolution_date: string;
  knowledge_article_id: string;
}

export interface AFCAApiResponse {
  results: AFCAApiResult[];
  total_count: number;
}

function formatDateForApi(dateStr: string): string {
  // Convert YYYY-MM-DD to M/D/YYYY format
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

function parseResolutionDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    // Handle various date formats from the API
    // "4/27/2026 4:22:29 AM" or "27/04/2026" or "2026-04-27"
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, first, second, year] = match;
      // Determine if it's MM/DD/YYYY or DD/MM/YYYY
      // AFCA is Australian, so likely DD/MM/YYYY, but the portal might use US format
      const num1 = parseInt(first);
      const num2 = parseInt(second);
      
      if (num1 > 12) {
        // First number > 12, so it must be DD/MM/YYYY
        return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      } else if (num2 > 12) {
        // Second number > 12, so it must be MM/DD/YYYY
        return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
      } else {
        // Ambiguous - assume DD/MM/YYYY for Australian site
        return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function mapApiResultToDecision(result: AFCAApiResult): Decision {
  return {
    caseNumber: result.case_number || '',
    financialFirm: result.financial_firm || '',
    resolutionDate: parseResolutionDate(result.resolution_date),
    knowledgeArticleId: result.knowledge_article_id || '',
    decisionUrl: result.knowledge_article_id 
      ? `${AFCA_ARTICLE_BASE_URL}${result.knowledge_article_id}` 
      : '',
  };
}

async function fetchWithProxy(url: string): Promise<string> {
  const errors: string[] = [];

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](url);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json, text/html, */*',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        errors.push(`Proxy ${i + 1}: HTTP ${response.status}`);
        continue;
      }

      const text = await response.text();
      
      // For allorigins /get endpoint, the response is wrapped in JSON
      if (proxyUrl.includes('/get?url=')) {
        try {
          const wrapper = JSON.parse(text);
          if (wrapper.contents) {
            return wrapper.contents;
          }
        } catch {
          // Not wrapped JSON, use raw text
        }
      }
      
      if (text && text.length > 10) {
        return text;
      }
      errors.push(`Proxy ${i + 1}: Empty response`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        errors.push(`Proxy ${i + 1}: Request timed out`);
      } else {
        errors.push(`Proxy ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  throw new Error(`All CORS proxies failed. Errors: ${errors.join('; ')}`);
}

export function parseSearchResults(html: string): AFCAApiResponse {
  const results: AFCAApiResult[] = [];

  // Strategy 1: Try to find JSON data embedded in the page
  // Power Pages sometimes embeds search results as JSON in a script tag
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptPattern.exec(html)) !== null) {
    const scriptContent = scriptMatch[1];
    // Look for JSON objects with results arrays
    const jsonPattern = /(\{[\s\S]*?"results"\s*:\s*\[[\s\S]*?\][\s\S]*?"total_count"\s*:\s*\d+[\s\S]*?\})/g;
    let jsonMatch;
    while ((jsonMatch = jsonPattern.exec(scriptContent)) !== null) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.results && Array.isArray(parsed.results)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
  }

  // Strategy 2: Parse HTML table rows
  // The KB search results are typically rendered as a table
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Check if this row contains article data
    const articleMatch = /\/kb\/article\/([^"'?\s]+)/.exec(rowHtml);
    if (!articleMatch) continue;
    
    const articleId = articleMatch[1];
    
    // Extract case number (format: XX-XX-XXXXXX)
    const caseMatch = /(\d{2}-\d{2}-\d{4,})/.exec(rowHtml);
    const caseNumber = caseMatch ? caseMatch[1] : '';
    
    // Extract all text content from cells
    const cells: string[] = [];
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      // Strip HTML tags to get text content
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cellText) cells.push(cellText);
    }
    
    // Try to identify which cell contains the firm name
    let firm = '';
    const firmPatterns = [
      /(?:Pty\s+Ltd|Limited|Ltd|Bank|Insurance|Group|Mutual|Credit\s+Union)/i,
    ];
    for (const cell of cells) {
      for (const pattern of firmPatterns) {
        if (pattern.test(cell) && cell.length < 100) {
          firm = cell;
          break;
        }
      }
      if (firm) break;
    }
    
    // Extract date
    const dateMatch = /(\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)?)/.exec(rowHtml);
    const date = dateMatch ? dateMatch[1] : '';
    
    results.push({
      case_number: caseNumber,
      financial_firm: firm,
      resolution_date: date,
      knowledge_article_id: articleId,
    });
  }

  // Strategy 3: Parse list items or divs with article links
  if (results.length === 0) {
    const linkPattern = /<a[^>]*href="[^"]*\/kb\/article\/([^"']*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const articleId = linkMatch[1];
      const linkText = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      
      // Look for case number and date near this link
      const contextStart = Math.max(0, linkMatch.index - 500);
      const contextEnd = Math.min(html.length, linkMatch.index + linkMatch[0].length + 500);
      const context = html.substring(contextStart, contextEnd);
      
      const caseMatch = /(\d{2}-\d{2}-\d{4,})/.exec(context);
      const dateMatch = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(context);
      
      results.push({
        case_number: caseMatch ? caseMatch[1] : '',
        financial_firm: linkText || '',
        resolution_date: dateMatch ? dateMatch[1] : '',
        knowledge_article_id: articleId,
      });
    }
  }

  return { results, total_count: results.length };
}

function buildSearchUrl(params: SearchParams): string {
  const searchParams = new URLSearchParams();
  
  let searchTerm = '';
  if (params.keyword) {
    searchTerm = params.keyword;
  }
  if (params.financialFirm) {
    searchTerm = searchTerm ? `${searchTerm} ${params.financialFirm}` : params.financialFirm;
  }
  
  searchParams.set('searchTerm', searchTerm);
  searchParams.set('pageNumber', '1');
  searchParams.set('pageSize', '500');
  
  // Date parameters - try various formats the API might accept
  if (params.dateFrom) {
    searchParams.set('dateFrom', formatDateForApi(params.dateFrom));
  }
  if (params.dateTo) {
    searchParams.set('dateTo', formatDateForApi(params.dateTo));
  }
  
  if (params.productLine) {
    searchParams.set('productLine', params.productLine);
  }
  if (params.issueType) {
    searchParams.set('issueType', params.issueType);
  }

  return `${AFCA_BASE_URL}/_services/search/${AFCA_SEARCH_CONFIG_ID}?${searchParams.toString()}`;
}

export async function searchDecisions(params: SearchParams): Promise<{ decisions: Decision[]; totalCount: number }> {
  const searchUrl = buildSearchUrl(params);
  
  let html: string;
  
  try {
    html = await fetchWithProxy(searchUrl);
  } catch (error) {
    throw new Error(
      `Unable to reach the AFCA portal through CORS proxies. ` +
      `This may be due to network restrictions or the proxies being temporarily unavailable. ` +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `Try using the bookmarklet alternative below.`
    );
  }

  // Try to parse as JSON first
  try {
    const jsonData = JSON.parse(html);
    if (jsonData.results || jsonData.data?.results) {
      const apiResponse: AFCAApiResponse = jsonData.data || jsonData;
      const decisions = (apiResponse.results || []).map(mapApiResultToDecision);
      return { decisions, totalCount: apiResponse.total_count || decisions.length };
    }
    // Handle nested data structure
    if (jsonData.d?.results) {
      const decisions = jsonData.d.results.map(mapApiResultToDecision);
      return { decisions, totalCount: jsonData.d.total_count || decisions.length };
    }
  } catch {
    // Not JSON, try HTML parsing
  }

  // Parse HTML response
  const apiResponse = parseSearchResults(html);
  const decisions = apiResponse.results.map(mapApiResultToDecision);
  
  if (decisions.length === 0) {
    // Check if the response indicates an error or empty result
    if (html.includes('No results found') || html.includes('no results') || html.includes('0 Results')) {
      return { decisions: [], totalCount: 0 };
    }
    // If we got HTML but couldn't parse results, it might be the search page itself
    // rather than search results
    if (html.includes('Search published decisions') && html.includes('searchfield')) {
      throw new Error(
        'The AFCA portal returned the search page instead of results. ' +
        'The API may require additional authentication or the search parameters may not be supported. ' +
        'Try using the bookmarklet to extract data directly from the portal.'
      );
    }
  }
  
  return {
    decisions,
    totalCount: apiResponse.total_count || decisions.length,
  };
}

// Generate a bookmarklet that can be used to extract data directly from the AFCA portal
export function generateBookmarklet(params: SearchParams): string {
  const script = `
    (function() {
      const dateFrom = '${params.dateFrom}';
      const dateTo = '${params.dateTo}';
      const keyword = '${params.keyword || ''}';
      const firm = '${params.financialFirm || ''}';
      
      // Set the date fields
      const dateFromEl = document.getElementById('date_from');
      const dateToEl = document.getElementById('date_to');
      if (dateFromEl) dateFromEl.value = dateFrom;
      if (dateToEl) dateToEl.value = dateTo;
      
      // Set keyword if provided
      if (keyword) {
        const keywordEl = document.getElementById('keywordsearch');
        if (keywordEl) keywordEl.value = keyword;
      }
      
      // Set firm if provided
      if (firm) {
        const firmEl = document.getElementById('ffsearch');
        if (firmEl) firmEl.value = firm;
      }
      
      // Click the search button
      const searchBtn = document.getElementById('submitsearch');
      if (searchBtn) searchBtn.click();
      
      // Wait for results and extract them
      setTimeout(function() {
        const table = document.getElementById('kb-articles-table');
        if (table) {
          const rows = table.querySelectorAll('tr');
          const results = [];
          rows.forEach(function(row) {
            const cells = row.querySelectorAll('td');
            const link = row.querySelector('a[href*="/kb/article/"]');
            if (link || cells.length > 0) {
              const articleId = link ? link.href.split('/kb/article/')[1] : '';
              const text = row.innerText;
              results.push(text + ' | ArticleID: ' + articleId);
            }
          });
          
          // Copy results to clipboard
          const output = results.join('\\n');
          const blob = new Blob([output], {type: 'text/plain'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'afca-decisions.txt';
          a.click();
          URL.revokeObjectURL(url);
          alert('Extracted ' + results.length + ' results! File downloaded.');
        } else {
          alert('No results table found. Wait for search to complete and try again.');
        }
      }, 5000);
    })();
  `.replace(/\s+/g, ' ').trim();
  
  return `javascript:${encodeURIComponent(script)}`;
}
