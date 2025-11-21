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
import { Plus, Trash2, Edit2, AlertCircle, ShoppingCart, CreditCard, DollarSign, Coins, Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDisplayDate } from "@/lib/date-utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
  total_amount: number | string
  advance_paid: number | string
  remaining_balance: number | string
  batch_number: string
  last_payment_date?: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface PurchaseStats {
  totalPurchased: number
  totalAdvance: number
  totalRemaining: number
}

interface ApiPurchasesResponse {
  data: Purchase[]
  pagination: PaginationData
  stats: PurchaseStats
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
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  })
  const [stats, setStats] = useState<PurchaseStats>({
    totalPurchased: 0,
    totalAdvance: 0,
    totalRemaining: 0,
  })
  const [searchSupplierName, setSearchSupplierName] = useState("")
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentNotes, setPaymentNotes] = useState("")

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadData(1, searchSupplierName)
  }, [router, searchSupplierName])

  const loadData = async (page = 1, searchName = "") => {
    try {
      // Build the query parameters
      let url = `/api/purchases?page=${page}&limit=${pagination.itemsPerPage}`
      if (searchName) {
        url += `&supplier_name=${encodeURIComponent(searchName)}`
      }

      const [purchasesRes, suppliersRes, tanksRes] = await Promise.all([
        fetch(url),
        fetch("/api/suppliers"),
        fetch("/api/tanks"),
      ])

      if (purchasesRes.ok) {
        const response = await purchasesRes.json() as ApiPurchasesResponse
        setPurchases(response.data)
        setPagination(response.pagination)
        setStats(response.stats) // Set the stats from the API response
      }

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
          await loadData(pagination.currentPage, searchSupplierName)
          resetForm()
        }
      } else {
        const response = await fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, tank_allocations: validAllocations }),
        })
        if (response.ok) {
          // Reload the current page after adding a new purchase
          await loadData(pagination.currentPage, searchSupplierName)
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
        const response = await fetch(`/api/purchases/${id}`, { method: "DELETE" })
        if (response.ok) {
          // Reload the current page after deletion
          await loadData(pagination.currentPage, searchSupplierName)
        }
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadData(page, searchSupplierName)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPurchase) {
      alert("Aucun achat sélectionné")
      return
    }

    const amount = Number(paymentAmount)
    const maxAmount = Number(selectedPurchase.remaining_balance)

    if (amount <= 0 || amount > maxAmount) {
      alert(`Le montant doit être entre 0 et ${maxAmount.toFixed(2)} DT`)
      return
    }

    try {
      const response = await fetch("/api/purchase-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_id: selectedPurchase.id,
          amount: amount,
          payment_date: paymentDate,
          notes: paymentNotes || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setIsPaymentOpen(false)
        // Reload the current page to update the remaining balance
        await loadData(pagination.currentPage, searchSupplierName)
        resetPaymentForm()
        alert("Paiement enregistré avec succès")
      } else {
        const error = await response.json()
        alert(error.error || "Erreur lors de l'enregistrement du paiement")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur de connexion")
    }
  }

  const resetPaymentForm = () => {
    setPaymentAmount("")
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentNotes("")
    setSelectedPurchase(null)
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achats d'Huile</h1>
              <p className="mt-2 text-muted-foreground">Enregistrement des achats auprès des fournisseurs</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 max-w-sm">
                <Input
                  type="text"
                  placeholder="Rechercher par nom de fournisseur..."
                  value={searchSupplierName}
                  onChange={(e) => setSearchSupplierName(e.target.value)}
                  className="w-full"
                />
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
                <div className="text-2xl font-bold">{stats.totalPurchased.toFixed(2)} DT</div>
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
                <div className="text-2xl font-bold">{stats.totalAdvance.toFixed(2)} DT</div>
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
                <div className="text-2xl font-bold">{stats.totalRemaining.toFixed(2)} DT</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Achat d'Olives ({pagination.totalItems})</CardTitle>
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
                        <TableHead>Date Paiement</TableHead>
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
                          <TableCell>
                            {p.last_payment_date ? formatDisplayDate(p.last_payment_date) : "-"}
                          </TableCell>
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
                              {Number(p.remaining_balance) > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPurchase(p);
                                    setPaymentAmount(String(Number(p.remaining_balance) || 0));
                                    setIsPaymentOpen(true);
                                  }}
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Payer
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Payé
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                        >
                          <PaginationPrevious className="!m-0" />
                        </Button>
                      </PaginationItem>

                      {/* First page */}
                      {pagination.currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(1)}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {pagination.currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Previous page */}
                      {pagination.currentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(pagination.currentPage - 1)}>
                            {pagination.currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Current page */}
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.currentPage)} isActive>
                          {pagination.currentPage}
                        </PaginationLink>
                      </PaginationItem>

                      {/* Next page */}
                      {pagination.currentPage < pagination.totalPages && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(pagination.currentPage + 1)}>
                            {pagination.currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Last page */}
                      {pagination.currentPage < pagination.totalPages - 1 && (
                        <>
                          {pagination.currentPage < pagination.totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(pagination.totalPages)}>
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                        >
                          <PaginationNext className="!m-0" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} sur {pagination.totalPages} •
                    Total {pagination.totalItems} achats
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Donner Avance/Payer</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Détails de l'achat</h3>
                <p><span className="font-medium">Fournisseur:</span> {selectedPurchase.supplier_name}</p>
                <p><span className="font-medium">Date:</span> {formatDisplayDate(selectedPurchase.purchase_date)}</p>
                <p><span className="font-medium">Dernier Paiement:</span> {selectedPurchase.last_payment_date ? formatDisplayDate(selectedPurchase.last_payment_date) : "-"}</p>
                <p><span className="font-medium">Lot:</span> {selectedPurchase.batch_number}</p>
                <p><span className="font-medium">Total:</span> {Number(selectedPurchase.total_amount).toFixed(2)} DT</p>
                <p><span className="font-medium">Avance payée:</span> {Number(selectedPurchase.advance_paid).toFixed(2)} DT</p>
                <p><span className="font-medium">Reste à payer:</span> {Number(selectedPurchase.remaining_balance).toFixed(2)} DT</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Montant à payer (TND) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    max={Number(selectedPurchase.remaining_balance)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {Number(selectedPurchase.remaining_balance).toFixed(2)} DT
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date du paiement *</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (facultatif)</label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Enregistrer le Paiement
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
