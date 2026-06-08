'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, UserPlus, CalendarPlus, Search, X, Trash2, Upload, Plus, AlertTriangle, ShieldCheck, Copy, Check, KeyRound } from 'lucide-react';
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

export default function AdministrationDesktop() {
  const t = useT();

  // Club
  const [club,         setClub]         = useState<ClubData>(EMPTY_CLUB);
  const [clubOpen,     setClubOpen]     = useState(false);
  const [clubVisible,  setClubVisible]  = useState(false);
  const [clubForm,     setClubForm]     = useState<ClubData>(EMPTY_CLUB);
  const [clubErrors,   setClubErrors]   = useState<ClubErrors>({});
  const clubLogoRef = useRef<HTMLInputElement>(null);

  // Saison
  const [saison,       setSaison]       = useState<SaisonData>(EMPTY_SAISON);
  const [saisonId,     setSaisonId]     = useState<number | null>(null);
  const [saisonOpen,   setSaisonOpen]   = useState(false);
  const [saisonVisible,setSaisonVisible]= useState(false);
  const [saisonForm,   setSaisonForm]   = useState<SaisonData>(EMPTY_SAISON);
  const [saisonErrors, setSaisonErrors] = useState<SaisonErrors>({});

  // Staff
  const [staff,           setStaff]           = useState<StaffMember[]>([]);
  const [staffSearch,     setStaffSearch]     = useState('');
  const [roleFilters,     setRoleFilters]     = useState<string[]>([]);
  const [roleFilterOpen,  setRoleFilterOpen]  = useState(false);
  const roleFilterRef = useRef<HTMLDivElement>(null);
  const [addOpen,         setAddOpen]         = useState(false);
  const [addVisible,      setAddVisible]      = useState(false);
  const [addForm,         setAddForm]         = useState<StaffForm>(EMPTY_STAFF);
  const [addErrors,       setAddErrors]       = useState<StaffErrors>({});
  const addPhotoRef = useRef<HTMLInputElement>(null);

  const [editOpen,        setEditOpen]        = useState(false);
  const [editVisible,     setEditVisible]     = useState(false);
  const [editForm,        setEditForm]        = useState<StaffForm>(EMPTY_STAFF);
  const [editErrors,      setEditErrors]      = useState<StaffErrors>({});
  const [editingId,       setEditingId]       = useState<number | null>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const [credsOpen,    setCredsOpen]    = useState(false);
  const [credsVisible, setCredsVisible] = useState(false);
  const [creds,        setCreds]        = useState<Credentials | null>(null);
  const [credsCopied,  setCredsCopied]  = useState<'user' | 'pass' | null>(null);

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

  // Close role filter on outside click
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

  const openClub = () => { setClubForm(club); setClubErrors({}); setClubOpen(true); setTimeout(() => setClubVisible(true), 10); };
  const closeClub = () => { setClubVisible(false); setTimeout(() => setClubOpen(false), 200); };
  const submitClub = async () => {
    const e: ClubErrors = {};
    if (!clubForm.nom.trim())    e.nom    = 'Champ obligatoire';
    if (!clubForm.annee.trim())  e.annee  = 'Champ obligatoire';
    if (!clubForm.ligue.trim())  e.ligue  = 'Champ obligatoire';
    if (!clubForm.email.trim())  e.email  = 'Champ obligatoire';
    if (!clubForm.phone.trim())  e.phone  = 'Champ obligatoire';
    if (!clubForm.adresse.trim()) e.adresse = 'Champ obligatoire';
    if (!clubForm.ville.trim())  e.ville  = 'Champ obligatoire';
    if (Object.keys(e).length) { setClubErrors(e); return; }
    const res = await fetch('/api/backend/club', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: clubForm.nom, founded_year: clubForm.annee, league: clubForm.ligue, email: clubForm.email, phone: clubForm.phone, address: clubForm.adresse, city: clubForm.ville }),
    });
    if (res.ok) { setClub(clubForm); closeClub(); }
  };

  // ── Saison modal ─────────────────────────────────────────────────────────────

  const openSaison = () => { setSaisonForm(saison); setSaisonErrors({}); setSaisonOpen(true); setTimeout(() => setSaisonVisible(true), 10); };
  const closeSaison = () => { setSaisonVisible(false); setTimeout(() => setSaisonOpen(false), 200); };
  const submitSaison = async () => {
    const e: SaisonErrors = {};
    if (!saisonForm.debut)              e.debut        = 'Champ obligatoire';
    if (!saisonForm.fin)                e.fin          = 'Champ obligatoire';
    if (!saisonForm.competitions.trim()) e.competitions = 'Champ obligatoire';
    if (!saisonForm.objectif.trim())    e.objectif     = 'Champ obligatoire';
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

  const openAdd = () => { setAddForm(EMPTY_STAFF); setAddErrors({}); setAddOpen(true); setTimeout(() => setAddVisible(true), 10); };
  const closeAdd = () => { setAddVisible(false); setTimeout(() => setAddOpen(false), 200); };
  const openCreds = (c: Credentials) => {
    setCreds(c); setCredsCopied(null);
    setCredsOpen(true); setTimeout(() => setCredsVisible(true), 10);
  };
  const closeCreds = () => { setCredsVisible(false); setTimeout(() => { setCredsOpen(false); setCreds(null); }, 200); };
  const copyToClipboard = (text: string, which: 'user' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCredsCopied(which);
    setTimeout(() => setCredsCopied(null), 2000);
  };

  const submitAdd = async () => {
    const e = validateStaff(addForm);
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
      setAddErrors({ email: err.detail ?? 'Erreur lors de la création.' });
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
    const e = validateStaff(editForm);
    if (Object.keys(e).length) { setEditErrors(e); return; }
    const body: Record<string, unknown> = { first_name: editForm.prenom, last_name: editForm.nom, role: editForm.role, email: editForm.email, phone: editForm.phone || null, since_date: editForm.since || null, notes: editForm.notes || null, is_admin: editForm.isAdmin };
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
      openCreds({ username: data.username, temp_password: data.temp_password });
    }
    setResetingId(null);
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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function validateStaff(f: StaffForm): StaffErrors {
    const e: StaffErrors = {};
    if (!f.prenom.trim()) e.prenom = 'Champ obligatoire';
    if (!f.nom.trim())    e.nom    = 'Champ obligatoire';
    if (!f.role)          e.role   = 'Champ obligatoire';
    if (!f.email.trim())  e.email  = 'Champ obligatoire';
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
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

        {/* Photo */}
        <div className="flex items-center gap-5 pb-6 border-b border-outline-variant">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
            {form.photoUrl
              ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-on-surface-variant">{initials}</span>
            }
          </div>
          <div className="space-y-2">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setForm(f => ({ ...f, photoUrl: ev.target?.result as string }));
              reader.readAsDataURL(file);
            }} />
            <button onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Upload size={15} className="text-on-surface-variant" /> Choisir une photo
            </button>
            {form.photoUrl && (
              <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))} className="text-xs text-error hover:underline block">
                Retirer la photo
              </button>
            )}
            <p className="text-xs text-on-surface-variant/60">JPG, PNG ou WebP</p>
          </div>
        </div>

        {/* Identité */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Identité</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.admin.fieldFirstName} <span className="text-error">*</span></label>
              <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className={inputCls(errors.prenom)} placeholder="Ex : Thomas" />
              {errors.prenom && <p className="text-xs text-error mt-1">{errors.prenom}</p>}
            </div>
            <div>
              <label className={labelCls}>{t.admin.fieldLastName} <span className="text-error">*</span></label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className={inputCls(errors.nom)} placeholder="Ex : Laurent" />
              {errors.nom && <p className="text-xs text-error mt-1">{errors.nom}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldRole} <span className="text-error">*</span></label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={`${inputCls(errors.role)} cursor-pointer`}>
              <option value="">Sélectionner un rôle…</option>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{t.admin.roles[r as keyof typeof t.admin.roles] ?? r}</option>)}
            </select>
            {errors.role && <p className="text-xs text-error mt-1">{errors.role}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email <span className="text-error">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls(errors.email)} placeholder="nom@club.com" />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Téléphone <span className="font-normal normal-case opacity-60">(optionnel)</span></label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls()} placeholder="+33 6 …" />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t.admin.fieldSince} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
            <input type="date" value={form.since} onChange={e => setForm(f => ({ ...f, since: e.target.value }))}
              className={inputCls()} />
          </div>
        </div>

        {/* Accès & Sécurité */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Accès &amp; Sécurité</p>
          <div>
            <label className={labelCls}>Identifiant de connexion</label>
            <div className="px-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-base text-on-surface-variant font-mono">
              {form.prenom && form.nom
                ? `${form.prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}.${form.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}`
                : <span className="opacity-40">prenom.nom</span>
              }
            </div>
            <p className="text-xs text-on-surface-variant/60 mt-1">Généré automatiquement — le mot de passe temporaire sera affiché après création.</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, isAdmin: !f.isAdmin }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.isAdmin ? 'bg-[#B45309]' : 'bg-outline-variant'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isAdmin ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <ShieldCheck size={15} className={form.isAdmin ? 'text-[#B45309]' : 'text-outline'} />
                Droits administrateur
              </p>
              <p className="text-xs text-on-surface-variant/60">Accès à l&apos;administration, CRUD complet</p>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className={labelCls}>Notes <span className="font-normal normal-case opacity-60">(optionnel)</span></label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} placeholder="Informations complémentaires, observations…"
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>

      </div>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 overflow-y-auto">

      {/* ── Club Info ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-surface-container-high rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
              {club.logoUrl
                ? <img src={club.logoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-3xl">🏟️</span>
              }
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{club.nom || '—'}</h1>
              <p className="text-base text-on-surface-variant mt-1">
                {club.annee ? `Fondé en ${club.annee}` : ''}{club.annee && club.ligue ? ' · ' : ''}{club.ligue}
              </p>
            </div>
          </div>
          <button onClick={openClub}
            className="flex items-center gap-2 px-5 py-3 border-2 border-outline-variant rounded-xl text-base font-semibold text-on-surface hover:bg-surface-container transition-colors">
            <Pencil size={18} /> {t.admin.editProfile}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-outline-variant">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Contact principal</p>
            <p className="text-base font-semibold text-on-surface">{club.email || '—'}</p>
            <p className="text-sm text-on-surface-variant">{club.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Siège social</p>
            <p className="text-base font-semibold text-on-surface">{club.adresse || '—'}</p>
            <p className="text-sm text-on-surface-variant">{club.ville}</p>
          </div>
        </div>
      </div>

      {/* ── Saison + Actions ── */}
      <div className="grid grid-cols-2 gap-5 items-stretch">

        {/* Saison Active */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-on-surface">{t.admin.activeSeason}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${ss.badge}`}>{saisonLabel}</span>
              <button onClick={openSaison}
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
                <Pencil size={15} /> Modifier
              </button>
            </div>
          </div>
          <div className="flex-1">
            {[
              { label: t.admin.fieldSeasonStart, value: fmtDate(saison.debut) || '—' },
              { label: t.admin.fieldSeasonEnd,   value: fmtDate(saison.fin) || '—' },
              { label: t.admin.fieldCompetitions, value: saison.competitions || '—' },
              { label: t.admin.fieldObjective,   value: saison.objectif || '—' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-outline-variant">
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{row.label}</p>
                <p className="text-base font-semibold text-on-surface">{row.value}</p>
              </div>
            ))}
            <div className="flex items-center justify-between py-4">
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.fieldStatus}</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ss.dot}`} />
                <p className={`text-base font-semibold ${ss.text}`}>{t.admin.statuses[saison.statut]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-on-surface mb-6">Actions</h2>
          <div className="flex flex-col gap-4 flex-1">
            <a href="/joueurs?new=true" className="flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <UserPlus size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Ajouter un joueur</p>
                  <p className="text-sm text-on-surface-variant">Créer un nouveau profil joueur dans l&apos;effectif</p>
                </div>
              </div>
            </a>
            <a href="/calendrier?new=true" className="flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                  <CalendarPlus size={22} className="text-secondary" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Planifier un événement</p>
                  <p className="text-sm text-on-surface-variant">Ajouter un entraînement, match ou réunion au calendrier</p>
                </div>
              </div>
            </a>
            <button onClick={openResetPwd} className="w-full flex items-center justify-between p-5 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0">
                  <KeyRound size={22} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Réinitialiser un mot de passe</p>
                  <p className="text-sm text-on-surface-variant">Générer de nouveaux identifiants pour un membre</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Gérer le staff ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-xl font-bold text-on-surface">{t.admin.manageStaff}</h2>
          <span className="text-xs text-on-surface-variant/60">
            {staff.length} {staff.length > 1 ? t.admin.staffCountPlural : t.admin.staffCount}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" size={16} />
            <input type="text" placeholder={t.admin.searchStaff} value={staffSearch}
              onChange={e => setStaffSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all w-52" />
          </div>

          <div ref={roleFilterRef} className="relative">
            <button onClick={() => setRoleFilterOpen(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-colors ${
                roleFilters.length > 0
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}>
              Rôle{roleFilters.length > 0 ? ` (${roleFilters.length})` : 's'}
              <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${roleFilterOpen ? 'rotate-180' : ''}`}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>

            {roleFilterOpen && (
              <div className="absolute top-full left-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 min-w-[220px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.admin.filterRoles}</p>
                  {roleFilters.length > 0 && (
                    <button onClick={() => setRoleFilters([])} className="text-xs text-primary font-semibold hover:underline">Effacer</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {STAFF_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container cursor-pointer transition-colors">
                      <input type="checkbox" checked={roleFilters.includes(role)}
                        onChange={() => setRoleFilters(prev =>
                          prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                        )}
                        className="w-4 h-4 rounded accent-primary cursor-pointer" />
                      <span className="text-sm text-on-surface">{t.admin.roles[role as keyof typeof t.admin.roles] ?? role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(staffSearch || roleFilters.length > 0) && (
            <p className="text-sm text-on-surface-variant">{filteredStaff.length} {filteredStaff.length > 1 ? t.admin.resultsPlural : t.admin.results}</p>
          )}

          <button onClick={openAdd}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={16} /> {t.admin.addMember}
          </button>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant">
            <p className="text-base">{t.admin.noStaff}</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/50">
            {filteredStaff.map(m => {
              const initials = (m.prenom.charAt(0) + m.nom.charAt(0)).toUpperCase();
              return (
                <div key={m.id} className="flex items-center gap-5 py-4 group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-base font-bold text-on-surface-variant">{initials}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-on-surface">{m.prenom} {m.nom}</p>
                      {m.isAdmin && <span className="text-xs font-bold text-[#B45309] bg-[#B45309]/10 px-2 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant">{t.admin.roles[m.role as keyof typeof t.admin.roles] ?? m.role}</p>
                  </div>
                  <p className="text-sm text-on-surface-variant hidden lg:block min-w-0 truncate max-w-[200px]">{m.email}</p>
                  {m.phone && <p className="text-sm text-on-surface-variant hidden xl:block shrink-0">{m.phone}</p>}
                  {m.since && <p className="text-sm text-on-surface-variant/60 shrink-0 hidden xl:block">Depuis {fmtDate(m.since)}</p>}
                  <button onClick={() => openEdit(m)}
                    className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100">
                    <Pencil size={14} /> Modifier
                  </button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${clubVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.admin.editProfile} - {t.admin.clubProfile}</p>
                <button onClick={closeClub} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                <div className="flex items-center gap-5 pb-6 border-b border-outline-variant">
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
                    {clubForm.logoUrl ? <img src={clubForm.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🏟️</span>}
                  </div>
                  <div className="space-y-2">
                    <input ref={clubLogoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setClubForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }} />
                    <button onClick={() => clubLogoRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
                      <Upload size={15} className="text-on-surface-variant" /> Changer le logo
                    </button>
                    {clubForm.logoUrl && <button onClick={() => setClubForm(f => ({ ...f, logoUrl: '' }))} className="text-xs text-error hover:underline block">Retirer le logo</button>}
                    <p className="text-xs text-on-surface-variant/60">JPG, PNG ou WebP</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Identité du club</p>
                  <div>
                    <label className={labelCls}>Nom du club <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.nom} onChange={e => setClubForm(f => ({ ...f, nom: e.target.value }))} className={inputCls(clubErrors.nom)} placeholder="Ex : Metropolis United FC" />
                    {clubErrors.nom && <p className="text-xs text-error mt-1">{clubErrors.nom}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Année de fondation <span className="text-error">*</span></label>
                      <input type="text" value={clubForm.annee} onChange={e => setClubForm(f => ({ ...f, annee: e.target.value }))} className={inputCls(clubErrors.annee)} placeholder="Ex : 1924" />
                      {clubErrors.annee && <p className="text-xs text-error mt-1">{clubErrors.annee}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Ligue / Compétition <span className="text-error">*</span></label>
                      <input type="text" value={clubForm.ligue} onChange={e => setClubForm(f => ({ ...f, ligue: e.target.value }))} className={inputCls(clubErrors.ligue)} placeholder="Ex : Elite Pro League" />
                      {clubErrors.ligue && <p className="text-xs text-error mt-1">{clubErrors.ligue}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-outline-variant">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-error">*</span></label>
                      <input type="email" value={clubForm.email} onChange={e => setClubForm(f => ({ ...f, email: e.target.value }))} className={inputCls(clubErrors.email)} placeholder="admin@club.com" />
                      {clubErrors.email && <p className="text-xs text-error mt-1">{clubErrors.email}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Téléphone <span className="text-error">*</span></label>
                      <input type="text" value={clubForm.phone} onChange={e => setClubForm(f => ({ ...f, phone: e.target.value }))} className={inputCls(clubErrors.phone)} placeholder="+44 20 7946 0012" />
                      {clubErrors.phone && <p className="text-xs text-error mt-1">{clubErrors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Adresse <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.adresse} onChange={e => setClubForm(f => ({ ...f, adresse: e.target.value }))} className={inputCls(clubErrors.adresse)} placeholder="Ex : United Training Complex" />
                    {clubErrors.adresse && <p className="text-xs text-error mt-1">{clubErrors.adresse}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Ville / Code postal <span className="text-error">*</span></label>
                    <input type="text" value={clubForm.ville} onChange={e => setClubForm(f => ({ ...f, ville: e.target.value }))} className={inputCls(clubErrors.ville)} placeholder="Ex : London, SE1 7PB, UK" />
                    {clubErrors.ville && <p className="text-xs text-error mt-1">{clubErrors.ville}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-7 py-5 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeClub} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitClub} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal saison ── */}
      {saisonOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${saisonVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeSaison} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${saisonVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-on-surface">Modifier la saison active</p>
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${SS[saisonForm.statut]?.badge ?? ''}`}>
                    {saisonForm.debut && saisonForm.fin ? `${saisonForm.debut.substring(0, 4)} — ${saisonForm.fin.substring(0, 4)}` : '— — —'}
                  </span>
                </div>
                <button onClick={closeSaison} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Saison</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Début de saison <span className="text-error">*</span></label>
                      <input type="date" value={saisonForm.debut} onChange={e => setSaisonForm(f => ({ ...f, debut: e.target.value }))} className={inputCls(saisonErrors.debut)} />
                      {saisonErrors.debut && <p className="text-xs text-error mt-1">{saisonErrors.debut}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Fin de saison <span className="text-error">*</span></label>
                      <input type="date" value={saisonForm.fin} onChange={e => setSaisonForm(f => ({ ...f, fin: e.target.value }))} className={inputCls(saisonErrors.fin)} />
                      {saisonErrors.fin && <p className="text-xs text-error mt-1">{saisonErrors.fin}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant/60 -mt-2">L&apos;intitulé de saison est calculé automatiquement depuis ces dates.</p>
                  <div>
                    <label className={labelCls}>Compétitions <span className="text-error">*</span></label>
                    <input type="text" value={saisonForm.competitions} onChange={e => setSaisonForm(f => ({ ...f, competitions: e.target.value }))} className={inputCls(saisonErrors.competitions)} placeholder="Ex : Premier League · FA Cup" />
                    {saisonErrors.competitions && <p className="text-xs text-error mt-1">{saisonErrors.competitions}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Objectif <span className="text-error">*</span></label>
                    <input type="text" value={saisonForm.objectif} onChange={e => setSaisonForm(f => ({ ...f, objectif: e.target.value }))} className={inputCls(saisonErrors.objectif)} placeholder="Ex : Top 4 · Quart FA Cup" />
                    {saisonErrors.objectif && <p className="text-xs text-error mt-1">{saisonErrors.objectif}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Statut <span className="text-error">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {SAISON_STATUTS.map(st => {
                        const style = SS[st];
                        return (
                          <button key={st} onClick={() => setSaisonForm(f => ({ ...f, statut: st }))}
                            className={`px-3 py-3 rounded-xl text-sm font-bold transition-all border ${saisonForm.statut === st ? style.active : `bg-surface-container text-on-surface-variant border-outline-variant ${style.hover}`}`}>
                            {t.admin.statuses[st]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-7 py-5 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeSaison} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitSaison} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal ajouter staff ── */}
      {addOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${addVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeAdd} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${addVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.admin.addMemberTitle}</p>
                <button onClick={closeAdd} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              {renderStaffForm(addForm, setAddForm, addErrors, addPhotoRef, false)}
              <div className="flex items-center justify-end px-7 py-5 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeAdd} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={submitAdd} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.add}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal modifier staff ── */}
      {editOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.admin.editMember}</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              {renderStaffForm(editForm, setEditForm, editErrors, editPhotoRef, true)}
              <div className="flex items-center justify-between px-7 py-5 border-t border-outline-variant shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDel(`${editForm.prenom} ${editForm.nom}`, async () => {
                      await fetch(`/api/backend/staff/${editingId}`, { method: 'DELETE' });
                      setStaff(prev => prev.filter(m => m.id !== editingId));
                      closeEdit();
                    })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold">
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                  <button onClick={submitEdit} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal réinitialiser un mot de passe ── */}
      {resetPwdOpen && (
        <>
          <div className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${resetPwdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeResetPwd} />
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto transition-all duration-200 ${resetPwdVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} flex flex-col max-h-[80vh]`}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
                    <KeyRound size={20} className="text-[#F97316]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">Réinitialiser un mot de passe</h2>
                    <p className="text-sm text-on-surface-variant">Sélectionner un membre</p>
                  </div>
                </div>
                <button onClick={closeResetPwd} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="px-6 py-4 border-b border-outline-variant shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={resetQuery}
                    onChange={e => setResetQuery(e.target.value)}
                    placeholder="Rechercher un membre..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/50">
                {resetUsers
                  .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(resetQuery.toLowerCase()) || u.detail.toLowerCase().includes(resetQuery.toLowerCase()))
                  .map(u => (
                    <div key={`${u.type}-${u.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-container/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${u.type === 'player' ? 'bg-secondary' : 'bg-primary'}`}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-on-surface-variant">{u.detail} · {u.type === 'player' ? 'Joueur' : 'Staff'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => doResetPassword(u.id, u.type)}
                        disabled={resetingId === u.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#F97316] hover:bg-[#F97316]/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <KeyRound size={13} />
                        {resetingId === u.id ? '...' : 'Réinitialiser'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal identifiants créés ── */}
      {credsOpen && creds && (
        <>
          <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${credsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeCreds} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-200 ${credsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-secondary/5 border-b border-secondary/20 px-7 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <KeyRound size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">Compte créé</p>
                  <p className="text-sm text-on-surface-variant">Communiquez ces identifiants au membre</p>
                </div>
              </div>
              <div className="px-7 py-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Identifiant</p>
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl border border-outline-variant">
                    <span className="flex-1 font-mono text-base text-on-surface">{creds.username}</span>
                    <button onClick={() => copyToClipboard(creds.username, 'user')}
                      className="text-on-surface-variant hover:text-primary transition-colors">
                      {credsCopied === 'user' ? <Check size={18} className="text-secondary" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mot de passe temporaire</p>
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl border border-outline-variant">
                    <span className="flex-1 font-mono text-base text-on-surface tracking-widest">{creds.temp_password}</span>
                    <button onClick={() => copyToClipboard(creds.temp_password, 'pass')}
                      className="text-on-surface-variant hover:text-primary transition-colors">
                      {credsCopied === 'pass' ? <Check size={18} className="text-secondary" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/70 bg-surface-container rounded-xl px-4 py-3 border border-outline-variant">
                  Le membre devra définir un nouveau mot de passe lors de sa première connexion.
                </p>
              </div>
              <div className="flex justify-end px-7 pb-6">
                <button onClick={closeCreds}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">
                  Compris
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal confirmation suppression ── */}
      {delOpen && (
        <>
          <div className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${delVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-200 ${delVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-error/5 border-b border-error/20 px-7 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} className="text-error" />
                </div>
                <div>
                  <p className="text-lg font-bold text-error">Suppression irréversible</p>
                  <p className="text-sm text-on-surface-variant">Cette action ne peut pas être annulée</p>
                </div>
              </div>
              <div className="px-7 py-6 space-y-3">
                <p className="text-base text-on-surface">
                  Vous êtes sur le point de supprimer définitivement <strong className="text-error">{delName}</strong>.
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Une fois supprimé, ce membre sera retiré de toutes les listes et son compte désactivé.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 px-7 pb-6">
                <button onClick={closeDel} className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={confirmDel} disabled={delTimer > 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${delTimer > 0 ? 'bg-error/30 text-error/50 cursor-not-allowed' : 'bg-error hover:bg-error/90 text-white cursor-pointer'}`}>
                  <Trash2 size={16} />
                  {delTimer > 0 ? `Confirmer (${delTimer}s)` : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
