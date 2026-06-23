'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Pencil, Trash2, Upload, AlertTriangle, Copy, Check, KeyRound } from 'lucide-react';
import NationalitySelect from '@/components/NationalitySelect';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import {
  type Player, type PlayerForm, type FormErrors, type Credentials,
  EMPTY_FORM, POSITION_OPTIONS, STATUSES_FORM, FOOT_OPTIONS, POSITIONS, STATUSES,
  S, STATUS_ACTIVE, STATUS_HOVER,
  playerFromApi, validateForm, contractColor, ph, inputCls, labelCls,
} from '@/lib/playerUtils';

// Filtre de position (les onglets en haut de la liste)
type PositionFilter = 'Tous' | 'GK' | 'DEF' | 'MIL' | 'ATT';

export default function JoueursDesktop({ openCreate = false }: { openCreate?: boolean }) {
  const t = useT();
  const { lang } = useLanguage();
  const { isAdmin } = useCurrentUser();

  const [natMap, setNatMap] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch(`/api/nationalities?lang=${lang}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: { label: string; iso: string }[]) => {
        const map: Record<string, string> = {};
        for (const { label, iso } of data) map[iso] = label;
        setNatMap(map);
      });
  }, [lang]);

  // ─── État de la liste ─────────────────────────────────────────────────────
  const [players,       setPlayers]       = useState<Player[]>([]);
  const [posFilter,     setPosFilter]     = useState<PositionFilter>('Tous');
  const [statusFilter,  setStatusFilter]  = useState<Player['status'] | 'Tous'>('Tous');
  const [search,        setSearch]        = useState('');
  const [selected,      setSelected]      = useState<Player | null>(null);
  const [displayed,     setDisplayed]     = useState<Player | null>(null);
  const [panelVisible,  setPanelVisible]  = useState(false);
  const [notes,         setNotes]         = useState<Record<number, string>>({});

  // ─── Modal modification ───────────────────────────────────────────────────
  const [editOpen,        setEditOpen]        = useState(false);
  const [editVisible,     setEditVisible]     = useState(false);
  const [editForm,        setEditForm]        = useState<PlayerForm>(EMPTY_FORM);
  const [editErrors,      setEditErrors]      = useState<FormErrors>({});
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const editPhotoRef  = useRef<HTMLInputElement>(null);
  const editScrollRef = useRef<HTMLDivElement>(null);

  // ─── Modal création ───────────────────────────────────────────────────────
  const [createOpen,    setCreateOpen]    = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm,    setCreateForm]    = useState<PlayerForm>(EMPTY_FORM);
  const [createErrors,  setCreateErrors]  = useState<FormErrors>({});
  const createPhotoRef  = useRef<HTMLInputElement>(null);
  const createScrollRef = useRef<HTMLDivElement>(null);

  // ─── Modal identifiants (affiché une seule fois après création) ───────────
  const [credsOpen,    setCredsOpen]    = useState(false);
  const [credsVisible, setCredsVisible] = useState(false);
  const [creds,        setCreds]        = useState<Credentials | null>(null);
  const [credsCopied,  setCredsCopied]  = useState<Record<string, boolean>>({});

  // ─── Modal confirmation suppression (timer 3s anti-clic accidentel) ───────
  const [delOpen,    setDelOpen]    = useState(false);
  const [delVisible, setDelVisible] = useState(false);
  const [delName,    setDelName]    = useState('');
  const [delTimer,   setDelTimer]   = useState(3);
  const delTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDelConfirmed = useRef<(() => void) | null>(null);

  // ─── Chargement des joueurs ───────────────────────────────────────────────

  const fetchPlayers = useCallback(async () => {
    const res = await fetch('/api/backend/players');
    if (res.ok) setPlayers((await res.json()).map(playerFromApi));
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // ─── Panneau de détail ────────────────────────────────────────────────────

  const openDetailPanel = (p: Player) => {
    setDisplayed(p); setSelected(p);
    if (notes[p.id] === undefined) setNotes(prev => ({ ...prev, [p.id]: p.notes ?? '' }));
    setTimeout(() => setPanelVisible(true), 10);
  };
  const closeDetailPanel = () => {
    setPanelVisible(false);
    setTimeout(() => { setSelected(null); setDisplayed(null); }, 300);
  };

  // ─── Modal suppression ────────────────────────────────────────────────────

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

  // Timer de sécurité : le bouton confirmer est bloqué 3 secondes
  useEffect(() => {
    if (!delOpen) return;
    setDelTimer(3);
    delTimerRef.current = setInterval(() => {
      setDelTimer(prev => { if (prev <= 1) { clearInterval(delTimerRef.current!); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (delTimerRef.current) clearInterval(delTimerRef.current); };
  }, [delOpen]);

  // ─── Modal modification ───────────────────────────────────────────────────

  const openEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditForm({
      prenom: player.firstName, nom: player.lastName,
      number: String(player.number),
      position: player.position, positionShort: player.positionShort,
      nationality: player.nationality ?? '', flag: player.flag ?? '',
      status: player.status,
      dob: player.dob ?? '',
      height: player.height?.replace(' cm', '') ?? '',
      weight: player.weight?.replace(' kg', '') ?? '',
      foot: player.foot ?? '',
      injury: player.injury ?? '', returnDate: player.returnDate ?? '',
      contract: player.contract ?? '', academy: player.academy ?? '',
      notes: player.notes ?? '', photoUrl: player.photoUrl ?? '',
      matches:      player.stats?.matches      !== undefined ? String(player.stats.matches)      : '',
      goals:        player.stats?.goals        !== undefined ? String(player.stats.goals)        : '',
      assists:      player.stats?.assists      !== undefined ? String(player.stats.assists)      : '',
      yellowCards:  player.stats?.yellowCards  !== undefined ? String(player.stats.yellowCards)  : '',
      redCards:     player.stats?.redCards     !== undefined ? String(player.stats.redCards)     : '',
      minutes:      player.stats?.minutes      !== undefined ? String(player.stats.minutes)      : '',
      cleanSheets:  player.stats?.cleanSheets  !== undefined ? String(player.stats.cleanSheets)  : '',
      goalsConceded: player.stats?.goalsConceded !== undefined ? String(player.stats.goalsConceded) : '',
    });
    setEditErrors({});
    setEditOpen(true);
    setTimeout(() => setEditVisible(true), 10);
  };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => { setEditOpen(false); setEditingPlayerId(null); }, 200); };

  // ─── Modal création ───────────────────────────────────────────────────────

  const openCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setCreateErrors({});
    setCreateOpen(true);
    setTimeout(() => setCreateVisible(true), 10);
  };
  const closeCreate = () => { setCreateVisible(false); setTimeout(() => setCreateOpen(false), 200); };

  // ─── Modal identifiants ───────────────────────────────────────────────────

  const openCreds = (data: Credentials) => {
    setCreds(data); setCredsCopied({});
    setCredsOpen(true);
    setTimeout(() => setCredsVisible(true), 10);
  };
  const closeCreds = () => { setCredsVisible(false); setTimeout(() => { setCredsOpen(false); setCreds(null); }, 200); };
  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCredsCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCredsCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  // ─── Soumissions formulaires ──────────────────────────────────────────────

  const handleEditSubmit = async () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      editScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const body: Record<string, unknown> = {
      first_name: editForm.prenom, last_name: editForm.nom,
      shirt_number: parseInt(editForm.number), position: editForm.position,
      position_short: editForm.positionShort, nationality: editForm.nationality,
      nationality_flag: editForm.flag || null,
      date_of_birth: editForm.dob || null,
      height_cm: editForm.height ? parseInt(editForm.height) : null,
      weight_kg: editForm.weight ? parseInt(editForm.weight) : null,
      preferred_foot: editForm.foot || null, photo_url: editForm.photoUrl || null, status: editForm.status,
      injury_description: editForm.injury || null,
      return_date_estimate: editForm.returnDate || null,
      contract_end_date: editForm.contract || null,
      academy: editForm.academy || null, notes: editForm.notes || null,
      matches:        editForm.matches       !== '' ? parseInt(editForm.matches)       : null,
      goals:          editForm.goals         !== '' ? parseInt(editForm.goals)         : null,
      assists:        editForm.assists        !== '' ? parseInt(editForm.assists)        : null,
      yellow_cards:   editForm.yellowCards   !== '' ? parseInt(editForm.yellowCards)   : null,
      red_cards:      editForm.redCards      !== '' ? parseInt(editForm.redCards)      : null,
      minutes_played: editForm.minutes       !== '' ? parseInt(editForm.minutes)       : null,
      clean_sheets:   editForm.cleanSheets   !== '' ? parseInt(editForm.cleanSheets)   : null,
      goals_conceded: editForm.goalsConceded !== '' ? parseInt(editForm.goalsConceded) : null,
    };
    const res = await fetch(`/api/backend/players/${editingPlayerId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = playerFromApi(await res.json());
      setPlayers(prev => prev.map(p => p.id === editingPlayerId ? updated : p));
      if (displayed?.id === editingPlayerId) setDisplayed(updated);
      closeEdit();
    }
  };

  const handleCreateSubmit = async () => {
    const errs = validateForm(createForm);
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      createScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const res = await fetch('/api/backend/players', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: createForm.prenom, last_name: createForm.nom,
        shirt_number: parseInt(createForm.number), position: createForm.position,
        position_short: createForm.positionShort, nationality: createForm.nationality,
        nationality_flag: createForm.flag || null,
        date_of_birth: createForm.dob || null,
        height_cm: createForm.height ? parseInt(createForm.height) : null,
        weight_kg: createForm.weight ? parseInt(createForm.weight) : null,
        preferred_foot: createForm.foot || null, photo_url: createForm.photoUrl || null, status: createForm.status,
        injury_description: createForm.injury || null,
        return_date_estimate: createForm.returnDate || null,
        contract_end_date: createForm.contract || null,
        academy: createForm.academy || null, notes: createForm.notes || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPlayers(prev => [...prev, playerFromApi(created)]);
      closeCreate();
      openCreds({ username: created.username, temp_password: created.temp_password });
    } else {
      const err = await res.json().catch(() => ({}));
      setCreateErrors({ prenom: err.detail ?? t.players.errorCreation });
    }
  };

  // Ouvre automatiquement le formulaire création si on arrive via l'URL ?new=true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openCreate) openCreateForm(); }, []);

  // ─── Données dérivées ─────────────────────────────────────────────────────

  const filtered = players.filter(p =>
    (posFilter === 'Tous' || p.positionShort === posFilter) &&
    (statusFilter === 'Tous' || p.status === statusFilter) &&
    (`${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
     p.position.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    Disponible: players.filter(p => p.status === 'Disponible').length,
    Blessé:     players.filter(p => p.status === 'Blessé').length,
    Suspendu:   players.filter(p => p.status === 'Suspendu').length,
    Incertain:  players.filter(p => p.status === 'Incertain').length,
  };

  const PANEL_W = 'w-[320px] xl:w-[400px] panel-detail';

  // ─── Corps de formulaire partagé (création + modification) ───────────────
  // Accepte les setters des deux formulaires pour ne pas dupliquer le JSX

  const renderFormBody = (
    form: PlayerForm,
    setForm: React.Dispatch<React.SetStateAction<PlayerForm>>,
    errors: FormErrors,
    photoRef: React.RefObject<HTMLInputElement | null>,
    isEdit: boolean,
    scrollRef?: React.RefObject<HTMLDivElement | null>,
  ) => {
    const initials = (form.prenom.charAt(0) + form.nom.charAt(0)).toUpperCase() || '?';
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

        {/* Photo */}
        <div className="flex items-center gap-5 pb-6 border-b border-outline-variant">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
            {form.photoUrl
              // eslint-disable-next-line @next/next/no-img-element
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
              <Upload size={15} className="text-on-surface-variant" /> {t.admin.choosePhoto}
            </button>
            {form.photoUrl && (
              <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))} className="text-xs text-error hover:underline block">
                {t.admin.removePhoto}
              </button>
            )}
            <p className="text-xs text-on-surface-variant/60">JPG, PNG ou WebP</p>
          </div>
        </div>

        {/* Identité (champs obligatoires) */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.players.sectionIdentity} <span className="text-error font-normal normal-case">— {t.common.required.toLowerCase()}</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.players.formFirstName} <span className="text-error">*</span></label>
              <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className={inputCls(errors.prenom)} placeholder="Ex : Marcus" />
              {errors.prenom && <p className="text-xs text-error mt-1">{errors.prenom}</p>}
            </div>
            <div>
              <label className={labelCls}>{t.players.formLastName} <span className="text-error">*</span></label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={inputCls(errors.nom)} placeholder="Ex : Valentin" />
              {errors.nom && <p className="text-xs text-error mt-1">{errors.nom}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.players.formNumber} <span className="text-error">*</span></label>
              <input type="number" min="0" max="99" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className={inputCls(errors.number)} placeholder="Ex : 8" />
              {errors.number && <p className="text-xs text-error mt-1">{errors.number}</p>}
            </div>
            <div>
              <label className={labelCls}>{t.players.formPosition} <span className="text-error">*</span></label>
              <select value={form.position} onChange={e => {
                const pos = e.target.value;
                const short = POSITION_OPTIONS.find(p => p.label === pos)?.short ?? '';
                setForm(f => ({ ...f, position: pos, positionShort: short }));
              }} className={`${inputCls(errors.position)} cursor-pointer`}>
                <option value="">{t.players.formPosition}...</option>
                {POSITION_OPTIONS.map(p => (
                  <option key={p.label} value={p.label}>
                    {t.players.positions[p.label as keyof typeof t.players.positions] ?? p.label}
                  </option>
                ))}
              </select>
              {errors.position && <p className="text-xs text-error mt-1">{errors.position}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>{t.players.formNationality} <span className="text-error">*</span></label>
            <NationalitySelect value={form.nationality} iso={form.flag} onChange={(label, iso) => setForm(f => ({ ...f, nationality: label, flag: iso }))} error={errors.nationality} />
          </div>
          <div>
            <label className={labelCls}>{t.players.formStatus} <span className="text-error">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {STATUSES_FORM.map(st => (
                <button key={st} onClick={() => setForm(f => ({ ...f, status: st }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${form.status === st ? STATUS_ACTIVE[st] : `bg-surface-container text-on-surface-variant border-outline-variant ${STATUS_HOVER[st]}`}`}>
                  {t.players.statuses[st]}
                </button>
              ))}
            </div>
            {errors.status && <p className="text-xs text-error mt-1">{errors.status}</p>}
          </div>
        </div>

        {/* Informations personnelles (optionnel) */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.players.sectionPersonalInfo} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.players.formDob}</label>
              <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls}>{t.players.formFoot}</label>
              <div className="grid grid-cols-3 gap-2">
                {FOOT_OPTIONS.map(ft => (
                  <button key={ft} onClick={() => setForm(f => ({ ...f, foot: f.foot === ft ? '' : ft }))}
                    className={`px-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${form.foot === ft ? 'bg-primary/10 text-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant hover:text-primary hover:border-primary'}`}>
                    {t.players.foot[ft]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.players.formHeight}</label>
              <input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className={inputCls()} placeholder="Ex : 182" />
            </div>
            <div>
              <label className={labelCls}>{t.players.formWeight}</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className={inputCls()} placeholder="Ex : 78" />
            </div>
          </div>
          {(form.status === 'Blessé' || form.status === 'Suspendu') && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{form.status === 'Blessé' ? t.players.injuryLabel : t.players.suspensionReason}</label>
                <input type="text" value={form.injury} onChange={e => setForm(f => ({ ...f, injury: e.target.value }))} className={inputCls()} placeholder={form.status === 'Blessé' ? 'Ex : Ischio-jambiers' : 'Ex : 2 matchs'} />
              </div>
              <div>
                <label className={labelCls}>{t.players.estimatedReturn}</label>
                <input type="text" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} className={inputCls()} placeholder="Ex : Dans 3 semaines" />
              </div>
            </div>
          )}
        </div>

        {/* Contrat (optionnel) */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.players.contract} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.players.formContract}</label>
              <input type="date" value={form.contract} onChange={e => setForm(f => ({ ...f, contract: e.target.value }))} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls}>{t.players.formAcademy}</label>
              <input type="text" value={form.academy} onChange={e => setForm(f => ({ ...f, academy: e.target.value }))} className={inputCls()} placeholder="Ex : OL Academy" />
            </div>
          </div>
        </div>

        {/* Aperçu du compte à créer (uniquement en mode création) */}
        {!isEdit && (
          <div className="space-y-3 pt-2 border-t border-outline-variant">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.players.sectionAccount}</p>
            <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <KeyRound size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  {form.prenom && form.nom
                    ? `${form.prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}.${form.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}`
                    : 'prenom.nom'}
                </p>
                <p className="text-xs text-on-surface-variant">{t.players.autoUsername}</p>
              </div>
              <p className="text-xs text-on-surface-variant/60 shrink-0">{t.players.tempPasswordHint}</p>
            </div>
          </div>
        )}

        {/* Statistiques saison (édition uniquement) */}
        {isEdit && (
          <div className="space-y-4 pt-2 border-t border-outline-variant">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t.players.stats} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></p>
            {form.positionShort === 'GK' ? (
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>{t.players.matches}</label>
                  <input type="number" min="0" value={form.matches} onChange={e => setForm(f => ({ ...f, matches: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.cleanSheets}</label>
                  <input type="number" min="0" value={form.cleanSheets} onChange={e => setForm(f => ({ ...f, cleanSheets: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.goalsConceded}</label>
                  <input type="number" min="0" value={form.goalsConceded} onChange={e => setForm(f => ({ ...f, goalsConceded: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.minutes}</label>
                  <input type="number" min="0" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} className={inputCls()} placeholder="0" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>{t.players.matches}</label>
                  <input type="number" min="0" value={form.matches} onChange={e => setForm(f => ({ ...f, matches: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.goals}</label>
                  <input type="number" min="0" value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.assists}</label>
                  <input type="number" min="0" value={form.assists} onChange={e => setForm(f => ({ ...f, assists: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.yellowCards}</label>
                  <input type="number" min="0" value={form.yellowCards} onChange={e => setForm(f => ({ ...f, yellowCards: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.redCards}</label>
                  <input type="number" min="0" value={form.redCards} onChange={e => setForm(f => ({ ...f, redCards: e.target.value }))} className={inputCls()} placeholder="0" /></div>
                <div><label className={labelCls}>{t.players.minutes}</label>
                  <input type="number" min="0" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} className={inputCls()} placeholder="0" /></div>
              </div>
            )}
          </div>
        )}

        {/* Notes du coach (optionnel) */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className={labelCls}>{t.players.coachNotes} <span className="font-normal normal-case opacity-60">({t.common.optional})</span></label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
            placeholder={t.players.coachNotesPlaceholder}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>

      </div>
    );
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-5 h-full overflow-hidden">

      {/* Liste */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto">

        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-on-surface shrink-0">{t.players.squad}</h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input type="text" placeholder={t.players.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-base outline-none focus:ring-2 focus:ring-primary transition-all" />
          </div>
          {isAdmin && (
            <button onClick={openCreateForm} className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white text-base font-semibold rounded-xl transition-colors shrink-0">
              + {t.players.addPlayer}
            </button>
          )}
        </div>

        {/* Compteurs par statut */}
        <div className="grid grid-cols-2 3xl:grid-cols-4 gap-3">
          {([
            { label: t.players.statusAvailablePlural, count: counts.Disponible, s: S['Disponible'] },
            { label: t.players.statusInjuredPlural,   count: counts.Blessé,     s: S['Blessé'] },
            { label: t.players.statusSuspendedPlural, count: counts.Suspendu,   s: S['Suspendu'] },
            { label: t.players.statusDoubtfulPlural,  count: counts.Incertain,  s: S['Incertain'] },
          ] as { label: string; count: number; s: typeof S[keyof typeof S] }[]).map((item, i) => (
            <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${item.s.bg}`}>
              <div className={`w-3 h-3 rounded-full ${item.s.dot} shrink-0`} />
              <p className={`text-3xl font-extrabold ${item.s.text}`}>{item.count}</p>
              <p className={`text-xl font-bold ${item.s.text}`}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres position + statut */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
            {POSITIONS.map(pos => (
              <button key={pos} onClick={() => setPosFilter(pos as PositionFilter)}
                className={`px-4 py-2 rounded-lg text-base font-bold transition-all ${posFilter === pos ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {pos === 'Tous' ? t.players.posAll : pos}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
            {STATUSES.map(st => (
              <button key={st} onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === st ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {st === 'Tous' ? t.players.statusAll : t.players.statuses[st as keyof typeof t.players.statuses]}
              </button>
            ))}
          </div>
          <p className="text-base text-on-surface-variant ml-auto">{filtered.length} {filtered.length > 1 ? t.players.playerPlural : t.players.player}</p>
        </div>

        {/* Grille de cartes joueurs */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(player => {
            const s = S[player.status];
            return (
              <div key={player.id} onClick={() => openDetailPanel(player)}
                className={`bg-surface-container-lowest border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${selected?.id === player.id ? 'border-primary shadow-md' : 'border-outline-variant'}`}>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                      {player.photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-2xl font-bold text-on-surface-variant">{player.initials}</span>
                      }
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-lg px-1.5 py-0.5">
                      <span className="text-white text-sm font-bold">#{player.number}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-on-surface">{player.name}</p>
                    <p className="text-base text-on-surface-variant">{t.players.positions[player.position as keyof typeof t.players.positions] ?? player.position}</p>
                    <div className="flex items-center gap-1.5 text-base text-on-surface-variant">
                      {player.flag && /^[a-z]{2}(-[a-z]{3})?$/.test(player.flag) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://flagcdn.com/w20/${player.flag}.png`} alt="" width={20} height={15} className="rounded-sm object-cover shrink-0" />
                      ) : (player.flag ? <span>{player.flag}</span> : null)}
                      <span>{(player.flag && natMap[player.flag]) || player.nationality}</span>
                    </div>
                  </div>
                  <span className={`px-4 py-2.5 rounded-xl text-base font-extrabold shrink-0 ${s.badge}`}>{t.players.statuses[player.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panneau de détail (slide depuis la droite) */}
      <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${panelVisible ? `${PANEL_W} opacity-100` : 'w-0 opacity-0'}`}>
        {displayed && (() => {
          const s = S[displayed.status];
          const st = displayed.stats ?? {};
          return (
            <div className={`${PANEL_W} h-full bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col overflow-hidden`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <button onClick={closeDetailPanel} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={20} className="text-on-surface-variant" />
                </button>
                {isAdmin && (
                  <button onClick={() => openEdit(displayed)} className="flex items-center gap-2 px-5 py-2.5 bg-error hover:bg-error/90 text-white text-base font-semibold rounded-xl transition-colors">
                    <Pencil size={16} /> {t.common.edit}
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 border-b border-outline-variant">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                        {displayed.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={displayed.photoUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-3xl font-bold text-on-surface-variant">{displayed.initials}</span>
                        }
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-primary rounded-xl px-2 py-1">
                        <span className="text-white text-base font-bold">#{displayed.number}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-extrabold text-on-surface">{displayed.firstName} {displayed.lastName}</p>
                      <p className="text-base text-on-surface-variant mb-3">{t.players.positions[displayed.position as keyof typeof t.players.positions] ?? displayed.position}</p>
                      <span className={`px-4 py-2 rounded-xl text-base font-extrabold ${s.badge}`}>{t.players.statuses[displayed.status]}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  {/* Infos générales */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.players.info}</p>
                    <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                      {[
                        { label: t.players.nationality, value: displayed.nationality ?? undefined },
                        { label: t.players.dob,         value: displayed.dob ? displayed.dob.split('-').reverse().join('/') : undefined },
                        { label: t.players.height,      value: displayed.height },
                        { label: t.players.weight,      value: displayed.weight },
                        { label: t.players.footLabel,   value: displayed.foot ? t.players.foot[displayed.foot as keyof typeof t.players.foot] ?? displayed.foot : undefined },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3.5">
                          <p className="text-base text-on-surface-variant">{item.label}</p>
                          <p className={`text-base font-semibold ${item.value ? 'text-on-surface' : 'text-outline'}`}>{ph(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Statistiques */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.players.stats} · 2026–2027</p>
                    {displayed.positionShort === 'GK' ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: t.players.matches,       value: st.matches,       color: 'text-on-surface' },
                          { label: t.players.cleanSheets,   value: st.cleanSheets,   color: 'text-secondary' },
                          { label: t.players.goalsConceded, value: st.goalsConceded, color: 'text-error' },
                          { label: t.players.minutes,       value: st.minutes !== undefined ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                            <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                            <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: t.players.matches, value: st.matches,     color: 'text-on-surface' },
                          { label: t.players.goals,   value: st.goals,       color: 'text-primary' },
                          { label: t.players.assists, value: st.assists,     color: 'text-secondary' },
                          { label: '🟨',              value: st.yellowCards, color: 'text-[#F97316]' },
                          { label: '🟥',              value: st.redCards,    color: 'text-error' },
                          { label: t.players.minutes, value: st.minutes !== undefined ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                            <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                            <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Statut médical */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.players.medicalStatus}</p>
                    <div className={`rounded-2xl p-4 border ${s.bg}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-3 h-3 rounded-full ${s.dot} shrink-0`} />
                        <p className={`text-lg font-bold ${s.text}`}>{t.players.statuses[displayed.status]}</p>
                      </div>
                      {displayed.injury     && <p className="text-base text-on-surface-variant ml-6">{displayed.injury}</p>}
                      {displayed.returnDate && <p className="text-base text-on-surface-variant ml-6 mt-1">↩ {displayed.returnDate}</p>}
                    </div>
                  </div>
                  {/* Contrat */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.players.contract}</p>
                    <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <p className="text-base text-on-surface-variant">{t.players.contract}</p>
                        <p className={`text-base ${displayed.contract ? contractColor(displayed.contract) : 'text-outline'}`}>
                          {displayed.contract ? displayed.contract.split('-').reverse().join('/') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <p className="text-base text-on-surface-variant">{t.players.academy}</p>
                        <p className={`text-base font-semibold ${displayed.academy ? 'text-on-surface' : 'text-outline'}`}>{ph(displayed.academy)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Notes */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">{t.players.coachNotes}</p>
                    <div className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-2xl text-base text-on-surface min-h-[96px]">
                      {displayed.notes
                        ? <p className="leading-relaxed whitespace-pre-wrap">{displayed.notes}</p>
                        : <p className="text-outline">{t.players.addNote}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal modification */}
      {editOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.players.editTitle}</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              {renderFormBody(editForm, setEditForm, editErrors, editPhotoRef, true, editScrollRef)}
              <div className="flex items-center justify-between px-7 py-5 border-t border-outline-variant shrink-0">
                <button onClick={() => openDel(`${editForm.prenom} ${editForm.nom}`, async () => {
                  await fetch(`/api/backend/players/${editingPlayerId}`, { method: 'DELETE' });
                  setPlayers(prev => prev.filter(p => p.id !== editingPlayerId));
                  closeEdit(); closeDetailPanel();
                })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold">
                  <Trash2 size={16} /> {t.players.deletePlayer}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                  <button onClick={handleEditSubmit} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.save}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal création */}
      {createOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${createVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeCreate} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant shrink-0">
                <p className="text-xl font-bold text-on-surface">{t.players.addTitle}</p>
                <button onClick={closeCreate} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"><X size={18} className="text-on-surface-variant" /></button>
              </div>
              {renderFormBody(createForm, setCreateForm, createErrors, createPhotoRef, false, createScrollRef)}
              <div className="flex items-center justify-end px-7 py-5 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeCreate} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={handleCreateSubmit} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.players.addTitle}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal identifiants (affiché une seule fois après création d'un joueur) */}
      {credsOpen && creds && (
        <>
          <div className={`fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${credsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-200 ${credsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-primary/5 border-b border-primary/20 px-7 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{t.players.credentialsTitle}</p>
                  <p className="text-sm text-on-surface-variant">{t.players.credentialsHint}</p>
                </div>
              </div>
              <div className="px-7 py-6 space-y-4">
                {([
                  { label: t.players.credentialUsername, key: 'username', value: creds.username },
                  { label: t.players.credentialTempPassword, key: 'password', value: creds.temp_password },
                ] as const).map(item => (
                  <div key={item.key} className="space-y-1.5">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{item.label}</p>
                    <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl border border-outline-variant">
                      <code className="flex-1 text-base font-mono text-on-surface">{item.value}</code>
                      <button onClick={() => copyField(item.key, item.value)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors shrink-0">
                        {credsCopied[item.key] ? <Check size={16} className="text-secondary" /> : <Copy size={16} className="text-on-surface-variant" />}
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-on-surface-variant leading-relaxed">{t.players.firstLoginHint}</p>
              </div>
              <div className="flex justify-end px-7 pb-6">
                <button onClick={closeCreds} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">{t.common.close}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal confirmation suppression */}
      {delOpen && (
        <>
          <div className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${delVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transition-all duration-200 ${delVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden`}>
              <div className="bg-error/5 border-b border-error/20 px-7 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0"><AlertTriangle size={24} className="text-error" /></div>
                <div>
                  <p className="text-lg font-bold text-error">{t.players.deleteIrreversible}</p>
                  <p className="text-sm text-on-surface-variant">{t.players.deleteCannotUndo}</p>
                </div>
              </div>
              <div className="px-7 py-6 space-y-4">
                <p className="text-base text-on-surface">Vous êtes sur le point de supprimer définitivement <strong className="text-error">{delName}</strong>.</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">Ce joueur sera retiré de l&apos;effectif et son compte désactivé.</p>
              </div>
              <div className="flex items-center justify-end gap-3 px-7 pb-6">
                <button onClick={closeDel} className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">{t.common.cancel}</button>
                <button onClick={confirmDel} disabled={delTimer > 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${delTimer > 0 ? 'bg-error/30 text-error/50 cursor-not-allowed' : 'bg-error hover:bg-error/90 text-white cursor-pointer'}`}>
                  <Trash2 size={16} />
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
