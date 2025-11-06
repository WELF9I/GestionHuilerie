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
import { Plus, Trash2, Edit2 } from "lucide-react"

interface Supplier {
  id: number
  name: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
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
      const [purchasesRes, suppliersRes] = await Promise.all([fetch("/api/purchases"), fetch("/api/suppliers")])
      if (purchasesRes.ok) setPurchases(await purchasesRes.json())
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json())
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

    try {
      if (editingId) {
        const response = await fetch(`/api/purchases/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          await loadData()
          resetForm()
        }
      } else {
        const response = await fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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

  const totalPurchased = purchases.reduce((sum, p) => sum + p.total_amount, 0)
  const totalAdvance = purchases.reduce((sum, p) => sum + p.advance_paid, 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achats d'Olives</h1>
              <p className="mt-2 text-muted-foreground">Enregistrement des achats auprès des fournisseurs</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Achat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier l'Achat" : "Enregistrer un Achat"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantité (kg) *</label>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Avance Versée (TND)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.advance_paid}
                      onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Mettre à Jour" : "Enregistrer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Acheté</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPurchased.toFixed(2)} DT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Avances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAdvance.toFixed(2)} DT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Solde Restant</CardTitle>
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
                        <TableHead>Quantité (kg)</TableHead>
                        <TableHead>P.U (TND)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Avance</TableHead>
                        <TableHead>Solde</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.purchase_date}</TableCell>
                          <TableCell>{p.supplier_name}</TableCell>
                          <TableCell>{p.quantity_kg}</TableCell>
                          <TableCell>{p.unit_price}</TableCell>
                          <TableCell>{p.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{p.advance_paid.toFixed(2)}</TableCell>
                          <TableCell>{p.remaining_balance.toFixed(2)}</TableCell>
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
