export interface DocPage {
  route: string;
  section: string;
  title: string;
  nav_title?: string;
  description?: string;
  order?: number;
  icon?: string;
  badge?: string;
  updated?: string;
  tags: string[];
  body: string;
}

export interface DocsIndex {
  generatedAt: string;
  pageCount: number;
  pages: DocPage[];
}

export interface SearchResult {
  route: string;
  title: string;
  section: string;
  score: number;
  snippet: string;
  tags: string[];
}

export interface SectionTreeNode {
  name: string;
  route: string;
  title: string;
  children: SectionTreeNode[];
}
