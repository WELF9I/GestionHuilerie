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
import { Plus, Trash2, Edit } from "lucide-react"

interface Purchase {
  id: number
  batch_number: string
}

interface Operation {
  id: number
  operation_date: string
  olives_quantity_kg: number
  total_price: number
  notes: string
}

export default function PressingPage() {
  const router = useRouter()
  const [operations, setOperations] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [formData, setFormData] = useState({
    operation_date: new Date().toISOString().split("T")[0],
    olives_quantity_kg: "",
    total_price: "",
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
      const response = await fetch("/api/pressing")
      if (response.ok) {
        const data = await response.json()
        setOperations(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.olives_quantity_kg || !formData.total_price) {
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
        resetForm()
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.olives_quantity_kg || !formData.total_price || !editingOperation) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const response = await fetch(`/api/pressing/${editingOperation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        await loadData()
        resetForm()
      }
    } catch (error) {
      alert("Erreur lors de la modification")
    }
  }

  const handleEditClick = (operation: Operation) => {
    setEditingOperation(operation)
    setFormData({
      operation_date: operation.operation_date,
      olives_quantity_kg: operation.olives_quantity_kg.toString(),
      total_price: operation.total_price.toString(),
      notes: operation.notes || "",
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setFormData({
      operation_date: new Date().toISOString().split("T")[0],
      olives_quantity_kg: "",
      total_price: "",
      notes: "",
    })
    setEditingOperation(null)
    setIsOpen(false)
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

  const totalRevenue = operations.reduce((sum, o) => sum + (o.total_price || 0), 0)

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
            <Dialog open={isOpen} onOpenChange={(open) => {
              if (!open) resetForm()
              setIsOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Pressage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingOperation ? "Modifier Pressage" : "Enregistrer Pressage"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={editingOperation ? handleEdit : handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={formData.operation_date}
                      onChange={(e) => setFormData({ ...formData, operation_date: e.target.value })}
                    />
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
                    <label className="text-sm font-medium">Prix Total (DT) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total_price}
                      onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes optionnelles"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingOperation ? "Modifier" : "Enregistrer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Olives (kg)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{operations.reduce((sum, o) => sum + o.olives_quantity_kg, 0).toFixed(2)} Kg</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenu Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalRevenue.toFixed(2)} DT</div>
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
                        <TableHead>Olives (kg)</TableHead>
                        <TableHead>Prix (DT)</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.operation_date}</TableCell>
                          <TableCell>{o.olives_quantity_kg}</TableCell>
                          <TableCell>{o.total_price}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(o)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(o.id)}
                                className="text-destructive"
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
