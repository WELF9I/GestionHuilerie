"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">System overview and key metrics</p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="mt-1 text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Oil Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 L</div>
                <p className="mt-1 text-xs text-muted-foreground">Total produced</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="mt-1 text-xs text-muted-foreground">Operations running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="mt-1 text-xs text-muted-foreground">System status</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules Principaux */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Modules Principaux</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Employés */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/employees")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    Employés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gestion du personnel</p>
                </CardContent>
              </Card>

              {/* Paie */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/payroll")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    Paie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gestion des salaires</p>
                </CardContent>
              </Card>

              {/* Fournisseurs */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/suppliers")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🚚</span>
                    Fournisseurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gestion des fournisseurs</p>
                </CardContent>
              </Card>

              {/* Achats d'Huile */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/purchases")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🫒</span>
                    Achats d'Huile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Achats et stocks</p>
                </CardContent>
              </Card>

              {/* Pressage */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pressing")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    Pressage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Transformation des olives</p>
                </CardContent>
              </Card>

              {/* Citernes */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/tanks")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🏭</span>
                    Citernes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Stockage d'huile</p>
                </CardContent>
              </Card>

              {/* Ventes */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/sales")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    Ventes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Ventes d'huile</p>
                </CardContent>
              </Card>

              {/* Maintenance */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/maintenance")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🔧</span>
                    Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Frais de maintenance</p>
                </CardContent>
              </Card>

              {/* Grignons */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pomace")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🌾</span>
                    Grignons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gestion des résidus</p>
                </CardContent>
              </Card>

              {/* Paramètres */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/settings")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    Paramètres
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Configuration système</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
