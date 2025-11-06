import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    // Only return active tanks by default (is_active = 1)
    const tanks = db.prepare("SELECT * FROM tanks WHERE is_active = 1 ORDER BY id DESC").all()
    return NextResponse.json(tanks)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { tank_code, capacity_liters, oil_type } = await request.json()

    if (!tank_code || !capacity_liters) {
      return NextResponse.json({ error: "tank_code et capacity_liters sont requis" }, { status: 400 })
    }

    const result = db
      .prepare(`
      INSERT INTO tanks (tank_code, capacity_liters, oil_type, current_volume, is_active)
      VALUES (?, ?, ?, 0, 1)
    `)
      .run(tank_code, capacity_liters, oil_type || "")

    return NextResponse.json({ id: result.lastInsertRowid, tank_code, capacity_liters, oil_type, current_volume: 0 })
  } catch (error) {
    console.error("Error creating tank:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: "Erreur lors de la création de la citerne", details: errorMessage }, { status: 500 })
  }
}
