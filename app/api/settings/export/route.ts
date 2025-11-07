import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { initializeDatabase, closeDatabase, getDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    
    // Ensure all pending writes are flushed to disk
    const db = getDatabase()
    db.pragma("wal_checkpoint(TRUNCATE)")
    
    const dbPath = path.join(process.cwd(), "data", "huilerie.db")
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Base de données introuvable" }, { status: 404 })
    }

  // Read the database file
  const dbBuffer = fs.readFileSync(dbPath)

  // Close the database connection after exporting to release file handles
  closeDatabase()
    
    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `huilerie-backup-${timestamp}.db`

    // Return the file as a download
    return new NextResponse(dbBuffer, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": dbBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Erreur lors de l'export de la base de données:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: "Erreur lors de l'export", details: errorMessage }, { status: 500 })
  }
}
