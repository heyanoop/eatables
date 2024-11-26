
import mongoose from 'mongoose';
import crypto from 'crypto'

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: { 
            type: mongoose.Schema.ObjectId, 
            ref: 'Product'},
        quantity: { 
            type: Number, 
            required: true }
    }],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    coupon: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'Coupon' 
    },
    discountApplied: { 
        type: Number, 
        default: 0 
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' },
    orderStatus: { type: String, default: 'Pending' },
    returnReason: {type: String},
    createdAt: { type: Date, default: Date.now },
    orderId: { type: String, unique: true },
    offer: { 
        type: mongoose.Schema.ObjectId,
        ref: 'Offer'
    }
});

// Middleware to generate unique order ID
orderSchema.pre('save', function(next) {
    if (!this.isNew) {
        return next();
    }
    
    const uniqueId = crypto.randomBytes(4).toString('hex');
    this.orderId = `ORD${uniqueId}`;
    next();
});

export const Order = mongoose.model('Order', orderSchema);
