export interface Confession {
  id: string | number;
  text: string;
  likes: number;
  timestamp: number;
  isLiked?: boolean;
}

export type Page = 'home' | 'confess' | 'feed' | 'about';
