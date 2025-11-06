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

interface Employee {
  id: number
  name: string
  position: string
  salary: number
  hire_date: string
  vacation_balance: number
  notes: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    salary: "",
    hire_date: "",
    vacation_balance: "",
    notes: "",
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
      return
    }
    loadEmployees()
  }, [router])

  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredEmployees(filtered)
  }, [employees, searchTerm])

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.position) {
      alert("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      if (editingId) {
        await fetch(`/api/employees/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        setEmployees(
          employees.map((emp) =>
            emp.id === editingId
              ? {
                  ...emp,
                  ...formData,
                  salary: Number(formData.salary) || 0,
                  vacation_balance: Number(formData.vacation_balance) || 0,
                }
              : emp,
          ),
        )
      } else {
        const response = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          const newEmployee = await response.json()
          setEmployees([
            ...employees,
            {
              ...newEmployee,
              salary: Number(formData.salary) || 0,
              vacation_balance: Number(formData.vacation_balance) || 0,
            },
          ])
        }
      }
      resetForm()
    } catch (error) {
      alert("Erreur lors de l'enregistrement")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", position: "", salary: "", hire_date: "", vacation_balance: "", notes: "" })
    setEditingId(null)
    setIsOpen(false)
  }

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      position: employee.position,
      salary: employee.salary.toString(),
      hire_date: employee.hire_date,
      vacation_balance: employee.vacation_balance.toString(),
      notes: employee.notes,
    })
    setEditingId(employee.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé?")) {
      try {
        await fetch(`/api/employees/${id}`, { method: "DELETE" })
        setEmployees(employees.filter((emp) => emp.id !== id))
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
              <h1 className="text-3xl font-bold text-foreground">Employés</h1>
              <p className="mt-2 text-muted-foreground">Gérez les informations de votre personnel</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ name: "", position: "", salary: "", hire_date: "", vacation_balance: "", notes: "" })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter Employé
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier Employé" : "Ajouter un Nouvel Employé"}</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Modifiez les informations de l'employé" : "Entrez les détails de l'employé"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom Complet *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Poste *</label>
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Salaire Mensuel (TND)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date d'Embauche</label>
                    <Input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Solde Congés (jours)</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.vacation_balance}
                      onChange={(e) => setFormData({ ...formData, vacation_balance: e.target.value })}
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
              placeholder="Rechercher par nom ou poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des Employés ({filteredEmployees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {employees.length === 0
                    ? "Aucun employé trouvé. Ajoutez-en un pour commencer."
                    : "Aucun résultat pour votre recherche."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Poste</TableHead>
                        <TableHead>Salaire</TableHead>
                        <TableHead>Embauche</TableHead>
                        <TableHead>Congés</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.salary.toFixed(2)} DT</TableCell>
                          <TableCell>{employee.hire_date}</TableCell>
                          <TableCell>{employee.vacation_balance} j</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(employee.id)}
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
