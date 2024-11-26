import express from "express"
const adminRoute = express();

import *as adminController from "../controllers/adminController.js"
import *as productController from "../controllers/productController.js"
import *as auth from "../middleware/auth.js"
import *as adminOrder from "../controllers/adminOrder.js"
import *as adminCategory from "../controllers/adminCategory.js"
import *as userController from "../controllers/userController.js"

import *as promoController from "../controllers/promotionalOffers.js"

import { upload } from "../controllers/productController.js";



import cookieParser from "cookie-parser";



adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/Admin')
adminRoute.use(express.json()) // Parses req with JSON payloads
adminRoute.use(express.urlencoded({ extended: true })) // Parses req with urlencoded payloads
adminRoute.use(cookieParser());
adminRoute.use(express.static('uploads'))


import { isAdmin } from "../middleware/roleChecker.js";


adminRoute.get ('/forgotPass',userController.userLogin)


adminRoute.get('/dashboard',auth.isLogin,isAdmin,adminController.loadDash)
adminRoute.get('/sales-data-stats',auth.isLogin,isAdmin,adminController.getStatsData)
adminRoute.get('/salesReport', auth.isLogin,isAdmin,adminController.getSalesReport);
// adminRoute.get('/generateReport',auth.isLogin,isAdmin,adminController.generatepdfReport)

adminRoute.get('/most-ordered',auth.isLogin,isAdmin,adminController.loadmostOrdered)

// adminRoute.get('/testpdf', auth.isLogin,isAdmin,adminController.generateSimplePDF)


adminRoute.get('/customer',auth.isLogin ,isAdmin,adminController.loadCustomerDash)
adminRoute.post('/blockCustomer',auth.isLogin ,isAdmin, adminController.blockUser)
adminRoute.post('/unBlockCustomer',auth.isLogin ,isAdmin,adminController.unblockUser)


adminRoute.get ('/category',auth.isLogin ,isAdmin, adminCategory.loadCategory)
adminRoute.get ('/editCategories',auth.isLogin ,isAdmin,adminCategory.loadEditCategory)
adminRoute.get('/unBlockCategory',auth.isLogin ,isAdmin,adminCategory.unblockCategory)
adminRoute.get('/blockCategory',auth.isLogin ,isAdmin,adminCategory.blockCategory)
adminRoute.post('/addCategory',auth.isLogin ,isAdmin,adminCategory.addCatagories)
adminRoute.post('/updateCategory',auth.isLogin ,isAdmin,adminCategory.EditCategory)


adminRoute.get ('/products',auth.isLogin ,isAdmin,productController.loadProduct)
adminRoute.post('/addProducts',auth.isLogin ,isAdmin,upload.array('image',5),productController.cropImages, productController.addNewProduct)
// adminRoute.post('/products', auth.isLogin,isAdmin, productController.addProduct)
adminRoute.get ('/productList',auth.isLogin ,isAdmin,productController.loadProductList)
adminRoute.get('/unBlockProduct',auth.isLogin ,isAdmin,productController.unblockProduct)
adminRoute.get('/blockProduct',auth.isLogin ,isAdmin,productController.blockProduct)
adminRoute.get('/editProduct', auth.isLogin, isAdmin, productController.editproductLoad);
adminRoute.post('/editProduct', auth.isLogin, isAdmin, productController.upload.array('image',5),productController.cropImages,productController.EditProduct);
adminRoute.delete('/deleteImage',auth.isLogin, isAdmin,productController. deleteProductImage);


adminRoute.get ('/orderlist',auth.isLogin, isAdmin,adminOrder.loadOrderPage)
adminRoute.post('/orders/change-status/:orderId',auth.isLogin, isAdmin,adminOrder.changeOrderStatus);



adminRoute.get ('/offer',auth.isLogin, isAdmin,promoController.loadOffer )
adminRoute.post('/addOffer',auth.isLogin, isAdmin,promoController.addOffer)
adminRoute.patch('/offer/:couponId/status', auth.isLogin, isAdmin, promoController.updateOfferStatus)



adminRoute.get('/coupon', auth.isLogin, isAdmin, promoController.loadCoupon)
adminRoute.post('/createCoupon', auth.isLogin, isAdmin, promoController.createCoupon)
adminRoute.patch('/coupon/:couponId/status', auth.isLogin, isAdmin, promoController.updateCouponStatus)



adminRoute.get('/logout', adminController.logout)



export default adminRoute