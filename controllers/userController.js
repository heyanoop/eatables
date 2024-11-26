import { User } from "../models/userModel.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import nodemailer from "nodemailer";

import Product from "../models/productModel.js";
import { Order } from "../models/OrdersModel.js";
import {category} from "../models/categoryModel.js"
import *as offerHelper from "../helper/offerPriceHelper.js"


//===========================================================

//load the signup page

export const loadRegister = async (req, res) => {

  try {
    res.render("reg");

  } catch (error) {
    console.log(error.message);
  }
};

//===========================================================

// Generate OTP
const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

//verifyemail
// const sendVerifyEmail = async (name, email, otp) => {
//   try {
//     const trasnporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       requireTLS: true,
//       auth: {
//         user: process.env.MY_EMAIL,
//         pass: process.env.MY_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.MY_EMAIL,
//       to: email,
//       subject: "Verification email to Eatable",
//       text: `Hi ${name},Welome! Your OTP is ${otp}`,
//     };

//     //send email
//     trasnporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log(error.message);
//       } else {
//         console.log(`Email sent  ${info.response}`);
//       }
//     });

//     return true;
//   } catch (error) {
//     console.log(error.message);
//   }
// };


const sendVerifyEmail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Verification email to Eatable",
      text: `Hi ${name}, Welcome! Your OTP is ${otp}`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });

    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};


// ==============================================================================================

//load the otp page

export const loadOtpVerification = async (req, res) => {
  try {
    
    const token = req.cookies.token;

    if (!token) {
      return res.redirect('/register');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.redirect('/register');
      }
      res.render('getotp', { userData: decoded });
    });
  } catch (error) {
    console.log("Error in loadOtpVerification:", error.message);
    res.status(500).json({ status: "failed", message: "Internal server error" });
  }
};

// user registration

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password, password_conf } =
      req.body;

    // Check if all fields are filled
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobile ||
      !password ||
      !password_conf
    ) {
      return res.status(400).json({ status: "failed", message: "All fields are required" });
    }

    if (password !== password_conf) {
      return res.status(400).json({
        status: "failed",
        message: "Password and confirm password do not match",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ status: "failed", message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate an OTP
    const otp = await generateOTP();

    console.log("OTP:", otp)

    // Generate a temporary token
    const token = jwt.sign(
      { firstName, lastName, email, mobile, hashedPassword, otp },
      process.env.JWT_SECRET,
      { expiresIn: "2m" }
    );
    res.cookie("token", token, { httpOnly: true });

    let name = firstName + " " + lastName;

    const emailSent = await sendVerifyEmail(name, email, otp);

    // Send OTP to the user's email
    if (emailSent) {
      return res.status(200).json({ status: "success", message: "OTP sent successfully", redirectUrl: "/verifyotp" });
    } else {
      return res.status(500).json({ status: "failed", message: "Error sending OTP. Please try again later." });
    }
  } catch (error) {
    console.log("Error in registerUser:", error.message);
    res.status(500).json({ status: "failed", message: "Internal server error" });
  }
};

//=========================================================



// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).send("Token missing or expired");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Generate a new OTP
    const newOTP = await generateOTP();

    console.log("newOTP", newOTP)

    // Create a new token with the updated OTP
    const { firstName, lastName, email, mobile, hashedPassword } = decoded;

    if (!email) {
      return res.status(400).send("Email not defined in the token");
    }

    const newToken = jwt.sign(
      { firstName, lastName, email, mobile, hashedPassword, otp: newOTP },
      process.env.JWT_SECRET,
      { expiresIn: "2m" } // Ensure this matches your use case
    );

    // Send the new OTP to the user's email
    let name = `${firstName} ${lastName}`;

    if (await sendVerifyEmail(name, email, newOTP)) {
      res.cookie("token", newToken, {
        httpOnly: true,
        expires: new Date(Date.now() + 120000), // Expires in 2 minutes
      });
      
      return res.status(200).send({
        message: "New OTP sent to email.",
        newToken, // Include the new token in the response if needed
      });
    } else {
      return res.status(500).send("Error sending new OTP. Please try again later.");
    }
  } catch (error) {
    console.log("Error in resendOTP:", error.message);
    res.status(500).send("Internal server error");
  }
};


//=========================================================

//verify OTP

// export const verifyOTP = async (req, res) => {
//   console.log("verifyotp ");
//   const { otp } = req.body;
//   const token = req.cookies.token;


//   if (!token) {
//     return res.status(400).send("Token missing or expired");
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("this is my password", decoded.hashedPassword);
//     if (decoded.otp !== otp) {
//       return res.status(400).json({ error: "Invalid OTP" })
//     }
//     console.log("decoded :", decoded);
//     const newUser = new User({
//       firstName: decoded.firstName,
//       lastName: decoded.lastName,
//       email: decoded.email,
//       mobile: decoded.mobile,
//       password: decoded.hashedPassword,
//       isVerified: true,
//       isActive:true,
//     });

//     await newUser.save();
//     res.clearCookie("token");

//     res.status(200);
//     // .send("OTP verified successfully! Your account is now active.");
//     res.redirect("/login");
//   } catch (error) {
//     console.log("Error in verifyOTP:", error.message);
//     res.status(500).send("Internal server error");
//   }
// };
export const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const token = req.cookies.token;

  console.log("otp received", otp)

  if (!token) {
    return res.status(400).json({ error: "Token missing or expired" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Token OTP:", decoded.otp);

    // Validate OTP
    if (decoded.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email: decoded.email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists. Please login instead." });
    }

    // Create a new user if email doesn't exist
    const newUser = new User({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      mobile: decoded.mobile,
      password: decoded.hashedPassword,
      isVerified: true,
      isActive: true,
    });

    await newUser.save();
    res.clearCookie("token");

    // Generate a new token for the user
    const userToken = jwt.sign(
      { id: newUser._id, email: newUser.email, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set the new token in a cookie
    res.cookie("token", userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'Strict',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    // Determine the redirect URL based on user role
    const redirectUrl = newUser.isAdmin ? "/admin/dashboard" : "/home";
    res.status(200).json({
      message: "OTP verified successfully! Your account is now active.",
      redirect: redirectUrl
    });

  } catch (error) {
    console.error("Error in verifyOTP:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//================================================================

//userlogin

export const userLogin = async (req, res) => {
  try {
    res.render("forgotPass");
  } catch (error) {
    console.log(error.message);
  }
};

//================================================================
//userVerification
export const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const userData = await User.findOne({ email, isActive: true}).select("+password"); // Include password for comparison

    if (!userData) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const token = jwt.sign(
      { id: userData._id, email: userData.email, isAdmin: userData.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set cookie with fixed attributes
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Adjust based on your environment
      sameSite: 'Strict',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    if (userData.isAdmin) {
      return res.json({ redirect: "/admin/dashboard" });
    } else {
      return res.json({ redirect: "/home" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//===========================================================================

         //google login

export const googleSuccess = async (req, res) => {
  try {
    const profile = req.user.profile;
    if (!profile || !profile.emails || profile.emails.length === 0) {
      console.error('Google profile or email not found.');
      return res.status(400).json({ message: 'Google profile or email not found.' });
    }

    const email = profile.emails[0].value; // Access email from profile object

    console.log("email", email);

    let userData = await User.findOne({ email });

    console.log("googleuserdata", userData);
    
    if (userData) {
      console.log('User logged with Google:', userData);
      // Generate JWT token
      const token = jwt.sign(
        { id: userData._id, email: userData.email, isAdmin: userData.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Set the token in a cookie
      res.cookie('token', token, { httpOnly: true});

      // Redirect to home
      return res.redirect('/home');
    } else {
      console.log('User not registered:', email);
      return res.status(401).json({ message: 'User not registered' });
    }
  } catch (error) {
    console.error('Error in Google authentication:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//================================== Reset Password ===================================================

//  requestPasswordResetOTP

export const sendForgotPasswordOTP = async (req, res) => {

  console.log("Im in sendForgotPasswordOTP")

  const { email } = req.body;


  console.log("emails from body", email)

    try {
        
      const existingUser = await User.findOne({ email: email });


      console.log("Existing user", existingUser)

        if (!existingUser) {
            return res.status(404).send({ message: "Email not found" });
        }

        console.log("Existing user", existingUser)

        // Generate OTP
        const otp = await generateOTP();
        console.log( "otp forgot pass", otp)

        // Generate temporary token with user data and OTP
        const token = jwt.sign(
            { userId: existingUser._id, email: existingUser.email, otp },
            process.env.JWT_SECRET,
            { expiresIn: "2m" } 
        )

        console.log("Created Token", token)

        const emailSent = await sendVerifyEmail(existingUser.firstName, email, otp);
        if (emailSent) {
            // Set the token in cookie 
            res.cookie("token", token, { httpOnly: true });
            return res.status(200).json({ success: true, message: "OTP sent to email." });
        } else {
            return res.status(500).json({ success: false, message: "Error sending OTP. Please try again later." });
        }
    } catch (error) {
        console.log("Error in sendForgotPasswordOTP:", error.message);
        res.status(500).send("Internal server error");
    }
};



// resend forgot pASSWORD OTP

export const resendForgotPasswordOTP = async (req, res) => {

  console.log("Im in resend forgot password otp")
  try {
      const token = req.cookies.token;

      // Debugging token and payload
      console.log("Received token:", token);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
      
      const { email } = decoded;

      // Generate new OTP
      const newOTP = await generateOTP();
      console.log("Generated OTP:", newOTP);

      // Generate new token with updated OTP
      const newToken = jwt.sign(
          { email, otp: newOTP },
          process.env.JWT_SECRET,
          { expiresIn: "2m" } 
      );
      
      // Send new OTP
      const emailSent = await sendVerifyEmail(decoded.firstName, email, newOTP);
      console.log("Email sent status:", emailSent);

      if (emailSent) {
          res.cookie("token", newToken, { httpOnly: true });
          return res.status(200).send({ message: "New OTP sent to email.", newToken });
      } else {
          return res.status(500).send("Error sending new OTP. Please try again later.");
      }

  } catch (error) {
      console.log("Error in resendForgotPasswordOTP:", error.message);
      res.status(500).send("Internal server error");
  }
};

 
//verify otp


export const verifyForgotPasswordOTP = async (req, res) => {
    console.log("Im in forgot pass verify otp");

    const { otp } = req.body;
    const token = req.cookies.token;

    if (!token) {
        return res.status(400).send("Token missing or expired");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);
        console.log("decoded otp", decoded.otp, "and", otp);

        if (decoded.otp !== otp) {
          return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      res.status(200).json({ success: true, message: "OTP verified successfully. You can now reset your password." });
  } catch (error) {
      console.log("Error in verifyForgotPasswordOTP:", error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};


//reset password



export const resetPassword = async (req, res) => {

  
  console.log("I'm in reset password");

  const { newPassword } = req.body;
  const token = req.cookies.token;

  console.log("Received newPassword:", newPassword);

  if (!token) {
      return res.status(400).send("Token missing or expired");
  }

  if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
  }

  const passwordValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordValidationRegex.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character." });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await User.findByIdAndUpdate(decoded.userId, { password: hashedPassword });

      if (!user) {
          return res.status(404).send("User not found");
      }

      res.clearCookie("token");

      return res.status(200).json({ success: true, message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
      console.log("Error in resetPassword:", error.message);
      return res.status(500).send("Internal server error");
  }
};




//===========================end of forget password====================

// =================================//home page=================================================

export const openingPage = async (req, res) => {
  try {
    console.log("home page rendered");


    const topProducts = await Order.aggregate([
      { $unwind: '$products' }, 
      { $group: { _id: '$products.productId', totalOrdered: { $sum: '$products.quantity' } } }, 
      { $sort: { totalOrdered: -1 } }, 
      { $limit: 6 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }, // Deconstruct the productDetails array
      { $match: { 'productDetails.isActive': true } }, // Match only active products
      { $project: { _id: 0, productId: '$_id', totalOrdered: 1, productDetails: 1 } } 
    ]);
    
    // Extract the product details from the aggregation result
    const topProductDetails = topProducts.map(product => product.productDetails);
    
    // Populate the category field for each top product
    const topProductsWithCategory = await Product.populate(topProductDetails, { path: 'category' });
  
    const additionalProducts = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(8).populate('category')

    const [{ count: activeProductCount } = { count: 0 }] = await Product.aggregate([
      { $match: { isActive: true } },
      { $count: 'count' }
    ]);

    console.log("Top ordered products:", topProductsWithCategory);
    console.log("Additional active products:", additionalProducts);

    res.render("openingPage", { topProducts: topProductsWithCategory, products: additionalProducts, activeProductCount });
  } catch (error) {
    console.log("error caught:", error);
    res.status(500).send("Internal Server Error");
  }
};



//home after login 
export const loadHome = async (req, res) => {

  console.log("request user",req.user)
  try {
    const userId = req.user.id;

    console.log("UserID:", userId)

    let user = await User.findOne({ _id: userId });

    

    console.log("home page rendered");
    console.log("USER:", user);

    const topProducts = await Order.aggregate([
      { $unwind: '$products' }, 
      { $group: { _id: '$products.productId', totalOrdered: { $sum: '$products.quantity' } } }, 
      { $sort: { totalOrdered: -1 } }, 
      { $limit: 6 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }, // Deconstruct the productDetails array
      { $match: { 'productDetails.isActive': true } }, // Match only active products
      { $project: { _id: 0, productId: '$_id', totalOrdered: 1, productDetails: 1 } } 
    ]);
    
    // Extract the product details from the aggregation result
    const topProductDetails = topProducts.map(product => product.productDetails);
    
    // Populate the category field for each top product
    const topProductsWithCategory = await Product.populate(topProductDetails, { path: 'category' });
  
    const additionalProducts = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(8).populate('category');
    const activeProductCount = await Product.countDocuments({ isActive: true });

    console.log("Top ordered products:", topProductsWithCategory);
    console.log("Additional active products:", additionalProducts);

    res.render("index", { topProducts: topProductsWithCategory, products: additionalProducts, user: user,  activeProductCount :  activeProductCount });
  } catch (error) {
    console.log("error caught:", error);
    res.status(500).send("Internal Server Error");
  }
};


// ===========================================/Product Detail Page/=====================================================================

//load product list

export const loadProductDetails = async (req, res) => {
  try {

     const productId = req.params.id;

      const products = await Product.findById(productId).populate('category');

      console.log("Product detail :", products)

      if (products) {
        const relatedProducts = await Product.find({
            category: products.category._id,
            _id: { $ne: productId }, // Exclude the current product
            isActive: true // Only include products that are active
        }).limit(4);
    
    
        console.log("related products", relatedProducts)

        return res.render('productDetails', { products, relatedProducts });
    }
    
    res.status(404).send('Product not found');
      
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};


// post Review 

export const postReview = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const { name, email, rating, review } = req.body;

    const products = await Product.findById(productId);

    if (products) {
      products.reviews.push({ name, email, rating, review });

      await products.save();

      return res
        .status(200)
        .json({
          message: "Review added successfully",
          review: products.reviews[products.reviews.length - 1],
        });
    }

    res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

//show the pssted reviews

export const getReviews = async (req, res) => {
  try {
      const productId = req.params.id;
      const products = await Product.findById(productId).populate('reviews');

      console.log("Products in get reviews", products)

      if (products) {
          return res.status(200).json(products.reviews);
      }
      
      res.status(404).json({ message: "Product not found" });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};



//contact page 






export const loadContactPage = async (req,res)=>{

  try{

    res.render('contact')

  }catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
}


export const contactEnquiry = async (req, res) => {
  console.log("Im in contact enquiry");
  console.log("Im in reqbody", req.body);

  const { name, email, message } = req.body;

  // Configure Nodemailer with the tls option to accept self-signed certificates
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.MY_EMAIL, // Your email
          pass: process.env.MY_PASS,  // Your email password
      },
      tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
      },
  });

  const mailOptions = {
      from: email,
      to: 'eatablesforyou@gmail.com', // Replace with your email address
      subject: `New Enquiry Form Submission from ${name}`,
      text: `You have a new message from ${name} (${email}):\n\n${message}`,
  };

  try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.json({ success: false, message: 'Something went wrong, please try again later.' });
  }
};









//user Logout

export const logout = async (req, res) => {
  try {
    console.log("userlogout");
    // Clear the JWT cookie
    res.clearCookie("token");

    // Redirect to the homepage
    res.redirect("/");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};