"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit, Leaf, TrendingUp } from "lucide-react"
import { formatDisplayDate } from "@/lib/date-utils"

interface Pomace {
  id: number
  collection_date: string
  quantity_kg: number
  status: string
  customer_buyer: string | null
  sale_price: number | null
  notes: string | null
}

export default function PomacePage() {
  const router = useRouter()
  const [pomaceList, setPomaceList] = useState<Pomace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    collection_date: "",
    quantity_kg: "",
    status: "stocké",
    customer_buyer: "",
    sale_price: "",
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
      const response = await fetch("/api/pomace")
      if (response.ok) {
        const result = await response.json()
        setPomaceList(result.data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPomace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.collection_date || !formData.quantity_kg) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const url = editingId ? `/api/pomace` : "/api/pomace"
      const method = editingId ? "PUT" : "POST"
      const body = editingId
        ? { ...formData, id: editingId, quantity_kg: Number.parseFloat(formData.quantity_kg), sale_price: formData.sale_price ? Number.parseFloat(formData.sale_price) : null }
        : { ...formData, quantity_kg: Number.parseFloat(formData.quantity_kg), sale_price: formData.sale_price ? Number.parseFloat(formData.sale_price) : null }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await loadData()
        setFormData({
          collection_date: "",
          quantity_kg: "",
          status: "stocké",
          customer_buyer: "",
          sale_price: "",
          notes: "",
        })
        setIsOpen(false)
        setEditingId(null)
      } else {
        alert("Erreur lors de l'enregistrement")
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (pomace: Pomace) => {
    setFormData({
      collection_date: pomace.collection_date,
      quantity_kg: pomace.quantity_kg.toString(),
      status: pomace.status,
      customer_buyer: pomace.customer_buyer || "",
      sale_price: pomace.sale_price ? pomace.sale_price.toString() : "",
      notes: pomace.notes || "",
    })
    setEditingId(pomace.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de grignons?")) {
      try {
        const response = await fetch(`/api/pomace?id=${id}`, { method: "DELETE" })
        if (response.ok) {
          await loadData()
        } else {
          alert("Erreur lors de la suppression")
        }
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
            <p className="text-muted-foreground">Chargement des grignons...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalPomace = pomaceList.reduce((sum, p) => sum + p.quantity_kg, 0)
  const soldCount = pomaceList.filter((p) => p.status === 'vendu').length
  const unsoldCount = pomaceList.filter((p) => p.status !== 'vendu').length
  const totalSalesRevenue = pomaceList
    .filter((p) => p.status === 'vendu' && p.sale_price)
    .reduce((sum, p) => sum + (p.sale_price || 0), 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestion des Grignons</h1>
              <p className="mt-2 text-muted-foreground">Gérez les résidus de pressage</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ collection_date: "", quantity_kg: "", status: "stocké", customer_buyer: "", sale_price: "", notes: "" })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Enregistrer Grignons
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier Grignons" : "Enregistrer Grignons"}</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Modifiez l'enregistrement de grignons" : "Enregistrez les grignons du pressage"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPomace} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de collecte *</label>
                    <Input
                      type="date"
                      value={formData.collection_date}
                      onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantité (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity_kg}
                      onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="stocké">Stocké</option>
                      <option value="vendu">Vendu</option>
                      <option value="donné">Donné</option>
                      <option value="jeté">Jeté</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client acheteur</label>
                    <Input
                      value={formData.customer_buyer}
                      onChange={(e) => setFormData({ ...formData, customer_buyer: e.target.value })}
                      placeholder="Nom du client (si vendu)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prix de vente (DT)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder="Prix de vente (si applicable)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Mettre à Jour" : "Enregistrer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Grignons Totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{totalPomace.toFixed(2)}</div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">kg</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Vendus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{soldCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">enregistrements</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Stockés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unsoldCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">enregistrements</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Revenus Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div className="text-2xl font-bold">{totalSalesRevenue.toFixed(2)}</div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">DT</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enregistrements de Grignons</CardTitle>
            </CardHeader>
            <CardContent>
              {pomaceList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun enregistrement de grignons. Commencez par en ajouter un.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date de collecte</TableHead>
                        <TableHead>Quantité (kg)</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Prix de vente</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pomaceList.map((pomace) => (
                        <TableRow key={pomace.id}>
                          <TableCell>{formatDisplayDate(pomace.collection_date)}</TableCell>
                          <TableCell className="font-medium">{pomace.quantity_kg.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                pomace.status === 'vendu' ? "bg-green-100 text-green-800" :
                                pomace.status === 'stocké' ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pomace.status}
                            </span>
                          </TableCell>
                          <TableCell>{pomace.customer_buyer || '-'}</TableCell>
                          <TableCell>{pomace.sale_price ? `${pomace.sale_price.toFixed(2)} DT` : '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{pomace.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(pomace)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pomace.id)}
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
