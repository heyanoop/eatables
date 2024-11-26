import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import Product from "../models/productModel.js";
import { Address } from "../models/addressModel.js";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/OrdersModel.js";
import { Wallet } from "../models/walletModel.js";
import { Coupon } from "../models/CouponModel.js";



import Razorpay  from "razorpay";
import crypto from "crypto";





//load checkoutpage

// export const loadCheckout = async (req, res) => {
//     try {
//         const userId = req.user._id; 

//         const cart = await Cart.findOne({ userId }).populate('product.productId');

//         if (!cart || cart.product.length === 0) {
//             return res.render('404Error'); 
//         }

//         //  individual product total
//         let subtotal = 0;
//         cart.product.forEach(item => {
//             item.total = item.productId.salesPrice * item.quantity;
//             subtotal += item.total; 
//         });

//         console.log("SubTotal", subtotal);

//         const deliveryCharges = subtotal > 400 ? 0 : 45;
//         let discount = 0;
//         let discountMessage = "";

//         const { couponCode } = req.query;

//         if (couponCode) {
//             // Finding the coupon and validate it
//             const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

//             if (coupon) {
//                 if (coupon.expirationDate > new Date()) {
//                     // Check user-specific usage count
//                     const userUsage = coupon.usedBy.find(user => user.userId.toString() === userId);

//                     if (userUsage && userUsage.count > coupon.usageLimit) {
//                         discountMessage = "Coupon usage limit exceeded for this user";
//                     } else {
//                         // Calculate the discount
//                         discount = parseFloat((subtotal * (coupon.discount / 100)).toFixed(2));
//                         discountMessage = `Coupon applied successfully. You saved ₹${discount}!`;
//                     }
//                 } else {
//                     discountMessage = "Coupon code has expired";
//                 }
//             } else {
//                 discountMessage = "Invalid or expired coupon code";
//             }
//         }

//         // Calculate the grand total
//         const grandTotal = subtotal + deliveryCharges - discount;

//         console.log("Grandtotal", grandTotal);

//         const userAddress = await Address.find({ userId, isDeleted: false });
        
//         res.render('checkout', { 
//             cartItems: cart.product, 
//             subtotal, 
//             deliveryCharges, 
//             discount, 
//             grandTotal,
//             userAddress,
//             discountMessage,
//             couponCode
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };


export const loadCheckout = async (req, res) => {
    try {
        const userId = req.user._id;
        const { order_id, couponCode } = req.query;

        let subtotal = 0;
        let deliveryCharges = 0;
        let discount = 0;
        let discountMessage = "";
        let grandTotal = 0;
        let cartItems = [];
        let userAddress = [];
        let appliedCouponCode = null;

        if (order_id) {
            // Fetch and display order details if order_id is provided
            const order = await Order.findById(order_id)
                .populate('products.productId')
                .populate('deliveryAddress')
                .populate('coupon');

            if (!order) {
                return res.status(404).render('404Error');
            }

            cartItems = order.products;

            cartItems.forEach(item => {
                item.total = item.productId.salesPrice * item.quantity;
                subtotal += item.total;
            });

            deliveryCharges = subtotal > 400 ? 0 : 45;
            discount = order.discountApplied;
            grandTotal = subtotal + deliveryCharges - discount;

            userAddress = await Address.find({ userId, isDeleted: false });

            appliedCouponCode = order.coupon ? order.coupon.code : null;
            discountMessage = order.coupon ? `Coupon applied: ${order.coupon.code}` : 'No coupon applied';

            res.render('checkout', {
                cartItems,
                subtotal,
                deliveryCharges,
                discount,
                grandTotal,
                userAddress,
                couponCode: appliedCouponCode,
                discountMessage
            });
        } else {
            // Handle cart checkout if no order_id is provided
            const cart = await Cart.findOne({ userId }).populate('product.productId');

            if (!cart || cart.product.length === 0) {
                return res.render('404Error');
            }

            cartItems = cart.product;

            cartItems.forEach(item => {
                item.total = item.productId.salesPrice * item.quantity;
                subtotal += item.total;
            });

            deliveryCharges = subtotal > 400 ? 0 : 45;

            if (couponCode) {
                // Finding and validating the coupon
                const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

                if (coupon) {
                    if (coupon.expirationDate > new Date()) {
                        const userUsage = coupon.usedBy.find(user => user.userId.toString() === userId);

                        if (userUsage && userUsage.count > coupon.usageLimit) {
                            discountMessage = "Coupon usage limit exceeded for this user";
                        } else {
                            discount = parseFloat((subtotal * (coupon.discount / 100)).toFixed(2));
                            discountMessage = `Coupon applied successfully. You saved ₹${discount}!`;
                        }
                    } else {
                        discountMessage = "Coupon code has expired";
                    }
                } else {
                    discountMessage = "Invalid or expired coupon code";
                }
            }

            grandTotal = subtotal + deliveryCharges - discount;
            userAddress = await Address.find({ userId, isDeleted: false });

            res.render('checkout', {
                cartItems,
                subtotal,
                deliveryCharges,
                discount,
                grandTotal,
                userAddress,
                discountMessage,
                couponCode
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};




//place order COD

export const placeOrder = async (req, res) => {
    try {
        console.log("In placeOrder controller");

        const userId = req.user._id;
        const { addressId, couponCode, paymentMethod, discount, order_id } = req.body;

        console.log("Discount:", discount);
        console.log("Order ID:", order_id);

        if (order_id) {
            // Handle retry case
            const existingOrder = await Order.findById(order_id);

            if (existingOrder) {
                // Update the payment status if order exists
                existingOrder.paymentMethod = paymentMethod;
                existingOrder.paymentStatus = 'Pending'; // Assuming 'Paid' means the payment has been confirmed
                await existingOrder.save();

                return res.json({ success: true, message: 'Order payment updated successfully', orderId: existingOrder._id });
            } else {
                return res.status(400).json({ success: false, message: 'Order not found' });
            }
        }

        
        // Check for recent orders to avoid duplicates
        const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }

        const cart = await Cart.findOne({ userId }).populate('product.productId');

        if (!cart || cart.product.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart is empty' });
        }

        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.productId.regularPrice * item.quantity;
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
        const totalAmount = subtotal + deliveryCharges - discount;

        console.log("Subtotal:", subtotal);
        console.log("Delivery Charges:", deliveryCharges);
        console.log("Total Amount:", totalAmount);

        if (paymentMethod === 'Cash On Delivery' && totalAmount > 1000) {
            return res.status(400).json({ success: false, message: 'Sorry, COD is not available for orders exceeding ₹1000.' });
        }

        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod,
            orderStatus: 'Pending',
            couponCode: couponCode || '', 
            discountApplied: discount
        });

        await newOrder.save();

        // Reduce product quantities in stock
        for (const item of cart.product) {
            const product = item.productId;
            product.quantity -= item.quantity;
            await product.save();
        }

        // Clear the cart
        await Cart.deleteOne({ userId });

        res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};





//Order placed Successfulll


export const loadOrderSuccess = async (req, res) => {

    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate('deliveryAddress').populate({
            path: 'products.productId',
            model: 'Product'
        })


        console.log("iam in LoadOrderSuccesss:::::", order)
        
        

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
       
        let subtotal = 0;
        order.products.forEach(product => {
            subtotal += product.quantity * product.productId.salesPrice;
        });

    
        const deliveryCharges = subtotal > 400 ? 0 : 45;

        
        const discount = order.discountApplied || 0;

        
        const totalAmount = subtotal + deliveryCharges - discount;

        // Render orderPlaced.ejs with order details and calculated amounts
        res.render('orderPlaced', {
            order,
            subtotal: subtotal.toFixed(2),
            deliveryCharges: deliveryCharges.toFixed(2),
            discount: discount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        });
    } catch (err) {
        console.error('Error retrieving order:', err);
        res.status(500).json({ message: 'Server Error' });
    }

};



//===========================Online Payment ====================================//


//instance created 

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// Place order using Razorpay
export const razorpayPlaceOrder = async (req, res) => {
    console.log(" Im in razorpay place order:::::::::::::::::::");

    try {
        const userId = req.user._id;
        const { addressId, couponCode, paymentMethod, discount, order_id } = req.body;

        console.log("ordeid", order_id)
        

        // If orderId is provided, fetch the existing order
        if (order_id) {
            const existingOrder = await Order.findById(order_id);
            if (existingOrder) {
                // Check if the order is already paid
                if (existingOrder.paymentStatus === 'Paid') {
                    return res.status(400).json({ success: false, message: 'Payment already completed' });
                }
                // Retry payment for existing order
                const updatedOrder = await razorpay.orders.create({
                    amount: existingOrder.totalAmount * 100,
                    currency: 'INR',
                    receipt: `receipt_order_${Date.now()}`
                });

                existingOrder.razorpayOrderId = updatedOrder.id;
                await existingOrder.save();

                return res.json({
                    success: true,
                    message: 'Retry payment',
                    orderId: existingOrder._id,
                    razorpayOrderId: updatedOrder.id,
                    amount: existingOrder.totalAmount * 100,
                    currency: 'INR',
                    key: process.env.RAZORPAY_KEY_ID,
                    paymentMethod
                });
            } else {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        }

        // Check for recent orders to prevent duplicate submissions
     const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }

        // Fetch the cart for the user
        const cart = await Cart.findOne({ userId }).populate('product.productId');
        if (!cart || cart.product.length === 0) {
            return res.status(404).render('404Error'); // Handle no cart scenario
        }

        // Calculate subtotal and total amount
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.productId.salesPrice * item.quantity;
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
        const totalAmount = Math.round(subtotal + deliveryCharges - discount)

        // Create a Razorpay order
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        console.log("Razorpay options", options);

        const order = await razorpay.orders.create(options);

        console.log("Razorpay order", order);

        // Save the initial order details in the database
        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod,
            orderStatus: 'Pending',
            razorpayOrderId: order.id,
            couponCode: couponCode || '',
            discountApplied: discount
        });

        await newOrder.save();

        // Return Razorpay order details to the client
        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id,
            razorpayOrderId: order.id,
            amount: totalAmount * 100,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
            paymentMethod
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// controller to  update order status to failed

export const updateFailedOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'Failed';
        order.failureReason = reason;
        await order.save();

        res.json({ success: true, message: 'Order status updated to failed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};




export const verifyPayment = async (req, res) => {
    console.log("Im in verify payment");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    try {
        // Verify the payment signature
        const shasum = crypto.createHmac('sha256', key_secret);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // Fetch the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the payment has already been marked as paid
        if (order.paymentStatus === 'Paid') {
            return res.json({ success: true, message: 'Payment already verified' });
        }

        // Update payment status and save
        order.paymentStatus = 'Paid';
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        // Reduce stock quantity for each product
        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();
            }
        }

        // Clear the user's cart
        await Cart.deleteOne({ userId: order.userId });

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};





//-------------------Wallet Payment -----------------------------------------------------------

export const walletOrder = async (req, res) => {
    try {
        console.log("I am in wallet order controller:::::::::::");

        const userId = req.user.id;
        const { addressId, couponCode, paymentMethod, discount, order_id } = req.body;

        if (order_id) {
            const existingOrder = await Order.findById(order_id);

            if (!existingOrder) {
                return res.status(400).json({ success: false, message: 'Order not found' });
            }

            if (existingOrder.paymentStatus === 'Paid') {
                return res.status(400).json({ success: false, message: 'Order already paid' });
            }

            // Fetching the user's wallet
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                return res.status(400).json({ success: false, message: 'Wallet not found' });
            }

            const totalAmount = existingOrder.totalAmount;
            // Check if wallet has sufficient balance
            if (wallet.balance < totalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance',
                    currentBalance: wallet.balance.toFixed(2)
                });
            }

            // Deduct the amount from the user's wallet and log the transaction
            wallet.balance -= totalAmount;
            wallet.transactions.push({
                type: 'Debit',
                amount: totalAmount,
                remarks: `Payment for order ${existingOrder.orderId}`
            });

            await wallet.save();

            // Update payment status to 'Paid'
            existingOrder.paymentMethod = paymentMethod;
            existingOrder.paymentStatus = 'Paid';
            await existingOrder.save();

            return res.json({ success: true, message: 'Order payment updated successfully', orderId: existingOrder._id });
        }

        // Check for recent orders to prevent duplicate orders
        const recentOrder = await Order.findOne({
            userId,
            createdAt: { $gte: new Date(Date.now() - 10 * 1000) } // 10 seconds window
        });

        if (recentOrder) {
            return res.status(400).json({ success: false, message: 'Duplicate order detected' });
        }

        // Fetch the user's cart
        const cart = await Cart.findOne({ userId }).populate('product.productId');

        if (!cart || cart.product.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate the total amount
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += (item.productId.salesPrice || 0) * (item.quantity || 0);
        });

        const deliveryCharges = subtotal > 400 ? 0 : 45;
        const totalAmount = subtotal + deliveryCharges - (discount || 0);

        // Ensure the payment method is 'Wallet'
        if (paymentMethod !== 'Wallet') {
            return res.status(400).json({ success: false, message: 'Invalid payment method for this route' });
        }

        // Fetch the user's wallet
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(400).json({ success: false, message: 'Wallet not found' });
        }

        // Check if the wallet has sufficient balance
        if (wallet.balance < totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance',
                currentBalance: wallet.balance.toFixed(2)
            });
        }

        const newOrder = new Order({
            userId,
            products: cart.product,
            totalAmount,
            deliveryAddress: addressId,
            paymentMethod: 'Wallet',
            orderStatus: 'Pending',
            paymentStatus: 'Paid',
            couponCode: couponCode || '',
            discountApplied: discount || 0
        });

        wallet.balance -= totalAmount;
        wallet.transactions.push({
            type: 'Debit',
            amount: totalAmount,
            remarks: `Payment for order ${newOrder._id}`
        });

        await wallet.save();
        await newOrder.save();

        // Reduce the quantity in stock for each product
        for (const item of cart.product) {
            const product = item.productId;
            product.quantity -= item.quantity;
            await product.save();
        }

        // Clear the user's cart after the order is placed
        await Cart.deleteOne({ userId });

        res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error('Error placing order with wallet:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};