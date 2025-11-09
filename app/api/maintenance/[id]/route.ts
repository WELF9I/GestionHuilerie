import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDatabase()
    
    const maintenanceFee = db.prepare(`
      SELECT * FROM maintenance_fees WHERE id = ?
    `).get(id)

    if (!maintenanceFee) {
      return NextResponse.json(
        { error: "Frais de maintenance non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(maintenanceFee)
  } catch (error) {
    console.error("Erreur lors de la récupération du frais de maintenance:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du frais de maintenance" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { expense_date, description, amount, category, provider, notes } = body

    if (!expense_date || !description || !amount) {
      return NextResponse.json(
        { error: "Les champs date, description et montant sont obligatoires" },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    const result = db.prepare(`
      UPDATE maintenance_fees 
      SET expense_date = ?, description = ?, amount = ?, category = ?, provider = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(expense_date, description, amount, category || 'maintenance', provider, notes, id)

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Frais de maintenance non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Frais de maintenance modifié avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de la modification du frais de maintenance:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification du frais de maintenance" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDatabase()
    
    const result = db.prepare(`
      DELETE FROM maintenance_fees WHERE id = ?
    `).run(id)

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Frais de maintenance non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Frais de maintenance supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de la suppression du frais de maintenance:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du frais de maintenance" },
      { status: 500 }
    )
  }
}
