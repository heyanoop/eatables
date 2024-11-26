import { User } from "../models/userModel.js";
import Product from "../models/productModel.js";
import { Cart } from "../models/cartModel.js";
import { Coupon } from "../models/CouponModel.js";

//========================wishlist=======================================



//loadWishlist

export const loadwishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(userId, "userId");

    const user = await User.findById(userId).populate("wishlist");

    res.render("wishlist", { wishlist: user.wishlist });

  } catch (error) {
    console.log(error.message);
  }
};



//addtowishlist

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(userId, "addtowishlist userid");

    const productId = req.params.id;

    console.log(productId, "addtowishlist productid");

    const user = await User.findById(userId);
    console.log("addtowishlisr:", user);

    console.log(user, "wishlist user");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if the product is already in the wishlist
    if (!user.wishlist.includes(productId)) {
      // If not, push and save
      user.wishlist.push(productId);
      await user.save();

      res.status(200).json({ success: true, message: "Product added to wishlist" });
    } else {
      res.status(400).json({ success: false, message: "Product already in wishlist" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// removing from wishlist

export const removeFromWishlist = async (req, res) => {
 
  try {
    const userId = req.user.id;

    console.log("removefromwishlist userId", userId);

    const productId = req.params.id;

    console.log("removefromwishlist productId", productId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalWishlistLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    const newWishlistLength = user.wishlist.length;

    if (originalWishlistLength === newWishlistLength) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await user.save();
    
    res.status(200).json({ message: "Product removed from wishlist" });
 
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Add to cart from wishlist

export const addToCartFromWishlist = async (req, res) => {

  console.log("Im in add to cart from wishlist::::::::::::")

  try {
    const userId = req.user.id;
    const productId = req.params.id;

    // Find the user and the product
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("user detail", user)

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("user product", product)
      
    // Check if the product is in the wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product not in wishlist" });
    }

    // Add product to cart
    
    const quantity = 1; // Assuming quantity is 1 when adding from wishlist, modify as needed

    const productData = await Product.findById(productId);

    if (quantity <= productData.quantity) {
      let userCart = await Cart.findOne({ userId });

      if (!userCart) {
        userCart = new Cart({ userId: userId, products: [] });
      }

      // Check if the product already exists in the cart
      const existingProduct = userCart.product.find(
        (prod) => prod.productId.toString() === productId.toString()
      );

      console.log

      if (existingProduct) {
        existingProduct.quantity += quantity; // Increment quantity if product exists in cart
      } else {
        userCart.product.push({ productId, quantity });
      }

      await userCart.save();

      // Remove product from wishlist
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
      await user.save();

      res.status(201).json({ success: true, message: "Item added to cart and removed from wishlist successfully" });
    } else {
      res.status(200).json({ success: false, message: "Out of stock" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error", error });
  }
};

//===========================================Cart==========================================================



//loadCart

export const loadCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const myCart = await Cart.findOne({ userId }).populate("product.productId");

    // Fetch all active coupons that have not expired
    const allCoupons = await Coupon.find({
      isActive: true,
      expirationDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    // Filter coupons based on user usage count
    const validCoupons = allCoupons.filter(coupon => {
      const userUsage = coupon.usedBy.find(u => u.userId.toString() === userId.toString());
      return !userUsage || userUsage.count < coupon.usageLimit;
    });

    if (!myCart) {
      return res.render("cart", { myCart: { product: [] }, coupons: validCoupons });
    }

    console.log("Cart:", myCart);
    console.log("Filtered Coupons:", validCoupons);

    res.render("cart", { myCart, coupons: validCoupons });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
};




//addtoCart

export const addToCart = async (req, res) => {
  console.log("Hit on add to cart endpoint");

  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const productData = await Product.findById({ _id: productId });

    console.log("productData", productData);

    if (!productData) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (quantity <= productData.quantity) {
      let userCart = await Cart.findOne({ userId });

      if (!userCart) {
        userCart = new Cart({ userId: userId, products: [] });
      }

      const existingProduct = userCart.product.find(
        (product) => product.productId.toString() === productId.toString()
      );

      console.log("existing product", existingProduct);

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        userCart.product.push({ productId, quantity });
      }

      await userCart.save();

      console.log("UserCart", userCart);

      res.status(201).json({ success: true, message: "Item added to cart successfully" });
    } else {
      console.log("OUT OF STOCK");
      res.status(200).json({ success: false, message: "Out of stock" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// delete from cart 


export const deleteFromCart = async (req,res)=>{

try{

  const userId= req.user.id 
  console.log("on remove from cart with userid", userId)

  const {productId} = req.body

  console.log("cart product id :", productId)

 const userCart = await Cart.findOne({ userId })

 console.log("userCart", userCart)

 if(!userCart){
  return res.status(400).json({ success: false, message: "Cart not found" });
 }

 if (!userCart.product || userCart.product.length === 0) {
  return res.status(404).json({ success: false, message: "Product not found in cart" });
}

// converting both values to strings ensures that the comparison is consistent and correct
const productIndex = userCart.product.findIndex(

  (product) => product.productId._id.toString() === productId.toString()

);
 
// existance of prod in the cart

if (productIndex > -1) {

  userCart.product.splice(productIndex, 1)
   // Remove the product 
  await userCart.save(); // Save changes to database

  console.log("Updated UserCart:", userCart);

  return res.status(200).json({ success: true, message: "Item removed from cart successfully" });
} else {
  return res.status(404).json({ success: false, message: "Product not found in cart" });
}
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
 
   
};





export const updateCart = async (req, res) => {
  try {
    console.log("iam on increment controller");

    const { productId, action } = req.body;
    const userId = req.user.id;

    console.log("Increment product id :", userId, "and", productId);

    const userCart = await Cart.findOne({ userId });

    if (!userCart) {
      return res.status(400).json({ success: false, message: "Cart not found" });
    }

    const product = userCart.product.find((item) => item.productId.toString() === productId.toString());

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }

    const productData = await Product.findById(productId);

    if (!productData) {
      return res.status(404).json({ success: false, message: "Product not found in inventory" });
    }

    const maxQuantity = 10; // Define the maximum quantity limit

    if (action === 'increment') {
      if (product.quantity < productData.quantity && product.quantity < maxQuantity) {
        product.quantity += 1;
        await userCart.save();
        return res.status(200).json({ success: true, message: "Quantity incremented successfully", newQuantity: product.quantity });
      } else if (product.quantity >= maxQuantity) {
        return res.status(400).json({ success: false, message: `Cannot exceed maximum quantity of ${maxQuantity}` });
      } else {
        return res.status(400).json({ success: false, message: "Out of stock" });
      }
    } else if (action === 'decrement') {
      if (product.quantity > 1) {
        product.quantity -= 1;
        await userCart.save();
        return res.status(200).json({ success: true, message: "Quantity decremented successfully", newQuantity: product.quantity });
      } else {
        return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




//apply Coupon


export const applyCoupon = async (req, res) => {
  console.log("Im in Apply Coupon!!!!!!!!!!!!!")
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    console.log("Applied Coupon", coupon);

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
    }

    if (coupon.expirationDate < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon code has expired" });
    }

    // Check user-specific usage count
    const userUsage = coupon.usedBy.find(user => user.userId.toString() === userId);
    if (userUsage && userUsage.count > coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon not available" });
    }

    const userCart = await Cart.findOne({ userId });
    console.log("UserCart::::::::", userCart);

    if (!userCart) {
      return res.status(400).json({ success: false, message: "Cart not found" });
    }

    let subtotal = 0;
    for (const item of userCart.product) {
      const product = await Product.findById(item.productId);
      if (product) {
        subtotal += product.salesPrice * item.quantity;
      } else {
        return res.status(400).json({ success: false, message: "Product not found" });
      }
    }

    console.log("Subtotal", subtotal);

    const discountAmount = (subtotal * (coupon.discount / 100)).toFixed(2);
    console.log("Discount amount:::::", discountAmount);

    const newTotal = (subtotal - discountAmount).toFixed(2);

    // Increment user-specific usage count
    if (userUsage) {
      userUsage.count += 1;
    } else {
      coupon.usedBy.push({ userId, count: 1 });
    }
    coupon.usageCount += 1;

    await coupon.save();

    res.status(200).json({
      success: true,
      discountAmount,
      newTotal,
      message: `Coupon applied successfully. You saved ₹${discountAmount}!`
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};








