import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  offers: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  }]
});

export const category = mongoose.model("category", categorySchema);
