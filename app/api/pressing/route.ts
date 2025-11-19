import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const operations = db
      .prepare(`
      SELECT * FROM pressing_operations ORDER BY operation_date DESC
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
    const { operation_date, olives_quantity_kg, total_price, notes } =
      await request.json()

    const result = db
      .prepare(`
      INSERT INTO pressing_operations (operation_date, olives_quantity_kg, total_price, notes)
      VALUES (?, ?, ?, ?)
    `)
      .run(
        operation_date,
        olives_quantity_kg,
        total_price,
        notes || null,
      )

    return NextResponse.json({ id: result.lastInsertRowid })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
