import { category } from "../models/categoryModel.js";
import Product from "../models/productModel.js";

import { Offer } from "../models/OfferModel.js";

import { Coupon } from "../models/CouponModel.js";

import { calculateAndUpdateSalesPrice } from "../helper/offerPriceHelper.js";





//===========================Offer===================================================


export const loadOffer = async (req, res) => {

    try {
      const categories = await category.find();

      const products = await Product.find();

      const offer = await Offer.find().populate('category', 'name').populate('product', 'title').sort({ createdAt: -1 });

      res.render('Offer', { categories, products, offer });

    } catch (err) {

      console.log(err);

      res.status(500).send('Server Error')

    }
};


//addOffer

export const addOffer = async (req, res) => {
  console.log("IM IN ADD OFFERRR:::::::::::");

  const { offerName, discount, validFrom, validUntil, offerType, category, product } = req.body;

  try {
    const newOffer = new Offer({
      offerName,
      discount,
      validFrom,
      validUntil,
      offerType,
      category: offerType === 'category' ? category : null,
      product: offerType === 'product' ? product : null,
    });

    console.log("NEW OFFFER!!!!!!", newOffer);

    await newOffer.save();

    // Recalculate and update the sales price for the affected products
    if (offerType === 'product') {
      await calculateAndUpdateSalesPrice(product);
    } else if (offerType === 'category') {
      const products = await Product.find({ category });
      for (const prod of products) {
        await calculateAndUpdateSalesPrice(prod._id);
      }
    }

    res.status(201).json({ message: 'Offer added successfully!' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

//block and unblock
export const updateOfferStatus = async (req, res) => {
  console.log('im in block and unblock coupon');
  const { couponId } = req.params;
  const { isActive } = req.body;

  try {
    const coupon = await Offer.findByIdAndUpdate(couponId, { isActive }, { new: true }).populate('category', '_id').populate('product', '_id');
    if (!coupon) {
      return res.status(404).send('Coupon not found');
    }

    // Recalculate and update the sales price for the affected products
    if (coupon.product) {
      await calculateAndUpdateSalesPrice(coupon.product._id);
    } else if (coupon.category) {
      const products = await Product.find({ category: coupon.category._id });
      for (const prod of products) {
        await calculateAndUpdateSalesPrice(prod._id);
      }
    }

    res.status(200).json(coupon);

  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};

  //=========================== Coupons ===================================


  export const loadCoupon = async (req, res) => {
    try {
      // Fetch all coupons
      const coupons = await Coupon.find().sort({ createdAt: -1 });
  
      // Check and update isActive status for expired coupons
      for (let coupon of coupons) {
        if (coupon.expirationDate < new Date() && coupon.isActive) {
          coupon.isExpired = true;
          await coupon.save();
        }
      }
  
      // Re-fetch the updated list of coupons
      const updatedCoupons = await Coupon.find().sort({ createdAt: -1 });
  
      res.render('Coupon', { coupons: updatedCoupons });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  };


 //create Coupon

 export const createCoupon = async (req, res) => {

  console.log('Request body::::::::', req.body)


  const { code, discount, expirationDate, usageLimit } = req.body;

  if (!code || !discount || !expirationDate || !usageLimit) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
      const coupon = new Coupon({
          code,
          discount,
          expirationDate,
          usageLimit
      });

      const savedCoupon = await coupon.save();
      console.log('Coupon created:', savedCoupon);
      
      res.status(201).json({ success: true, coupon: savedCoupon });

  } catch (error) {
      console.error('Error creating coupon:', error);

      if (error.code === 11000) {
          res.status(400).json({ success: false, message: 'Coupon code already exists' });
      } else if (error.errors && error.errors.code) {
          res.status(400).json({ success: false, message: 'Invalid coupon code format' });
      } else {
          res.status(500).json({ success: false, message: 'Failed to create coupon', error });
      }
  }
};



//block unblock

export const updateCouponStatus = async (req, res) => {

  console.log('im in block and unblock coupon')
  const { couponId } = req.params;
  const { isActive } = req.body;

  try {
    const coupon = await Coupon.findByIdAndUpdate(couponId, { isActive }, { new: true });
    if (!coupon) {
      return res.status(404).send('Coupon not found');
    }
    res.status(200).json(coupon);
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};
