import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const purchases = db
      .prepare(`
      SELECT p.*, s.name as supplier_name FROM olive_purchases p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.id DESC
    `)
      .all()
    return NextResponse.json(purchases)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { purchase_date, supplier_id, quantity_kg, unit_price, advance_paid } = await request.json()

    const total_amount = Number(quantity_kg) * Number(unit_price)
    const remaining_balance = total_amount - Number(advance_paid)
    const batch_number = `LOT-${Date.now()}`

    const result = db
      .prepare(`
      INSERT INTO olive_purchases (purchase_date, supplier_id, quantity_kg, unit_price, total_amount, advance_paid, remaining_balance, batch_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        purchase_date,
        supplier_id,
        quantity_kg,
        unit_price,
        total_amount,
        advance_paid,
        remaining_balance,
        batch_number,
      )

    return NextResponse.json({ id: result.lastInsertRowid, batch_number, total_amount, remaining_balance })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
