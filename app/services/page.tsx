"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ServicesPage() {
  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Services aux Tiers</h1>
            <p className="mt-2 text-muted-foreground">Pressage et services à façon</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pressage à Façon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gestion des services de pressage effectués pour des clients externes.
                </p>
                <div className="space-y-2 text-sm">
                  <p>• Enregistrement des clients</p>
                  <p>• Quantités d'olives reçues</p>
                  <p>• Rendements et frais de pressage</p>
                  <p>• Traçabilité par lot</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Pressage des olives (rendement garanti)</li>
                  <li>✓ Filtration et clarification</li>
                  <li>✓ Stockage temporaire</li>
                  <li>✓ Conditionnement</li>
                  <li>✓ Analyse qualitative</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
