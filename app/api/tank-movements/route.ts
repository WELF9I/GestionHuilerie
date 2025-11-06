import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const movements = db
      .prepare(`
      SELECT 
        m.*, 
        t.tank_code
      FROM tank_movements m
      LEFT JOIN tanks t ON m.tank_id = t.id
      ORDER BY m.id DESC
    `)
      .all()
    return NextResponse.json(movements)
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
          error: `Capacité dépassée! La citerne ${tank.tank_code} a une capacité de ${tank.capacity_liters}L. Volume actuel: ${tank.current_volume}L. Volume après ajout: ${newVolume}L.` 
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
        message: `Mouvement enregistré avec succès. Nouveau volume: ${newVolume.toFixed(2)}L`
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
          error: `Stock insuffisant! La citerne ${tank.tank_code} contient seulement ${tank.current_volume}L. Quantité demandée: ${quantity}L.` 
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
        message: `Mouvement enregistré avec succès. Nouveau volume: ${newVolume.toFixed(2)}L`
      })

    } else {
      return NextResponse.json({ error: "Type de mouvement non supporté" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du mouvement:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du mouvement" }, { status: 500 })
  }
}
