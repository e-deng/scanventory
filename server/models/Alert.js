const mongoose = require("mongoose")

const alertSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    daysUntilExpiry: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["critical", "warning", "expired"],
    },
    dismissed: {
      type: Boolean,
      default: false,
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
alertSchema.index({ dismissed: 1 })
alertSchema.index({ severity: 1 })
alertSchema.index({ itemId: 1 })

module.exports = mongoose.model("Alert", alertSchema)
