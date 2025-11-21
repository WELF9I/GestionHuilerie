import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { initializeDatabase, closeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
  const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Validate file extension
    if (!file.name.endsWith(".db")) {
      return NextResponse.json({ error: "Le fichier doit être un fichier .db" }, { status: 400 })
    }

    const dataDir = path.join(process.cwd(), "data")
    const dbPath = path.join(dataDir, "huilerie.db")
    const backupPath = path.join(dataDir, `huilerie-backup-${Date.now()}.db`)
    const walPath = `${dbPath}-wal`
    const shmPath = `${dbPath}-shm`

    // Close the current database connection before replacing the file
    closeDatabase()

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Create backup of current database before replacing
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
    }

    // Remove lingering WAL/SHM files so they don't override imported data
    // Handle Windows permission issues when files are locked
    try {
      if (fs.existsSync(walPath)) {
        fs.rmSync(walPath)
      }
    } catch (error) {
      console.warn("Could not delete WAL file (likely still locked):", walPath, error.message)
      // On Windows, WAL files may still be locked, which is normal
      // We can continue with the import anyway
    }

    try {
      if (fs.existsSync(shmPath)) {
        fs.rmSync(shmPath)
      }
    } catch (error) {
      console.warn("Could not delete SHM file (likely still locked):", shmPath, error.message)
      // On Windows, SHM files may still be locked, which is normal
      // We can continue with the import anyway
    }

    // Read the uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write the new database file
    fs.writeFileSync(dbPath, buffer)

    // Reinitialize the database with the new file
    initializeDatabase()

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
