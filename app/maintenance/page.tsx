"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, RotateCcw, Wrench, DollarSign, TrendingUp, FileText } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface MaintenanceFee {
  id: number
  expense_date: string
  description: string
  amount: number
  category: string
  provider?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface MaintenanceStats {
  totalCount: number
  totalAmount: number
  averageAmount: number
  maxAmount: number
  minAmount: number
}

export default function MaintenancePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [maintenanceFees, setMaintenanceFees] = useState<MaintenanceFee[]>([])
  const [stats, setStats] = useState<MaintenanceStats>({ 
    totalCount: 0, 
    totalAmount: 0, 
    averageAmount: 0, 
    maxAmount: 0, 
    minAmount: 0 
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; fee?: MaintenanceFee }>({ open: false })
  const [editingFee, setEditingFee] = useState<MaintenanceFee | null>(null)
  
  const [formData, setFormData] = useState({
    expense_date: "",
    description: "",
    amount: "",
    category: "maintenance",
    provider: "",
    notes: ""
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
    } else {
      loadMaintenanceFees()
    }
  }, [router])

  const loadMaintenanceFees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/maintenance")
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des frais de maintenance")
      }

      const data = await response.json()
      setMaintenanceFees(data.maintenanceFees || [])
      setStats(data.stats || { totalCount: 0, totalAmount: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les frais de maintenance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      expense_date: "",
      description: "",
      amount: "",
      category: "maintenance",
      provider: "",
      notes: ""
    })
    setEditingFee(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingFee ? `/api/maintenance/${editingFee.id}` : "/api/maintenance"
      const method = editingFee ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: formData.expense_date,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          provider: formData.provider,
          notes: formData.notes
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement")
      }

      toast({
        title: "Succès",
        description: editingFee ? "Frais de maintenance modifié avec succès" : "Frais de maintenance ajouté avec succès",
      })

      setIsDialogOpen(false)
      resetForm()
      await loadMaintenanceFees()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'enregistrement",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (fee: MaintenanceFee) => {
    setEditingFee(fee)
    setFormData({
      expense_date: fee.expense_date,
      description: fee.description,
      amount: fee.amount.toString(),
      category: fee.category,
      provider: fee.provider || "",
      notes: fee.notes || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (fee: MaintenanceFee) => {
    try {
      const response = await fetch(`/api/maintenance/${fee.id}`, { method: "DELETE" })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression")
      }

      toast({
        title: "Succès",
        description: "Frais de maintenance supprimé avec succès",
      })

      setDeleteDialog({ open: false })
      await loadMaintenanceFees()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number): string => {
    // Custom formatting to use dots for decimals and DT as currency symbol
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    
    // Replace comma with dot for decimal separator and add DT
    return formatted.replace(',', '.') + ' DT'
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      maintenance: "bg-blue-100 text-blue-800",
      repair: "bg-orange-100 text-orange-800",
      equipment: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[category] || colors.other
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Frais de Maintenance</h1>
            <p className="mt-2 text-muted-foreground">
              Gérer les frais de maintenance et réparations de l'huilerie
            </p>
          </div>

          <div className="grid gap-6 max-w-6xl">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total des Frais</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCount} frais enregistrés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moyenne par Frais</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.averageAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    Frais moyen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Frais Maximum</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.maxAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    Frais le plus élevé
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Frais Minimum</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.minAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    Frais le plus bas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Gérer les frais de maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => {
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Frais de Maintenance
                  </Button>
                  
                  <Button 
                    onClick={loadMaintenanceFees} 
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Fees List */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Frais de Maintenance</CardTitle>
                <CardDescription>
                  Tous les frais de maintenance enregistrés
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                    <p className="text-muted-foreground">Chargement des frais de maintenance...</p>
                  </div>
                ) : maintenanceFees.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun frais de maintenance enregistré</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajoutez votre premier frais de maintenance pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceFees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">
                              {formatDate(fee.expense_date)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{fee.description}</div>
                                {fee.notes && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {fee.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getCategoryColor(fee.category)}>
                                {fee.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{fee.provider || "-"}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(fee.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(fee)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteDialog({ open: true, fee })}
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
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Modifier le Frais de Maintenance" : "Nouveau Frais de Maintenance"}
            </DialogTitle>
            <DialogDescription>
              {editingFee ? "Modifiez les informations du frais de maintenance" : "Ajoutez un nouveau frais de maintenance"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (DT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du frais de maintenance"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="maintenance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Fournisseur</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingFee ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce frais de maintenance ?
              <br />
              <br />
              Frais : <strong>{deleteDialog.fee?.description}</strong>
              <br />
              Montant : <strong>{deleteDialog.fee && formatCurrency(deleteDialog.fee.amount)}</strong>
              <br />
              Date : <strong>{deleteDialog.fee && formatDate(deleteDialog.fee.expense_date)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.fee && handleDelete(deleteDialog.fee)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
