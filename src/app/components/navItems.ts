import { Home, Plus, ClipboardCheck, Building2, User, LucideIcon } from 'lucide-react';
import { canSubmitRequests } from '@/lib/roles';

export interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** the round "+" button in the middle of the phone navigation */
  primary?: boolean;
  badge?: 'pending';
}

/** Navigation entries the user may see, by role. */
export function navItemsFor(roles: string[] | undefined | null): NavItem[] {
  const items: NavItem[] = [];
  const canSubmit = canSubmitRequests(roles);
  if (canSubmit) items.push({ key: 'home', href: '/employee', labelKey: 'nav.home', icon: Home });
  if (roles?.includes('manager')) {
    items.push({ key: 'approvals', href: '/manager', labelKey: 'nav.approvals', icon: ClipboardCheck, badge: 'pending' });
  }
  if (canSubmit) items.push({ key: 'new', href: '/employee/new-request', labelKey: 'nav.new', icon: Plus, primary: true });
  if (roles?.includes('office')) items.push({ key: 'office', href: '/office', labelKey: 'nav.office', icon: Building2 });
  items.push({ key: 'profile', href: '/profile', labelKey: 'profile', icon: User });
  return items;
}

export function isActivePath(pathname: string, href: string) {
  if (href === '/employee') return pathname === '/employee' || pathname.startsWith('/employee/reports');
  return pathname === href || pathname.startsWith(href + '/');
}
