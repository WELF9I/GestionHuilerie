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
import { Plus, Trash2, Edit2, Search } from "lucide-react"

interface Supplier {
  id: number
  name: string
  phone: string
  address: string
  notes: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", notes: "" })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadSuppliers()
  }, [router])

  useEffect(() => {
    const filtered = suppliers.filter(
      (sup) =>
        sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.phone.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm])

  const loadSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers")
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert("Veuillez remplir le nom du fournisseur")
      return
    }

    try {
      if (editingId) {
        await fetch(`/api/suppliers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        setSuppliers(suppliers.map((sup) => (sup.id === editingId ? { ...sup, ...formData } : sup)))
      } else {
        const response = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          const newSupplier = await response.json()
          setSuppliers([...suppliers, newSupplier])
        }
      }
      resetForm()
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", phone: "", address: "", notes: "" })
    setEditingId(null)
    setIsOpen(false)
  }

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier)
    setEditingId(supplier.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr?")) {
      try {
        await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
        setSuppliers(suppliers.filter((sup) => sup.id !== id))
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fournisseurs</h1>
              <p className="mt-2 text-muted-foreground">Gérez vos fournisseurs d'olives</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ name: "", phone: "", address: "", notes: "" })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier" : "Ajouter"} Fournisseur</DialogTitle>
                  <DialogDescription>Entrez les détails du fournisseur</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom Entreprise *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adresse</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    {editingId ? "Mettre à Jour" : "Ajouter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des Fournisseurs ({filteredSuppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSuppliers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {suppliers.length === 0 ? "Aucun fournisseur trouvé." : "Aucun résultat pour votre recherche."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Adresse</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{supplier.address}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(supplier.id)}
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
