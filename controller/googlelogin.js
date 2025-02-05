
const router = require("express").Router();
const passport = require("passport");

// router.get("/login/success", (req, res) => {
//     if (req.user) {
//         res.status(200).json({
//             error: false,
//             message: "Successfully Loged In",
//             user: req.user,
//         });
//     } else {
//         res.status(403).json({ error: true, message: "Not Authorized" });
//     }
// });

// router.get("/login/failed", (req, res) => {
//     res.status(401).json({
//         error: true,
//         message: "Log in failure",
//     });
// });

router.get("/google", passport.authenticate("google", ["profile", "email"]));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), (req, res) => {
    if (req.user?.status === 'success') {
        if (req.user?.redirect) {
            return res.redirect(`${process.env.domainurl}/login/success?type=${req.user.type}&token=${req.user.token}&redirect=${req.user.redirect}`)
        }
        return res.redirect(`${process.env.domainurl}/login/success?type=${req.user.type}&token=${req.user.token}`)

    } else if (req.user?.status === 'pending') {
        return res.redirect(`${process.env.domainurl}/signup?name=${req.user.name}&email=${req.user.email}`)
    } else if (req.user?.status === 'error') {
        return res.redirect(`${process.env.domainurl}/login/error?message=${req.user.message}`)
    }
    // res.json({ user: req.user, success: true, token: req?.user?.token }); // Send token in the response
})

// router.get("/logout", (req, res) => {
//     req.logout();
//     res.redirect(process.env.domainurl);
// });

module.exports = router;
