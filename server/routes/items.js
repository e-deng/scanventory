const express = require("express")
const { body, validationResult } = require("express-validator")
const { Item, Alert } = require("../models")

const router = express.Router()

// GET /api/items - Get all items
router.get("/", async (req, res) => {
  try {
    const { shelf, category, search, sortBy = "addedDate", order = "desc" } = req.query

    // Build query
    const query = {}
    if (shelf) query.shelf = shelf
    if (category) query.category = category
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1
    const sortObj = { [sortBy]: sortOrder }

    const items = await Item.find(query).sort(sortObj)

    res.json({
      success: true,
      data: items,
      count: items.length,
    })
  } catch (error) {
    console.error("Error fetching items:", error)
    res.status(500).json({ success: false, error: "Failed to fetch items" })
  }
})

// GET /api/items/:id - Get single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id })

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    console.error("Error fetching item:", error)
    res.status(500).json({ success: false, error: "Failed to fetch item" })
  }
})

// POST /api/items - Create new item
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Item name is required"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a positive integer"),
    body("shelf").notEmpty().withMessage("Shelf is required"),
    body("expirationDate").isISO8601().withMessage("Valid expiration date is required"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const itemData = {
        ...req.body,
      }

      const item = new Item(itemData)
      await item.save()

      // Create alert if item expires soon
      await createExpirationAlert(item)

      res.status(201).json({ success: true, data: item })
    } catch (error) {
      console.error("Error creating item:", error)
      res.status(500).json({ success: false, error: "Failed to create item" })
    }
  },
)

// PUT /api/items/:id - Update item
router.put(
  "/:id",
  [
    body("name").optional().trim().notEmpty().withMessage("Item name cannot be empty"),
    body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a positive integer"),
    body("expirationDate").optional().isISO8601().withMessage("Valid expiration date is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const item = await Item.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true,
      })

      if (!item) {
        return res.status(404).json({ success: false, error: "Item not found" })
      }

      // Update or create alert if expiration date changed
      if (req.body.expirationDate) {
        await createExpirationAlert(item)
      }

      res.json({ success: true, data: item })
    } catch (error) {
      console.error("Error updating item:", error)
      res.status(500).json({ success: false, error: "Failed to update item" })
    }
  },
)

// DELETE /api/items/:id - Delete item
router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id })

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" })
    }

    // Delete associated alerts
    await Alert.deleteMany({ itemId: item._id })

    res.json({ success: true, message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting item:", error)
    res.status(500).json({ success: false, error: "Failed to delete item" })
  }
})

// POST /api/items/scan - Handle barcode scanning
router.post("/scan", async (req, res) => {
  try {
    const { barcode, action = "in" } = req.body

    if (!barcode) {
      return res.status(400).json({ success: false, error: "Barcode is required" })
    }

    // Find existing item with this barcode
    const existingItem = await Item.findOne({ barcode })

    if (action === "out") {
      if (!existingItem) {
        return res.status(404).json({ success: false, error: "Item not found for scan out" })
      }

      if (existingItem.quantity <= 0) {
        return res.status(400).json({ success: false, error: "Item is already out of stock" })
      }

      existingItem.quantity -= 1
      await existingItem.save()

      return res.json({
        success: true,
        action: "scanned_out",
        data: existingItem,
      })
    }

    // Scan in logic
    if (existingItem) {
      existingItem.quantity += 1
      await existingItem.save()

      return res.json({
        success: true,
        action: "quantity_increased",
        data: existingItem,
      })
    }

    // Mock product database for demo
    const mockProducts = {
      123456789012: { name: "Organic Milk", category: "Dairy" },
      234567890123: { name: "Whole Wheat Bread", category: "Bakery" },
      345678901234: { name: "Greek Yogurt", category: "Dairy" },
      456789012345: { name: "Chicken Breast", category: "Meat & Seafood" },
      567890123456: { name: "Bananas", category: "Produce" },
    }

    const productInfo = mockProducts[barcode]

    res.json({
      success: true,
      action: "new_item_scanned",
      productInfo: productInfo || null,
      barcode,
    })
  } catch (error) {
    console.error("Error processing scan:", error)
    res.status(500).json({ success: false, error: "Failed to process scan" })
  }
})

// Helper function to create expiration alerts
async function createExpirationAlert(item) {
  const today = new Date()
  const expiry = new Date(item.expirationDate)
  const diffTime = expiry - today
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let severity
  if (daysUntilExpiry < 0) severity = "expired"
  else if (daysUntilExpiry <= 2) severity = "critical"
  else if (daysUntilExpiry <= 7) severity = "warning"
  else return // No alert needed

  // Remove existing alert for this item
  await Alert.deleteMany({ itemId: item._id })

  // Create new alert
  const alert = new Alert({
    itemId: item._id,
    itemName: item.name,
    expirationDate: item.expirationDate,
    daysUntilExpiry,
    severity,
    userId: item.userId,
  })

  await alert.save()
}

module.exports = router
