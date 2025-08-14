const express = require("express")
const { Alert, Item } = require("../models")

const router = express.Router()

// GET /api/alerts - Get all alerts
router.get("/", async (req, res) => {
  try {
    const { dismissed = "false", severity } = req.query

    const query = {}
    if (dismissed !== "all") {
      query.dismissed = dismissed === "true"
    }
    if (severity) {
      query.severity = severity
    }

    const alerts = await Alert.find(query)
      .populate("itemId", "name shelf quantity")
      .sort({ severity: 1, createdAt: -1 }) // Critical first, then by date

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    res.status(500).json({ success: false, error: "Failed to fetch alerts" })
  }
})

// PUT /api/alerts/:id/dismiss - Dismiss an alert
router.put("/:id/dismiss", async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id },
      { dismissed: true },
      { new: true },
    )

    if (!alert) {
      return res.status(404).json({ success: false, error: "Alert not found" })
    }

    res.json({ success: true, data: alert })
  } catch (error) {
    console.error("Error dismissing alert:", error)
    res.status(500).json({ success: false, error: "Failed to dismiss alert" })
  }
})

// PUT /api/alerts/dismiss-all - Dismiss all alerts
router.put("/dismiss-all", async (req, res) => {
  try {
    const result = await Alert.updateMany({ dismissed: false }, { dismissed: true })

    res.json({
      success: true,
      message: `Dismissed ${result.modifiedCount} alerts`,
      count: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error dismissing all alerts:", error)
    res.status(500).json({ success: false, error: "Failed to dismiss alerts" })
  }
})

// POST /api/alerts/generate - Generate alerts for expiring items
router.post("/generate", async (req, res) => {
  try {
    const items = await Item.find({})
    let alertsCreated = 0

    for (const item of items) {
      const today = new Date()
      const expiry = new Date(item.expirationDate)
      const diffTime = expiry - today
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let severity
      if (daysUntilExpiry < 0) severity = "expired"
      else if (daysUntilExpiry <= 2) severity = "critical"
      else if (daysUntilExpiry <= 7) severity = "warning"
      else continue // No alert needed

      // Check if alert already exists
      const existingAlert = await Alert.findOne({ itemId: item._id, dismissed: false })
      if (existingAlert) continue

      // Create new alert
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

    res.json({
      success: true,
      message: `Generated ${alertsCreated} new alerts`,
      count: alertsCreated,
    })
  } catch (error) {
    console.error("Error generating alerts:", error)
    res.status(500).json({ success: false, error: "Failed to generate alerts" })
  }
})

module.exports = router
