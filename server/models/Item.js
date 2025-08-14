const mongoose = require("mongoose")

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name cannot exceed 100 characters"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 1,
    },
    shelf: {
      type: String,
      required: [true, "Shelf location is required"],
      enum: [
        "Refrigerator - Top",
        "Refrigerator - Middle",
        "Refrigerator - Bottom",
        "Freezer - Top",
        "Freezer - Bottom",
        "Pantry - Shelf 1",
        "Pantry - Shelf 2",
        "Pantry - Shelf 3",
        "Counter",
        "Other",
      ],
    },
    expirationDate: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Dairy",
        "Bakery",
        "Canned Goods",
        "Frozen",
        "Produce",
        "Meat & Seafood",
        "Snacks",
        "Beverages",
        "Condiments",
        "Grains & Pasta",
        "Other",
      ],
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // No longer required since we removed authentication
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
itemSchema.index({ shelf: 1 })
itemSchema.index({ expirationDate: 1 })
itemSchema.index({ barcode: 1 }, { sparse: true })

// Virtual for days until expiry
itemSchema.virtual("daysUntilExpiry").get(function () {
  const today = new Date()
  const expiry = new Date(this.expirationDate)
  const diffTime = expiry - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Virtual for expiration status
itemSchema.virtual("expirationStatus").get(function () {
  const days = this.daysUntilExpiry
  if (days < 0) return "expired"
  if (days <= 2) return "critical"
  if (days <= 7) return "warning"
  return "good"
})

module.exports = mongoose.model("Item", itemSchema)
