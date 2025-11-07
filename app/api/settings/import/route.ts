import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Validate file extension
    if (!file.name.endsWith(".db")) {
      return NextResponse.json({ error: "Le fichier doit être un fichier .db" }, { status: 400 })
    }

    const dbPath = path.join(process.cwd(), "data", "huilerie.db")
    const backupPath = path.join(process.cwd(), "data", `huilerie-backup-${Date.now()}.db`)

    // Create backup of current database before replacing
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
    }

    // Read the uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write the new database file
    fs.writeFileSync(dbPath, buffer)

    return NextResponse.json({ 
      success: true, 
      message: "Base de données importée avec succès. Veuillez actualiser la page.",
      backup: backupPath
    })
  } catch (error) {
    console.error("Erreur lors de l'import de la base de données:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: "Erreur lors de l'import", details: errorMessage }, { status: 500 })
  }
}
