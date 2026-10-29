export type ToolCategory = 'affiliate' | 'animation' | 'story';

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: ToolCategory;
  tag: string;
  thumbnailUrl?: string;
  gradientTheme: string;
  clicks: number;
  isFavorite: boolean;
  createdAt: string;
  badge?: string;
}

export type UserRole = 'admin' | 'creator' | 'member';
export type UserStatus = 'active' | 'suspended';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarBg: string;
  joinedDate: string;
}

export interface AuthState {
  user: UserItem | null;
  isAuthenticated: boolean;
}

export type MainNavigationId = 
  | 'all' 
  | 'affiliate' 
  | 'animation' 
  | 'story' 
  | 'favorites' 
  | 'admin' 
  | 'login';

export type AdminSubTab = 'all' | 'links' | 'users' | 'overview' | 'settings';
