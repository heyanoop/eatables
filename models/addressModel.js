
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    addressLine1: {
        type: String,
        required: true
    },
    addressLine2: String,
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }


}, {
    timestamps: true
});


export const Address = mongoose.model('Address', addressSchema);


