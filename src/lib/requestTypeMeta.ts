// Icons and colors for each request type and status, shared by the employee screens.
import {
  HardHat, Palmtree, Stethoscope, ShieldCheck, Wallet,
  Hourglass, CheckCircle2, XCircle, Inbox, LucideIcon,
} from 'lucide-react';
import { RequestType, RequestStatus } from '@/lib/types';

export interface TypeMeta {
  icon: LucideIcon;
  /** soft background + icon color for the round icon badge */
  badge: string;
  /** translation key of the "new ..." label */
  newKey: string;
}

export const TYPE_META: Record<RequestType, TypeMeta> = {
  extra_shift: { icon: HardHat, badge: 'bg-brand-blue-light text-brand-navy', newKey: 'new.extra.shift' },
  vacation: { icon: Palmtree, badge: 'bg-emerald-50 text-emerald-700', newKey: 'new.vacation' },
  sick: { icon: Stethoscope, badge: 'bg-rose-50 text-rose-600', newKey: 'new.sick.leave' },
  reserve: { icon: ShieldCheck, badge: 'bg-[#EEF2E4] text-[#4F6228]', newKey: 'new.reserve.duty' },
  petty_cash: { icon: Wallet, badge: 'bg-amber-50 text-amber-700', newKey: 'new.petty.cash' },
};

export const TYPE_ORDER: RequestType[] = ['extra_shift', 'vacation', 'sick', 'reserve', 'petty_cash'];

export interface StatusMeta {
  icon: LucideIcon;
  pill: string;
  /** a longer, friendlier label when one exists */
  longKey?: string;
  open: boolean;
}

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  pending: { icon: Hourglass, pill: 'bg-amber-50 text-amber-800 ring-amber-200', longKey: 'status.pending.long', open: true },
  submitted: { icon: Inbox, pill: 'bg-sky-50 text-sky-800 ring-sky-200', longKey: 'status.submitted.long', open: true },
  approved: { icon: CheckCircle2, pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', open: false },
  handled: { icon: CheckCircle2, pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', open: false },
  paid: { icon: CheckCircle2, pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', open: false },
  rejected: { icon: XCircle, pill: 'bg-red-50 text-red-700 ring-red-200', open: false },
  cancelled: { icon: XCircle, pill: 'bg-slate-100 text-slate-600 ring-slate-200', open: false },
};
