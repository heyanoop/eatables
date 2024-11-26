
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import Product from "../models/productModel.js";
import { Address } from "../models/addressModel.js";
import { Order } from "../models/OrdersModel.js";

import {Wallet} from "../models/walletModel.js"




//============================================ loadMyProfile =============================================

export const loadProfile = async (req, res) => {

    try {

      console.log("iM IN LOADPROFILEEEEEEEEEEE")
      
      const userId = req.user.id; 
      
    const userData = await User.findById(userId)

     console.log("User details:", userData)

     if (!userData){

        console.log("User doesnot exist !!!!")
     }

     const userAddress = await Address.find({ userId, isDeleted: false });

     const userOrder = await Order.find({ userId }).populate('deliveryAddress').sort({ createdAt: -1 })

     const userWallet = await Wallet.findOne({ userId }).sort({ 'transactions.date': -1 }).populate('userId').exec();

    console.log("User wallet:", userWallet);     
     console.log("UserOrders",userOrder)

     console.log("User addresses:", userAddress);

     res.render("myProfile", { userData, userAddress, userOrder, userWallet})
  
    } catch (error) {
      console.log(error.message);
    }
  };


  //=== editProfile =====

 export  let editProfile = async (req, res) => {

    const userId = req.user._id
    const { firstName, lastName, email, mobile } = req.body

    try {
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, email, mobile },
            { new: true, runValidators: true }

            //{new : true} By default, findByIdAndUpdate returns the document as it was before the update was applied. Setting the new option to true will make the method return the updated document instead.
            // By default, Mongoose does not run validation on update operations. Setting the runValidators option to true ensures that the update operation respects the schema validation rules you have defined. This means Mongoose will validate the data before applying the update
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};





  //==============================================change Password=====================================



  export const changePassword = async (req, res) => {

  const { currentPassword, newPassword } = req.body;

  //checking if its blank

  if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
      const user = await User.findById(req.user.id); // Assuming you have user id in the req.user

      // ifpassword matches
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      //salt is used to make the hashing unique 
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      console.log(user, "userData")

      res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ============================= Address controlers==========================


//add Adress

export const addAddress = async (req, res) => {
  const { name, mobile, addressLine1, addressLine2, city, state, postalCode } = req.body;

  try {
    const userAddressCount = await Address.countDocuments({ userId: req.user._id });

    if (userAddressCount >= 3) {
        return res.status(400).json({ message: 'Maximum 3 addresses allowed per user' });
    }

} catch (error) {
    console.error('Error checking address count:', error);
    return res.status(500).json({ message: 'Server error', error });
}


  if (!name || !mobile || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ message: 'All required fields must be filled' });
  }



  try {
      const newAddress = new Address({
          userId: req.user._id, 
          name,
          mobile,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode
      });

      const savedAddress = await newAddress.save();
      res.status(201).json(savedAddress);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error', error });
  }
};





//fetch address in the edit

export const getAddressDetails = async (req, res) => {

  console.log("Im in address in edit ")

  const addressId = req.params._id;

  try {
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
};


// edit address 

export const updateAddress = async (req, res) => {

  console.log("Im in updateAddress:::::::::::::::::::::::::")

  const {name,mobile, addressLine1, addressLine2, city, state, postalCode } = req.body;
  const addressId = req.params.id; 

  try {
   
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { name,mobile,addressLine1, addressLine2, city, state, postalCode},
      { new: true } // Return the updated document
    );

     console.log("updatedAddress", updateAddress)

    if (!updatedAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(updatedAddress); 

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }

};


//delete address 

export const deleteAddress = async (req, res) => {

  console.log('Im in delete')
  const addressId = req.params.id;

  try {

    const deletedAddress =  await Address.findByIdAndUpdate(addressId, { isDeleted: true });
    
    console.log("Address to be deleted:", deleteAddress)

    if (!deletedAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};


//=====================================================================================================


//cancel order 


export const cancelOrder = async (req, res) => {

  const userId = req.user._id;

  console.log("userId;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;", userId);
  console.log("Im in cancelOrder:::::::");

  const { orderId } = req.params;

  console.log(req.params);

  try {
    const order = await Order.findById(orderId);

    console.log("Order to be cancelled", order);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Delivered product cannot be cancelled' });
    }

    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled as it have initiated' });
    }

    let wallet = await Wallet.findOne({ userId });

    console.log("My wallet::::::::::::", wallet);

    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        balance: 0,
        transactions: []
      });
    }

    if (order.paymentMethod === 'Online Payment'|| order.paymentMethod === 'Wallet') {
      wallet.balance += order.totalAmount;

      wallet.transactions.push({
        date: new Date(),
        type: 'Credit',
        amount: order.totalAmount,
        remarks: `Refund for cancelled order ${order.orderId}`
      });
    // } else {
    //   wallet.transactions.push({
    //     date: new Date(),
    //     type: 'Credit',
    //     amount: order.totalAmount,
    //     description: `Refund for cancelled order ${orderId}`
    //   });
    }

    await wallet.save();

    console.log("Updated wallet", wallet);

    // Update the product quantities
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.quantity += item.quantity; // Adjust quantity based on the order item
        await product.save();
      }
    }


    if (order.paymentMethod === 'Online Payment') {

      order.orderStatus = 'Cancelled';
      order.paymentStatus ='Refunded'

      await order.save();
    }else{

      order.orderStatus = 'Cancelled';
      order.paymentStatus ='Cancelled';

       await order.save();

    }


    console.log("Updated order", order);

    return res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'An error occurred while cancelling the order', error: error.message });
  }
};


//view order details 


export const viewOrderDetail = async (req, res) => {
  try {
    console.log("I am in view order details:::::");

    // Extract orderId from query parameters
    const myOrderId = req.query._id;

    const order = await Order.findById(myOrderId).populate('deliveryAddress').populate({
      path: 'products.productId',
      model: 'Product'
    });

    console.log("Order details:::::", order);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let subtotal = 0;
    order.products.forEach(product => {
      subtotal += product.quantity * product.productId.regularPrice;
    });

    const deliveryCharges = subtotal > 400 ? 0 : 45;
    const discount = 0;
    const totalAmount = subtotal + deliveryCharges - discount;

    res.render('myOrderDetails', {
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


// Return order
export const returnOrder = async (req, res) => {
  const { orderId, reason } = req.body;

  try {
      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const timeElapsed = new Date() - new Date(order.createdAt);
      if (timeElapsed > 6 * 60 * 60 * 1000) {
          return res.status(400).json({ success: false, message: 'Return window has expired' });
      }

      if (order.orderStatus !== 'Delivered') {
          return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
      }

      if (reason === 'Different Product' || reason === 'Decayed Product') {
          order.orderStatus = 'Replacement Initiated';
          order.returnReason = reason;
          await order.save();

          return res.json({ success: true, message: 'Replacement initiated successfully' });
      } else {
          return res.status(400).json({ success: false, message: 'Invalid return reason' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
  }
};
