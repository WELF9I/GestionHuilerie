import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()

    // Delete the advance payment record
    db.prepare('DELETE FROM advance_payments WHERE id = ?').run(id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ message: "Paiement supprimé avec succès" })
  } catch (error) {
    console.error("Error in DELETE /api/advance-payments/[id]:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { amount, payment_date, notes, payment_type } = await request.json()
    
    initializeDatabase()
    const db = getDatabase()

    // Validate required fields
    if (!amount) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Update the advance payment record
    db.prepare(`
      UPDATE advance_payments
      SET amount = ?, payment_date = ?, notes = ?, payment_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Number(amount), payment_date, notes, payment_type, id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ message: "Paiement mis à jour avec succès" })
  } catch (error) {
    console.error("Error in PUT /api/advance-payments/[id]:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}