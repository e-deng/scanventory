import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Alert } from "@/lib/models"

type Params = { params: Promise<{ id: string }> }

// PUT /api/alerts/:id/dismiss - Dismiss an alert
export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params

    const alert = await Alert.findOneAndUpdate({ _id: id }, { dismissed: true }, { new: true })

    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: alert })
  } catch (error) {
    console.error("Error dismissing alert:", error)
    return NextResponse.json({ success: false, error: "Failed to dismiss alert" }, { status: 500 })
  }
}
