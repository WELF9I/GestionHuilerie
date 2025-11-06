import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const tanks = db.prepare("SELECT * FROM tanks ORDER BY id DESC").all()
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

    const result = db
      .prepare(`
      INSERT INTO tanks (tank_code, capacity_liters, oil_type, current_volume)
      VALUES (?, ?, ?, 0)
    `)
      .run(tank_code, capacity_liters, oil_type || "")

    return NextResponse.json({ id: result.lastInsertRowid, tank_code, capacity_liters, oil_type, current_volume: 0 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
