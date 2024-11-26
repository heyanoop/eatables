import  mongoose from "mongoose" 
mongoose.connect(process.env.ATLAS_CONNECT)
// mongoose.connect(process.env.MONGOOSE_CONNECT)
.then(() => console.log("Connected with DataBase"))
.catch(err => console.error("MongoDB connection error:", err));


import express from "express"
const app = express();
import userRoute from "./routes/userRoute.js"
import adminRoute from "./routes/adminRoute.js"
import nocache from "nocache"
app.use(nocache())

import passport from './helper/passportHelper.js';
app.use(passport.initialize());


//for user routes
app.use(express.static('public'))

app.use('/',userRoute)
app.use('/admin', adminRoute)

const PORT= process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log(`Server started on http://localhost:${PORT}`);
})
