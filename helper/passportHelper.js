import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";

//google Passport

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:
      // process.env.NODE_ENV === "production"? 
      "https://eatables.shop/login/google/callback"  // Production
      // : "http://localhost:3000/login/google/callback"  // Development

    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
        console.log("Profile:", profile);

        const token = jwt.sign({ profile }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        return done(null, { token, profile });
      } catch (error) {
        console.error("Error during Google authentication:", error.message);

        return done(error, null);
      }
    }
  )
);

export default passport;
