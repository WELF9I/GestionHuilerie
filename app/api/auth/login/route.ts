import { type NextRequest, NextResponse } from "next/server"
import { loginUser, generateAuthToken } from "@/lib/auth"
import { initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await loginUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateAuthToken(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed" }, { status: 400 })
  }
}
