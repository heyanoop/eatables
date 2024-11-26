
import { Order } from "../models/OrdersModel.js";



export const loadOrderPage = async (req,res)=>{

    try{

        const orders = await Order.find().populate('userId').populate('products.productId').populate('deliveryAddress').sort({ createdAt: -1 });

        res.render('OrderList', {orders})

    }catch(error){

        console.error("error")
    }
}

//change order status

export const changeOrderStatus = async (req, res) => {

    const { orderId } = req.params;
    const { newStatus } = req.body;

    console.log("Change status controller")

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        order.orderStatus = newStatus;

        if(order.orderStatus ==='Delivered' && order.paymentMethod==='Cash On Delivery'){
            order.paymentStatus = "Paid"
        }
        await order.save();

        res.json({ message: 'Order status updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
