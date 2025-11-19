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

    const quantity = Number(quantity_liters)
    const total_amount = quantity * Number(unit_price)

    // Check tank stock only if tank_id is provided
    if (tank_id) {
      const tank = db.prepare("SELECT tank_code, current_volume FROM tanks WHERE id = ?").get(tank_id) as { tank_code: string, current_volume: number }
      if (!tank) {
        return NextResponse.json({ error: "Citerne non trouvée" }, { status: 404 })
      }

      if (quantity > tank.current_volume) {
        return NextResponse.json({ 
          error: `Stock insuffisant! La citerne ${tank.tank_code} contient seulement ${tank.current_volume}Kg. Quantité demandée: ${quantity}Kg.`
        }, { status: 400 })
      }

      // Deduct from tank
      const newVolume = tank.current_volume - quantity
      db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, tank_id)
    }

    const result = db
      .prepare(`
      INSERT INTO oil_sales (sale_date, customer_name, quantity_liters, unit_price, total_amount, tank_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(sale_date, customer_name, quantity_liters, unit_price, total_amount, tank_id || null, notes || "")

    return NextResponse.json({ id: result.lastInsertRowid, total_amount })
  } catch (error) {
    console.error("Erreur lors de la vente:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: "Erreur lors de la vente", details: errorMessage }, { status: 500 })
  }
}
