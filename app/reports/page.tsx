"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ReportData {
  totalRevenue: number
  totalOilProduced: number
  totalPomace: number
  totalEmployees: number
  totalSuppliers: number
  monthlyData: Array<{ month: string; revenue: number; oilOutput: number }>
  statusDistribution: Array<{ name: string; value: number }>
}

const COLORS = ["oklch(0.54 0.23 49.5)", "oklch(0.65 0.2 200)", "oklch(0.7 0.18 120)"]

export default function ReportsPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchReportData(token)
  }, [router])

  const fetchReportData = async (token: string) => {
    try {
      const response = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setReportData(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="mt-2 text-muted-foreground">System overview and performance metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {reportData.totalRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">all time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Oil Produced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalOilProduced.toLocaleString()}</div>
                <p className="mt-1 text-xs text-muted-foreground">liters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pomace Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalPomace.toLocaleString()}</div>
                <p className="mt-1 text-xs text-muted-foreground">kg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalEmployees + reportData.totalSuppliers}</div>
                <p className="mt-1 text-xs text-muted-foreground">total staff & suppliers</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0 0)" />
                    <XAxis dataKey="month" stroke="oklch(0.65 0 0)" />
                    <YAxis stroke="oklch(0.65 0 0)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.18 0 0)",
                        border: "none",
                        borderRadius: "0.5rem",
                        color: "oklch(0.93 0 0)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="oklch(0.54 0.23 49.5)" radius={4} />
                    <Bar dataKey="oilOutput" fill="oklch(0.65 0.2 200)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.18 0 0)",
                        border: "none",
                        borderRadius: "0.5rem",
                        color: "oklch(0.93 0 0)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
