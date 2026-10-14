export interface Decision {
  caseNumber: string;
  financialFirm: string;
  resolutionDate: string;
  knowledgeArticleId: string;
  decisionUrl: string;
}

export interface SearchParams {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  keyword?: string;
  financialFirm?: string;
  productLine?: string;
  productCategory?: string;
  productName?: string;
  issueType?: string;
  issue?: string;
}

export interface FetchStatus {
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export interface ProductLine {
  id: string;
  name: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId: string;
}

export interface ProductName {
  id: string;
  name: string;
}

export interface IssueType {
  id: string;
  name: string;
}

export interface Issue {
  id: string;
  name: string;
  parentId: string;
}
