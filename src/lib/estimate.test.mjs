import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateLine,
  calculateProjectTotals,
  createLineItem,
  emptyDraft,
  normalizeWorkspace,
  validateLineItem,
  workspaceToCsv,
} from './estimate.js'

test('calculates material, labor, markup, tax, price, and margin deterministically', () => {
  const result = calculateLine({ quantity: 2, listPrice: 100, multiplier: 0.8, markupPercent: 25, laborRate: 50, laborHours: 3 }, 10)
  assert.deepEqual(result, {
    quantity: 2,
    listPrice: 100,
    multiplier: 0.8,
    materialUnitCost: 80,
    materialCost: 160,
    laborRate: 50,
    laborHours: 3,
    laborCost: 150,
    totalCost: 310,
    markupPercent: 25,
    markupAmount: 77.5,
    sellingPriceBeforeTax: 387.5,
    taxRate: 10,
    taxAmount: 38.75,
    totalPrice: 426.25,
    unitPrice: 213.13,
    grossProfit: 77.5,
    marginPercent: 20,
  })
})

test('uses an explicit unit cost when supplied', () => {
  const result = calculateLine({ quantity: 4, listPrice: 200, multiplier: 0.5, unitCost: 65, markupPercent: 0, laborRate: 0, laborHours: 0 })
  assert.equal(result.materialUnitCost, 65)
  assert.equal(result.totalPrice, 260)
})

test('aggregates project totals', () => {
  const totals = calculateProjectTotals([
    { quantity: 1, unitCost: 100, multiplier: 1, markupPercent: 10, laborRate: 0, laborHours: 0 },
    { quantity: 2, unitCost: 20, multiplier: 1, markupPercent: 0, laborRate: 10, laborHours: 2 },
  ], 5)
  assert.deepEqual(totals, { materialCost: 140, laborCost: 20, totalCost: 160, markupAmount: 10, taxAmount: 8.5, totalPrice: 178.5, grossProfit: 10 })
})

test('requires a list price or unit cost and normalizes valid imports', () => {
  const invalid = validateLineItem({ ...emptyDraft(), manufacturer: 'Acme', partNumber: 'A-1', description: 'Cable' })
  assert.equal(invalid.success, false)
  assert.equal(invalid.errors.unitCost, 'Enter a unit cost or list price.')

  const imported = normalizeWorkspace({ project: { id: 'project_1', name: 'Imported estimate', customer: '', notes: '', taxRate: 0, items: [{ id: 'item_1', manufacturer: 'Acme', partNumber: 'A-1', description: 'Cable', quantity: '2', unitCost: '12.50', multiplier: '1', markupPercent: '15', laborRate: '0', laborHours: '0' }] } })
  assert.equal(imported.success, true)
  assert.equal(imported.data.project.items[0].quantity, 2)
})

test('exports calculated CSV values with escaped descriptions', () => {
  const created = createLineItem({ ...emptyDraft(), manufacturer: 'Acme', partNumber: 'A-1', description: 'Cable, "blue"', quantity: '2', unitCost: '12.50' })
  const csv = workspaceToCsv({ project: { taxRate: 0, items: [created.data] } })
  assert.match(csv, /Manufacturer,Part Number,Description/)
  assert.match(csv, /"Cable, ""blue"""/)
  assert.match(csv, /25/)
})
