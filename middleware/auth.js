import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isLogin = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    // || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);;

    if (token) {
      try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        console.log("verify", verify);

        const user = await User.findById(verify.id);
        console.log("MIDTOKEN", user);

        if (user) {
          req.user = user;
          console.log(req.user, "admin");
          req.role = verify.isAdmin;
          console.log(req.role, "my role");

          next();
        } else {
          res.status(401).render("forgotPass");
        }
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          res.status(401).render("forgotPass", {
            message: "Session expired, please log in again.",
          }); // Token expired
        } else {
          res
            .status(401)
            .render("forgotPass", { message: "Unauthorized, please log in." }); // Other token errors
        }
      }
    } else {
      res.status(401).render("forgotPass");
    }
  } catch (error) {
    console.error(error);
  }
};


export const isLogout = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    // || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);;

    if (token) {
      res.redirect("/home");
      return;
    } else {
      // res.redirect('/')
      next();
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};
