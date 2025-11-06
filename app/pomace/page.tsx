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
import { Plus, Trash2, Edit, Leaf } from "lucide-react"

interface Pomace {
  id: number
  date: string
  quantity_kg: number
  destination: string
  sold: boolean
  notes: string
}

export default function PomacePage() {
  const router = useRouter()
  const [pomaceList, setPomaceList] = useState<Pomace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    quantity_kg: "",
    destination: "",
    sold: false,
    notes: "",
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    setPomaceList([])
    setIsLoading(false)
  }, [router])

  const handleAddPomace = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.quantity_kg) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    if (editingId) {
      setPomaceList(
        pomaceList.map((pomace) =>
          pomace.id === editingId
            ? {
                ...pomace,
                date: formData.date,
                quantity_kg: Number.parseFloat(formData.quantity_kg),
                destination: formData.destination,
                sold: formData.sold,
                notes: formData.notes,
              }
            : pomace,
        ),
      )
      setEditingId(null)
    } else {
      const newPomace: Pomace = {
        id: Date.now(),
        date: formData.date,
        quantity_kg: Number.parseFloat(formData.quantity_kg),
        destination: formData.destination,
        sold: formData.sold,
        notes: formData.notes,
      }
      setPomaceList([...pomaceList, newPomace])
    }

    setFormData({
      date: "",
      quantity_kg: "",
      destination: "",
      sold: false,
      notes: "",
    })
    setIsOpen(false)
  }

  const handleEdit = (pomace: Pomace) => {
    setFormData({
      date: pomace.date,
      quantity_kg: pomace.quantity_kg.toString(),
      destination: pomace.destination,
      sold: pomace.sold,
      notes: pomace.notes,
    })
    setEditingId(pomace.id)
    setIsOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de grignons?")) {
      setPomaceList(pomaceList.filter((pomace) => pomace.id !== id))
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
  const soldCount = pomaceList.filter((p) => p.sold).length
  const unsoldCount = pomaceList.filter((p) => !p.sold).length

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
                    setFormData({ date: "", quantity_kg: "", destination: "", sold: false, notes: "" })
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
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    <label className="text-sm font-medium">Destination</label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="ex: Compostage, Alimentation animale"
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sold"
                      checked={formData.sold}
                      onChange={(e) => setFormData({ ...formData, sold: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="sold" className="text-sm font-medium">
                      Vendu
                    </label>
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
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <CardTitle className="text-sm font-medium">Non Vendus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unsoldCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">enregistrements</p>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Quantité (kg)</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pomaceList.map((pomace) => (
                        <TableRow key={pomace.id}>
                          <TableCell>{pomace.date}</TableCell>
                          <TableCell className="font-medium">{pomace.quantity_kg.toFixed(2)}</TableCell>
                          <TableCell>{pomace.destination}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                pomace.sold ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pomace.sold ? "Vendu" : "Non vendu"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{pomace.notes}</TableCell>
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
