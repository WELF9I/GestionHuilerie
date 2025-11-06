import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const operations = db
      .prepare(`
      SELECT p.*, o.batch_number as lot FROM pressing_operations p
      LEFT JOIN olive_purchases o ON p.purchase_id = o.id ORDER BY p.id DESC
    `)
      .all()
    return NextResponse.json(operations)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { operation_date, purchase_id, olives_quantity_kg, oil_produced_liters, pomace_quantity_kg } =
      await request.json()

    const rendement = (Number(oil_produced_liters) / Number(olives_quantity_kg)) * 100 || 0

    const result = db
      .prepare(`
      INSERT INTO pressing_operations (operation_date, purchase_id, olives_quantity_kg, oil_produced_liters, pomace_quantity_kg, rendement_percentage)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(
        operation_date,
        purchase_id,
        olives_quantity_kg,
        oil_produced_liters,
        pomace_quantity_kg,
        rendement.toFixed(2),
      )

    return NextResponse.json({ id: result.lastInsertRowid, rendement: rendement.toFixed(2) })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
