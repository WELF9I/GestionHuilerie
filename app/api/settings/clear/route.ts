import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { confirmation } = await request.json()

    if (confirmation !== "DELETE_ALL_DATA") {
      return NextResponse.json({ error: "Confirmation incorrecte" }, { status: 400 })
    }

    // Get all table names (excluding sqlite internal tables)
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]

    // Temporarily disable foreign key constraints
    db.prepare("PRAGMA foreign_keys = OFF").run()

    try {
      // Delete all data from each table (but keep the structure)
      for (const table of tables) {
        // Don't delete from users table to keep the admin account
        if (table.name !== "users" && table.name !== "settings") {
          db.prepare(`DELETE FROM ${table.name}`).run()
        }
      }

      // Reset auto-increment counters
      db.prepare("DELETE FROM sqlite_sequence WHERE name != 'users'").run()
    } finally {
      // Re-enable foreign key constraints
      db.prepare("PRAGMA foreign_keys = ON").run()
    }

    return NextResponse.json({ 
      success: true, 
      message: "Toutes les données ont été supprimées avec succès",
      tablesCleared: tables.filter(t => t.name !== "users" && t.name !== "settings").length
    })
  } catch (error) {
    console.error("Erreur lors de la suppression des données:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: "Erreur lors de la suppression", details: errorMessage }, { status: 500 })
  }
}
