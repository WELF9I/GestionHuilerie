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
    const { operation_date, olives_quantity_kg, oil_produced_liters, pomace_quantity_kg, notes } =
      await request.json()

    const rendement = (Number(oil_produced_liters) / Number(olives_quantity_kg)) * 100 || 0

    const result = db
      .prepare(`
      INSERT INTO pressing_operations (operation_date, olives_quantity_kg, oil_produced_liters, pomace_quantity_kg, rendement_percentage, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(
        operation_date,
        olives_quantity_kg,
        oil_produced_liters,
        pomace_quantity_kg || null,
        rendement.toFixed(2),
        notes || null,
      )

    // Create pomace record if pomace_quantity_kg is provided
    if (pomace_quantity_kg && Number(pomace_quantity_kg) > 0) {
      db.prepare(`
        INSERT INTO pomace (collection_date, quantity_kg, status, notes)
        VALUES (?, ?, 'stocké', ?)
      `).run(operation_date, pomace_quantity_kg, `Généré depuis pressage #${result.lastInsertRowid}`)
    }

    return NextResponse.json({ id: result.lastInsertRowid, rendement: rendement.toFixed(2) })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
