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
import { Plus, Trash2, TrendingUp } from "lucide-react"

interface Tank {
  id: number
  tank_code: string
  current_volume: number
}

interface Sale {
  id: number
  sale_date: string
  customer_name: string
  quantity_liters: number
  unit_price: number
  total_amount: number
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    quantity_liters: "",
    unit_price: "",
    tank_id: "",
    notes: "",
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
      const [salesRes, tanksRes] = await Promise.all([fetch("/api/sales"), fetch("/api/tanks")])
      if (salesRes.ok) setSales(await salesRes.json())
      if (tanksRes.ok) setTanks(await tanksRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_name || !formData.quantity_liters || !formData.unit_price) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        await loadData()
        setFormData({
          sale_date: new Date().toISOString().split("T")[0],
          customer_name: "",
          quantity_liters: "",
          unit_price: "",
          tank_id: "",
          notes: "",
        })
        setIsOpen(false)
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr?")) {
      try {
        await fetch(`/api/sales/${id}`, { method: "DELETE" })
        setSales(sales.filter((s) => s.id !== id))
      } catch (error) {
        alert("Erreur")
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

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity_liters, 0)
  const avgPrice = sales.length > 0 ? (totalRevenue / totalQuantity).toFixed(2) : "0"

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ventes d'Huile</h1>
              <p className="mt-2 text-muted-foreground">Suivi des ventes et revenus</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Vente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer Vente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client *</label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantité (L) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity_liters}
                      onChange={(e) => setFormData({ ...formData, quantity_liters: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prix Unitaire (TND) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Citerne</label>
                    <Select
                      value={formData.tank_id}
                      onValueChange={(value) => setFormData({ ...formData, tank_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une citerne" />
                      </SelectTrigger>
                      <SelectContent>
                        {tanks.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.tank_code} ({t.current_volume}L)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Enregistrer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenu Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div className="text-3xl font-bold">{totalRevenue.toFixed(2)} DT</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quantité Vendue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalQuantity.toFixed(2)} L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prix Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgPrice} DT/L</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ventes ({sales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucune vente enregistrée</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Quantité (L)</TableHead>
                        <TableHead>P.U (TND)</TableHead>
                        <TableHead>Total (TND)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.sale_date}</TableCell>
                          <TableCell className="font-semibold">{s.customer_name}</TableCell>
                          <TableCell>{s.quantity_liters}</TableCell>
                          <TableCell>{s.unit_price}</TableCell>
                          <TableCell className="font-bold text-green-600">{s.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(s.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
