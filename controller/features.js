const express = require("express");
const FeaturesRouter = express.Router();
const FeatureModel = require("../model/ModelExport");

FeaturesRouter.post("/add", async (req, res) => {
  const { name } = req.body;
  try {
    const newFeature = new FeatureModel({
      name: name,
      status: true,
    });
    console.log(newFeature);
    await newFeature.save();
    res.json({
      status: "success",
      message: `Successfully Added New Feature`,
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Unable To Add Feature Model ${error.message}`,
    });
  }
});

FeaturesRouter.get("/listall", async (req, res) => {
  try {
    const list = await FeatureModel.find({});
    if (list.length == 0) {
      res.json({
        status: "error",
        message: "No Feature List Found",
      });
    } else {
      res.json({
        status: "success",
        data: list,
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Unable To Fetch Features List ${error.message}`,
    });
  }
});

FeaturesRouter.get("/listall/active", async (req, res) => {
  try {
    const list = await FeatureModel.find({
      status: true,
    });
    if (list.length == 0) {
      res.json({
        status: "error",
        message: "No Active Feature List Found",
      });
    } else {
      res.json({
        status: "success",
        data: list,
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Unable To Fetch Features List ${error.message}`,
    });
  }
});

module.exports = { FeaturesRouter };
