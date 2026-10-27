'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Footprints,
  Leaf,
  ListFilter,
  Pencil,
  Plus,
  Recycle,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrainFront,
  TrendingUp,
  X,
} from 'lucide-react'

type ActivityType = 'Cycling' | 'Walking' | 'Public transport' | 'Recycling' | 'Reusable products'
type Activity = { id: string; type: ActivityType; date: string; quantity: number; notes: string; example?: boolean }
type Goal = { transport: number; waste: number; reuse: number }

const factors: Record<ActivityType, { unit: string; impact: number; category: keyof Goal; icon: typeof Bike; color: string }> = {
  Cycling: { unit: 'km', impact: 0.21, category: 'transport', icon: Bike, color: 'emerald' },
  Walking: { unit: 'km', impact: 0.18, category: 'transport', icon: Footprints, color: 'lime' },
  'Public transport': { unit: 'km', impact: 0.12, category: 'transport', icon: TrainFront, color: 'sky' },
  Recycling: { unit: 'items', impact: 0.08, category: 'waste', icon: Recycle, color: 'amber' },
  'Reusable products': { unit: 'uses', impact: 0.04, category: 'reuse', icon: ShoppingBag, color: 'violet' },
}

const sampleActivities: Activity[] = [
  { id: 'sample-1', type: 'Cycling', date: '2026-10-26', quantity: 8, notes: 'Commute to work', example: true },
  { id: 'sample-2', type: 'Recycling', date: '2026-10-25', quantity: 12, notes: 'Glass and paper', example: true },
  { id: 'sample-3', type: 'Walking', date: '2026-10-24', quantity: 3.2, notes: 'Errands around town', example: true },
  { id: 'sample-4', type: 'Reusable products', date: '2026-10-23', quantity: 4, notes: 'Coffee cup + produce bags', example: true },
  { id: 'sample-5', type: 'Public transport', date: '2026-10-22', quantity: 14, notes: 'Train instead of driving', example: true },
]

const initialGoal: Goal = { transport: 40, waste: 30, reuse: 20 }
const storageKey = 'ecotrack-activities-v1'
const goalKey = 'ecotrack-goal-v1'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}
function startOfWeek(date = new Date()) {
  const d = new Date(date); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day
  d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + diff); return d
}
function isThisWeek(date: string) { return new Date(`${date}T12:00:00`) >= startOfWeek() }

export default function Page() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [goal, setGoal] = useState<Goal>(initialGoal)
  const [hydrated, setHydrated] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [dateFilter, setDateFilter] = useState('All time')
  const [sort, setSort] = useState('Newest first')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      const storedGoal = localStorage.getItem(goalKey)
      setActivities(stored ? JSON.parse(stored) : sampleActivities)
      if (storedGoal) setGoal(JSON.parse(storedGoal))
    } catch { setActivities(sampleActivities); setNotice('We could not load saved data, so example records are shown.') }
    setHydrated(true)
  }, [])
  useEffect(() => { if (hydrated) { try { localStorage.setItem(storageKey, JSON.stringify(activities)) } catch { setNotice('Your browser blocked saving this change.') } } }, [activities, hydrated])
  useEffect(() => { if (hydrated) { try { localStorage.setItem(goalKey, JSON.stringify(goal)) } catch { setNotice('Your browser blocked saving your goal.') } } }, [goal, hydrated])

  const weekActivities = activities.filter((a) => isThisWeek(a.date))
  const totalImpact = weekActivities.reduce((sum, a) => sum + a.quantity * factors[a.type].impact, 0)
  const filtered = useMemo(() => activities.filter((a) => {
    const matchesQuery = !query || `${a.type} ${a.notes}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All categories' || a.type === category
    const matchesDate = dateFilter === 'All time' || (dateFilter === 'This week' ? isThisWeek(a.date) : new Date(a.date) >= new Date(Date.now() - 30 * 86400000))
    return matchesQuery && matchesCategory && matchesDate
  }).sort((a, b) => sort === 'Newest first' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)), [activities, category, dateFilter, query, sort])

  function saveActivity(data: Omit<Activity, 'id' | 'example'>) {
    if (editing) setActivities((current) => current.map((item) => item.id === editing.id ? { ...item, ...data, example: false } : item))
    else setActivities((current) => [{ ...data, id: crypto.randomUUID(), example: false }, ...current])
    setEditing(null); setShowForm(false); setNotice('Activity saved.')
  }
  function resetExamples() { setActivities(sampleActivities); setNotice('Example records restored.') }
  const totals = (categoryName: keyof Goal) => weekActivities.filter((a) => factors[a.type].category === categoryName).reduce((s, a) => s + a.quantity, 0)
  const goalRows = [{ key: 'transport' as const, label: 'Low-carbon transport', value: totals('transport'), unit: 'km', icon: Bike }, { key: 'waste' as const, label: 'Waste diverted', value: totals('waste'), unit: 'items', icon: Recycle }, { key: 'reuse' as const, label: 'Reusable choices', value: totals('reuse'), unit: 'uses', icon: ShoppingBag }]

  return <main className="min-h-screen bg-[#f7faf7] text-slate-900">
    <header className="border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm"><Leaf aria-hidden="true" /></div><div><div className="text-lg font-bold tracking-tight">EcoTrack</div><div className="text-xs text-slate-500">Personal sustainability dashboard</div></div></div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setShowGoals(true)}><Settings2 data-icon="inline-start" /> Goals</button>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700"><Sparkles data-icon="inline-start" /> Your weekly snapshot</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Small actions, measurable momentum.</h1><p className="mt-2 max-w-xl text-slate-500">Track the everyday choices that help you live a little lighter.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700" onClick={() => { setEditing(null); setShowForm(true) }}><Plus data-icon="inline-start" /> Log an activity</button></section>
      {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice('')}><X /></button></div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="This week" value={`${weekActivities.length}`} suffix="activities" icon={Leaf} tone="green" hint="Logged by you" />
        <StatCard label="Estimated impact" value={`${totalImpact.toFixed(1)}`} suffix="kg CO₂e avoided" icon={TrendingUp} tone="blue" hint="Illustrative estimate" />
        <StatCard label="Weekly goal" value={`${Math.min(100, Math.round((totalImpact / 12) * 100))}%`} suffix="of target" icon={Check} tone="purple" hint="Across all categories" />
        <StatCard label="Best streak" value="4" suffix="days" icon={Sparkles} tone="orange" hint="Keep it going" />
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Weekly activity</h2><p className="mt-1 text-sm text-slate-500">Your logged actions by day</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Last 7 days</span></div><WeeklyChart activities={activities} /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Goal progress</h2><p className="mt-1 text-sm text-slate-500">Your personal targets this week</p></div><button className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setShowGoals(true)}>Edit</button></div><div className="mt-5 flex flex-col gap-5">{goalRows.map(({ key, ...row }) => <ProgressRow key={key} {...row} goal={goal[key]} />)}</div><p className="mt-5 flex gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500"><CircleHelp className="mt-0.5 shrink-0" />Goals are personal targets, not benchmarks. Progress is based on your logged quantities.</p></div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Activity history</h2><p className="mt-1 text-sm text-slate-500">{activities.length} records · Estimates are illustrative</p></div><button className="text-left text-sm font-semibold text-slate-600 hover:text-emerald-700" onClick={resetExamples}>Reset examples</button></div><div className="grid gap-3 md:grid-cols-[1fr_170px_150px_150px]"><label className="relative block"><span className="sr-only">Search activities</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activities..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none ring-emerald-500 focus:ring-2" /></label><Select value={category} onChange={setCategory} options={['All categories', ...Object.keys(factors)]} icon={ListFilter} /><Select value={dateFilter} onChange={setDateFilter} options={['All time', 'This week', 'Last 30 days']} icon={CalendarDays} /><Select value={sort} onChange={setSort} options={['Newest first', 'Oldest first']} icon={ArrowDownUp} /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3 font-semibold">Activity</th><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Quantity</th><th className="px-6 py-3 font-semibold">Estimate</th><th className="px-6 py-3 font-semibold">Notes</th><th className="px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((activity) => { const item = factors[activity.type]; const Icon = item.icon; return <tr key={activity.id} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`grid size-9 place-items-center rounded-lg bg-${item.color}-50 text-${item.color}-700`}><Icon /></div><div><div className="font-medium">{activity.type}</div>{activity.example && <div className="text-xs text-emerald-600">Example record</div>}</div></div></td><td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(activity.date)}</td><td className="px-6 py-4 font-medium">{activity.quantity} <span className="font-normal text-slate-500">{item.unit}</span></td><td className="px-6 py-4 text-slate-600">~{(activity.quantity * item.impact).toFixed(1)} kg CO₂e</td><td className="max-w-[180px] truncate px-6 py-4 text-slate-500">{activity.notes || '—'}</td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-700" aria-label={`Edit ${activity.type}`} onClick={() => { setEditing(activity); setShowForm(true) }}><Pencil /></button><button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${activity.type}`} onClick={() => setConfirmId(activity.id)}><Trash2 /></button></div></td></tr> })}</tbody></table>{filtered.length === 0 && <div className="p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Search /></div><h3 className="mt-3 font-semibold">No activities found</h3><p className="mt-1 text-sm text-slate-500">Try changing your filters or log a new activity.</p></div>}</div></section>
      <footer className="mt-6 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-relaxed text-slate-500 sm:flex-row sm:justify-between"><p>EcoTrack keeps your data in this browser using localStorage.</p><p><strong>About estimates:</strong> Impact factors are illustrative assumptions for learning, not verified measurements.</p></footer>
    </div>
    {showForm && <ActivityForm initial={editing} onSave={saveActivity} onClose={() => { setShowForm(false); setEditing(null) }} />}
    {showGoals && <GoalsDialog goal={goal} onSave={(next) => { setGoal(next); setShowGoals(false); setNotice('Goals updated.') }} onClose={() => setShowGoals(false)} />}
    {confirmId && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Delete this activity?</h2><p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => setConfirmId(null)}>Cancel</button><button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => { setActivities((items) => items.filter((a) => a.id !== confirmId)); setConfirmId(null); setNotice('Activity deleted.') }}>Delete</button></div></div></div>}
  </main>
}

function StatCard({ label, value, suffix, icon: Icon, tone, hint }: { label: string; value: string; suffix: string; icon: typeof Leaf; tone: string; hint: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><div className={`grid size-9 place-items-center rounded-lg bg-${tone}-50 text-${tone}-700`}><Icon /></div></div><div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-bold tracking-tight">{value}</span><span className="text-sm text-slate-500">{suffix}</span></div><p className="mt-2 text-xs text-slate-400">{hint}</p></div> }
function ProgressRow({ label, value, unit, goal, icon: Icon }: { label: string; value: number; unit: string; goal: number; icon: typeof Bike }) { const percent = Math.min(100, Math.round((value / goal) * 100)); return <div><div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium"><Icon className="text-emerald-600" />{label}</span><span className="text-slate-500">{value} / {goal} {unit}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} /></div><div className="mt-1 text-right text-xs text-emerald-700">{percent}%</div></div> }
function WeeklyChart({ activities }: { activities: Activity[] }) { const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d }); const counts = days.map((d) => activities.filter((a) => a.date === d.toISOString().slice(0, 10)).length); const max = Math.max(...counts, 3); return <div className="mt-8 flex h-44 items-end justify-between gap-2 border-b border-slate-100 pb-2">{days.map((day, i) => <div key={day.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full max-w-12 rounded-t-lg bg-emerald-100" style={{ height: `${Math.max(10, (counts[i] / max) * 100)}%` }}><div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-emerald-500" style={{ height: counts[i] ? '100%' : '0%' }} /></div><span className="text-xs text-slate-500">{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day).slice(0, 2)}</span></div>)}</div> }
function Select({ value, onChange, options, icon: Icon }: { value: string; onChange: (v: string) => void; options: string[]; icon: typeof Search }) { return <label className="relative"><span className="sr-only">Filter</span><Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-sm outline-none focus:ring-2 focus:ring-emerald-500">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></label> }
function ActivityForm({ initial, onSave, onClose }: { initial: Activity | null; onSave: (data: Omit<Activity, 'id' | 'example'>) => void; onClose: () => void }) { const [type, setType] = useState<ActivityType>(initial?.type || 'Cycling'); const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10)); const [quantity, setQuantity] = useState(initial?.quantity?.toString() || ''); const [notes, setNotes] = useState(initial?.notes || ''); const [error, setError] = useState(''); function submit(e: React.FormEvent) { e.preventDefault(); const number = Number(quantity); if (!date || !Number.isFinite(number) || number <= 0) { setError('Choose a date and enter a quantity greater than zero.'); return } onSave({ type, date, quantity: Math.round(number * 10) / 10, notes: notes.trim() }) } return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-5"><div className="mx-auto mt-10 w-full max-w-lg rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-semibold">{initial ? 'Edit activity' : 'Log an activity'}</h2><p className="mt-1 text-sm text-slate-500">Record a small action toward your goals.</p></div><button aria-label="Close form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}><X /></button></div><form onSubmit={submit} className="flex flex-col gap-5 p-6"><label className="flex flex-col gap-2 text-sm font-medium">Activity type<select value={type} onChange={(e) => setType(e.target.value as ActivityType)} className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500">{Object.keys(factors).map((item) => <option key={item}>{item}</option>)}</select></label><div className="grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-medium">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500" /></label><label className="flex flex-col gap-2 text-sm font-medium">Quantity <span className="font-normal text-slate-500">({factors[type].unit})</span><input type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 5" className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500" /></label></div><label className="flex flex-col gap-2 text-sm font-medium">Notes <span className="font-normal text-slate-400">(optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What did you do?" className="rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-emerald-500" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3 pt-2"><button type="button" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold" onClick={onClose}>Cancel</button><button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700" type="submit">{initial ? 'Save changes' : 'Add activity'}</button></div></form></div></div> }
function GoalsDialog({ goal, onSave, onClose }: { goal: Goal; onSave: (goal: Goal) => void; onClose: () => void }) { const [values, setValues] = useState(goal); return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-5"><div className="w-full max-w-md rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-semibold">Weekly goals</h2><p className="mt-1 text-sm text-slate-500">Set targets that feel right for you.</p></div><button aria-label="Close goals" onClick={onClose}><X className="text-slate-400" /></button></div><div className="flex flex-col gap-4 p-6">{([['transport', 'Low-carbon transport', 'km'], ['waste', 'Waste diverted', 'items'], ['reuse', 'Reusable choices', 'uses']] as const).map(([key, label, unit]) => <label key={key} className="flex flex-col gap-2 text-sm font-medium">{label} <div className="flex items-center gap-2"><input type="number" min="1" value={values[key]} onChange={(e) => setValues({ ...values, [key]: Math.max(1, Number(e.target.value)) })} className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-emerald-500" /><span className="text-sm text-slate-500">{unit} / week</span></div></label>)}<button className="mt-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700" onClick={() => onSave(values)}>Save goals</button></div></div></div> }
