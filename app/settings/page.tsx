"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
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
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react"
import { formatDisplayDate } from "@/lib/date-utils"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearConfirmation, setClearConfirmation] = useState("")
  const [isClearLoading, setIsClearLoading] = useState(false)

  useEffect(() => {
    const isAuth = localStorage.getItem("huilerie_auth") === "true"
    if (!isAuth) {
      router.push("/")
    }
  }, [router])

  const handleExportDatabase = async () => {
    try {
      const response = await fetch("/api/settings/export")
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'export")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `huilerie-backup-${new Date().toISOString().slice(0, 10)}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Succès",
        description: "Base de données exportée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export de la base de données",
        variant: "destructive",
      })
    }
  }

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".db")) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être un fichier .db",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/settings/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'import")
      }

      toast({
        title: "Succès",
        description: "Base de données importée. La page va se recharger...",
      })

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'import",
        variant: "destructive",
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClearAllData = async () => {
    if (clearConfirmation !== "DELETE_ALL_DATA") {
      toast({
        title: "Erreur",
        description: "Veuillez taper DELETE_ALL_DATA pour confirmer",
        variant: "destructive",
      })
      return
    }

    setIsClearLoading(true)

    try {
      const response = await fetch("/api/settings/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: clearConfirmation }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression")
      }

      toast({
        title: "Succès",
        description: "Toutes les données ont été supprimées. La page va se recharger...",
      })

      setShowClearDialog(false)
      setClearConfirmation("")

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive",
      })
    } finally {
      setIsClearLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
            <p className="mt-2 text-muted-foreground">Gérer les données de l'application</p>
          </div>

          <div className="grid gap-6 max-w-4xl">
            {/* Database Management Section */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion de la base de données</CardTitle>
                <CardDescription>
                  Exporter, importer ou réinitialiser les données de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Database */}
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Download className="h-5 w-5 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Exporter la base de données</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Télécharger une copie complète de la base de données pour sauvegarde sur clé USB ou disque
                      externe.
                    </p>
                    <Button onClick={handleExportDatabase} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>

                {/* Import Database */}
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Upload className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Importer une base de données</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Restaurer une base de données à partir d'un fichier de sauvegarde. Cela remplacera toutes les
                      données actuelles.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".db"
                      onChange={handleImportDatabase}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </Button>
                  </div>
                </div>

                {/* Clear All Data */}
                <div className="flex items-start gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-destructive">Supprimer toutes les données</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Supprimer définitivement toutes les données (employés, achats, ventes, etc.). Cette action est
                      irréversible.
                    </p>
                    <Button
                      onClick={() => setShowClearDialog(true)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer toutes les données
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog for Clear All Data */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmation de suppression
            </AlertDialogTitle>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong>ATTENTION :</strong> Cette action supprimera <strong>TOUTES</strong> les données de l'application :
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Employés</li>
                <li>Fournisseurs et achats d'olives</li>
                <li>Opérations de pressage</li>
                <li>Citernes et mouvements</li>
                <li>Ventes d'huile</li>
                <li>Grignons</li>
              </ul>
              <div className="font-semibold">Cette action est IRRÉVERSIBLE.</div>
              <div className="pt-2">
                <Label htmlFor="confirmation">
                  Pour confirmer, tapez <code className="bg-muted px-2 py-1 rounded">DELETE_ALL_DATA</code>
                </Label>
                <Input
                  id="confirmation"
                  value={clearConfirmation}
                  onChange={(e) => setClearConfirmation(e.target.value)}
                  placeholder="DELETE_ALL_DATA"
                  className="mt-2"
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearConfirmation("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={isClearLoading || clearConfirmation !== "DELETE_ALL_DATA"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isClearLoading ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
