export interface SearchResultItem {
  bookId: string;
  img: string;
  title: string;
  ISBN: string;
  author: string;
  publisher: string;
}

export interface SearchResult {
  bookCount: number;
  pageCount: number;
  data: SearchResultItem[];
}

export interface BookChapter {
  title: string;
  href: string;
}

export interface BookDetail {
  img: string;
  title: string;
  author: string;
  publisher: string;
  ISBN: string;
  version: string;
  volume: string;
  chapters: BookChapter[];
}
