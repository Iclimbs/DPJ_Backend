
const router = require("express").Router();
const passport = require("passport");


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
})

module.exports = router;
