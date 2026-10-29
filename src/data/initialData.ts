import { LinkItem, UserItem } from '../types';

// Semua template link bawaan telah dihapus sesuai permintaan pengguna.
export const INITIAL_LINKS: LinkItem[] = [];

const LEGACY_TEMPLATE_IDS = new Set([
  'link-aff-1',
  'link-aff-2',
  'link-aff-3',
  'link-aff-4',
  'link-anim-1',
  'link-anim-2',
  'link-anim-3',
  'link-anim-4',
  'link-story-1',
  'link-story-2',
  'link-story-3',
  'link-story-4',
]);

export function isTemplateLink(link: Partial<LinkItem> | null | undefined): boolean {
  if (!link) return false;
  if (link.id && LEGACY_TEMPLATE_IDS.has(String(link.id))) return true;
  if (typeof link.url === 'string' && link.url.includes('.airastudio.internal')) return true;
  return false;
}

export const INITIAL_USERS: UserItem[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Admin AIRA Studio',
    email: 'admin@airastudio.ai',
    role: 'admin',
    status: 'active',
    avatarBg: 'bg-indigo-600',
    joinedDate: '2026-01-10',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Rian Pratama',
    email: 'rian.creator@airastudio.ai',
    role: 'creator',
    status: 'active',
    avatarBg: 'bg-emerald-600',
    joinedDate: '2026-03-15',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Siti Rahmawati',
    email: 'siti.story@airastudio.ai',
    role: 'creator',
    status: 'active',
    avatarBg: 'bg-purple-600',
    joinedDate: '2026-05-20',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Budi Santoso',
    email: 'budi.affiliate@gmail.com',
    role: 'member',
    status: 'active',
    avatarBg: 'bg-amber-600',
    joinedDate: '2026-08-04',
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Dewi Lestari',
    email: 'dewi.anim@external.io',
    role: 'member',
    status: 'suspended',
    avatarBg: 'bg-rose-600',
    joinedDate: '2026-09-12',
  },
];

