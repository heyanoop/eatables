import express from "express"
const userRoute = express();

import *as userController from "../controllers/userController.js"
import *as auth from "../middleware/auth.js"
import cookieParser from "cookie-parser";
import *as cartController from "../controllers/cartController.js"
import *as profileController from "../controllers/userProfileController.js"
import *as shopPageController from "../controllers/shopPageController.js"
import *as checkoutController from "../controllers/checkoutController.js"
import passport from "../helper/passportHelper.js"
import nocache from "nocache"
userRoute.set('view engine','ejs')
userRoute.set('views','./views/User')
userRoute.use(express.json()) // Parses req with JSON payloads
userRoute.use(express.urlencoded({ extended: true })) // Parses req with urlencoded payloads
userRoute.use(cookieParser());
userRoute.use(nocache());

import { isUser } from "../middleware/roleChecker.js";


userRoute.get('/',userController.openingPage)


userRoute.get('/register',userController.loadRegister)
userRoute.post('/register', userController.registerUser)

userRoute.get('/verifyotp',userController.loadOtpVerification)
userRoute.post('/verifyotp',userController.verifyOTP)
userRoute.post('/resendotp',userController.resendOTP);

userRoute.get ('/login/google',passport.authenticate('google', { scope: ['profile', 'email']}))
userRoute.get('/login/google/callback',passport.authenticate('google', { failureRedirect: '/login' , session: false}),userController.googleSuccess)

userRoute.get('/login',auth.isLogout,userController.userLogin) 
userRoute.post('/login',auth.isLogout,userController.verifyLogin)


//password reset 
userRoute.post('/request-password-reset-otp', userController.sendForgotPasswordOTP);
userRoute.post('/request-password-resend-otp', userController.resendForgotPasswordOTP);
userRoute.post('/verify-password-reset-otp', userController.verifyForgotPasswordOTP); 
userRoute.post('/reset-password', userController.resetPassword ); 



userRoute.get('/home',auth.isLogin,isUser,userController.loadHome)


userRoute.get('/productDetails/:id',auth.isLogin,isUser, userController.loadProductDetails, userController.getReviews)
userRoute.post('/productDetails/:id/review', auth.isLogin, isUser, userController.postReview);


userRoute.get('/shopPage', shopPageController.loadShopProduct)
userRoute.get('/shop/sort', shopPageController.sortProducts)
userRoute.get('/shop/search',shopPageController.searchProducts)
userRoute.get('/shop/filter', shopPageController.priceFilter) 
userRoute.get('/shop/filterByCategory', shopPageController.categoryFilter) 





userRoute.get('/wishlist',auth.isLogin,isUser,cartController.loadwishlist) 
userRoute.post('/wishlist/add/:id', auth.isLogin,isUser,cartController.addToWishlist)
userRoute.delete('/wishlist/remove/:id', auth.isLogin,isUser,cartController.removeFromWishlist)
userRoute.post('/wishlist/movetocart/:id', auth.isLogin, isUser, cartController.addToCartFromWishlist);



//cart

userRoute.get('/mycart',auth.isLogin,isUser,cartController.loadCart)
userRoute.post('/mycart',auth.isLogin,isUser,cartController.addToCart)
userRoute.delete('/mycart', auth.isLogin, isUser, cartController.deleteFromCart);
userRoute.patch('/mycart/update', auth.isLogin, isUser, cartController.updateCart);
userRoute.patch('/mycart/applycoupon', auth.isLogin, isUser, cartController.applyCoupon)


//userProfile

userRoute.get ('/profile',auth.isLogin,isUser, profileController.loadProfile)
userRoute.post('/editprofile', auth.isLogin,isUser, profileController.editProfile)
userRoute.post('/changepassword', auth.isLogin, isUser, profileController.changePassword)
//address
userRoute.post('/addaddresses', auth.isLogin,isUser, profileController.addAddress)
userRoute.get('/address/:id',auth.isLogin,isUser, profileController.getAddressDetails)
userRoute.put('/address/:id', auth.isLogin, isUser, profileController.updateAddress)
userRoute.delete('/address/:id', auth.isLogin, isUser, profileController.deleteAddress)



//order
userRoute.get('/checkout',auth.isLogin,isUser,checkoutController.loadCheckout)
userRoute.post('/placeorder', auth.isLogin, isUser, checkoutController.placeOrder)
userRoute.post('/razorpay/placeorder', auth.isLogin, isUser, checkoutController.razorpayPlaceOrder);
userRoute.post('/razorpay/update-failed-order', auth.isLogin, checkoutController.updateFailedOrder);
userRoute.post('/razorpay/verify', auth.isLogin, isUser, checkoutController.verifyPayment)
userRoute.post('/placeorder/wallet', auth.isLogin,isUser, checkoutController.walletOrder)
userRoute.get('/order/success', auth.isLogin, isUser, checkoutController.loadOrderSuccess)

//cancelorder
userRoute.put('/cancelorder/:orderId', auth.isLogin, isUser, profileController.cancelOrder)
userRoute.get('/vieworderdetails', auth.isLogin, isUser, profileController.viewOrderDetail);
userRoute.post('/orders/return', auth.isLogin, isUser, profileController.returnOrder)



userRoute.get('/contact', userController.loadContactPage)
userRoute.post('/contact-enquiry', userController.contactEnquiry);




userRoute.get('/logout', userController.logout)








export default userRoute