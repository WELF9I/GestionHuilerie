import { NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()

    // Get employee count
    const employees = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number }

    // Get supplier count
    const suppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number }

    // Get total oil stock from tanks
    const oilStock = db.prepare("SELECT SUM(current_volume) as total FROM tanks").get() as { total: number | null }

    // Get monthly sales (current month)
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

    const sales = db
      .prepare(`
      SELECT SUM(total_amount) as total FROM oil_sales 
      WHERE sale_date BETWEEN ? AND ?
    `)
      .get(firstDay, lastDay) as { total: number | null }

    return NextResponse.json({
      totalEmployees: employees.count || 0,
      totalSuppliers: suppliers.count || 0,
      currentOilStock: oilStock.total || 0,
      monthlySales: sales.total || 0,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({
      totalEmployees: 0,
      totalSuppliers: 0,
      currentOilStock: 0,
      monthlySales: 0,
    })
  }
}
