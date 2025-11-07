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
import { Plus, Trash2 } from "lucide-react"

interface Purchase {
  id: number
  batch_number: string
}

interface Operation {
  id: number
  operation_date: string
  lot: string
  olives_quantity_kg: number
  oil_produced_liters: number
  pomace_quantity_kg: number
  rendement_percentage: number
}

export default function PressingPage() {
  const router = useRouter()
  const [operations, setOperations] = useState<Operation[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    operation_date: new Date().toISOString().split("T")[0],
    purchase_id: "",
    olives_quantity_kg: "",
    oil_produced_liters: "",
    pomace_quantity_kg: "",
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
      const [opRes, purchRes] = await Promise.all([fetch("/api/pressing"), fetch("/api/purchases")])
      if (opRes.ok) setOperations(await opRes.json())
      if (purchRes.ok) setPurchases(await purchRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.purchase_id || !formData.olives_quantity_kg || !formData.oil_produced_liters) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const response = await fetch("/api/pressing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        await loadData()
        setFormData({
          operation_date: new Date().toISOString().split("T")[0],
          purchase_id: "",
          olives_quantity_kg: "",
          oil_produced_liters: "",
          pomace_quantity_kg: "",
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
        await fetch(`/api/pressing/${id}`, { method: "DELETE" })
        setOperations(operations.filter((o) => o.id !== id))
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

  const totalOil = operations.reduce((sum, o) => sum + o.oil_produced_liters, 0)
  const avgRendement =
    operations.length > 0
      ? (operations.reduce((sum, o) => sum + o.rendement_percentage, 0) / operations.length).toFixed(1)
      : "0"

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pressage / Transformation</h1>
              <p className="mt-2 text-muted-foreground">Transformation d'olives en huile</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Pressage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer Pressage</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={formData.operation_date}
                      onChange={(e) => setFormData({ ...formData, operation_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lot d'Olives *</label>
                    <Select
                      value={formData.purchase_id}
                      onValueChange={(value) => setFormData({ ...formData, purchase_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {purchases.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.batch_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantité Olives (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.olives_quantity_kg}
                      onChange={(e) => setFormData({ ...formData, olives_quantity_kg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Huile Produite (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.oil_produced_liters}
                      onChange={(e) => setFormData({ ...formData, oil_produced_liters: e.target.value })}
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
                <CardTitle className="text-sm">Huile Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalOil.toFixed(2)} L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rendement Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgRendement}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Opérations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{operations.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique ({operations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucun pressage enregistré</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Olives (kg)</TableHead>
                        <TableHead>Huile (kg)</TableHead>
                        <TableHead>Rendement %</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.operation_date}</TableCell>
                          <TableCell className="text-sm">{o.lot}</TableCell>
                          <TableCell>{o.olives_quantity_kg}</TableCell>
                          <TableCell>{o.oil_produced_liters}</TableCell>
                          <TableCell className="font-bold">{o.rendement_percentage}%</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(o.id)}
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
