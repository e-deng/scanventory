import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAlert extends Document {
  itemId: mongoose.Types.ObjectId
  itemName: string
  expirationDate: Date
  daysUntilExpiry: number
  severity: "critical" | "warning" | "expired"
  dismissed: boolean
  userId?: mongoose.Types.ObjectId
}

const alertSchema = new Schema<IAlert>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

alertSchema.index({ dismissed: 1 })
alertSchema.index({ severity: 1 })
alertSchema.index({ itemId: 1 })

export const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>("Alert", alertSchema)
