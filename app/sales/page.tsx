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

interface Tank {
  id: number
  tank_code: string
  current_volume: number
}

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

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface SaleStats {
  totalRevenue: number
  totalQuantity: number
  avgPrice: number
}

interface ApiSalesResponse {
  data: Sale[]
  pagination: PaginationData
  stats: SaleStats
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [tanks, setTanks] = useState<Tank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    quantity_liters: "",
    unit_price: "",
    tank_id: "",
    notes: "",
  })
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  })
  const [stats, setStats] = useState<SaleStats>({
    totalRevenue: 0,
    totalQuantity: 0,
    avgPrice: 0,
  })

  // Debounce hook
  function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadData(page)
    }
  }

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadData()
  }, [router])

  const loadData = async (page = 1) => {
    try {
      const [salesRes, tanksRes] = await Promise.all([
        fetch(`/api/sales?page=${page}&limit=${pagination.itemsPerPage}`),
        fetch("/api/tanks")
      ])

      if (salesRes.ok) {
        const response = await salesRes.json() as ApiSalesResponse
        setSales(response.data)
        setPagination(response.pagination)
        setStats(response.stats) // Set the stats from the API response
      }

      if (tanksRes.ok) setTanks(await tanksRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter sales based on search term
  useEffect(() => {
    if (debouncedSearchTerm.trim() === "") {
      setFilteredSales(sales);
    } else {
      const term = debouncedSearchTerm.toLowerCase();
      const filtered = sales.filter(sale =>
        sale.customer_name.toLowerCase().includes(term)
      );
      setFilteredSales(filtered);
    }
  }, [debouncedSearchTerm, sales]);

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
        // Reload the current page after adding a new sale
        await loadData(pagination.currentPage)
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
        const response = await fetch(`/api/sales/${id}`, { method: "DELETE" })
        if (response.ok) {
          // Reload the current page after deletion
          await loadData(pagination.currentPage)
        }
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
                    <label className="text-sm font-medium">Quantité (Kg) *</label>
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
                            {t.tank_code} ({t.current_volume}Kg)
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

          {/* Search Bar */}
          <div className="mb-4">
            <Input
              placeholder="Rechercher par nom du client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenu Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} DT</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quantité Vendue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalQuantity.toFixed(2)} Kg</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prix Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgPrice.toFixed(2)} DT/Kg</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ventes ({pagination.totalItems})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSales.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucune vente enregistrée</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Quantité (Kg)</TableHead>
                        <TableHead>P.U (TND)</TableHead>
                        <TableHead>Total (TND)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{formatDisplayDate(s.sale_date)}</TableCell>
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
                    Total {pagination.totalItems} ventes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
