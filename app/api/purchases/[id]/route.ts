import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { purchase_date, supplier_id, quantity_kg, unit_price, advance_paid, tank_allocations } = await request.json()

    initializeDatabase()
    const db = getDatabase()

    // Validate required fields
    if (!purchase_date || !supplier_id || !quantity_kg || !unit_price) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Check if supplier exists
    const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id) as { name: string } | undefined
    if (!supplier) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 400 })
    }

    const total_amount = Number(quantity_kg) * Number(unit_price)
    const remaining_balance = total_amount - Number(advance_paid)

    // Update the purchase
    db.prepare(`
      UPDATE olive_purchases
      SET purchase_date = ?, supplier_id = ?, quantity_kg = ?, unit_price = ?, total_amount = ?, advance_paid = ?, remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      purchase_date,
      supplier_id,
      quantity_kg,
      unit_price,
      total_amount,
      advance_paid,
      remaining_balance,
      id
    )

    // Update tank volumes based on tank allocations
    if (tank_allocations && Array.isArray(tank_allocations)) {
      // First get the purchase to access batch number for finding previous movements
      const currentPurchase = db.prepare('SELECT batch_number FROM olive_purchases WHERE id = ?').get(id) as any

      // First clear existing allocations for this purchase by looking for both batch number and purchase ID formats
      let previousAllocations = db.prepare(`
        SELECT tank_id, quantity_liters
        FROM tank_movements
        WHERE notes LIKE ?
      `).all(`%Achat ${currentPurchase.batch_number}%`) as any[]

      // If not found with batch number, try with purchase ID format
      if (previousAllocations.length === 0) {
        previousAllocations = db.prepare(`
          SELECT tank_id, quantity_liters
          FROM tank_movements
          WHERE notes LIKE ?
        `).all(`%purchase ID: ${id}%`) as any[]
      }

      // Reduce the previous allocations
      for (const alloc of previousAllocations) {
        db.prepare(`
          UPDATE tanks
          SET current_volume = current_volume - ?
          WHERE id = ?
        `).run(alloc.quantity_liters, alloc.tank_id)
      }

      // Add new allocations
      for (const allocation of tank_allocations) {
        if (allocation.tank_id && allocation.quantity) {
          db.prepare(`
            UPDATE tanks
            SET current_volume = current_volume + ?
            WHERE id = ?
          `).run(Number(allocation.quantity), allocation.tank_id)

          // Record tank movement
          db.prepare(`
            INSERT INTO tank_movements (tank_id, movement_type, quantity_liters, movement_date, notes)
            VALUES (?, 'entree', ?, ?, ?)
          `).run(
            allocation.tank_id,
            Number(allocation.quantity),
            purchase_date,
            `Achat (updated) for purchase ID: ${id}`
          )
        }
      }
    }

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ id: parseInt(id), total_amount, remaining_balance })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()

    // Get the purchase details before deletion to handle tank volumes
    const purchase = db.prepare('SELECT * FROM olive_purchases WHERE id = ?').get(id) as any

    if (!purchase) {
      return NextResponse.json({ error: "Achat introuvable" }, { status: 404 })
    }

    // Get tank allocations for this purchase to revert the volume changes
    // First try to find with batch number format (for original purchases)
    let previousAllocations = db.prepare(`
      SELECT tank_id, quantity_liters
      FROM tank_movements
      WHERE notes LIKE ?
    `).all(`%Achat ${purchase.batch_number}%`) as any[]

    // If not found with batch number, try with purchase ID format (for updated purchases)
    if (previousAllocations.length === 0) {
      previousAllocations = db.prepare(`
        SELECT tank_id, quantity_liters
        FROM tank_movements
        WHERE notes LIKE ?
      `).all(`%purchase ID: ${id}%`) as any[]
    }

    // Reverse the tank volume changes
    for (const alloc of previousAllocations) {
      db.prepare(`
        UPDATE tanks
        SET current_volume = current_volume - ?
        WHERE id = ?
      `).run(alloc.quantity_liters, alloc.tank_id)

      // Mark the movement as deleted or create a reversal entry
      db.prepare(`
        INSERT INTO tank_movements (tank_id, movement_type, quantity_liters, movement_date, notes)
        VALUES (?, 'retrait', ?, ?, ?)
      `).run(
        alloc.tank_id,
        -alloc.quantity_liters,
        new Date().toISOString().split('T')[0],
        `Reversal for deleted purchase ID: ${id}`
      )
    }

    // Delete the purchase
    db.prepare('DELETE FROM olive_purchases WHERE id = ?').run(id)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ message: "Achat supprimé avec succès" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
