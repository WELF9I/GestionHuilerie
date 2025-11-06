import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"
import { verifyAuthToken } from "@/lib/auth"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    initializeDatabase()
    const db = getDatabase()

    // Fetch aggregated data
    const revenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_orders").get() as {
      total: number
    }
    const oilProduced = db
      .prepare("SELECT COALESCE(SUM(oil_output_liters), 0) as total FROM pressing_operations")
      .get() as { total: number }
    const pomaceGenerated = db.prepare("SELECT COALESCE(SUM(quantity_kg), 0) as total FROM pomace").get() as {
      total: number
    }
    const employees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = ?").get("active") as {
      count: number
    }
    const suppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers WHERE status = ?").get("active") as {
      count: number
    }

    // Mock monthly data
    const monthlyData = [
      { month: "Jan", revenue: 5000, oilOutput: 1200 },
      { month: "Feb", revenue: 6500, oilOutput: 1500 },
      { month: "Mar", revenue: 7200, oilOutput: 1800 },
      { month: "Apr", revenue: 8100, oilOutput: 2100 },
      { month: "May", revenue: 9000, oilOutput: 2400 },
      { month: "Jun", revenue: 10200, oilOutput: 2800 },
    ]

    const statusDistribution = [
      {
        name: "Pending Orders",
        value: db.prepare("SELECT COUNT(*) as count FROM sales_orders WHERE status = ?").get("pending") as unknown as {
          count: number
        },
      },
      {
        name: "Active Operations",
        value: db
          .prepare("SELECT COUNT(*) as count FROM pressing_operations WHERE status = ?")
          .get("pending") as unknown as { count: number },
      },
      { name: "Completed", value: 45 },
    ]

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: revenue.total,
        totalOilProduced: oilProduced.total,
        totalPomace: pomaceGenerated.total,
        totalEmployees: employees.count,
        totalSuppliers: suppliers.count,
        monthlyData,
        statusDistribution: [
          { name: "Pending Orders", value: (statusDistribution[0].value as any).count || 0 },
          { name: "Active Operations", value: (statusDistribution[1].value as any).count || 0 },
          { name: "Completed", value: 45 },
        ],
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch reports" },
      { status: 500 },
    )
  }
}
