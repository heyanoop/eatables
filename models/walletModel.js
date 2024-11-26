
import mongoose from "mongoose";
const Schema = mongoose.Schema;


//Transaction sub-schema
const transactionSchema = new Schema({
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    amount: { type: Number, required: true },
    remarks: { type: String, default: '' }
});

//Wallet schema
const walletSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    balance: { type: Number, required: true, default: 0 },
    transactions: [transactionSchema]
}, {
    timestamps: true
});


export const Wallet = mongoose.model("Wallet", walletSchema);


//note :  enum is a property used to specify that a particular field 
//can only have one of the specified values. It restricts the values 
//that can be assigned to that field to a predefined set. 
//This is particularly useful for fields that should only accept a limited set of values, 
//such as status codes, types, or categories.
