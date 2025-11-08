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

    // Get monthly sales (current month) - Only oil sales from oil_sales table
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Format dates as YYYY-MM-DD for SQLite
    const firstDayStr = firstDay.toISOString().split('T')[0]
    const lastDayStr = lastDay.toISOString().split('T')[0]

    const sales = db
      .prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM oil_sales
      WHERE sale_date >= ? AND sale_date <= ?
      AND total_amount > 0
    `)
      .get(firstDayStr, lastDayStr) as { total: number | null }

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
