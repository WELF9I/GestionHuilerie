"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit2, AlertCircle, ShoppingCart, CreditCard, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDisplayDate } from "@/lib/date-utils"

interface Supplier {
  id: number
  name: string
}

interface Tank {
  id: number
  tank_code: string
  capacity_liters: number
  current_volume: number
  oil_type: string
}

interface TankAllocation {
  tank_id: number
  quantity: string
}

interface Purchase {
  id: number
  purchase_date: string
  supplier_id: number
  supplier_name: string
  quantity_kg: number
  unit_price: number
  total_amount: number
  advance_paid: number
  remaining_balance: number
  batch_number: string
}

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [tankAllocations, setTankAllocations] = useState<TankAllocation[]>([{ tank_id: 0, quantity: "" }])
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    quantity_kg: "",
    unit_price: "",
    advance_paid: "",
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [purchasesRes, suppliersRes, tanksRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/tanks"),
      ])
      if (purchasesRes.ok) setPurchases(await purchasesRes.json())
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json())
      if (tanksRes.ok) setTanks(await tanksRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.supplier_id || !formData.quantity_kg || !formData.unit_price) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    // Validate tank allocations
    const totalAllocated = tankAllocations.reduce((sum, alloc) => sum + (Number(alloc.quantity) || 0), 0)
    const purchaseQuantity = Number(formData.quantity_kg)
    
    if (totalAllocated !== purchaseQuantity) {
      alert(`La quantité totale affectée (${totalAllocated}Kg) doit être égale à la quantité achetée (${purchaseQuantity}Kg)`)
      return
    }

    // Check tank capacities
    const validAllocations = tankAllocations.filter(a => a.tank_id > 0 && Number(a.quantity) > 0)
    for (const alloc of validAllocations) {
      const tank = tanks.find(t => t.id === alloc.tank_id)
      if (tank) {
        const availableSpace = tank.capacity_liters - tank.current_volume
        if (Number(alloc.quantity) > availableSpace) {
          alert(`La citerne ${tank.tank_code} n'a que ${availableSpace}Kg d'espace libre`)
          return
        }
      }
    }

    try {
      if (editingId) {
        const response = await fetch(`/api/purchases/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, tank_allocations: validAllocations }),
        })
        if (response.ok) {
          await loadData()
          resetForm()
        }
      } else {
        const response = await fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, tank_allocations: validAllocations }),
        })
        if (response.ok) {
          await loadData()
          resetForm()
        }
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const resetForm = () => {
    setFormData({
      purchase_date: new Date().toISOString().split("T")[0],
      supplier_id: "",
      quantity_kg: "",
      unit_price: "",
      advance_paid: "",
    })
    setTankAllocations([{ tank_id: 0, quantity: "" }])
    setEditingId(null)
    setIsOpen(false)
  }

  const handleEdit = (purchase: Purchase) => {
    setFormData({
      purchase_date: purchase.purchase_date,
      supplier_id: purchase.supplier_id.toString(),
      quantity_kg: purchase.quantity_kg.toString(),
      unit_price: purchase.unit_price.toString(),
      advance_paid: purchase.advance_paid.toString(),
    })
    setEditingId(purchase.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr?")) {
      try {
        await fetch(`/api/purchases/${id}`, { method: "DELETE" })
        setPurchases(purchases.filter((p) => p.id !== id))
      } catch (error) {
        alert("Erreur lors de la suppression")
      }
    }
  }

  const addTankAllocation = () => {
    setTankAllocations([...tankAllocations, { tank_id: 0, quantity: "" }])
  }

  const removeTankAllocation = (index: number) => {
    setTankAllocations(tankAllocations.filter((_, i) => i !== index))
  }

  const updateTankAllocation = (index: number, field: keyof TankAllocation, value: string | number) => {
    const updated = [...tankAllocations]
    updated[index] = { ...updated[index], [field]: value }
    setTankAllocations(updated)
  }

  const getAvailableTanks = (currentTankId: number) => {
    const allocatedTankIds = tankAllocations.map(a => a.tank_id).filter(id => id !== currentTankId)
    return tanks.filter(t => !allocatedTankIds.includes(t.id))
  }

  const getTotalAllocated = () => {
    return tankAllocations.reduce((sum, alloc) => sum + (Number(alloc.quantity) || 0), 0)
  }

  const getRemainingToAllocate = () => {
    return Number(formData.quantity_kg || 0) - getTotalAllocated()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalPurchased = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
  const totalAdvance = purchases.reduce((sum, p) => sum + (Number(p.advance_paid) || 0), 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achats d'Huile</h1>
              <p className="mt-2 text-muted-foreground">Enregistrement des achats auprès des fournisseurs</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Achat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier l'Achat" : "Enregistrer un Achat"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fournisseur *</label>
                      <Select
                        value={formData.supplier_id}
                        onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantité (Kg) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quantity_kg}
                        onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prix Unitaire (TND) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Avance Versée (TND)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.advance_paid}
                      onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Affectation aux Citernes *</label>
                      <Button type="button" size="sm" variant="outline" onClick={addTankAllocation}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter Citerne
                      </Button>
                    </div>

                    {tankAllocations.map((alloc, index) => {
                      const tank = tanks.find(t => t.id === alloc.tank_id)
                      const availableSpace = tank ? tank.capacity_liters - tank.current_volume : 0
                      
                      return (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Select
                              value={alloc.tank_id.toString()}
                              onValueChange={(value) => updateTankAllocation(index, 'tank_id', Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Citerne..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableTanks(alloc.tank_id).map((t) => (
                                  <SelectItem key={t.id} value={t.id.toString()}>
                                    {t.tank_code} - {t.oil_type || 'Non spécifié'} (Libre: {(t.capacity_liters - t.current_volume).toFixed(0)}Kg)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                              {tank && (
                                <p className="text-xs text-muted-foreground">
                                  Capacité libre: {availableSpace.toFixed(0)}Kg sur {tank.capacity_liters}Kg
                                </p>
                              )}
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Quantité (Kg)"
                                value={alloc.quantity}
                                onChange={(e) => updateTankAllocation(index, 'quantity', e.target.value)}
                              />
                            </div>
                            {tankAllocations.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeTankAllocation(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )
                      })}

                      <div className="bg-muted p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Quantité achetée:</span>
                          <span className="font-medium">{Number(formData.quantity_kg || 0).toFixed(2)} Kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total affecté:</span>
                          <span className="font-medium">{getTotalAllocated().toFixed(2)} Kg</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>Reste à affecter:</span>
                          <span className={getRemainingToAllocate() === 0 ? "text-green-600" : "text-orange-600"}>
                            {getRemainingToAllocate().toFixed(2)} Kg
                          </span>
                        </div>
                      </div>

                      {getRemainingToAllocate() !== 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Vous devez affecter toute la quantité achetée aux citernes.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                  <Button type="submit" className="w-full" disabled={getRemainingToAllocate() !== 0}>
                    {editingId ? "Mettre à Jour" : "Enregistrer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Total Acheté
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPurchased.toFixed(2)} DT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Total Avances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAdvance.toFixed(2)} DT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Rest à payer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(totalPurchased - totalAdvance).toFixed(2)} DT</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Achat d'Olives ({purchases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucun achat enregistré</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Quantité (Kg)</TableHead>
                        <TableHead>P.U (TND)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Avance</TableHead>
                        <TableHead>Rest à payer</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDisplayDate(p.purchase_date)}</TableCell>
                          <TableCell>{p.supplier_name}</TableCell>
                          <TableCell>{p.quantity_kg}</TableCell>
                          <TableCell>{p.unit_price}</TableCell>
                          <TableCell>{(Number(p.total_amount) || 0).toFixed(2)}</TableCell>
                          <TableCell>{(Number(p.advance_paid) || 0).toFixed(2)}</TableCell>
                          <TableCell>{(Number(p.remaining_balance) || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs">{p.batch_number}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(p)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(p.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
