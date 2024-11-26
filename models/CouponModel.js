import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^[A-Z0-9]{5,10}$/
    },
    discount: {
        type: Number,
        required: true,
        min: 0
    },
    expirationDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    usageLimit: {
        type: Number,
        required: true,
        min: 1
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    usedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        count: {
            type: Number,
            default: 0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

couponSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


// Instance method to increment the usage count
couponSchema.methods.incrementUsage = async function() {
    if (this.usageCount < this.usageLimit) {
        this.usageCount += 1;
        await this.save();
    } else {
        throw new Error('Coupon usage limit exceeded');
    }
};

export const Coupon = mongoose.model('Coupon', couponSchema);