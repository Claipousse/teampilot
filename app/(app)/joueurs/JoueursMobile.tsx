'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Pencil, Send, Trash2, Upload, AlertTriangle } from 'lucide-react';

type PlayerStatus = 'Disponible' | 'Blessé' | 'Suspendu' | 'Incertain';

type Player = {
  id: number;
  initials: string;
  number: number;
  name: string;
  position: string;
  positionShort: 'GK' | 'DEF' | 'MIL' | 'ATT';
  nationality?: string;
  flag?: string;
  dob?: string;
  height?: string;
  weight?: string;
  foot?: string;
  status: PlayerStatus;
  injury?: string;
  returnDate?: string;
  contract?: string;
  academy?: string;
  photoUrl?: string;
  stats?: {
    matches?: number; goals?: number; assists?: number;
    yellowCards?: number; redCards?: number; minutes?: number;
    cleanSheets?: number; goalsConceded?: number;
  };
  notes?: string;
};

type PlayerForm = {
  prenom: string; nom: string; number: string;
  position: string; positionShort: 'GK' | 'DEF' | 'MIL' | 'ATT' | '';
  nationality: string; flag: string;
  status: PlayerStatus | '';
  dob: string; height: string; weight: string; foot: string;
  injury: string; returnDate: string;
  contract: string; academy: string;
  notes: string; photoUrl: string;
};

type FormErrors = Partial<Record<'prenom' | 'nom' | 'number' | 'position' | 'nationality' | 'status', string>>;

const EMPTY_FORM: PlayerForm = {
  prenom: '', nom: '', number: '',
  position: '', positionShort: '',
  nationality: '', flag: '',
  status: '',
  dob: '', height: '', weight: '', foot: '',
  injury: '', returnDate: '',
  contract: '', academy: '',
  notes: '', photoUrl: '',
};

const POSITION_OPTIONS: { label: string; short: 'GK' | 'DEF' | 'MIL' | 'ATT' }[] = [
  { label: 'Gardien de but',    short: 'GK' },
  { label: 'Défenseur Central', short: 'DEF' },
  { label: 'Arrière Droit',     short: 'DEF' },
  { label: 'Arrière Gauche',    short: 'DEF' },
  { label: 'Milieu Défensif',   short: 'MIL' },
  { label: 'Milieu Central',    short: 'MIL' },
  { label: 'Milieu Offensif',   short: 'MIL' },
  { label: 'Ailier Droit',      short: 'ATT' },
  { label: 'Ailier Gauche',     short: 'ATT' },
  { label: 'Attaquant Centre',  short: 'ATT' },
];

const STATUSES_FORM: PlayerStatus[] = ['Disponible', 'Blessé', 'Suspendu', 'Incertain'];
const FOOT_OPTIONS = ['Droit', 'Gauche', 'Les deux'] as const;
const POSITIONS = ['Tous', 'GK', 'DEF', 'MIL', 'ATT'] as const;

const S: Record<PlayerStatus, { badge: string; dot: string; bg: string; text: string }> = {
  'Disponible': { badge: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', bg: 'bg-secondary/5 border-secondary/20', text: 'text-secondary' },
  'Blessé':     { badge: 'bg-error/10 text-error',         dot: 'bg-error',     bg: 'bg-error/5 border-error/20',         text: 'text-error' },
  'Suspendu':   { badge: 'bg-[#F97316]/10 text-[#F97316]', dot: 'bg-[#F97316]', bg: 'bg-[#F97316]/5 border-[#F97316]/20', text: 'text-[#F97316]' },
  'Incertain':  { badge: 'bg-primary/10 text-primary',     dot: 'bg-primary',   bg: 'bg-primary/5 border-primary/20',     text: 'text-primary' },
};

const STATUS_ACTIVE: Record<PlayerStatus, string> = {
  'Disponible': 'bg-secondary/10 text-secondary border-secondary',
  'Blessé':     'bg-error/10 text-error border-error',
  'Suspendu':   'bg-[#F97316]/10 text-[#F97316] border-[#F97316]',
  'Incertain':  'bg-primary/10 text-primary border-primary',
};

const STATUS_HOVER: Record<PlayerStatus, string> = {
  'Disponible': 'hover:text-secondary hover:border-secondary',
  'Blessé':     'hover:text-error hover:border-error',
  'Suspendu':   'hover:text-[#F97316] hover:border-[#F97316]',
  'Incertain':  'hover:text-primary hover:border-primary',
};

const ph = (v: string | number | undefined) => (v !== undefined && v !== '') ? String(v) : '—';

const INITIAL_PLAYERS: Player[] = [
  { id: 1, initials: 'MV', number: 8,  name: 'Marcus V.',  position: 'Milieu Central',    positionShort: 'MIL', nationality: 'Anglais',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '15/03/1998', height: '182 cm', weight: '78 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2027', academy: 'Manchester Academy', stats: { matches: 22, goals: 4,  assists: 9, yellowCards: 3, redCards: 0, minutes: 1850 }, notes: 'Excellent visionnaire du jeu.' },
  { id: 2, initials: 'JR', number: 3,  name: 'Julian R.',  position: 'Arrière Gauche',    positionShort: 'DEF', nationality: 'Espagnol',  flag: '🇪🇸', dob: '22/07/2000', height: '175 cm', weight: '72 kg', foot: 'Gauche', status: 'Blessé',     injury: 'Ischio-jambiers', returnDate: 'Dans 3 semaines', contract: '30/06/2025', academy: 'Atletico Madrid B', stats: { matches: 14, goals: 0, assists: 3, yellowCards: 2, redCards: 0, minutes: 1170 }, notes: "Récupération en bonne voie." },
  { id: 3, initials: 'KL', number: 9,  name: 'Kevin L.',   position: 'Attaquant Centre',  positionShort: 'ATT', nationality: 'Français',  flag: '🇫🇷', dob: '08/11/1996', height: '186 cm', weight: '82 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2028', academy: 'OL Academy',          stats: { matches: 22, goals: 11, assists: 4, yellowCards: 1, redCards: 0, minutes: 1940 }, notes: 'En grande forme.' },
  { id: 4, initials: 'SK', number: 1,  name: 'Stefan K.',  position: 'Gardien de but',    positionShort: 'GK',  nationality: 'Allemand',  flag: '🇩🇪', dob: '14/05/1995', height: '192 cm', weight: '88 kg', foot: 'Droit',  status: 'Disponible', contract: '30/06/2028', academy: 'Bayern Youth',        stats: { matches: 22, cleanSheets: 9, goalsConceded: 18, minutes: 1980 },               notes: 'Fiable sur toute la ligne.' },
  { id: 5, initials: 'AM', number: 5,  name: 'Alex M.',    position: 'Défenseur Central', positionShort: 'DEF', nationality: 'Brésilien', flag: '🇧🇷', dob: '30/01/1997', height: '188 cm', weight: '84 kg', foot: 'Droit',  status: 'Suspendu',   injury: '2 matchs de suspension', contract: '30/06/2026', academy: 'Flamengo Youth',      stats: { matches: 19, goals: 2, assists: 1, yellowCards: 5, redCards: 1, minutes: 1710 },  notes: 'Doit gérer son agressivité.' },
  { id: 6, initials: 'TO', number: 11, name: 'Tom O.',     position: 'Ailier Droit',      positionShort: 'ATT', nationality: 'Anglais',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dob: '19/09/2001', height: '178 cm', weight: '74 kg', foot: 'Gauche', status: 'Incertain',  injury: 'Gêne musculaire cuisse', returnDate: 'Décision avant le match', contract: '30/06/2027', academy: 'Chelsea Academy', stats: { matches: 18, goals: 6, assists: 7, yellowCards: 1, redCards: 0, minutes: 1420 }, notes: 'À surveiller avant le prochain match.' },
];

function contractColor(date?: string): string {
  if (!date) return 'text-on-surface-variant';
  const [, m, y] = date.split('/').map(Number);
  const months = (y - 2026) * 12 + (m - 6);
  if (months < 0)  return 'text-error font-bold';
  if (months < 12) return 'text-[#F97316] font-bold';
  return 'text-secondary font-semibold';
}

function validateForm(form: PlayerForm): FormErrors {
  const e: FormErrors = {};
  if (!form.prenom.trim())      e.prenom     = 'Champ obligatoire';
  if (!form.nom.trim())         e.nom        = 'Champ obligatoire';
  if (!form.number.trim())      e.number     = 'Champ obligatoire';
  if (!form.position)           e.position   = 'Champ obligatoire';
  if (!form.nationality.trim()) e.nationality = 'Champ obligatoire';
  if (!form.status)             e.status     = 'Champ obligatoire';
  return e;
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 bg-surface-container border ${err ? 'border-error' : 'border-outline-variant'} rounded-xl text-base text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all`;

const labelCls = 'text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block';

export default function JoueursMobile({ openCreate = false }: { openCreate?: boolean }) {
  const [players, setPlayers]       = useState<Player[]>(INITIAL_PLAYERS);
  const [posFilter, setPosFilter]   = useState<typeof POSITIONS[number]>('Tous');
  const [displayed, setDisplayed]   = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes]           = useState<Record<number, string>>({});

  const [editOpen,        setEditOpen]        = useState(false);
  const [editVisible,     setEditVisible]     = useState(false);
  const [editForm,        setEditForm]        = useState<PlayerForm>(EMPTY_FORM);
  const [editErrors,      setEditErrors]      = useState<FormErrors>({});
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const [createOpen,    setCreateOpen]    = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm,    setCreateForm]    = useState<PlayerForm>(EMPTY_FORM);
  const [createErrors,  setCreateErrors]  = useState<FormErrors>({});
  const createPhotoRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [delOpen,    setDelOpen]    = useState(false);
  const [delVisible, setDelVisible] = useState(false);
  const [delName,    setDelName]    = useState('');
  const [delTimer,   setDelTimer]   = useState(3);
  const delTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDelConfirmed = useRef<(() => void) | null>(null);

  const openDetailModal = (p: Player) => {
    setDisplayed(p);
    if (notes[p.id] === undefined) setNotes(prev => ({ ...prev, [p.id]: p.notes ?? '' }));
    setTimeout(() => setModalVisible(true), 10);
  };
  const closeDetailModal = () => {
    setModalVisible(false);
    setTimeout(() => setDisplayed(null), 300);
  };

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

  const openEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    const nameParts = player.name.split(' ');
    setEditForm({
      prenom: nameParts[0] ?? '',
      nom: (nameParts[1] ?? '').replace('.', ''),
      number: String(player.number),
      position: player.position,
      positionShort: player.positionShort,
      nationality: player.nationality ?? '',
      flag: player.flag ?? '',
      status: player.status,
      dob: player.dob ?? '',
      height: player.height ?? '',
      weight: player.weight ?? '',
      foot: player.foot ?? '',
      injury: player.injury ?? '',
      returnDate: player.returnDate ?? '',
      contract: player.contract ?? '',
      academy: player.academy ?? '',
      notes: player.notes ?? '',
      photoUrl: player.photoUrl ?? '',
    });
    setEditErrors({});
    setEditOpen(true);
    setTimeout(() => setEditVisible(true), 10);
  };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => { setEditOpen(false); setEditingPlayerId(null); }, 200); };

  const openCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setCreateErrors({});
    setCreateOpen(true);
    setTimeout(() => setCreateVisible(true), 10);
  };
  const closeCreate = () => { setCreateVisible(false); setTimeout(() => setCreateOpen(false), 200); };

  const handleEditSubmit = () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    closeEdit();
  };
  const handleCreateSubmit = () => {
    const errs = validateForm(createForm);
    if (Object.keys(errs).length > 0) { setCreateErrors(errs); return; }
    closeCreate();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openCreate) openCreateForm(); }, []);

  const filtered = players.filter(p => posFilter === 'Tous' || p.positionShort === posFilter);
  const counts = {
    Disponible: players.filter(p => p.status === 'Disponible').length,
    Blessé:     players.filter(p => p.status === 'Blessé').length,
    Suspendu:   players.filter(p => p.status === 'Suspendu').length,
    Incertain:  players.filter(p => p.status === 'Incertain').length,
  };

  const renderFormBody = (
    form: PlayerForm,
    setForm: React.Dispatch<React.SetStateAction<PlayerForm>>,
    errors: FormErrors,
    photoRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const initials = (form.prenom.charAt(0) + form.nom.charAt(0)).toUpperCase() || '?';
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Photo */}
        <div className="flex items-center gap-4 pb-5 border-b border-outline-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant">
            {form.photoUrl
              ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-on-surface-variant">{initials}</span>
            }
          </div>
          <div className="space-y-1.5">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => setForm(f => ({ ...f, photoUrl: ev.target?.result as string }));
              reader.readAsDataURL(file);
            }} />
            <button onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
              <Upload size={14} className="text-on-surface-variant" /> Choisir une photo
            </button>
            {form.photoUrl && (
              <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                className="text-xs text-error hover:underline block">Retirer</button>
            )}
          </div>
        </div>

        {/* Identité obligatoire */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Identité <span className="text-error font-normal normal-case">*</span>
          </p>

          <div>
            <label className={labelCls}>Prénom <span className="text-error">*</span></label>
            <input type="text" value={form.prenom}
              onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              className={inputCls(errors.prenom)} placeholder="Ex : Marcus" />
            {errors.prenom && <p className="text-xs text-error mt-1">{errors.prenom}</p>}
          </div>

          <div>
            <label className={labelCls}>Nom <span className="text-error">*</span></label>
            <input type="text" value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className={inputCls(errors.nom)} placeholder="Ex : Valentin" />
            {errors.nom && <p className="text-xs text-error mt-1">{errors.nom}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>N° maillot <span className="text-error">*</span></label>
              <input type="number" min="0" max="99" value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                className={inputCls(errors.number)} placeholder="Ex : 8" />
              {errors.number && <p className="text-xs text-error mt-1">{errors.number}</p>}
            </div>
            <div>
              <label className={labelCls}>Drapeau</label>
              <input type="text" value={form.flag}
                onChange={e => setForm(f => ({ ...f, flag: e.target.value }))}
                className={inputCls()} placeholder="🇫🇷" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Poste <span className="text-error">*</span></label>
            <select value={form.position}
              onChange={e => {
                const pos = e.target.value;
                const short = POSITION_OPTIONS.find(p => p.label === pos)?.short ?? '';
                setForm(f => ({ ...f, position: pos, positionShort: short }));
              }}
              className={`${inputCls(errors.position)} cursor-pointer`}>
              <option value="">Sélectionner un poste...</option>
              {POSITION_OPTIONS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
            </select>
            {errors.position && <p className="text-xs text-error mt-1">{errors.position}</p>}
          </div>

          <div>
            <label className={labelCls}>Nationalité <span className="text-error">*</span></label>
            <input type="text" value={form.nationality}
              onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
              className={inputCls(errors.nationality)} placeholder="Ex : Français" />
            {errors.nationality && <p className="text-xs text-error mt-1">{errors.nationality}</p>}
          </div>

          <div>
            <label className={labelCls}>Statut <span className="text-error">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES_FORM.map(st => (
                <button key={st} onClick={() => setForm(f => ({ ...f, status: st }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${form.status === st ? STATUS_ACTIVE[st] : `bg-surface-container text-on-surface-variant border-outline-variant ${STATUS_HOVER[st]}`}`}>
                  {st}
                </button>
              ))}
            </div>
            {errors.status && <p className="text-xs text-error mt-1">{errors.status}</p>}
          </div>
        </div>

        {/* Informations personnelles optionnel */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Infos personnelles <span className="font-normal normal-case opacity-60">(optionnel)</span>
          </p>

          <div>
            <label className={labelCls}>Date de naissance</label>
            <input type="text" value={form.dob}
              onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
              className={inputCls()} placeholder="JJ/MM/AAAA" />
          </div>

          <div>
            <label className={labelCls}>Pied préféré</label>
            <div className="grid grid-cols-3 gap-2">
              {FOOT_OPTIONS.map(ft => (
                <button key={ft} onClick={() => setForm(f => ({ ...f, foot: f.foot === ft ? '' : ft }))}
                  className={`px-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${form.foot === ft ? 'bg-primary/10 text-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant hover:text-primary hover:border-primary'}`}>
                  {ft}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Taille</label>
              <input type="text" value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                className={inputCls()} placeholder="Ex : 182 cm" />
            </div>
            <div>
              <label className={labelCls}>Poids</label>
              <input type="text" value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                className={inputCls()} placeholder="Ex : 78 kg" />
            </div>
          </div>

          {(form.status === 'Blessé' || form.status === 'Suspendu') && (
            <>
              <div>
                <label className={labelCls}>{form.status === 'Blessé' ? 'Blessure' : 'Motif de suspension'}</label>
                <input type="text" value={form.injury}
                  onChange={e => setForm(f => ({ ...f, injury: e.target.value }))}
                  className={inputCls()} placeholder={form.status === 'Blessé' ? 'Ex : Ischio-jambiers' : 'Ex : 2 matchs'} />
              </div>
              <div>
                <label className={labelCls}>Retour estimé</label>
                <input type="text" value={form.returnDate}
                  onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                  className={inputCls()} placeholder="Ex : Dans 3 semaines" />
              </div>
            </>
          )}
        </div>

        {/* Contrat optionnel */}
        <div className="space-y-4 pt-2 border-t border-outline-variant">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Contrat <span className="font-normal normal-case opacity-60">(optionnel)</span>
          </p>
          <div>
            <label className={labelCls}>Fin de contrat</label>
            <input type="text" value={form.contract}
              onChange={e => setForm(f => ({ ...f, contract: e.target.value }))}
              className={inputCls()} placeholder="JJ/MM/AAAA" />
          </div>
          <div>
            <label className={labelCls}>Club formateur</label>
            <input type="text" value={form.academy}
              onChange={e => setForm(f => ({ ...f, academy: e.target.value }))}
              className={inputCls()} placeholder="Ex : OL Academy" />
          </div>
        </div>

        {/* Notes optionnel */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className={labelCls}>Notes du coach <span className="font-normal normal-case opacity-60">(optionnel)</span></label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} placeholder="Observations, consignes particulières..."
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-on-surface">Effectif</h1>
        <button onClick={openCreateForm}
          className="px-4 py-2.5 bg-error rounded-xl text-white text-base font-bold active:scale-[0.98] transition-all">
          + Ajouter
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {([
          { label: `Disponibles : ${counts.Disponible}`, dot: 'bg-secondary', pill: 'bg-secondary/10 border-secondary/20 text-secondary' },
          { label: `Blessés : ${counts.Blessé}`,         dot: 'bg-error',     pill: 'bg-error/10 border-error/20 text-error' },
          { label: `Suspendus : ${counts.Suspendu}`,     dot: 'bg-[#F97316]', pill: 'bg-[#F97316]/10 border-[#F97316]/20 text-[#F97316]' },
          { label: `Incertains : ${counts.Incertain}`,   dot: 'bg-primary',   pill: 'bg-primary/10 border-primary/20 text-primary' },
        ]).map((item, i) => (
          <div key={i} className={`flex items-center gap-2 px-4 py-2 border rounded-full ${item.pill}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
            <span className="text-base font-bold">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${posFilter === pos ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
            {pos}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(player => {
          const s = S[player.status];
          return (
            <div key={player.id} onClick={() => openDetailModal(player)}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-all">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                    {player.photoUrl
                      ? <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-on-surface-variant">{player.initials}</span>
                    }
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-primary rounded-lg px-1.5 py-0.5">
                    <span className="text-white text-xs font-bold">#{player.number}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-on-surface">{player.name}</p>
                  <p className="text-base text-on-surface-variant">{player.position}</p>
                  <p className="text-base text-on-surface-variant">{player.flag} {player.nationality}</p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-base font-extrabold shrink-0 ${s.badge}`}>
                  {player.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backdrop détail */}
      {displayed && (
        <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ willChange: 'opacity, backdrop-filter' }}
          onClick={closeDetailModal} />
      )}

      {/* Modal détail (bottom sheet) */}
      {displayed && (() => {
        const s = S[displayed.status];
        const st = displayed.stats ?? {};
        return (
          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-300 ${modalVisible ? 'translate-y-0' : 'translate-y-full'}`}>

            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                    {displayed.photoUrl
                      ? <img src={displayed.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-on-surface-variant">{displayed.initials}</span>
                    }
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-primary rounded-lg px-1.5 py-0.5">
                    <span className="text-white text-xs font-bold">#{displayed.number}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-on-surface">{displayed.name}</p>
                  <p className="text-base text-on-surface-variant">{displayed.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => openEdit(displayed)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-error text-white text-base font-semibold rounded-xl">
                  <Pencil size={15} /> Modifier
                </button>
                <div className="relative group">
                  <a href="/messagerie" className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container transition-colors hover:bg-primary/10">
                    <Send size={19} className="text-on-surface-variant" />
                  </a>
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1.5 bg-inverse-surface text-inverse-on-surface text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    Envoyer un message
                  </span>
                </div>
                <button onClick={closeDetailModal} className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container">
                  <X size={20} className="text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${s.bg}`}>
                <div className={`w-3 h-3 rounded-full ${s.dot} shrink-0`} />
                <div>
                  <p className={`text-lg font-bold ${s.text}`}>{displayed.status}</p>
                  {displayed.injury     && <p className="text-base text-on-surface-variant">{displayed.injury}</p>}
                  {displayed.returnDate && <p className="text-base text-on-surface-variant">↩ {displayed.returnDate}</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Informations personnelles</p>
                <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                  {[
                    { label: 'Nationalité', value: displayed.nationality ? `${displayed.flag} ${displayed.nationality}` : undefined },
                    { label: 'Naissance',   value: displayed.dob },
                    { label: 'Taille',      value: displayed.height },
                    { label: 'Poids',       value: displayed.weight },
                    { label: 'Pied',        value: displayed.foot },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5">
                      <p className="text-base text-on-surface-variant">{item.label}</p>
                      <p className={`text-base font-semibold ${item.value ? 'text-on-surface' : 'text-outline'}`}>{ph(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Statistiques · 2026–2027</p>
                {displayed.positionShort === 'GK' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Matchs',    value: st.matches,       color: 'text-on-surface' },
                      { label: 'CS',        value: st.cleanSheets,   color: 'text-secondary' },
                      { label: 'Encaissés', value: st.goalsConceded, color: 'text-error' },
                      { label: 'Minutes',   value: st.minutes ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                        <p className={`text-4xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                        <p className="text-base text-on-surface-variant mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Matchs',  value: st.matches,     color: 'text-on-surface' },
                      { label: 'Buts',    value: st.goals,       color: 'text-primary' },
                      { label: 'Passes',  value: st.assists,     color: 'text-secondary' },
                      { label: '🟨',      value: st.yellowCards, color: 'text-[#F97316]' },
                      { label: '🟥',      value: st.redCards,    color: 'text-error' },
                      { label: 'Minutes', value: st.minutes ? `${st.minutes}'` : undefined, color: 'text-on-surface-variant' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-surface-container rounded-xl p-4 text-center">
                        <p className={`text-3xl font-extrabold ${stat.value !== undefined ? stat.color : 'text-outline'}`}>{ph(stat.value)}</p>
                        <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Contrat</p>
                <div className="bg-surface-container rounded-2xl overflow-hidden divide-y divide-outline-variant/50">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="text-base text-on-surface-variant">Expire le</p>
                    <p className={`text-base ${displayed.contract ? contractColor(displayed.contract) : 'text-outline'}`}>{ph(displayed.contract)}</p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="text-base text-on-surface-variant">Club formateur</p>
                    <p className={`text-base font-semibold ${displayed.academy ? 'text-on-surface' : 'text-outline'}`}>{ph(displayed.academy)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">Notes du coach</p>
                <textarea
                  value={notes[displayed.id] ?? (displayed.notes ?? '')}
                  onChange={e => setNotes(prev => ({ ...prev, [displayed.id]: e.target.value }))}
                  rows={4} placeholder="Ajouter une note..."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-2xl text-base text-on-surface placeholder:text-outline resize-none outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div className="h-14" />
            </div>
          </div>
        );
      })()}

      {/* ── Modal modification ── */}
      {editOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${editVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeEdit} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${editVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">Modifier le joueur</p>
                <button onClick={closeEdit} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              {renderFormBody(editForm, setEditForm, editErrors, editPhotoRef)}

              <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant shrink-0">
                <button
                  onClick={() => openDel(editForm.prenom + ' ' + editForm.nom, () => {
                    setPlayers(prev => prev.filter(p => p.id !== editingPlayerId));
                    closeEdit();
                    closeDetailModal();
                  })}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors font-semibold text-sm">
                  <Trash2 size={15} /> Supprimer
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">Annuler</button>
                  <button onClick={handleEditSubmit} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">Sauvegarder</button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Modal création ── */}
      {createOpen && (
        <>
          <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${createVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeCreate} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pt-4 pb-24 pointer-events-none">
            <div className={`bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col pointer-events-auto transition-all duration-200 ${createVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
                <p className="text-lg font-bold text-on-surface">Nouveau joueur</p>
                <button onClick={closeCreate} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              {renderFormBody(createForm, setCreateForm, createErrors, createPhotoRef)}

              <div className="flex items-center justify-end px-5 py-4 border-t border-outline-variant shrink-0 gap-2">
                <button onClick={closeCreate} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">Annuler</button>
                <button onClick={handleCreateSubmit} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">Créer le joueur</button>
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
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-error" />
                </div>
                <div>
                  <p className="text-base font-bold text-error">Suppression irréversible</p>
                  <p className="text-xs text-on-surface-variant">Cette action ne peut pas être annulée</p>
                </div>
              </div>
              <div className="px-5 py-5 space-y-3">
                <p className="text-base text-on-surface">
                  Vous allez supprimer définitivement <strong className="text-error">{delName}</strong>.
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Ce joueur sera retiré de l&apos;effectif et toutes ses données seront perdues. Cette opération est irréversible.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 pb-5">
                <button onClick={closeDel} className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-semibold">Annuler</button>
                <button onClick={confirmDel} disabled={delTimer > 0}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    delTimer > 0 ? 'bg-error/30 text-error/50 cursor-not-allowed' : 'bg-error hover:bg-error/90 text-white'
                  }`}>
                  <Trash2 size={14} />
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
