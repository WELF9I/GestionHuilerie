"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Eye, EyeOff, Users, Truck, Droplet, ShoppingCart, AlertCircle, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import Navigation from "@/components/navigation"

interface DashboardStats {
  totalEmployees: number
  totalSuppliers: number
  currentOilStock: number
  monthlySales: number
}

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalSuppliers: 0,
    currentOilStock: 0,
    monthlySales: 0,
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    setIsAuthenticated(isAuth)
    setIsLoading(false)

    if (isAuth) {
      loadDashboardStats()
    }
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password === "hassenadmin") {
      localStorage.setItem("huilerie_auth", "true")
      setIsAuthenticated(true)
      setPassword("")
    } else {
      setError("Mot de passe incorrect")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("huilerie_auth")
    setIsAuthenticated(false)
    setPassword("")
  }

  const handleExportDatabase = async () => {
    try {
      const response = await fetch("/api/settings/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `huilerie-backup-${new Date().toISOString().split("T")[0]}.db`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Erreur lors de l'export de la base de données")
      }
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      alert("Erreur lors de l'export de la base de données")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-linear-to-br from-background via-card to-background px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Droplets className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Huilerie</h1>
            <p className="mt-2 text-lg text-muted-foreground">Gestion Complète de Votre Production</p>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Accès Sécurisé</CardTitle>
              <CardDescription>Entrez votre mot de passe pour accéder</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 text-base"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full text-base h-10">
                  Connexion
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">Application de gestion d'huilerie - Accès protégé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tableau de Bord</h1>
              <p className="mt-2 text-lg text-muted-foreground">Bienvenue dans l'application de gestion d'huilerie</p>
            </div>
            <Button
              onClick={handleExportDatabase}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Exporter la Base de Données
            </Button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Employés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.totalEmployees}</div>
                <p className="mt-2 text-xs text-muted-foreground">Gestion du personnel</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Total Fournisseurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.totalSuppliers}</div>
                <p className="mt-2 text-xs text-muted-foreground">Gestion des fournisseurs</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Stock d'Huile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.currentOilStock.toFixed(0)} L</div>
                <p className="mt-2 text-xs text-muted-foreground">Litres disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ventes du Mois (Huile)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.monthlySales.toFixed(0)} DT</div>
                <p className="mt-2 text-xs text-muted-foreground">Total en TND</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Modules Principaux</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/employees">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Employés</CardTitle>
                        <CardDescription>Gestion du personnel</CardDescription>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/suppliers">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Fournisseurs</CardTitle>
                        <CardDescription>Gestion des fournisseurs</CardDescription>
                      </div>
                      <Truck className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/purchases">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Achats d'Huile</CardTitle>
                        <CardDescription>Enregistrement des achats</CardDescription>
                      </div>
                      <Droplets className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/pressing">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Pressage</CardTitle>
                        <CardDescription>Transformation d'olives</CardDescription>
                      </div>
                      <Droplets className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/tanks">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Citernes</CardTitle>
                        <CardDescription>Gestion du stockage</CardDescription>
                      </div>
                      <AlertCircle className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/sales">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Ventes d'Huile</CardTitle>
                        <CardDescription>Enregistrement des ventes</CardDescription>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/pomace">
                <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Grignons</CardTitle>
                        <CardDescription>Gestion des résidus</CardDescription>
                      </div>
                      <Droplets className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
