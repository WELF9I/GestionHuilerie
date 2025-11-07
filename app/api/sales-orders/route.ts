import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const orders = db.prepare("SELECT * FROM sales_orders ORDER BY order_date DESC").all()

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const {
      order_number,
      customer_name,
      order_date,
      delivery_date,
      oil_type,
      quantity_liters,
      unit_price,
      total_amount,
    } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO sales_orders (order_number, customer_name, order_date, delivery_date, oil_type, quantity_liters, unit_price, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        order_number,
        customer_name,
        order_date,
        delivery_date,
        oil_type,
        quantity_liters,
        unit_price,
        total_amount,
        "pending",
      )

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        order_number,
        customer_name,
        order_date,
        delivery_date,
        oil_type,
        quantity_liters,
        unit_price,
        total_amount,
        status: "pending",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 400 },
    )
  }
}
