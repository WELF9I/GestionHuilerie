import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { purchase_date, supplier_id, quantity_kg, unit_price, advance_paid } = await request.json()

    initializeDatabase()
    const db = getDatabase()

    const total_amount = Number(quantity_kg) * Number(unit_price)
    const remaining_balance = total_amount - Number(advance_paid)

    const result = db
      .prepare(`
      UPDATE olive_purchases 
      SET purchase_date = ?, supplier_id = ?, quantity_kg = ?, unit_price = ?, 
          total_amount = ?, advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(
        purchase_date,
        supplier_id,
        quantity_kg,
        unit_price,
        total_amount,
        advance_paid,
        remaining_balance,
        id
      )

    return NextResponse.json({ 
      id: parseInt(id), 
      purchase_date, 
      supplier_id, 
      quantity_kg, 
      unit_price, 
      total_amount, 
      advance_paid, 
      remaining_balance 
    })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM olive_purchases WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
