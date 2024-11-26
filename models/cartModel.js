import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  product: [
    {
      productId: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
    },
  ],
});



export const Cart = mongoose.model("Cart", cartSchema);


