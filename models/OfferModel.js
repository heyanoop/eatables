import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({

  offerName: { type: String, required: true },

  discount: { type: Number, required: true },

  validFrom: { type: Date, required: true },

  validUntil: { type: Date, required: true },

  offerType: { type: String, required: true, enum: ['category', 'product'] },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },

  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

export const Offer = mongoose.model('Offer', offerSchema);

