import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()

    // Get the payment to be deleted
    const payment = db.prepare('SELECT * FROM purchase_payments WHERE id = ?').get(id) as any
    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
    }

    // Get the related purchase
    const purchase = db.prepare('SELECT * FROM olive_purchases WHERE id = ?').get(payment.purchase_id) as any
    if (!purchase) {
      return NextResponse.json({ error: "Achat introuvable" }, { status: 404 })
    }

    // Update the purchase record by removing this payment amount
    const newAdvancePaid = Number(purchase.advance_paid) - Number(payment.amount)
    const newRemainingBalance = Number(purchase.total_amount) - newAdvancePaid

    db.prepare(`
      UPDATE olive_purchases
      SET advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAdvancePaid, newRemainingBalance, payment.purchase_id)

    // Delete the payment record
    db.prepare('DELETE FROM purchase_payments WHERE id = ?').run(id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ message: "Paiement supprimé avec succès" })
  } catch (error) {
    console.error("Error in DELETE /api/purchase-payments/[id]:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { amount, payment_date, notes } = await request.json()
    
    initializeDatabase()
    const db = getDatabase()

    // Validate required fields
    if (!amount || !payment_date) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Get the current payment record
    const currentPayment = db.prepare('SELECT * FROM purchase_payments WHERE id = ?').get(id) as any
    if (!currentPayment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
    }

    // Get the related purchase
    const purchase = db.prepare('SELECT * FROM olive_purchases WHERE id = ?').get(currentPayment.purchase_id) as any
    if (!purchase) {
      return NextResponse.json({ error: "Achat introuvable" }, { status: 404 })
    }

    // Calculate the difference between old and new amount
    const amountDifference = Number(amount) - Number(currentPayment.amount)
    const newAdvancePaid = Number(purchase.advance_paid) + amountDifference
    const maxPossibleAdvance = Number(purchase.total_amount)
    
    if (newAdvancePaid > maxPossibleAdvance) {
      return NextResponse.json({ 
        error: `Le montant total payé dépasse le montant total de l'achat (${maxPossibleAdvance} DT)` 
      }, { status: 400 })
    }

    const newRemainingBalance = maxPossibleAdvance - newAdvancePaid

    // Update the purchase record with the new amounts
    db.prepare(`
      UPDATE olive_purchases
      SET advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAdvancePaid, newRemainingBalance, currentPayment.purchase_id)

    // Update the payment record
    db.prepare(`
      UPDATE purchase_payments
      SET amount = ?, payment_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Number(amount), payment_date, notes, id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ 
      message: "Paiement mis à jour avec succès",
      newAdvancePaid,
      newRemainingBalance
    })
  } catch (error) {
    console.error("Error in PUT /api/purchase-payments/[id]:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}