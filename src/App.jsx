import { useEffect, useMemo, useRef, useState } from 'react'

import { Calculator, Download, FileDown, FileUp, Pencil, Plus, Printer, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import {
  calculateLine,
  calculateProjectTotals,
  createLineItem,
  createWorkspace,
  emptyDraft,
  formatCurrency,
  formatPercent,
  normalizeWorkspace,
  validateProject,
  workspaceToCsv,
  workspaceToJson,
} from '@/lib/estimate.js'
import './App.css'

const STORAGE_KEY = 'material-estimate.workspace.v1'

function loadWorkspace() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return createWorkspace()
    const restored = normalizeWorkspace(JSON.parse(saved))
    return restored.success ? restored.data : createWorkspace()
  } catch {
    return createWorkspace()
  }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toDraft(item) {
  return {
    manufacturer: item.manufacturer ?? '',
    partNumber: item.partNumber ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    quantity: String(item.quantity ?? 1),
    listPrice: item.listPrice === undefined ? '' : String(item.listPrice),
    multiplier: String(item.multiplier ?? 1),
    unitCost: item.unitCost === undefined ? '' : String(item.unitCost),
    markupPercent: String(item.markupPercent ?? 20),
    laborRate: String(item.laborRate ?? 0),
    laborHours: String(item.laborHours ?? 0),
  }
}

function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [projectErrors, setProjectErrors] = useState({})
  const [notice, setNotice] = useState('Your estimate is stored privately in this browser.')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const importRef = useRef(null)
  const { project } = workspace

  const totals = useMemo(() => calculateProjectTotals(project.items, project.taxRate), [project.items, project.taxRate])
  const categories = useMemo(() => [...new Set(project.items.map((item) => item.category).filter(Boolean))], [project.items])
  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase()
    return [...project.items]
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => !search || [item.manufacturer, item.partNumber, item.description, item.category].some((value) => value?.toLowerCase().includes(search)))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [project.items, category, query])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }))
    } catch {
      setNotice('Browser storage is unavailable. Download a JSON backup before closing this page.')
    }
  }, [workspace])

  const updateProject = (field, value) => {
    setWorkspace((current) => ({ ...current, project: { ...current.project, [field]: value } }))
    setProjectErrors((current) => ({ ...current, [field]: undefined }))
  }

  const updateDraft = (event) => {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const resetDraft = () => {
    setDraft(emptyDraft())
    setEditingId(null)
    setErrors({})
  }

  const saveLine = (event) => {
    event.preventDefault()
    const existing = editingId ? project.items.find((item) => item.id === editingId) : {}
    const result = createLineItem(draft, existing)
    if (!result.success) {
      setErrors(result.errors)
      setNotice('Review the highlighted fields before saving this line item.')
      return
    }
    setWorkspace((current) => ({
      ...current,
      project: {
        ...current.project,
        items: editingId
          ? current.project.items.map((item) => item.id === editingId ? result.data : item)
          : [...current.project.items, result.data],
      },
    }))
    setNotice(editingId ? 'Line item updated.' : 'Line item added to the estimate.')
    resetDraft()
  }

  const editLine = (item) => {
    setDraft(toDraft(item))
    setEditingId(item.id)
    setErrors({})
    setNotice(`Editing ${item.partNumber}.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const duplicateLine = (item) => {
    const result = createLineItem({ ...toDraft(item), description: `${item.description} (copy)` })
    if (!result.success) return
    setWorkspace((current) => ({ ...current, project: { ...current.project, items: [...current.project.items, result.data] } }))
    setNotice(`${item.partNumber} duplicated.`)
  }

  const deleteLine = (item) => {
    setWorkspace((current) => ({ ...current, project: { ...current.project, items: current.project.items.filter((candidate) => candidate.id !== item.id) } }))
    if (editingId === item.id) resetDraft()
    setNotice(`${item.partNumber} removed.`)
  }

  const validProject = () => {
    const result = validateProject(project)
    if (result.success) {
      setProjectErrors({})
      return true
    }
    setProjectErrors(result.errors)
    setNotice('Review the project information before continuing.')
    return false
  }

  const exportJson = () => {
    if (!validProject()) return
    download('material-estimate.json', workspaceToJson(workspace), 'application/json')
    setNotice('JSON backup downloaded.')
  }

  const exportCsv = () => {
    if (!validProject()) return
    download('material-estimate.csv', workspaceToCsv(workspace), 'text/csv;charset=utf-8')
    setNotice('CSV export downloaded.')
  }

  const importJson = async (event) => {
    const [file] = event.target.files
    if (!file) return
    try {
      const result = normalizeWorkspace(JSON.parse(await file.text()))
      if (!result.success) throw new Error(result.error)
      setWorkspace(result.data)
      resetDraft()
      setNotice(result.skippedItems ? `Estimate imported; ${result.skippedItems} invalid line item(s) were skipped.` : 'Estimate imported successfully.')
    } catch (error) {
      setNotice(error.message || 'This file could not be imported.')
    } finally {
      event.target.value = ''
    }
  }

  const clearWorkspace = () => {
    if (!window.confirm('Clear this browser workspace? Download a JSON backup first if you may need these records.')) return
    setWorkspace(createWorkspace())
    resetDraft()
    setNotice('A new empty estimate is ready.')
  }

  const printEstimate = () => {
    if (validProject()) window.print()
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end print:border-0">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-700"><Calculator className="h-4 w-4" /> Material Estimate Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Clearer, auditable material estimates.</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Calculate material, labor, markup, and tax from one local browser workspace. No estimate record is sent to a service.</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => importRef.current?.click()}><FileUp className="mr-2 h-4 w-4" />Import JSON</Button>
            <Button variant="outline" onClick={exportJson}><Download className="mr-2 h-4 w-4" />Backup JSON</Button>
            <Button variant="outline" onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" />Export CSV</Button>
            <Button onClick={printEstimate}><Printer className="mr-2 h-4 w-4" />Print estimate</Button>
            <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </header>

        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 print:hidden" role="status">{notice}</div>

        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Project details</h2>
            <p className="mt-1 text-sm text-slate-600">Project context is included in every backup and print output.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Project name" name="project-name" value={project.name} onChange={(event) => updateProject('name', event.target.value)} error={projectErrors.name} required />
              <Field label="Customer" name="customer" value={project.customer} onChange={(event) => updateProject('customer', event.target.value)} error={projectErrors.customer} placeholder="Customer or organization" />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={project.notes} onChange={(event) => updateProject('notes', event.target.value)} placeholder="Scope, exclusions, or terms" rows={2} className={projectErrors.notes ? 'border-destructive' : ''} />
                {projectErrors.notes && <ErrorText text={projectErrors.notes} />}
              </div>
              <NumberField label="Tax rate (%)" name="tax-rate" value={project.taxRate} onChange={(event) => updateProject('taxRate', event.target.value)} error={projectErrors.taxRate} min="0" max="100" step="0.01" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-sm text-slate-300">Estimate total</p>
            <p className="mt-1 text-4xl font-bold">{formatCurrency(totals.totalPrice)}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Summary label="Material" value={formatCurrency(totals.materialCost)} />
              <Summary label="Labor" value={formatCurrency(totals.laborCost)} />
              <Summary label="Markup" value={formatCurrency(totals.markupAmount)} />
              <Summary label="Tax" value={formatCurrency(totals.taxAmount)} />
            </dl>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><h2 className="text-lg font-semibold">{editingId ? 'Update line item' : 'Add a line item'}</h2><p className="text-sm text-slate-600">Unit cost uses list price × multiplier unless you provide an override.</p></div>
            {editingId && <Button variant="outline" onClick={resetDraft}><X className="mr-2 h-4 w-4" />Cancel edit</Button>}
          </div>
          <form className="mt-5" noValidate onSubmit={saveLine}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Manufacturer" name="manufacturer" value={draft.manufacturer} onChange={updateDraft} error={errors.manufacturer} required />
              <Field label="Part number" name="partNumber" value={draft.partNumber} onChange={updateDraft} error={errors.partNumber} required />
              <Field label="Category" name="category" value={draft.category} onChange={updateDraft} error={errors.category} placeholder="Electrical, HVAC, etc." />
              <NumberField label="Quantity" name="quantity" value={draft.quantity} onChange={updateDraft} error={errors.quantity} min="0.0001" step="0.01" required />
              <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Description <span className="text-destructive">*</span></Label><Input id="description" name="description" value={draft.description} onChange={updateDraft} className={errors.description ? 'border-destructive' : ''} /></div>
              <NumberField label="List price" name="listPrice" value={draft.listPrice} onChange={updateDraft} error={errors.listPrice} min="0" step="0.01" placeholder="Optional" />
              <NumberField label="Multiplier" name="multiplier" value={draft.multiplier} onChange={updateDraft} error={errors.multiplier} min="0" step="0.0001" required />
              <NumberField label="Unit cost override" name="unitCost" value={draft.unitCost} onChange={updateDraft} error={errors.unitCost} min="0" step="0.01" placeholder="Optional" />
              <NumberField label="Markup (%)" name="markupPercent" value={draft.markupPercent} onChange={updateDraft} error={errors.markupPercent} min="0" max="1000" step="0.01" required />
              <NumberField label="Labor rate" name="laborRate" value={draft.laborRate} onChange={updateDraft} error={errors.laborRate} min="0" step="0.01" required />
              <NumberField label="Labor hours" name="laborHours" value={draft.laborHours} onChange={updateDraft} error={errors.laborHours} min="0" step="0.01" required />
            </div>
            {errors.description && <ErrorText text={errors.description} />}
            <div className="mt-5 flex gap-3"><Button type="submit"><Plus className="mr-2 h-4 w-4" />{editingId ? 'Save line item' : 'Add line item'}</Button><Button type="button" variant="outline" onClick={resetDraft}>Reset fields</Button></div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h2 className="text-lg font-semibold">Estimate line items</h2><p className="text-sm text-slate-600">{visibleItems.length} of {project.items.length} record{project.items.length === 1 ? '' : 's'} shown</p></div>
            <div className="text-sm"><p className="text-slate-500">Customer</p><p className="font-medium">{project.customer || 'Not specified'}</p></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] print:hidden">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search description, part, manufacturer, or category" /></div>
            <select className="rounded-md border border-input bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </div>
          <div className="mt-5 space-y-3">
            {visibleItems.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">Add a calculated material or labor line item to begin this estimate.</p>}
            {visibleItems.map((item) => <LineItem key={item.id} item={item} taxRate={project.taxRate} onEdit={editLine} onDuplicate={duplicateLine} onDelete={deleteLine} />)}
          </div>
          {project.items.length > 0 && <div className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm sm:ml-auto sm:max-w-sm"><TotalRow label="Total cost" value={formatCurrency(totals.totalCost)} /><TotalRow label="Markup" value={formatCurrency(totals.markupAmount)} /><TotalRow label="Tax" value={formatCurrency(totals.taxAmount)} /><TotalRow label="Estimate total" value={formatCurrency(totals.totalPrice)} strong /></div>}
        </section>

        <section className="grid gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Safe data workflows</h2><p className="mt-1 text-sm text-slate-600">Browser storage is convenient, but a versioned JSON download is your recoverable backup.</p><div className="mt-4 flex gap-3"><Button variant="outline" onClick={exportJson}><Download className="mr-2 h-4 w-4" />Export backup</Button><Button variant="outline" onClick={clearWorkspace}><Trash2 className="mr-2 h-4 w-4" />Clear workspace</Button></div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Collaboration-ready foundation</h2><p className="mt-1 text-sm text-slate-600">This release keeps estimates private and local. Future shared projects and provider integrations require a server-side API so credentials and permissions never reach the browser.</p></div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, name, value, onChange, error, required = false, placeholder = '' }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label><Input id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className={error ? 'border-destructive' : ''} aria-invalid={Boolean(error)} />{error && <ErrorText text={error} />}</div>
}

function NumberField({ label, name, value, onChange, error, min, max, step, required = false, placeholder = '' }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label><Input id={name} name={name} type="number" value={value} onChange={onChange} min={min} max={max} step={step} placeholder={placeholder} className={error ? 'border-destructive' : ''} aria-invalid={Boolean(error)} />{error && <ErrorText text={error} />}</div>
}

function ErrorText({ text }) { return <p className="text-xs text-destructive">{text}</p> }
function Summary({ label, value }) { return <div><dt className="text-slate-400">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div> }
function TotalRow({ label, value, strong = false }) { return <div className={strong ? 'flex justify-between border-t border-slate-950 pt-3 text-base font-bold' : 'flex justify-between'}><span>{label}</span><span>{value}</span></div> }

function LineItem({ item, taxRate, onEdit, onDuplicate, onDelete }) {
  const line = calculateLine(item, taxRate)
  return <article className="rounded-lg border border-slate-200 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h3 className="font-semibold">{item.description}</h3><p className="mt-1 text-sm text-slate-600">{item.manufacturer} · {item.partNumber}{item.category ? ` · ${item.category}` : ''}</p></div><div className="flex gap-2 print:hidden"><Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="outline" onClick={() => onDuplicate(item)}>Duplicate</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(item)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button></div></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><Metric label="Quantity" value={line.quantity} /><Metric label="Material cost" value={formatCurrency(line.materialCost)} /><Metric label="Labor cost" value={formatCurrency(line.laborCost)} /><Metric label="Markup" value={formatCurrency(line.markupAmount)} /><Metric label="Unit price" value={formatCurrency(line.unitPrice)} /><Metric label="Total price" value={formatCurrency(line.totalPrice)} /><Metric label="Margin" value={formatPercent(line.marginPercent)} /><Metric label="Tax" value={formatCurrency(line.taxAmount)} /></dl></article>
}
function Metric({ label, value }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium tabular-nums">{value}</dd></div> }

export default App
