import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const movements = db
      .prepare(`
      SELECT m.*, t.tank_code FROM tank_movements m
      LEFT JOIN tanks t ON m.tank_id = t.id ORDER BY m.id DESC
    `)
      .all()
    return NextResponse.json(movements)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { movement_date, movement_type, tank_id, quantity_liters, reference, notes } = await request.json()

    // Update tank volume
    const tank = db.prepare("SELECT current_volume FROM tanks WHERE id = ?").get(tank_id) as { current_volume: number }
    let newVolume = tank.current_volume
    if (movement_type === "entrée") {
      newVolume += Number(quantity_liters)
    } else if (movement_type === "sortie") {
      newVolume = Math.max(0, newVolume - Number(quantity_liters))
    }

    db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, tank_id)

    const result = db
      .prepare(`
      INSERT INTO tank_movements (movement_date, movement_type, tank_id, quantity_liters, reference, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(movement_date, movement_type, tank_id, quantity_liters, reference || "", notes || "")

    return NextResponse.json({ id: result.lastInsertRowid })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
