import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Item, Alert } from "@/lib/models"

// POST /api/alerts/generate - Generate alerts for expiring items
export async function POST() {
  try {
    await connectDB()

    const items = await Item.find({})
    let alertsCreated = 0

    for (const item of items) {
      const today = new Date()
      const expiry = new Date(item.expirationDate)
      const diffTime = expiry.getTime() - today.getTime()
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let severity: "critical" | "warning" | "expired" | undefined
      if (daysUntilExpiry < 0) severity = "expired"
      else if (daysUntilExpiry <= 2) severity = "critical"
      else if (daysUntilExpiry <= 7) severity = "warning"
      else continue

      const existingAlert = await Alert.findOne({ itemId: item._id, dismissed: false })
      if (existingAlert) continue

      const alert = new Alert({
        itemId: item._id,
        itemName: item.name,
        expirationDate: item.expirationDate,
        daysUntilExpiry,
        severity,
      })

      await alert.save()
      alertsCreated++
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${alertsCreated} new alerts`,
      count: alertsCreated,
    })
  } catch (error) {
    console.error("Error generating alerts:", error)
    return NextResponse.json({ success: false, error: "Failed to generate alerts" }, { status: 500 })
  }
}
