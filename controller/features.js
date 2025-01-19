const express = require("express");
const FeaturesRouter = express.Router();
const FeatureModel = require("../model/ModelExport");

FeaturesRouter.post("/add", (req, res) => {
  const {} = req.body;
  try {
  } catch (error) {}
});

module.exports = { FeaturesRouter };
