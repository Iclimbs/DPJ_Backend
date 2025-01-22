const express = require('express');
const FeatureRouter = express.Router();
const { FeaturesModel } = require('../model/ModelExport');
const { AdminAuthentication } = require('../middleware/MiddlewareExport');

FeatureRouter.post('/create', AdminAuthentication, async (req, res) => {
    try {
        const feature = new FeaturesModel(req.body);
        await feature.save();
        res.json({ status: 'success', message: "Feature created successfully" });
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Create New Feature${error}` });
    }
});

FeatureRouter.post('/update/:id', AdminAuthentication, async (req, res) => {
    try {
        const feature = await FeaturesModel.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ status: 'success', message: "Feature Value Updated successfully" });
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Create New Feature${error}` });
    }
});


FeatureRouter.get('/list/active', AdminAuthentication, async (req, res) => {
    try {
        const features = await FeaturesModel.find({ status: true });
        if (features.length < 1) {
            return res.json({ status: 'error', message: "No Feature Found" });
        } else {
            return res.json({ status: 'success', data: features });
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Features${error}` });
    }
})

FeatureRouter.get('/all', AdminAuthentication, async (req, res) => {
    try {
        const features = await FeaturesModel.find({ status: true });
        if (features.length < 1) {
            return res.json({ status: 'error', message: "No Feature Found" });
        } else {
            return res.json({ status: 'success', data: features });
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Features${error}` });
    }
})


module.exports = { FeatureRouter };