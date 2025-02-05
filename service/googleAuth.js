const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken')
const { UserModel } = require("../model/user.model");


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `/auth/google/callback`,
            scope: ["profile", "email"],
        },
        async function (accessToken, refreshToken, profile, callback) {
            try {
                const user = await UserModel.find({ email: profile._json.email })
                if (user.length === 0) {
                    callback(null, {
                        status:'pending',
                        name: profile.displayName,
                        email: profile._json.email,
                        redirect:"/signup"
                    });
                } else {
                    let token = jwt.sign(
                        {
                            _id: user[0]._id,
                            name: user[0].name,
                            email: user[0].email,
                            accountType: user[0].accountType,
                            profile: user[0].profile,
                            verified: user[0].verified,
                            subscription: user[0].subscription,
                            planExpireAt: user[0].planExpireAt,
                            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                        },
                        "Authentication",
                    );
                    if (user[0].dob === undefined || user[0].dob === "") {
                        callback(null, {
                            status:'success',
                            message:'Login Successful',
                            token:token,
                            type:user[0].accountType,
                            redirect:'/user/basicprofile',
                        });
                    }
                    if (
                        user[0].profile === undefined ||
                        user[0].profile === ""
                    ) {
                        callback(null, {
                            status:'success',
                            message:'Login Successful',
                            token:token,
                            type:user[0].accountType,
                            redirect:'/user/basicprofile',
                        });
                    }
                    callback(null, {
                        status:'success',
                        message:'Login Successful',
                        token:token,
                        type:user[0].accountType,
                    });
                }
            } catch (error) {
                callback(null, {status:'error',message:`${error.message}`});
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});