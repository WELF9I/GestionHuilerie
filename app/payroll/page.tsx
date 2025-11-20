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
import { Plus, Trash2, Edit2, DollarSign, TrendingUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
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

interface Employee {
  id: number
  name: string
  salary: number
}

interface PayrollRecord {
  id: number
  employee_id: number
  employee_name: string
  employee_salary: number
  payment_date: string
  payment_type: "salary" | "advance"
  amount: number
  month: string | null
  notes: string | null
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface ApiPayrollResponse {
  data: PayrollRecord[]
  pagination: PaginationData
}

interface EmployeeBalance {
  employee_id: number
  employee_name: string
  salary: number
  totalAdvances: number
  totalPaid: number
  balance: number
}

export default function PayrollPage() {
  const router = useRouter()
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [formData, setFormData] = useState({
    employee_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_type: "salary" as "salary" | "advance",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    notes: "",
  })
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadData(1) // Load first page on initial load
  }, [router, selectedMonth])

  const loadData = async (page = 1) => {
    try {
      const [payrollRes, employeesRes] = await Promise.all([
        fetch(`/api/payroll?page=${page}&limit=${pagination.itemsPerPage}&month=${selectedMonth}`),
        fetch("/api/employees"),
      ])

      if (payrollRes.ok) {
        const response = await payrollRes.json() as ApiPayrollResponse
        setPayrollRecords(response.data)
        setPagination(response.pagination)
      }

      if (employeesRes.ok) setEmployees(await employeesRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employee_id || !formData.amount) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      if (editingId) {
        const response = await fetch(`/api/payroll/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          await loadData(pagination.currentPage)
          resetForm()
        }
      } else {
        const response = await fetch("/api/payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          // Reload the current page after adding a new record
          await loadData(pagination.currentPage)
          resetForm()
        }
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_type: "salary",
      amount: "",
      month: new Date().toISOString().slice(0, 7),
      notes: "",
    })
    setEditingId(null)
    setIsOpen(false)
  }

  const handleEdit = (record: PayrollRecord) => {
    setFormData({
      employee_id: record.employee_id.toString(),
      payment_date: record.payment_date,
      payment_type: record.payment_type,
      amount: record.amount.toString(),
      month: record.month || new Date().toISOString().slice(0, 7),
      notes: record.notes || "",
    })
    setEditingId(record.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr?")) {
      try {
        const response = await fetch(`/api/payroll/${id}`, { method: "DELETE" })
        if (response.ok) {
          // Reload the current page after deletion
          await loadData(pagination.currentPage)
        }
      } catch (error) {
        alert("Erreur lors de la suppression")
      }
    }
  }

  const getEmployeeBalances = (): EmployeeBalance[] => {
    return employees.map(emp => {
      const empRecords = payrollRecords.filter(r =>
        r.employee_id === emp.id &&
        r.month === selectedMonth
      )
      const totalAdvances = empRecords
        .filter(r => r.payment_type === "advance")
        .reduce((sum, r) => sum + r.amount, 0)
      const totalPaid = empRecords
        .filter(r => r.payment_type === "salary")
        .reduce((sum, r) => sum + r.amount, 0)

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        salary: emp.salary,
        totalAdvances,
        totalPaid,
        balance: emp.salary - totalAdvances - totalPaid,
      }
    })
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadData(page)
    }
  }

  // Separate pagination for employee balances
  const [employeePagination, setEmployeePagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Update employee pagination when employees change
  useEffect(() => {
    const totalPages = Math.ceil(employees.length / 10);
    setEmployeePagination(prev => ({
      ...prev,
      totalPages,
      totalItems: employees.length
    }));
  }, [employees]);

  // Paginated version for employee balances table
  const getPaginatedEmployeeBalances = (): EmployeeBalance[] => {
    const allBalances = getEmployeeBalances();
    const start = (employeePagination.currentPage - 1) * employeePagination.itemsPerPage;
    const end = start + employeePagination.itemsPerPage;
    return allBalances.slice(start, end);
  };

  const handleEmployeePageChange = (page: number) => {
    if (page >= 1 && page <= employeePagination.totalPages) {
      setEmployeePagination(prev => ({
        ...prev,
        currentPage: page
      }));
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

  const balances = getEmployeeBalances()
  const totalSalaries = balances.reduce((sum, b) => sum + b.salary, 0)
  const totalAdvances = balances.reduce((sum, b) => sum + b.totalAdvances, 0)
  const totalPaid = balances.reduce((sum, b) => sum + b.totalPaid, 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestion de la Paie</h1>
              <p className="mt-2 text-muted-foreground">Suivi des salaires et avances des employés</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier" : "Enregistrer un Paiement/Avance"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employé *</label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) => {
                        const employee = employees.find(e => e.id === Number(value))
                        setFormData({ 
                          ...formData, 
                          employee_id: value,
                          amount: formData.payment_type === "salary" && employee ? employee.salary.toString() : formData.amount
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>
                            {e.name} - {e.salary} TND/mois
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type *</label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value: "salary" | "advance") => {
                          const employee = employees.find(e => e.id === Number(formData.employee_id))
                          setFormData({ 
                            ...formData, 
                            payment_type: value,
                            amount: value === "salary" && employee ? employee.salary.toString() : ""
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary">Salaire</SelectItem>
                          <SelectItem value="advance">Avance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant (TND) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mois</label>
                      <Input
                        type="month"
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {editingId ? "Mettre à Jour" : "Enregistrer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mr-4">Mois de référence:</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48 inline-block"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Salaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSalaries.toFixed(2)} DT</div>
                <p className="text-xs text-muted-foreground mt-1">Mois: {selectedMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Avances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalAdvances.toFixed(2)} DT</div>
                <p className="text-xs text-muted-foreground mt-1">Mois: {selectedMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Payé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} DT</div>
                <p className="text-xs text-muted-foreground mt-1">Mois: {selectedMonth}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>État des Paiements par Employé ({employeePagination.totalItems})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Salaire Mensuel</TableHead>
                      <TableHead>Avances</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Solde Restant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedEmployeeBalances().map((b) => (
                      <TableRow key={b.employee_id}>
                        <TableCell className="font-medium">{b.employee_name}</TableCell>
                        <TableCell>{b.salary.toFixed(2)} DT</TableCell>
                        <TableCell className="text-orange-600">{b.totalAdvances.toFixed(2)} DT</TableCell>
                        <TableCell className="text-green-600">{b.totalPaid.toFixed(2)} DT</TableCell>
                        <TableCell className="font-bold">
                          {b.balance.toFixed(2)} DT
                        </TableCell>
                        <TableCell>
                          {b.balance === 0 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Payé</span>
                          ) : b.totalAdvances > 0 ? (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Avance</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">En attente</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Employee pagination controls */}
              {employeePagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmployeePageChange(employeePagination.currentPage - 1)}
                          disabled={employeePagination.currentPage <= 1}
                        >
                          <PaginationPrevious className="!m-0" />
                        </Button>
                      </PaginationItem>

                      {/* First page */}
                      {employeePagination.currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => handleEmployeePageChange(1)}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {employeePagination.currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Previous page */}
                      {employeePagination.currentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleEmployeePageChange(employeePagination.currentPage - 1)}>
                            {employeePagination.currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Current page */}
                      <PaginationItem>
                        <PaginationLink onClick={() => handleEmployeePageChange(employeePagination.currentPage)} isActive>
                          {employeePagination.currentPage}
                        </PaginationLink>
                      </PaginationItem>

                      {/* Next page */}
                      {employeePagination.currentPage < employeePagination.totalPages && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handleEmployeePageChange(employeePagination.currentPage + 1)}>
                            {employeePagination.currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Last page */}
                      {employeePagination.currentPage < employeePagination.totalPages - 1 && (
                        <>
                          {employeePagination.currentPage < employeePagination.totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink onClick={() => handleEmployeePageChange(employeePagination.totalPages)}>
                              {employeePagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmployeePageChange(employeePagination.currentPage + 1)}
                          disabled={employeePagination.currentPage >= employeePagination.totalPages}
                        >
                          <PaginationNext className="!m-0" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-sm text-muted-foreground">
                    Page {employeePagination.currentPage} sur {employeePagination.totalPages} •
                    Total {employeePagination.totalItems} employés
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions ({pagination.totalItems})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDisplayDate(r.payment_date)}</TableCell>
                        <TableCell>{r.employee_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            r.payment_type === "salary"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {r.payment_type === "salary" ? "Salaire" : "Avance"}
                          </span>
                        </TableCell>
                        <TableCell>{r.month}</TableCell>
                        <TableCell className="font-bold">{r.amount.toFixed(2)} DT</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(r.id)}
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
                    Total {pagination.totalItems} transactions
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
