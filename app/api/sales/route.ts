import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const sales = db.prepare("SELECT * FROM oil_sales ORDER BY id DESC").all()
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { sale_date, customer_name, quantity_liters, unit_price, tank_id, notes } = await request.json()

    const total_amount = Number(quantity_liters) * Number(unit_price)

    // Deduct from tank
    const tank = db.prepare("SELECT current_volume FROM tanks WHERE id = ?").get(tank_id) as { current_volume: number }
    const newVolume = Math.max(0, tank.current_volume - Number(quantity_liters))
    db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, tank_id)

    const result = db
      .prepare(`
      INSERT INTO oil_sales (sale_date, customer_name, quantity_liters, unit_price, total_amount, tank_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(sale_date, customer_name, quantity_liters, unit_price, total_amount, tank_id, notes || "")

    return NextResponse.json({ id: result.lastInsertRowid, total_amount })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
