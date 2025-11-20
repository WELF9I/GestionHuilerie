import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()

    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Calculate offset
    const offset = (page - 1) * limit

    // First, get total count for pagination metadata
    const totalCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM tank_movements m
      LEFT JOIN tanks t ON m.tank_id = t.id
    `).get() as { count: number }

    const totalCount = totalCountResult.count

    // Get paginated results
    const movements = db
      .prepare(`
      SELECT
        m.*,
        t.tank_code
      FROM tank_movements m
      LEFT JOIN tanks t ON m.tank_id = t.id
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?
    `)
      .all(limit, offset)

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    // Return both data and pagination metadata
    return NextResponse.json({
      data: movements,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { movement_date, movement_type, tank_id, quantity_liters, reference, notes } = await request.json()

    const quantity = Number(quantity_liters)
    
    // Handle different movement types
    if (movement_type === "entrée") {
      // Get tank details including capacity
      const tank = db.prepare("SELECT * FROM tanks WHERE id = ?").get(tank_id) as { 
        id: number
        tank_code: string
        capacity_liters: number
        current_volume: number
      }

      if (!tank) {
        return NextResponse.json({ error: "Citerne non trouvée" }, { status: 404 })
      }

      const newVolume = tank.current_volume + quantity
      
      // Check if new volume exceeds capacity
      if (newVolume > tank.capacity_liters) {
        return NextResponse.json({ 
          error: `Capacité dépassée! La citerne ${tank.tank_code} a une capacité de ${tank.capacity_liters}Kg. Volume actuel: ${tank.current_volume}Kg. Volume après ajout: ${newVolume}Kg.`
        }, { status: 400 })
      }

      // Update tank volume
      db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, tank_id)

      const result = db
        .prepare(`
        INSERT INTO tank_movements (movement_date, movement_type, tank_id, quantity_liters, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .run(movement_date, movement_type, tank_id, quantity_liters, reference || "", notes || "")

      return NextResponse.json({
        id: result.lastInsertRowid,
        success: true,
        message: `Mouvement enregistré avec succès. Nouveau volume: ${newVolume.toFixed(2)}Kg`
      })

    } else if (movement_type === "sortie") {
      // Get tank details
      const tank = db.prepare("SELECT * FROM tanks WHERE id = ?").get(tank_id) as { 
        id: number
        tank_code: string
        capacity_liters: number
        current_volume: number
      }

      if (!tank) {
        return NextResponse.json({ error: "Citerne non trouvée" }, { status: 404 })
      }

      // Check if there's enough oil to withdraw
      if (quantity > tank.current_volume) {
        return NextResponse.json({ 
          error: `Stock insuffisant! La citerne ${tank.tank_code} contient seulement ${tank.current_volume}Kg. Quantité demandée: ${quantity}Kg.`
        }, { status: 400 })
      }

      const newVolume = Math.max(0, tank.current_volume - quantity)

      // Update tank volume
      db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, tank_id)

      const result = db
        .prepare(`
        INSERT INTO tank_movements (movement_date, movement_type, tank_id, quantity_liters, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .run(movement_date, movement_type, tank_id, quantity_liters, reference || "", notes || "")

      return NextResponse.json({
        id: result.lastInsertRowid,
        success: true,
        message: `Mouvement enregistré avec succès. Nouveau volume: ${newVolume.toFixed(2)}Kg`
      })

    } else {
      return NextResponse.json({ error: "Type de mouvement non supporté" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du mouvement:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du mouvement" }, { status: 500 })
  }
}
