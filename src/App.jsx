import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Plus, Save, Trash2 } from 'lucide-react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    qty: '',
    manufacturer: '',
    partNo: '',
    description: '',
    list: '',
    multiplier: '',
    cost: '',
    totalCost: '',
    markUp: '',
    unitPrice: '',
    totalPrice: '',
    labor: ''
  })

  const [records, setRecords] = useState([])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newRecord = {
      id: Date.now(),
      ...formData
    }
    setRecords(prev => [...prev, newRecord])
    
    // Reset form
    setFormData({
      qty: '',
      manufacturer: '',
      partNo: '',
      description: '',
      list: '',
      multiplier: '',
      cost: '',
      totalCost: '',
      markUp: '',
      unitPrice: '',
      totalPrice: '',
      labor: ''
    })
  }

  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(record => record.id !== id))
  }

  const exportData = () => {
    const dataStr = JSON.stringify(records, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'estimate_records.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Estimate Record Entry</h1>
          <p className="text-gray-600 mt-2">Enter and manage estimate records</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Record
            </CardTitle>
            <CardDescription>
              Fill in the details for a new estimate record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    name="qty"
                    type="number"
                    step="0.01"
                    value={formData.qty}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Enter manufacturer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partNo">Part Number</Label>
                  <Input
                    id="partNo"
                    name="partNo"
                    value={formData.partNo}
                    onChange={handleInputChange}
                    placeholder="Enter part number"
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="list">List Price</Label>
                  <Input
                    id="list"
                    name="list"
                    type="number"
                    step="0.01"
                    value={formData.list}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multiplier">Multiplier</Label>
                  <Input
                    id="multiplier"
                    name="multiplier"
                    type="number"
                    step="0.01"
                    value={formData.multiplier}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCost">Total Cost</Label>
                  <Input
                    id="totalCost"
                    name="totalCost"
                    type="number"
                    step="0.01"
                    value={formData.totalCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="markUp">Mark Up</Label>
                  <Input
                    id="markUp"
                    name="markUp"
                    type="number"
                    step="0.01"
                    value={formData.markUp}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Total Price</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labor">Labor</Label>
                  <Input
                    id="labor"
                    name="labor"
                    type="number"
                    step="0.01"
                    value={formData.labor}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </form>
          </CardContent>
        </Card>

        {records.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Saved Records ({records.length})</CardTitle>
                  <CardDescription>
                    View and manage your estimate records
                  </CardDescription>
                </div>
                <Button onClick={exportData} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{record.manufacturer || 'Unknown Manufacturer'}</h3>
                        <p className="text-gray-600">{record.description || 'No description'}</p>
                      </div>
                      <Button
                        onClick={() => deleteRecord(record.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="font-medium">Qty:</span> {record.qty || '0'}</div>
                      <div><span className="font-medium">Part No:</span> {record.partNo || 'N/A'}</div>
                      <div><span className="font-medium">List:</span> ${record.list || '0.00'}</div>
                      <div><span className="font-medium">Cost:</span> ${record.cost || '0.00'}</div>
                      <div><span className="font-medium">Multiplier:</span> {record.multiplier || '0.00'}</div>
                      <div><span className="font-medium">Mark Up:</span> {record.markUp || '0.00'}</div>
                      <div><span className="font-medium">Unit Price:</span> ${record.unitPrice || '0.00'}</div>
                      <div><span className="font-medium">Total Price:</span> ${record.totalPrice || '0.00'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App

