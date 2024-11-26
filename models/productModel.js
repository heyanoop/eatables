import mongoose, { model } from "mongoose";


const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  salesPrice: {
    type: Number,
    default: function () {
      return this.regularPrice; // Set salesPrice equal to regularPrice by default
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  image: [
    {
      type: String,
      required: true,
    },
  ],
  tags: [String], // Updated to be an array of strings
  isActive: {
    type: Boolean,
    default: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  catStatus: {
    type: Boolean,
    default: true,
  },
  reviews: [reviewSchema],
  offers: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  }]
},
  { timestamps: true }
);






const Product = mongoose.model("Product", productSchema);
export default Product;
