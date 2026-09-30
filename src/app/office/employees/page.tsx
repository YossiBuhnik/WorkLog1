'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Check, Pencil, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { db } from '@/lib/firebase/firebase';
import { getDocuments, updateUser, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { getVacationQuotasForYear, setVacationQuota, usedVacationDays } from '@/lib/firebase/vacationQuotas';
import { canSubmitRequests } from '@/lib/roles';
import { initialsOf } from '@/lib/initials';
import { Request, User, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['employee', 'manager', 'office'];
const round = (n: number) => Math.round(n * 10) / 10;

export default function EmployeesPage() {
  const { user, loading: userLoading } = useAuth();
  const { t } = useTranslation();
  const thisYear = new Date().getFullYear();

  const [people, setPeople] = useState<User[]>([]);
  const [vacations, setVacations] = useState<Request[]>([]);
  const [quotas, setQuotas] = useState<Map<string, number>>(new Map());
  const [quotaDrafts, setQuotaDrafts] = useState<Record<string, string>>({});
  const [year, setYear] = useState(thisYear);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchPeople = useCallback(async () => {
    try {
      const [users, vacationSnap] = await Promise.all([
        getDocuments('users') as Promise<User[]>,
        getDocs(query(collection(db, 'requests'), where('type', '==', 'vacation'))),
      ]);
      setPeople(users.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email, 'he')));
      setVacations(vacationSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as Request));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error(t('error.loading.employees'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  useEffect(() => {
    setQuotaDrafts({});
    getVacationQuotasForYear(year)
      .then(setQuotas)
      .catch((error) => {
        console.error('Error loading vacation quotas:', error);
        setQuotas(new Map());
      });
  }, [year]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => (p.displayName || '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [people, search]);

  const handleRoleToggle = async (person: User, role: UserRole) => {
    const newRoles = person.roles.includes(role) ? person.roles.filter((r) => r !== role) : [...person.roles, role];
    setBusyId(person.id);
    try {
      await updateUser(person.id, { roles: newRoles });
      setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, roles: newRoles } : p)));
      toast.success(t('people.roles.updated'));
    } catch (error) {
      toast.error(t('people.roles.failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveName = async (person: User) => {
    try {
      await updateUser(person.id, { displayName: editName });
      setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, displayName: editName } : p)));
      setEditingUserId(null);
    } catch (error) {
      toast.error(t('people.name.failed'));
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDocument('users', userToDelete.id);
      setPeople((prev) => prev.filter((p) => p.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      toast.error(t('people.delete.failed'));
    }
  };

  // Saved when the field loses focus (or on Enter); an empty field removes the quota
  const saveQuota = async (person: User) => {
    const draft = quotaDrafts[person.id];
    if (draft === undefined || !user) return;
    const current = quotas.get(person.id);
    const value = draft.trim() === '' ? null : Number(draft.replace(',', '.'));
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 365)) {
      toast.error(t('quota.invalid'));
      return;
    }
    if (value === (current ?? null)) {
      setQuotaDrafts(({ [person.id]: _, ...rest }) => rest);
      return;
    }
    try {
      await setVacationQuota(person.id, year, value, user.id);
      setQuotas((prev) => {
        const next = new Map(prev);
        if (value === null) next.delete(person.id);
        else next.set(person.id, value);
        return next;
      });
      setQuotaDrafts(({ [person.id]: _, ...rest }) => rest);
      toast.success(t('quota.saved'));
    } catch (error) {
      console.error('Error saving vacation quota:', error);
      toast.error(t('quota.save.failed'));
    }
  };

  if (loading || userLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto space-y-3 animate-pulse">
        <div className="h-12 w-72 rounded-xl bg-slate-200/70" />
        <div className="h-96 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('people.search')}
            className="select-input w-full ps-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {t('quota.title')}
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="select-input">
            {[thisYear - 1, thisYear, thisYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="panel overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/70">
            <tr>
              <th className="th">{t('employee.name')}</th>
              <th className="th">{t('people.roles')}</th>
              <th className="th">
                {t('quota.title')} {year}
                <span className="block font-normal text-slate-400">{t('quota.hint')}</span>
              </th>
              <th className="th">{t('quota.used')}</th>
              <th className="th">{t('quota.left')}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((person) => {
              const isSelf = person.id === user.id;
              const submits = canSubmitRequests(person.roles);
              const quota = quotas.get(person.id);
              const used = submits ? usedVacationDays(vacations, person.id, year) : 0;
              const left = quota !== undefined ? round(quota - used) : null;
              const draft = quotaDrafts[person.id];
              const name = person.displayName || person.email;
              return (
                <tr key={person.id} className="hover:bg-slate-50/60">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-blue to-brand-navy text-white text-xs font-semibold flex items-center justify-center">
                        {initialsOf(name)}
                      </span>
                      {editingUserId === person.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName(person)}
                            className="select-input w-40"
                            autoFocus
                          />
                          <button onClick={() => handleSaveName(person)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" aria-label={t('save')}>
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingUserId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label={t('cancel')}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium text-slate-900">
                            {person.displayName || '—'}
                            <button
                              onClick={() => { setEditingUserId(person.id); setEditName(person.displayName || ''); }}
                              className="p-1 rounded-md text-slate-300 hover:text-brand-blue hover:bg-brand-blue-light"
                              aria-label={t('people.edit.name')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </p>
                          <p className="text-xs text-slate-500" dir="ltr">{person.email}</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5" title={isSelf ? t('people.self.roles') : undefined}>
                      {ROLES.map((role) => {
                        const on = person.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleToggle(person, role)}
                            disabled={isSelf || busyId === person.id}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition disabled:cursor-not-allowed ${
                              on ? 'bg-brand-blue-light text-brand-navy ring-brand-blue/30' : 'bg-white text-slate-400 ring-slate-200 hover:text-slate-600'
                            } ${isSelf ? 'opacity-60' : ''}`}
                          >
                            {on && <Check className="inline h-3 w-3 me-0.5 -mt-0.5" />}
                            {t(`role.${role}`)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="td">
                    {submits ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft ?? (quota !== undefined ? String(quota) : '')}
                        onChange={(e) => setQuotaDrafts((d) => ({ ...d, [person.id]: e.target.value }))}
                        onBlur={() => saveQuota(person)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        placeholder={t('quota.not.set')}
                        className="select-input w-24 text-center"
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="td">{submits ? used : <span className="text-slate-300">—</span>}</td>
                  <td className="td">
                    {left === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        left < 0 ? 'bg-red-50 text-red-700' : left <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {left}
                      </span>
                    )}
                  </td>
                  <td className="td text-end">
                    {!isSelf && (
                      <button
                        onClick={() => setUserToDelete(person)}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50"
                        aria-label={t('people.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">{t('people.delete')}</h2>
            <p className="mt-2 text-slate-600">
              {t('people.delete.confirm').replace('{name}', userToDelete.displayName || userToDelete.email)}
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setUserToDelete(null)} className="btn-soft flex-1">{t('cancel')}</button>
              <button onClick={confirmDeleteUser} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                {t('people.delete.button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
