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
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Tank {
  id: number
  tank_code: string
  capacity_liters: number
  current_volume: number
  oil_type: string
}

interface Movement {
  id: number
  movement_date: string
  movement_type: string
  tank_code: string
  quantity_liters: number
  reference: string
}

export default function TanksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tanks, setTanks] = useState<Tank[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpenTank, setIsOpenTank] = useState(false)
  const [isOpenMove, setIsOpenMove] = useState(false)
  const [formTank, setFormTank] = useState({ tank_code: "", capacity_liters: "", oil_type: "" })
  const [formMove, setFormMove] = useState({
    movement_date: new Date().toISOString().split("T")[0],
    tank_id: "",
    movement_type: "entrée",
    quantity_liters: "",
    reference: "",
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
      const [tanksRes, movementsRes] = await Promise.all([fetch("/api/tanks"), fetch("/api/tank-movements")])
      if (tanksRes.ok) setTanks(await tanksRes.json())
      if (movementsRes.ok) setMovements(await movementsRes.json())
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTank.tank_code || !formTank.capacity_liters) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/tanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formTank),
      })
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Citerne ajoutée avec succès",
        })
        await loadData()
        setFormTank({ tank_code: "", capacity_liters: "", oil_type: "" })
        setIsOpenTank(false)
      } else {
        const result = await response.json()
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de l'ajout",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout",
        variant: "destructive",
      })
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formMove.tank_id || !formMove.quantity_liters) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/tank-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formMove),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: result.message || "Mouvement enregistré avec succès",
        })
        await loadData()
        setFormMove({
          movement_date: new Date().toISOString().split("T")[0],
          tank_id: "",
          movement_type: "entrée",
          quantity_liters: "",
          reference: "",
        })
        setIsOpenMove(false)
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de l'enregistrement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTank = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette citerne?")) {
      try {
        const response = await fetch(`/api/tanks/${id}`, { method: "DELETE" })
        const result = await response.json()
        
        if (response.ok) {
          toast({
            title: "Succès",
            description: "Citerne supprimée avec succès",
          })
          setTanks(tanks.filter((t) => t.id !== id))
        } else {
          toast({
            title: "Impossible de supprimer",
            description: result.error || "Erreur lors de la suppression",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive",
        })
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

  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity_liters, 0)
  const totalVolume = tanks.reduce((sum, t) => sum + t.current_volume, 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Citernes (Stock d'Huile)</h1>
              <p className="mt-2 text-muted-foreground">Gestion et visualisation du stock</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isOpenTank} onOpenChange={setIsOpenTank}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Citerne
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ajouter Citerne</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddTank} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Code (ex: C1) *</label>
                      <Input
                        value={formTank.tank_code}
                        onChange={(e) => setFormTank({ ...formTank, tank_code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capacité (L) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formTank.capacity_liters}
                        onChange={(e) => setFormTank({ ...formTank, capacity_liters: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type d'Huile</label>
                      <Input
                        value={formTank.oil_type}
                        onChange={(e) => setFormTank({ ...formTank, oil_type: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Ajouter
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isOpenMove} onOpenChange={setIsOpenMove}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Mouvement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enregistrer Mouvement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMovement} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={formMove.movement_date}
                        onChange={(e) => setFormMove({ ...formMove, movement_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Citerne *</label>
                      <select
                        className="w-full border border-border rounded-md px-3 py-2 text-sm"
                        value={formMove.tank_id}
                        onChange={(e) => setFormMove({ ...formMove, tank_id: e.target.value })}
                      >
                        <option value="">Sélectionner...</option>
                        {tanks.map((t) => (
                          <option key={t.id} value={t.id.toString()}>
                            {t.tank_code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type *</label>
                      <select
                        className="w-full border border-border rounded-md px-3 py-2 text-sm"
                        value={formMove.movement_type}
                        onChange={(e) => setFormMove({ ...formMove, movement_type: e.target.value })}
                      >
                        <option value="entrée">Entrée</option>
                        <option value="sortie">Sortie</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantité (L) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formMove.quantity_liters}
                        onChange={(e) => setFormMove({ ...formMove, quantity_liters: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Référence</label>
                      <Input
                        value={formMove.reference}
                        onChange={(e) => setFormMove({ ...formMove, reference: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Enregistrer
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Capacité Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCapacity.toFixed(0)} L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Volume Actuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalVolume.toFixed(2)} L</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalCapacity > 0 ? ((totalVolume / totalCapacity) * 100).toFixed(1) : "0"}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Vue des Citernes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tanks.map((tank) => {
                const fillPercent = tank.capacity_liters > 0 ? (tank.current_volume / tank.capacity_liters) * 100 : 0
                const fillColor =
                  fillPercent >= 70 ? "bg-red-500" : fillPercent >= 50 ? "bg-yellow-500" : "bg-green-500"

                return (
                  <Card key={tank.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{tank.tank_code}</CardTitle>
                          <p className="text-sm text-muted-foreground">{tank.oil_type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTank(tank.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Capacité: {tank.capacity_liters} L</p>
                        <p className="text-sm text-muted-foreground">Contenu: {tank.current_volume.toFixed(2)} L</p>
                        <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${fillColor} transition-all`}
                            style={{ width: `${Math.min(100, fillPercent)}%` }}
                          />
                        </div>
                        <p className="text-sm font-semibold">{fillPercent.toFixed(1)}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {tanks.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Aucune citerne. Ajoutez-en une pour commencer.
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Aucun mouvement</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Citerne</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantité (L)</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.movement_date}</TableCell>
                          <TableCell>{m.tank_code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {m.movement_type === "entrée" && <ArrowUp className="h-4 w-4 text-green-500" />}
                              {m.movement_type === "sortie" && <ArrowDown className="h-4 w-4 text-red-500" />}
                              {m.movement_type}
                            </div>
                          </TableCell>
                          <TableCell>{m.quantity_liters}</TableCell>
                          <TableCell className="text-sm">{m.reference}</TableCell>
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
