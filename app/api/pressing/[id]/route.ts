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
    const { operation_date, olives_quantity_kg, oil_produced_liters, pomace_quantity_kg, notes } =
      await request.json()

    const rendement = (Number(oil_produced_liters) / Number(olives_quantity_kg)) * 100 || 0

    db.prepare(`
      UPDATE pressing_operations
      SET operation_date = ?, olives_quantity_kg = ?, oil_produced_liters = ?, pomace_quantity_kg = ?, rendement_percentage = ?, notes = ?
      WHERE id = ?
    `).run(
      operation_date,
      olives_quantity_kg,
      oil_produced_liters,
      pomace_quantity_kg || null,
      rendement.toFixed(2),
      notes || null,
      id
    )

    return NextResponse.json({ success: true, rendement: rendement.toFixed(2) })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
