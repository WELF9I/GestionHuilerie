import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = getDatabase()
    
    const maintenanceFees = db.prepare(`
      SELECT * FROM maintenance_fees 
      ORDER BY expense_date DESC, created_at DESC
    `).all()

    // Calculate statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        MAX(amount) as max_amount,
        MIN(amount) as min_amount
      FROM maintenance_fees
    `).get() as {
      total_count: number
      total_amount: number
      average_amount: number
      max_amount: number
      min_amount: number
    }

    return NextResponse.json({
      maintenanceFees,
      stats: {
        totalCount: stats.total_count || 0,
        totalAmount: stats.total_amount || 0,
        averageAmount: stats.average_amount || 0,
        maxAmount: stats.max_amount || 0,
        minAmount: stats.min_amount || 0
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des frais de maintenance:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des frais de maintenance" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      INSERT INTO maintenance_fees (expense_date, description, amount, category, provider, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(expense_date, description, amount, category || 'maintenance', provider, notes)

    return NextResponse.json({
      id: result.lastInsertRowid,
      message: "Frais de maintenance ajouté avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de l'ajout du frais de maintenance:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du frais de maintenance" },
      { status: 500 }
    )
  }
}
