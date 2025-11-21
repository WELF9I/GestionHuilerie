import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get("purchase_id") || null

    let query = `
      SELECT * FROM purchase_payments
      WHERE 1=1
    `
    const params: any[] = []

    if (purchaseId) {
      query += ` AND purchase_id = ?`
      params.push(purchaseId)
    }
    
    query += ` ORDER BY payment_date DESC, id DESC`

    const payments = db.prepare(query).all(params)

    return NextResponse.json({ data: payments })
  } catch (error) {
    console.error("Error in GET /api/purchase-payments:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { purchase_id, amount, payment_date, notes } = await request.json()

    // Validate required fields
    if (!purchase_id || !amount || !payment_date) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Get the related purchase to validate and update remaining balance
    const purchase = db.prepare('SELECT * FROM olive_purchases WHERE id = ?').get(purchase_id) as any
    if (!purchase) {
      return NextResponse.json({ error: "Achat introuvable" }, { status: 404 })
    }

    // Calculate new advance paid and remaining balance
    const newAdvancePaid = Number(purchase.advance_paid) + Number(amount)
    const maxPossibleAdvance = Number(purchase.total_amount)
    
    if (newAdvancePaid > maxPossibleAdvance) {
      return NextResponse.json({ 
        error: `Le montant total payé dépasse le montant total de l'achat (${maxPossibleAdvance} DT)` 
      }, { status: 400 })
    }

    const newRemainingBalance = maxPossibleAdvance - newAdvancePaid

    // Update the purchase record with the new advance and remaining balance
    db.prepare(`
      UPDATE olive_purchases 
      SET advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newAdvancePaid, newRemainingBalance, purchase_id)

    // Create the payment record
    const result = db.prepare(`
      INSERT INTO purchase_payments (purchase_id, amount, payment_date, notes)
      VALUES (?, ?, ?, ?)
    `).run(purchase_id, Number(amount), payment_date, notes || null)

    // Update the purchase record to ensure the data is consistent
    db.prepare(`
      UPDATE olive_purchases
      SET advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAdvancePaid, newRemainingBalance, purchase_id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({
      id: result.lastInsertRowid,
      message: "Paiement enregistré avec succès",
      newAdvancePaid,
      newRemainingBalance
    })
  } catch (error) {
    console.error("Error in POST /api/purchase-payments:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du paiement" }, { status: 500 })
  }
}

