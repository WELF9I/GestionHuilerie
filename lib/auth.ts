import crypto from "crypto"
import { getDatabase } from "./db"

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export interface AuthToken {
  userId: number
  email: string
  role: string
  iat: number
  exp: number
}

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-key-change-in-production"

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + AUTH_SECRET)
    .digest("hex")
}

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const db = getDatabase()
  const hashedPassword = hashPassword(password)

  try {
    const result = db
      .prepare(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `)
      .run(email, hashedPassword, name, "user")

    return {
      id: result.lastInsertRowid as number,
      email,
      name,
      role: "user",
    }
  } catch (error) {
    throw new Error("User already exists or database error")
  }
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const db = getDatabase()
  const hashedPassword = hashPassword(password)

  const user = db
    .prepare(`
    SELECT id, email, name, role FROM users
    WHERE email = ? AND password = ?
  `)
    .get(email, hashedPassword)

  return user || null
}

export function generateAuthToken(user: User): string {
  const token = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  }

  const encoded = Buffer.from(JSON.stringify(token)).toString("base64")
  return encoded
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const authToken = JSON.parse(decoded)

    if (authToken.exp < Math.floor(Date.now() / 1000)) {
      return null // Token expired
    }

    return authToken
  } catch {
    return null
  }
}
