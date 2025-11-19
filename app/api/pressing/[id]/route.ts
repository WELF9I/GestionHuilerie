import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM pressing_operations WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    const { operation_date, olives_quantity_kg, total_price, notes } =
      await request.json()

    db.prepare(`
      UPDATE pressing_operations
      SET operation_date = ?, olives_quantity_kg = ?, total_price = ?, notes = ?
      WHERE id = ?
    `).run(
      operation_date,
      olives_quantity_kg,
      total_price,
      notes || null,
      id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
