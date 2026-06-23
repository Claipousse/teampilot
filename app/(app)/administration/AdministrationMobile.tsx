'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, UserPlus, CalendarPlus, Search, X, Trash2, Upload, Plus, AlertTriangle, ChevronRight, ShieldCheck, Copy, Check, KeyRound } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaisonStatus = 'À venir' | 'En cours' | 'Terminée';

type ClubData = {
  nom: string; annee: string; ligue: string;
  email: string; phone: string; adresse: string; ville: string;
  logoUrl: string;
};
type ClubErrors = Partial<Record<keyof Omit<ClubData, 'logoUrl'>, string>>;

type SaisonData = {
  debut: string; fin: string;
  competitions: string; objectif: string;
  statut: SaisonStatus;
};
type SaisonErrors = Partial<Record<keyof SaisonData, string>>;

type StaffMember = {
  id: number; prenom: string; nom: string; role: string;
  email: string; phone: string; since: string;
  photoUrl?: string; notes?: string; isAdmin: boolean;
};
type StaffForm = {
  prenom: string; nom: string; role: string;
  email: string; phone: string; since: string;
  photoUrl: string; notes: string;
  isAdmin: boolean;
};
type StaffErrors = Partial<Record<'prenom' | 'nom' | 'role' | 'email', string>>;

type Credentials = { username: string; temp_password: string };
type ResetUser = { id: number; type: 'player' | 'staff'; firstName: string; lastName: string; detail: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_ROLES = [
  'Coach Principal', 'Coach Adjoint', 'Préparateur Physique',
  'Médecin', 'Kinésithérapeute', 'Manager', 'Modérateur',
  'Scout', 'Analyste Vidéo', 'Intendant', 'Directeur Sportif', 'Psychologue', 'Dirigeant',
] as const;

const SAISON_STATUTS: SaisonStatus[] = ['À venir', 'En cours', 'Terminée'];

const SS: Record<SaisonStatus, { active: string; hover: string; badge: string; text: string; dot: string }> = {
  'À venir':  { active: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]', hover: 'hover:text-[#F97316] hover:border-[#F97316]', badge: 'bg-[#F97316]/10 text-[#F97316]', text: 'text-[#F97316]', dot: 'bg-[#F97316]' },
  'En cours': { active: 'bg-secondary/10 text-secondary border-secondary', hover: 'hover:text-secondary hover:border-secondary',    badge: 'bg-secondary/10 text-secondary',  text: 'text-secondary',  dot: 'bg-secondary' },
  'Terminée': { active: 'bg-error/10 text-error border-error',             hover: 'hover:text-error hover:border-error',            badge: 'bg-error/10 text-error',          text: 'text-error',      dot: 'bg-error' },
};

const EMPTY_CLUB: ClubData = { nom: '', annee: '', ligue: '', email: '', phone: '', adresse: '', ville: '', logoUrl: '' };
const EMPTY_SAISON: SaisonData = { debut: '', fin: '', competitions: '', objectif: '', statut: 'En cours' };
const EMPTY_STAFF: StaffForm = { prenom: '', nom: '', role: '', email: '', phone: '', since: '', photoUrl: '', notes: '', isAdmin: false };

const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-surface-container border ${err ? 'border-error' : 'border-outline-variant'} rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all`;
const labelCls = 'text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block';

// ─── API helpers ──────────────────────────────────────────────────────────────

function clubFromApi(a: Record<string, string>): ClubData {
  return { nom: a.name ?? '', annee: a.founded_year ?? '', ligue: a.league ?? '', email: a.email ?? '', phone: a.phone ?? '', adresse: a.address ?? '', ville: a.city ?? '', logoUrl: a.logo_url ?? '' };
}
function staffFromApi(a: Record<string, string | boolean | null>): StaffMember {
  return { id: a.id as unknown as number, prenom: (a.first_name as string) ?? '', nom: (a.last_name as string) ?? '', role: (a.role as string) ?? '', email: (a.email as string) ?? '', phone: (a.phone as string) ?? '', since: (a.since_date as string) ?? '', photoUrl: (a.photo_url as string) ?? undefined, notes: (a.notes as string) ?? undefined, isAdmin: (a.is_admin as boolean) ?? false };
}
function fmtDate(iso?: string) { return iso ? iso.split('-').reverse().join('/') : ''; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdministrationMobile() {
  const t = useT();

  const [club,          setClub]          = useState<ClubData>(EMPTY_CLUB);
  const [clubOpen,      setClubOpen]      = useState(false);
  const [clubVisible,   setClubVisible]   = useState(false);
  const [clubForm,      setClubForm]      = useState<ClubData>(EMPTY_CLUB);
  const [clubErrors,    setClubErrors]    = useState<ClubErrors>({});
  const clubLogoRef = useRef<HTMLInputElement>(null);

  const [saison,         setSaison]         = useState<SaisonData>(EMPTY_SAISON);
  const [saisonId,       setSaisonId]       = useState<number | null>(null);
  const [saisonOpen,     setSaisonOpen]     = useState(false);
  const [saisonVisible,  setSaisonVisible]  = useState(false);
  const [saisonForm,     setSaisonForm]     = useState<SaisonData>(EMPTY_SAISON);
  const [saisonErrors,   setSaisonErrors]   = useState<SaisonErrors>({});

  const [staff,          setStaff]          = useState<StaffMember[]>([]);
  const [staffSearch,    setStaffSearch]    = useState('');
  const [roleFilters,    setRoleFilters]    = useState<string[]>([]);
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const roleFilterRef = useRef<HTMLDivElement>(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [addForm,    setAddForm]    = useState<StaffForm>(EMPTY_STAFF);
  const [addErrors,  setAddErrors]  = useState<StaffErrors>({});
  const addPhotoRef = useRef<HTMLInputElement>(null);

  const [editOpen,    setEditOpen]    = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editForm,    setEditForm]    = useState<StaffForm>(EMPTY_STAFF);
  const [editErrors,  setEditErrors]  = useState<StaffErrors>({});
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const [credsOpen,    setCredsOpen]    = useState(false);
  const [credsVisible, setCredsVisible] = useState(false);
  const [creds,        setCreds]        = useState<Credentials | null>(null);
  const [credsCopied,  setCredsCopied]  = useState<Record<string, boolean>>({});

  const [resetPwdOpen,    setResetPwdOpen]    = useState(false);
  const [resetPwdVisible, setResetPwdVisible] = useState(false);
  const [resetUsers,      setResetUsers]      = useState<ResetUser[]>([]);
  const [resetQuery,      setResetQuery]      = useState('');
  const [resetingId,      setResetingId]      = useState<number | null>(null);

  const [delOpen,    setDelOpen]    = useState(false);
  const [delVisible, setDelVisible] = useState(false);
  const [delName,    setDelName]    = useState('');
  const [delTimer,   setDelTimer]   = useState(3);
  const delTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDelConfirmed = useRef<(() => void) | null>(null);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const [clubRes, seasonRes, staffRes] = await Promise.all([
      fetch('/api/backend/club'),
      fetch('/api/backend/seasons/active'),
      fetch('/api/backend/staff'),
    ]);
    if (clubRes.ok) setClub(clubFromApi(await clubRes.json()));
    if (seasonRes.ok) {
      const s = await seasonRes.json();
      setSaisonId(s.id);
      setSaison({ debut: s.start_date, fin: s.end_date, competitions: s.competitions, objectif: s.objective, statut: s.status as SaisonStatus });
    }
    if (staffRes.ok) setStaff((await staffRes.json()).map(staffFromApi));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (roleFilterRef.current && !roleFilterRef.current.contains(e.target as Node)) setRoleFilterOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  // ── Computed ────────────────────────────────────────────────────────────────

  const saisonLabel = saison.debut && saison.fin
    ? `${saison.debut.substring(0, 4)} — ${saison.fin.substring(0, 4)}`
    : '— — —';
  const ss = SS[saison.statut] ?? SS['En cours'];

  // ── Club modal ───────────────────────────────────────────────────────────────

  const openClub  = () => { setClubForm(club); setClubErrors({}); setClubOpen(true); setTimeout(() => setClubVisible(true), 10); };
  const closeClub = () => { setClubVisible(false); setTimeout(() => setClubOpen(false), 200); };
  const submitClub = async () => {
    const e: ClubErrors = {};
    if (!clubForm.nom.trim())     e.nom     = t.common.required;
    if (!clubForm.annee.trim())   e.annee   = t.common.required;
    if (!clubForm.ligue.trim())   e.ligue   = t.common.required;
    if (!clubForm.email.trim())   e.email   = t.common.required;
    if (!clubForm.phone.trim())   e.phone   = t.common.required;
    if (!clubForm.adresse.trim()) e.adresse = t.common.required;
    if (!clubForm.ville.trim())   e.ville   = t.common.required;
    if (Object.keys(e).length) { setClubErrors(e); return; }
    const res = await fetch('/api/backend/club', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: clubForm.nom, founded_year: clubForm.annee, league: clubForm.ligue, email: clubForm.email, phone: clubForm.phone, address: clubForm.adresse, city: clubForm.ville }),
    });
    if (res.ok) { setClub(clubForm); closeClub(); }
  };

  // ── Saison modal ─────────────────────────────────────────────────────────────

  const openSaison  = () => { setSaisonForm(saison); setSaisonErrors({}); setSaisonOpen(true); setTimeout(() => setSaisonVisible(true), 10); };
  const closeSaison = () => { setSaisonVisible(false); setTimeout(() => setSaisonOpen(false), 200); };
  const submitSaison = async () => {
    const e: SaisonErrors = {};
    if (!saisonForm.debut)               e.debut        = t.common.required;
    if (!saisonForm.fin)                 e.fin          = t.common.required;
    if (!saisonForm.competitions.trim()) e.competitions = t.common.required;
    if (!saisonForm.objectif.trim())     e.objectif     = t.common.required;
    if (Object.keys(e).length) { setSaisonErrors(e); return; }
    const body = { start_date: saisonForm.debut, end_date: saisonForm.fin, competitions: saisonForm.competitions, objective: saisonForm.objectif, status: saisonForm.statut };
    let res: Response;
    if (saisonId) {
      res = await fetch(`/api/backend/seasons/${saisonId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      res = await fetch('/api/backend/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const created = await res.json();
        setSaisonId(created.id);
        await fetch(`/api/backend/seasons/${created.id}/activate`, { method: 'PATCH' });
      }
    }
    if (res.ok) { setSaison(saisonForm); closeSaison(); }
  };

  // ── Staff add ────────────────────────────────────────────────────────────────

  const openAdd  = () => { setAddForm(EMPTY_STAFF); setAddErrors({}); setAddOpen(true); setTimeout(() => setAddVisible(true), 10); };
  const closeAdd = () => { setAddVisible(false); setTimeout(() => setAddOpen(false), 200); };
  const openCreds = (data: Credentials) => {
    setCreds(data);
    setCredsCopied({});
    setCredsOpen(true);
    setTimeout(() => setCredsVisible(true), 10);
  };
  const closeCreds = () => {
    setCredsVisible(false);
    setTimeout(() => { setCredsOpen(false); setCreds(null); }, 200);
  };
  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCredsCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCredsCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  const openResetPwd = async () => {
    const [playersRes, staffRes] = await Promise.all([
      fetch('/api/backend/players'),
      fetch('/api/backend/staff'),
    ]);
    const players: Record<string, unknown>[] = playersRes.ok ? await playersRes.json() : [];
    const staffList: Record<string, unknown>[] = staffRes.ok ? await staffRes.json() : [];
    setResetUsers([
      ...players.map(p => ({ id: p.id as number, type: 'player' as const, firstName: p.first_name as string, lastName: p.last_name as string, detail: (p.position as string) ?? '' })),
      ...staffList.map(s => ({ id: s.id as number, type: 'staff' as const, firstName: s.first_name as string, lastName: s.last_name as string, detail: (s.role as string) ?? '' })),
    ]);
    setResetQuery('');
    setResetPwdOpen(true);
    setTimeout(() => setResetPwdVisible(true), 10);
  };
  const closeResetPwd = () => { setResetPwdVisible(false); setTimeout(() => setResetPwdOpen(false), 200); };

  const doResetPassword = async (id: number, type: 'player' | 'staff') => {
    setResetingId(id);
    const url = type === 'player' ? `/api/backend/players/${id}/reset-password` : `/api/backend/staff/${id}/reset-password`;
    const res = await fetch(url, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      closeResetPwd();
      openCreds(data);
    }
    setResetingId(null);
  };

  const submitAdd = async () => {
    const e = validateStaff(addForm, false);
    if (Object.keys(e).length) { setAddErrors(e); return; }
    const res = await fetch('/api/backend/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: addForm.prenom, last_name: addForm.nom, role: addForm.role, email: addForm.email, phone: addForm.phone || null, since_date: addForm.since || null, notes: addForm.notes || null, is_admin: addForm.isAdmin }),
    });
    if (res.ok) {
      const created = await res.json();
      setStaff(prev => [...prev, staffFromApi(created)]);
      closeAdd();
      openCreds({ username: created.username, temp_password: created.temp_password });
    } else {
      const err = await res.json().catch(() => ({}));
      setAddErrors({ email: err.detail ?? t.players.errorCreation });
    }
  };

  // ── Staff edit ───────────────────────────────────────────────────────────────

  const openEdit = (m: StaffMember) => {
    setEditingId(m.id);
    setEditForm({ prenom: m.prenom, nom: m.nom, role: m.role, email: m.email, phone: m.phone, since: m.since, photoUrl: m.photoUrl ?? '', notes: m.notes ?? '', isAdmin: m.isAdmin });
    setEditErrors({});
    setEditOpen(true);
    setTimeout(() => setEditVisible(true), 10);
  };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => { setEditOpen(false); setEditingId(null); }, 200); };
  const submitEdit = async () => {
    const e = validateStaff(editForm, true);
    if (Object.keys(e).length) { setEditErrors(e); return; }
    const body = { first_name: editForm.prenom, last_name: editForm.nom, role: editForm.role, email: editForm.email, phone: editForm.phone || null, since_date: editForm.since || null, notes: editForm.notes || null, is_admin: editForm.isAdmin };
    const res = await fetch(`/api/backend/staff/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setStaff(prev => prev.map(m => m.id === editingId ? staffFromApi(updated) : m));
      closeEdit();
    }
  };

  // ── Delete confirmation ───────────────────────────────────────────────────────

  const openDel = (name: string, onConfirmed: () => void) => {
    onDelConfirmed.current = onConfirmed;
    setDelName(name);
    setDelOpen(true);
    setTimeout(() => setDelVisible(true), 10);
  };
  const closeDel = () => {
    setDelVisible(false);
    if (delTimerRef.current) clearInterval(delTimerRef.current);
    setTimeout(() => { setDelOpen(false); setDelName(''); }, 200);
  };
  const confirmDel = () => {
    if (delTimer > 0) return;
    onDelConfirmed.current?.();
    closeDel();
  };

  useEffect(() => {
    if (!delOpen) return;
    setDelTimer(3);
    delTimerRef.current = setInterval(() => {
      setDelTimer(prev => { if (prev <= 1) { clearInterval(delTimerRef.current!); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (delTimerRef.current) clearInterval(delTimerRef.current); };
  }, [delOpen]);

  function validateStaff(f: StaffForm, isEdit: boolean): StaffErrors {
    const e: StaffErrors = {};
    if (!f.prenom.trim()) e.prenom = t.common.required;
    if (!f.nom.trim())    e.nom    = t.common.required;
    if (!f.role)          e.role   = t.common.required;
    void isEdit;
    return e;
  }

  const filteredStaff = staff.filter(m =>
    (roleFilters.length === 0 || roleFilters.includes(m.role)) &&
    (`${m.prenom} ${m.nom}`.toLowerCase().includes(staffSearch.toLowerCase()) ||
     m.role.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  // ── Staff form body ───────────────────────────────────────────────────────────

  const renderStaffForm = (
    form: StaffForm,
    setForm: React.Dispatch<React.SetStateAction<StaffForm>>,
    errors: StaffErrors,
    photoRef: React.RefObject<HTMLInputElement | null>,
    isEdit: boolean,
  ) => {
    const initials = (form.prenom.charAt(0) + form.nom.charAt(0)).toUpperCase() || '?';
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4 pb-5 border-b border-outline-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
            {form.photoUrl ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-on-surface-variant">{initials}</span>}
          </div>
          <div className="space-y-1.5">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setForm(f => ({ ...f, photoUrl: ev.target?.result as string }));
              reader.readAsDataURL(file);
            }} />
            <button onClick={() => photoRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Upload size={14} className="text-on-surface-variant" /> Choisir une photo
            </button>
            {form.photoUrl && <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))} className="text-xs text-error hover:underline block">{t.admin.removePhoto}</button>}
          </div>
        </div>
        {/* Identité */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.sectionIdentity}</p>
          <div>
            <label className={labelCls}>{t.admin.fieldFirstName} <span className="text-error">*</span></label>
            <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className={inputCls(errors.prenom)} placeholder="Ex : Thomas" />
            {errors.prenom && <p className="text-xs text-error mt-1">{errors.prenom}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldLastName} <span className="text-error">*</span></label>
            <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={inputCls(errors.nom)} placeholder="Ex : Laurent" />
            {errors.nom && <p className="text-xs text-error mt-1">{errors.nom}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldRole} <span className="text-error">*</span></label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={`${inputCls(errors.role)} cursor-pointer`}>
              <option value="">{t.admin.selectRolePlaceholder}</option>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{t.admin.roles[r as keyof typeof t.admin.roles] ?? r}</option>)}
            </select>
            {errors.role && <p className="text-xs text-error mt-1">{errors.role}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldEmail} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls(errors.email)} placeholder="nom@club.com" />
            {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldPhone} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls()} placeholder="+33 6 …" />
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldSince} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
            <input type="date" value={form.since} onChange={e => setForm(f => ({ ...f, since: e.target.value }))} className={inputCls()} />
          </div>
        </div>
        {/* Accès & Sécurité */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.sectionAccess}</p>
          {!isEdit && (
            <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <KeyRound size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  {form.prenom && form.nom
                    ? `${form.prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}.${form.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}`
                    : 'prenom.nom'}
                </p>
                <p className="text-xs text-on-surface-variant">{t.admin.autoCredentials}</p>
              </div>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setForm(f => ({ ...f, isAdmin: !f.isAdmin }))} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.isAdmin ? 'bg-[#B45309]' : 'bg-outline-variant'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isAdmin ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <ShieldCheck size={14} className={form.isAdmin ? 'text-[#B45309]' : 'text-outline'} />
                {t.admin.adminRights}
              </p>
              <p className="text-xs text-on-surface-variant/60">{t.admin.adminRightsDesc}</p>
            </div>
          </label>
        </div>
        {/* Notes */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className={labelCls}>{t.admin.fieldNotes} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder={t.admin.notesPlaceholder}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-on-surface">Administration</h1>

      {/* ── Club Info ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
              {club.logoUrl ? <img src={club.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🏟️</span>}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">{club.nom || '—'}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {club.annee ? `${t.dashboard.founded} ${club.annee}` : ''}{club.annee && club.ligue ? ' · ' : ''}{club.ligue}
              </p>
            </div>
          </div>
          <button onClick={openClub} className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shrink-0">
            <Pencil size={16} className="text-on-surface-variant" />
          </button>
        </div>
        <div className="space-y-3 pt-4 border-t border-outline-variant">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t.admin.mainContact}</p>
            <p className="text-base font-semibold text-on-surface">{club.email || '—'}</p>
            <p className="text-sm text-on-surface-variant">{club.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t.admin.headquarters}</p>
            <p className="text-base font-semibold text-on-surface">{club.adresse || '—'}</p>
            <p className="text-sm text-on-surface-variant">{club.ville}</p>
          </div>
        </div>
      </div>

      {/* ── Saison Active ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-on-surface">{t.admin.activeSeason}</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${ss.badge}`}>{saisonLabel}</span>
            <button onClick={openSaison} className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Pencil size={13} /> {t.admin.editSeason}
            </button>
          </div>
        </div>
        <div>
          {[
            { label: t.admin.fieldSeasonStart,  value: fmtDate(saison.debut) || '—' },
            { label: t.admin.fieldSeasonEnd,    value: fmtDate(saison.fin) || '—' },
            { label: t.admin.fieldCompetitions, value: saison.competitions || '—' },
            { label: t.admin.fieldObjective,    value: saison.objectif || '—' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-3.5 border-b border-outline-variant">
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{row.label}</p>
              <p className="text-base font-semibold text-on-surface">{row.value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-3.5">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.fieldStatus}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${ss.dot}`} />
              <p className={`text-base font-semibold ${ss.text}`}>{t.admin.statuses[saison.statut]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <h2 className="text-xl font-bold text-on-surface mb-4">{t.admin.actions}</h2>
        <div className="space-y-3">
          <a href="/joueurs?new=true" className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0"><UserPlus size={20} className="text-primary" /></div>
              <div>
                <p className="text-base font-bold text-on-surface">{t.admin.addPlayerAction}</p>
                <p className="text-sm text-on-surface-variant">{t.admin.addPlayerDesc}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </a>
          <a href="/calendrier?new=true" className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0"><CalendarPlus size={20} className="text-secondary" /></div>
              <div>
                <p className="text-base font-bold text-on-surface">{t.admin.scheduleEvent}</p>
                <p className="text-sm text-on-surface-variant">{t.admin.scheduleEventDesc}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </a>
          <button onClick={openResetPwd} className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0"><KeyRound size={20} className="text-[#F97316]" /></div>
              <div>
                <p className="text-base font-bold text-on-surface">{t.admin.resetPassword}</p>
                <p className="text-sm text-on-surface-variant">{t.admin.resetPasswordDesc}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
          </button>
        </div>
      </div>

      {/* ── Gérer le staff ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-on-surface">{t.admin.manageStaff}</h2>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shrink-0">
            <Plus size={15} /> {t.common.add}
          </button>
        </div>
        <p className="text-xs text-on-surface-variant/60 mb-4">{staff.length} {staff.length > 1 ? t.admin.staffCountPlural : t.admin.staffCount}</p>

        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" size={16} />
            <input type="text" placeholder={t.admin.searchStaff} value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all" />
          </div>
          <div ref={roleFilterRef} className="relative">
            <button onClick={() => setRoleFilterOpen(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm font-semibold transition-colors ${roleFilters.length > 0 ? 'bg-primary/10 text-primary border-primary' : 'bg-surface-container border-outline-variant text-on-surface'}`}>
              <span>{roleFilters.length > 0 ? `${roleFilters.length} ${t.admin.filterRoles}` : t.admin.filterRoles}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform shrink-0 ${roleFilterOpen ? 'rotate-180' : ''}`}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {roleFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.roleFilter}</p>
                  {roleFilters.length > 0 && <button onClick={() => setRoleFilters([])} className="text-xs text-primary font-semibold">{t.admin.clearFilter}</button>}
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {STAFF_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container cursor-pointer transition-colors active:bg-surface-container">
                      <input type="checkbox" checked={roleFilters.includes(role)} onChange={() => setRoleFilters(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])} className="w-4 h-4 rounded accent-primary" />
                      <span className="text-sm text-on-surface">{t.admin.roles[role as keyof typeof t.admin.roles] ?? role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-6">{t.admin.noStaff}</p>
        ) : (
          <div className="space-y-2">
            {filteredStaff.map(m => {
              const initials = (m.prenom.charAt(0) + m.nom.charAt(0)).toUpperCase();
              return (
                <div key={m.id} onClick={() => openEdit(m)} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl cursor-pointer active:scale-[0.99] transition-all hover:bg-surface-container-high">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                    {m.photoUrl ? <img src={m.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-on-surface-variant">{initials}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-on-surface">{m.prenom} {m.nom}</p>
                      {m.isAdmin && <span className="text-xs font-bold text-[#B45309] bg-[#B45309]/10 px-1.5 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant">{t.admin.roles[m.role as keyof typeof t.admin.roles] ?? m.role}</p>
                  </div>
                  <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS
      ═════════════════════════════════════════════════════════════════════════ */}

      {/* ── Modal profil club ── */}
      {clubOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${clubVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeClub} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${clubVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.admin.editProfile}</p>
                <button onClick={closeClub} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div className="flex items-center gap-4 pb-5 border-b border-outline-variant">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
                    {clubForm.logoUrl ? <img src={clubForm.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🏟️</span>}
                  </div>
                  <div className="space-y-1.5">
                    <input ref={clubLogoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setClubForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }} />
                    <button onClick={() => clubLogoRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
                      <Upload size={14} /> {t.admin.uploadLogo}
                    </button>
                    {clubForm.logoUrl && <button onClick={() => setClubForm(f => ({ ...f, logoUrl: '' }))} className="text-xs text-error hover:underline block">{t.admin.removeLogo}</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.clubIdentity}</p>
                  <div>
                    <label className={labelCls}>{t.admin.fieldClubName} <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.nom} onChange={e => setClubForm(f => ({ ...f, nom: e.target.value }))} className={inputCls(clubErrors.nom)} placeholder="Ex : Metropolis United FC" />
                    {clubErrors.nom && <p className="text-xs text-error mt-1">{clubErrors.nom}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t.admin.fieldYear} <span className="text-error">*</span></label>
                      <input type="text" value={clubForm.annee} onChange={e => setClubForm(f => ({ ...f, annee: e.target.value }))} className={inputCls(clubErrors.annee)} placeholder="1924" />
                      {clubErrors.annee && <p className="text-xs text-error mt-1">{clubErrors.annee}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>{t.admin.fieldLeague} <span className="text-error">*</span></label>
                      <input type="text" value={clubForm.ligue} onChange={e => setClubForm(f => ({ ...f, ligue: e.target.value }))} className={inputCls(clubErrors.ligue)} placeholder="Elite Pro…" />
                      {clubErrors.ligue && <p className="text-xs text-error mt-1">{clubErrors.ligue}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t.admin.fieldEmail} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
                    <input type="email" value={clubForm.email} onChange={e => setClubForm(f => ({ ...f, email: e.target.value }))} className={inputCls(clubErrors.email)} placeholder="admin@club.com" />
                    {clubErrors.email && <p className="text-xs text-error mt-1">{clubErrors.email}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.admin.fieldPhone} <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.phone} onChange={e => setClubForm(f => ({ ...f, phone: e.target.value }))} className={inputCls(clubErrors.phone)} placeholder="+44 20 7946 0012" />
                    {clubErrors.phone && <p className="text-xs text-error mt-1">{clubErrors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.admin.fieldAddress} <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.adresse} onChange={e => setClubForm(f => ({ ...f, adresse: e.target.value }))} className={inputCls(clubErrors.adresse)} placeholder="Ex : United Training Complex" />
                    {clubErrors.adresse && <p className="text-xs text-error mt-1">{clubErrors.adresse}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.admin.fieldCityPostcode} <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.ville} onChange={e => setClubForm(f => ({ ...f, ville: e.target.value }))} className={inputCls(clubErrors.ville)} placeholder="London, SE1 7PB, UK" />
                    {clubErrors.ville && <p className="text-xs text-error mt-1">{clubErrors.ville}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end px-5 py-4 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeClub} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitClub} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal saison ── */}
      {saisonOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${saisonVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeSaison} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${saisonVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.admin.editActiveSeason}</p>
                <button onClick={closeSaison} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.seasonLabel}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t.admin.fieldSeasonStart} <span className="text-error">*</span></label>
                    <input type="date" value={saisonForm.debut} onChange={e => setSaisonForm(f => ({ ...f, debut: e.target.value }))} className={inputCls(saisonErrors.debut)} />
                    {saisonErrors.debut && <p className="text-xs text-error mt-1">{saisonErrors.debut}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.admin.fieldSeasonEnd} <span className="text-error">*</span></label>
                    <input type="date" value={saisonForm.fin} onChange={e => setSaisonForm(f => ({ ...f, fin: e.target.value }))} className={inputCls(saisonErrors.fin)} />
                    {saisonErrors.fin && <p className="text-xs text-error mt-1">{saisonErrors.fin}</p>}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/60">{t.admin.seasonAuto}</p>
                <div>
                  <label className={labelCls}>{t.admin.fieldCompetitions} <span className="text-error">*</span></label>
                  <input type="text" value={saisonForm.competitions} onChange={e => setSaisonForm(f => ({ ...f, competitions: e.target.value }))} className={inputCls(saisonErrors.competitions)} placeholder="Premier League · FA Cup" />
                  {saisonErrors.competitions && <p className="text-xs text-error mt-1">{saisonErrors.competitions}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t.admin.fieldObjective} <span className="text-error">*</span></label>
                  <input type="text" value={saisonForm.objectif} onChange={e => setSaisonForm(f => ({ ...f, objectif: e.target.value }))} className={inputCls(saisonErrors.objectif)} placeholder="Top 4 · Quart FA Cup" />
                  {saisonErrors.objectif && <p className="text-xs text-error mt-1">{saisonErrors.objectif}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t.admin.fieldStatus} <span className="text-error">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {SAISON_STATUTS.map(st => {
                      const style = SS[st];
                      return (
                        <button key={st} onClick={() => setSaisonForm(f => ({ ...f, statut: st }))}
                          className={`px-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${saisonForm.statut === st ? style.active : `bg-surface-container text-on-surface-variant border-outline-variant ${style.hover}`}`}>
                          {t.admin.statuses[st]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end px-5 py-4 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeSaison} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitSaison} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal ajouter staff ── */}
      {addOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${addVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeAdd} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${addVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.admin.addMemberTitle}</p>
                <button onClick={closeAdd} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              {renderStaffForm(addForm, setAddForm, addErrors, addPhotoRef, false)}
              <div className="flex items-center justify-end px-5 py-4 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeAdd} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitAdd} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.add}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal modifier staff ── */}
      {editOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">{t.admin.editMember}</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              {renderStaffForm(editForm, setEditForm, editErrors, editPhotoRef, true)}
              <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant shrink-0">
                <button
                  onClick={() => openDel(`${editForm.prenom} ${editForm.nom}`, async () => {
                    await fetch(`/api/backend/staff/${editingId}`, { method: 'DELETE' });
                    setStaff(prev => prev.filter(m => m.id !== editingId));
                    closeEdit();
                  })}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold text-sm">
                  <Trash2 size={15} /> {t.common.delete}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                  <button onClick={submitEdit} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal identifiants ── */}
      {/* ── Modal réinitialiser un mot de passe ── */}
      {resetPwdOpen && (
        <>
          <div className={`fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${resetPwdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeResetPwd} />
          <div className="fixed inset-0 z-[75] flex items-end justify-center pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-t-2xl shadow-2xl w-full max-w-lg pointer-events-auto transition-all duration-200 ${resetPwdVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} flex flex-col max-h-[85vh]`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
                    <KeyRound size={18} className="text-[#F97316]" />
                  </div>
                  <p className="text-base font-bold text-on-surface">{t.admin.resetPassword}</p>
                </div>
                <button onClick={closeResetPwd} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="px-5 py-3 border-b border-outline-variant shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={resetQuery}
                    onChange={e => setResetQuery(e.target.value)}
                    placeholder={t.admin.searchMember}
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/50">
                {resetUsers
                  .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(resetQuery.toLowerCase()) || u.detail.toLowerCase().includes(resetQuery.toLowerCase()))
                  .map(u => (
                    <div key={`${u.type}-${u.id}`} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${u.type === 'player' ? 'bg-primary' : 'bg-secondary'}`}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-on-surface-variant">
                            {u.type === 'player'
                              ? (t.players.positions[u.detail as keyof typeof t.players.positions] ?? u.detail)
                              : (t.admin.roles[u.detail as keyof typeof t.admin.roles] ?? u.detail)}
                            {' · '}
                            {u.type === 'player' ? t.profile.rolePlayer : 'Staff'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => doResetPassword(u.id, u.type)}
                        disabled={resetingId === u.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#F97316] hover:bg-[#F97316]/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <KeyRound size={12} />
                        {resetingId === u.id ? '...' : t.admin.resetAction}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {credsOpen && creds && (
        <>
          <div className={`fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${credsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto transition-all duration-200 ${credsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-primary/5 border-b border-primary/20 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">{t.admin.accountCreated}</p>
                  <p className="text-xs text-on-surface-variant">{t.admin.shareCredentials}</p>
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                {([
                  { label: t.admin.credentialUsername, key: 'username', value: creds.username },
                  { label: t.admin.credentialTempPassword, key: 'password', value: creds.temp_password },
                ] as const).map(item => (
                  <div key={item.key} className="space-y-1.5">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{item.label}</p>
                    <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl border border-outline-variant">
                      <code className="flex-1 text-base font-mono text-on-surface">{item.value}</code>
                      <button onClick={() => copyField(item.key, item.value)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors shrink-0">
                        {credsCopied[item.key] ? <Check size={15} className="text-secondary" /> : <Copy size={15} className="text-on-surface-variant" />}
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-on-surface-variant">{t.admin.memberFirstLoginHint}</p>
              </div>
              <div className="flex justify-end px-5 pb-5">
                <button onClick={closeCreds} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">
                  {t.admin.understood}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal confirmation suppression ── */}
      {delOpen && (
        <>
          <div className={`fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${delVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto transition-all duration-200 ${delVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-error/5 border-b border-error/20 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0"><AlertTriangle size={20} className="text-error" /></div>
                <div>
                  <p className="text-base font-bold text-error">{t.players.deleteIrreversible}</p>
                  <p className="text-xs text-on-surface-variant">{t.players.deleteCannotUndo}</p>
                </div>
              </div>
              <div className="px-5 py-5 space-y-3">
                <p className="text-base text-on-surface">Vous allez supprimer définitivement <strong className="text-error">{delName}</strong>.</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">Cette opération est irréversible. Le compte associé sera désactivé.</p>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 pb-5">
                <button onClick={closeDel} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={confirmDel} disabled={delTimer > 0}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm ${delTimer > 0 ? 'bg-error/30 text-error/50 cursor-not-allowed' : 'bg-error hover:bg-error/90 text-white'}`}>
                  <Trash2 size={14} />
                  {delTimer > 0 ? `${t.common.confirm} (${delTimer}s)` : t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
