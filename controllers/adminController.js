import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { Order } from "../models/OrdersModel.js"
import Product from "../models/productModel.js";
import { category } from "../models/categoryModel.js";

import *as salesData from "../helper/salesDataHelper.js"
import moment from 'moment';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';





import nodemailer from "nodemailer";


//========================================================================================
//LoadDashboard has chart and sales report

export const loadDash = async (req, res) => {
    try {
        // Fetch overall statistics
        const totalOrders = await Order.countDocuments();
        const totalOrderAmount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);
        const totalDiscount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalDiscount: { $sum: '$discountApplied' }
                }
            }
        ]);

        const overallRevenue = await Order.aggregate([
            {
                $match: { orderStatus: 'Delivered' }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Prepare data to send to the view
        const stats = {
            overallSalesCount: totalOrders,
            overallOrderAmount: totalOrderAmount[0] ? totalOrderAmount[0].totalAmount : 0,
            overallDiscount: totalDiscount[0] ? totalDiscount[0].totalDiscount : 0,
            overallRevenue: overallRevenue[0] ? overallRevenue[0].totalRevenue : 0
        };

        // Render the dashboard view with statistics
        res.render('dashboard', { stats });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('An error occurred while loading the dashboard');
    }
}

//get graph data

export const getStatsData = async (req, res) => {

    console.log("Iam in get StatsData:::::::::::")
    try {
        const { filter, startDate, endDate } = req.query;
        let data = {};

        if (filter === undefined) {
            return res.status(400).json({ error: 'Filter is required' });
        }

        if (filter === 'daily') {
            data = await salesData.getDailySales();
            console.log("Daily", data);
        } else if (filter === 'weekly') {
            data = await salesData.getWeeklySales();
            console.log("Weekly", data);
        } else if (filter === 'monthly') {
            data = await salesData.getMonthlySales();
            console.log("Monthly", data);
        } else if (filter === 'yearly') {
            data = await salesData.getYearlySales();
            console.log("Yearly", data);
        } else if (filter === 'custom') {
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required for custom filter' });
            }
            data = await salesData.getCustomSales(startDate, endDate);
        } else {
            return res.status(400).json({ error: 'Invalid filter type' });
        }
        

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};



//sales report 
export const getSalesReport = async (req, res) => {
    const { dateFrom, dateTill } = req.query;

    if (!dateFrom || !dateTill) {
        return res.status(400).json({ message: 'Date range is required' });
    }

    try {
        const orders = await Order.find({
            createdAt: {
              $gte: new Date(dateFrom),
              $lte: new Date(dateTill)
            },
            paymentStatus: 'Paid',        
            
          })
          .populate('deliveryAddress', 'name')
          .populate('coupon')
          .sort({ createdAt: -1 });       
          
          

        const totalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const totalSales = orders.length;
        const totalCouponDiscount = orders.reduce((acc, order) => acc + order.discountApplied, 0);
        const totalPayment = totalAmount + totalCouponDiscount;

        res.json({
            orders,
            transactionDetails: {
                totalAmount,
                totalSales,
                totalCouponDiscount,
                totalPayment
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error); 
}     
};


export const generatepdfReport = async (req, res) => {
    console.log("In pdf generation");
    const { dateFrom, dateTill } = req.query;

    console.log("dates:",dateFrom, dateTill )

    if (!dateFrom || !dateTill) {
        return res.status(400).send('Both dateFrom and dateTill are required');
    }

    try {
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTill)
            },
            paymentStatus: 'Paid'
        })
        .populate('deliveryAddress', 'name')
        .populate('coupon')
        .sort({ createdAt: -1 });

        if (!orders.length) {
            return res.status(404).send('No orders found for the given date range');
        }

        const doc = new jsPDF();
        const tableColumn = ['Order Id', 'Cx Name', 'Total', 'Coupon Discount', 'Date', 'Payment'];
        const tableRows = [];

        orders.forEach(order => {
            const totalAmount = (parseFloat(order.totalAmount) + parseFloat(order.discountApplied)).toFixed(2);
            const discountApplied = parseFloat(order.discountApplied).toFixed(2);
            const totalAfterDiscount = (parseFloat(order.totalAmount) - parseFloat(order.discountApplied)).toFixed(2);
            const createdAt = moment(order.createdAt).format('MM/DD/YYYY');

            tableRows.push([
                order.orderId,
                order.deliveryAddress?.name || 'N/A',
                `₹ ${totalAmount}`,
                `₹ ${discountApplied}`,
                createdAt,
                `₹ ${totalAfterDiscount}`
            ]);
        });

        console.log("TABLE ROWSS", tableRows)

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            margin: { horizontal: 10 }
        });

        console.log("doc::::::::", doc)

        const totalAmount = orders.reduce((acc, order) => acc + parseFloat(order.totalAmount), 0);
        const totalSales = orders.length;
        const totalCouponDiscount = orders.reduce((acc, order) => acc + parseFloat(order.discountApplied), 0);
        const totalPayment = totalAmount + totalCouponDiscount;

        doc.setFontSize(16);
        doc.text('Transaction Details', 14, doc.autoTable.previous.finalY + 20);

        doc.setFontSize(12);
        doc.text(`Total Amount: ₹ ${totalAmount.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 30);
        doc.text(`Total Sales: ${totalSales}`, 14, doc.autoTable.previous.finalY + 40);
        doc.text(`Total Coupon Discount: ₹ ${totalCouponDiscount.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 50);
        doc.text(`Total Payment: ₹ ${totalPayment.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 60);

        const fileName = `Sales_Report_${Date.now()}.pdf`;
        const pdfBlob = doc.output('blob');
         console.log('PDF Blob:', pdfBlob);
         console.log('Blob Size:', pdfBlob.size);


        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        console.log('Response Headers:', res.getHeaders());

        res.send(pdfBlob);


    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Internal Server Error');
    }
};



//Most orderd
export const loadmostOrdered = async (req, res) => {
    try {
        // Aggregate top 10 products
        const topProducts = await Order.aggregate([
            { $unwind: '$products' }, // Deconstruct the products array
            { $group: { 
                _id: '$products.productId', // Group by product ID
                totalOrders: { $sum: '$products.quantity' } // Sum up the quantities
            }},
            { $sort: { totalOrders: -1 } }, // Sort by total orders in descending order
            { $limit: 10 }, // Limit to top 10
            { $lookup: {
                from: 'products', // Reference the Product collection
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' } // Unwind product details
        ]);

        // Aggregate total orders per category
        const categoryOrders = await Order.aggregate([
            { $unwind: '$products' }, // Deconstruct the products array
            { $lookup: {
                from: 'products', // Join with Product collection
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' }, // Unwind product details
            { $group: {
                _id: '$productDetails.category', // Group by category ID
                totalOrders: { $sum: '$products.quantity' } // Sum up the quantities
            }},
            { $sort: { totalOrders: -1 } }, // Sort by total orders in descending order
            { $limit: 10 }, // Limit to top 10 categories
            { $lookup: {
                from: 'categories', // Reference the Category collection
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }},
            { $unwind: '$categoryDetails' } // Unwind category details
        ]);

        res.render('MostOrdered', {
            topProducts,
            topCategories: categoryOrders // Renaming to `topCategories` for consistency with the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
//===============================================================================

//customerdash

export const loadCustomerDash= async(req,res)=>{

    try{
        const userDetails = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
    
        res.render('customer',{userDetails})
    }catch(error){
        console.error(error)
    }

}

// Block User
export const blockUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.isActive = false;
      await user.save();
  
      res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to block user', error });
    }
  };
  
  // Unblock User
  export const unblockUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.isActive = true;
      await user.save();
  
      res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unblock user', error });
    }
  };

// ===============================================================================

//Logout

export const logout = async (req, res) => {
    try {
      // Clear the JWT cookie
      res.clearCookie('token');
  
      // Redirect to the homepage
      res.redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  };

//=================================================================================== 













