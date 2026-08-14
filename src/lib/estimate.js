import { z } from 'zod'

export const ESTIMATE_SCHEMA_VERSION = 1

const optionalNumber = (minimum = 0) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number({ invalid_type_error: 'Enter a number.' }).finite('Enter a valid number.').min(minimum, `Must be at least ${minimum}.`).optional(),
)

const requiredNumber = (minimum = 0) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? Number.NaN : Number(value)),
  z.number({ invalid_type_error: 'Enter a number.' }).finite('Enter a valid number.').min(minimum, `Must be at least ${minimum}.`),
)

export const lineItemSchema = z.object({
  manufacturer: z.string().trim().min(1, 'Manufacturer is required.').max(120, 'Keep the manufacturer under 120 characters.'),
  partNumber: z.string().trim().min(1, 'Part number is required.').max(120, 'Keep the part number under 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(500, 'Keep the description under 500 characters.'),
  category: z.string().trim().max(80, 'Keep the category under 80 characters.').optional().default(''),
  quantity: requiredNumber(0.0001),
  listPrice: optionalNumber(0),
  multiplier: requiredNumber(0),
  unitCost: optionalNumber(0),
  markupPercent: requiredNumber(0).refine((value) => value <= 1000, 'Markup must be 1,000% or less.'),
  laborRate: requiredNumber(0),
  laborHours: requiredNumber(0),
})

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Project name is required.').max(160, 'Keep the project name under 160 characters.'),
  customer: z.string().trim().max(160, 'Keep the customer name under 160 characters.'),
  notes: z.string().trim().max(2000, 'Keep project notes under 2,000 characters.'),
  taxRate: requiredNumber(0).refine((value) => value <= 100, 'Tax rate must be 100% or less.'),
  items: z.array(z.unknown()),
})

export function emptyDraft() {
  return {
    manufacturer: '',
    partNumber: '',
    description: '',
    category: '',
    quantity: '1',
    listPrice: '',
    multiplier: '1',
    unitCost: '',
    markupPercent: '20',
    laborRate: '0',
    laborHours: '0',
  }
}

export function createWorkspace() {
  return {
    version: ESTIMATE_SCHEMA_VERSION,
    project: {
      id: createId('project'),
      name: 'Untitled estimate',
      customer: '',
      notes: '',
      taxRate: 0,
      items: [],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function createId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function asNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateLine(item, taxRate = 0) {
  const quantity = Math.max(asNumber(item.quantity), 0)
  const listPrice = Math.max(asNumber(item.listPrice), 0)
  const multiplier = Math.max(asNumber(item.multiplier, 1), 0)
  const manualUnitCost = item.unitCost === '' || item.unitCost === undefined || item.unitCost === null
    ? null
    : Math.max(asNumber(item.unitCost), 0)
  const laborRate = Math.max(asNumber(item.laborRate), 0)
  const laborHours = Math.max(asNumber(item.laborHours), 0)
  const markupPercent = Math.max(asNumber(item.markupPercent), 0)
  const normalizedTaxRate = Math.max(asNumber(taxRate), 0)
  const materialUnitCost = manualUnitCost ?? roundCurrency(listPrice * multiplier)
  const materialCost = roundCurrency(materialUnitCost * quantity)
  const laborCost = roundCurrency(laborRate * laborHours)
  const totalCost = roundCurrency(materialCost + laborCost)
  const markupAmount = roundCurrency(totalCost * (markupPercent / 100))
  const sellingPriceBeforeTax = roundCurrency(totalCost + markupAmount)
  const taxAmount = roundCurrency(sellingPriceBeforeTax * (normalizedTaxRate / 100))
  const totalPrice = roundCurrency(sellingPriceBeforeTax + taxAmount)
  const unitPrice = quantity > 0 ? roundCurrency(totalPrice / quantity) : totalPrice
  const grossProfit = roundCurrency(sellingPriceBeforeTax - totalCost)
  const marginPercent = sellingPriceBeforeTax > 0 ? roundCurrency((grossProfit / sellingPriceBeforeTax) * 100) : 0

  return {
    quantity,
    listPrice,
    multiplier,
    materialUnitCost,
    materialCost,
    laborRate,
    laborHours,
    laborCost,
    totalCost,
    markupPercent,
    markupAmount,
    sellingPriceBeforeTax,
    taxRate: normalizedTaxRate,
    taxAmount,
    totalPrice,
    unitPrice,
    grossProfit,
    marginPercent,
  }
}

export function calculateProjectTotals(items, taxRate = 0) {
  return items.reduce((totals, item) => {
    const line = calculateLine(item, taxRate)
    return {
      materialCost: roundCurrency(totals.materialCost + line.materialCost),
      laborCost: roundCurrency(totals.laborCost + line.laborCost),
      totalCost: roundCurrency(totals.totalCost + line.totalCost),
      markupAmount: roundCurrency(totals.markupAmount + line.markupAmount),
      taxAmount: roundCurrency(totals.taxAmount + line.taxAmount),
      totalPrice: roundCurrency(totals.totalPrice + line.totalPrice),
      grossProfit: roundCurrency(totals.grossProfit + line.grossProfit),
    }
  }, {
    materialCost: 0,
    laborCost: 0,
    totalCost: 0,
    markupAmount: 0,
    taxAmount: 0,
    totalPrice: 0,
    grossProfit: 0,
  })
}

export function validateLineItem(draft) {
  const parsed = lineItemSchema.safeParse(draft)
  if (parsed.success) {
    const hasListOrCost = parsed.data.listPrice !== undefined || parsed.data.unitCost !== undefined
    if (hasListOrCost) {
      return { success: true, data: parsed.data, errors: {} }
    }
    return { success: false, data: null, errors: { unitCost: 'Enter a unit cost or list price.' } }
  }

  const errors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (field && !errors[field]) errors[field] = issue.message
  }
  return { success: false, data: null, errors }
}

export function validateProject(project) {
  const parsed = projectSchema.safeParse(project)
  if (parsed.success) return { success: true, data: parsed.data, errors: {} }

  const errors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (field && !errors[field]) errors[field] = issue.message
  }
  return { success: false, data: null, errors }
}

export function createLineItem(draft, existing = {}) {
  const validation = validateLineItem(draft)
  if (!validation.success) return validation

  const now = new Date().toISOString()
  return {
    success: true,
    errors: {},
    data: {
      id: existing.id ?? createId('item'),
      createdAt: existing.createdAt ?? now,
      updatedAt: now,
      ...validation.data,
    },
  }
}

function validateImportedItem(item) {
  const result = createLineItem(item, item)
  return result.success ? result.data : null
}

export function normalizeWorkspace(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, error: 'The selected file does not contain a valid estimate.' }
  }

  const candidate = payload.project ? payload : { version: ESTIMATE_SCHEMA_VERSION, project: payload }
  const project = candidate.project
  if (!project || typeof project !== 'object') {
    return { success: false, error: 'The selected file does not include a project.' }
  }

  const normalizedItems = Array.isArray(project.items)
    ? project.items.map(validateImportedItem).filter(Boolean)
    : []
  const projectValidation = validateProject({
    id: typeof project.id === 'string' && project.id ? project.id : createId('project'),
    name: project.name || 'Imported estimate',
    customer: project.customer || '',
    notes: project.notes || '',
    taxRate: project.taxRate ?? 0,
    items: normalizedItems,
  })

  if (!projectValidation.success) {
    return { success: false, error: 'The imported project contains invalid project details.' }
  }

  return {
    success: true,
    data: {
      version: ESTIMATE_SCHEMA_VERSION,
      project: { ...projectValidation.data, items: normalizedItems },
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    },
    skippedItems: Array.isArray(project.items) ? project.items.length - normalizedItems.length : 0,
  }
}

export function workspaceToJson(workspace) {
  return JSON.stringify({ ...workspace, version: ESTIMATE_SCHEMA_VERSION, exportedAt: new Date().toISOString() }, null, 2)
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function workspaceToCsv(workspace) {
  const taxRate = workspace.project.taxRate
  const header = [
    'Manufacturer', 'Part Number', 'Description', 'Category', 'Quantity', 'List Price', 'Multiplier',
    'Unit Cost', 'Material Cost', 'Labor Rate', 'Labor Hours', 'Labor Cost', 'Markup %', 'Markup Amount',
    'Tax %', 'Tax Amount', 'Unit Price', 'Total Price', 'Margin %',
  ]
  const rows = workspace.project.items.map((item) => {
    const line = calculateLine(item, taxRate)
    return [
      item.manufacturer, item.partNumber, item.description, item.category, line.quantity, line.listPrice,
      line.multiplier, line.materialUnitCost, line.materialCost, line.laborRate, line.laborHours, line.laborCost,
      line.markupPercent, line.markupAmount, line.taxRate, line.taxAmount, line.unitPrice, line.totalPrice,
      line.marginPercent,
    ].map(csvEscape).join(',')
  })
  return [header.join(','), ...rows].join('\n')
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(asNumber(value))
}

export function formatPercent(value) {
  return `${asNumber(value).toFixed(1)}%`
}
