// Basic Required Modules
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");

// Basic Model Imports
const { JobModel, JobAppliedModel, UserModel } = require("../model/ModelExport");

// Basic Middleware Imports
const {
  ProfessionalAuthentication,
  UserAuthentication,
  AdminAuthentication,
  uploadMiddleWare,
  JobCreationChecker,
  ArtistAuthentication,
  JobApplyChecker,
} = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");
const { getDateAfter30Days, currentDate } = require("../service/currentDate");

const JobRouter = express.Router();

// Creating A Job Post

JobRouter.post(
  "/add",
  [ProfessionalAuthentication, JobCreationChecker],
  async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    const {
      salary,
      role,
      workType,
      description,
      education,
      experience,
      companyOverview,
      employmentType,
      category
    } = req.body;

    let addressdetails = {
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      location: req.body.location,
    };
    let jobBenefits;
    if (typeof req.body.benefits === "string") {
      jobBenefits = JSON.parse(req.body.benefits);
    } else {
      jobBenefits = req.body.benefits;
    }
    let keyResponsibilities;
    if (typeof req.body.keyResponsibilities === "string") {
      keyResponsibilities = JSON.parse(req.body.keyResponsibilities);
    } else {
      keyResponsibilities = req.body.keyResponsibilities;
    }

    const newJobPosting = new JobModel({
      createdBy: decoded._id,
      salary: Number(salary),
      role,
      category,
      workType,
      description,
      education,
      experience: Number(experience),
      companyOverview,
      employmentType,
      address: addressdetails,
      endtime: getDateAfter30Days(currentDate),
      benefits: jobBenefits,
      keyResponsibilities: keyResponsibilities,
    });
    try {
      await newJobPosting.save();
      return res.json({
        status: "success",
        message: `Job Creation Successful. Please Wait Till Admin Verify This Job !!`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Create New Job Posting ${error.message}`,
      });
    }
  },
);

// Editing Job Post Details

JobRouter.patch(
  "/edit/:id",
  [ProfessionalAuthentication, JobCreationChecker],
  async (req, res) => {
    const { id } = req.params;
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, "Authentication");

      const JobDetails = await JobModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
      ]);

      if (JobDetails.length === 0) {
        return res.json({
          status: "error",
          message: `No Job Post Found with this ID OR You Don't Have Required Permission !! `,
        });
      }

      let addressdetails = {
        country: req.body?.country || JobDetails[0].address.country,
        state: req.body?.state || JobDetails[0].address.state,
        city: req.body?.city || JobDetails[0].address.city,
        location: req.body?.location || JobDetails[0].address.location,
      };
      let jobBenefits;
      if (typeof req.body?.benefits === "string") {
        jobBenefits = JSON.parse(req.body?.benefits) || JobDetails[0].benefits;
      } else {
        jobBenefits = req.body?.benefits || JobDetails[0].benefits;
      }
      let keyResponsibilities;
      if (typeof req.body?.keyResponsibilities === "string") {
        keyResponsibilities =
          JSON.parse(req.body?.keyResponsibilities) ||
          JobDetails[0].keyResponsibilities;
      } else {
        keyResponsibilities =
          req.body?.keyResponsibilities || JobDetails[0].keyResponsibilities;
      }
      let salary = Number(req.body.salary) || JobDetails[0].salary;
      let experience = Number(req.body.experience) || JobDetails[0].experience;

      const updatedData = {
        ...req.body,
        address: addressdetails,
        benefits: jobBenefits,
        salary: salary,
        experience: experience,
        keyResponsibilities: keyResponsibilities,
      };

      const updatedJobDetails = await JobModel.findByIdAndUpdate(
        { _id: id },
        updatedData,
      );
      await updatedJobDetails.save();
      return res.json({
        status: "success",
        message: `Job Details Updated Successfully !!`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Update Job Details ${error.message}`,
      });
    }
  },
);

// Disable Job Details By Professional

JobRouter.patch(
  "/disable/:id",
  [ProfessionalAuthentication, JobCreationChecker],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const JobDetails = await JobModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
      ]);
      JobDetails[0].status = "Hold";
      await JobDetails[0].save();
      return res.json({
        status: "success",
        message: `Job Post Disabled Successfully !!`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Disable Job Details ${error.message}`,
      });
    }
  },
);

// Disable Job By Admin

JobRouter.patch("/disable/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const JobDetails = await JobModel.findByIdAndUpdate(id, { status: "Hold" });
    return res.json({
      status: "success",
      message: `Job Post Disabled Successfully !!`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Disable Job Details ${error.message}`,
    });
  }
});
// Get All Job List Which are Currently Active

JobRouter.get("/listall/active", UserAuthentication, async (req, res) => {
  try {
    const activeJobs = await JobModel.aggregate([
      { $match: { endtime: { $gte: currentDate } } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
      { $sort: { CreatedAt: -1 } },
    ]);
    if (activeJobs.length > 0) {
      return res.json({ status: "success", data: activeJobs });
    } else {
      return res.json({
        status: "error",
        message: `No Active Job Post Found !!`,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Job List ${error.message}`,
    });
  }
});

// Get All Job List For Admin

JobRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
  try {
    const alljobs = await JobModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
      { $sort: { CreatedAt: -1 } },
    ]);
    if (alljobs.length > 0) {
      return res.json({ status: "success", data: alljobs });
    } else {
      return res.json({
        status: "error",
        message: `No Active Job Post Found !!`,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Job List ${error.message}`,
    });
  }
});

// Get Job Details Only For Artists Who are not Professional & will Apply For Job

JobRouter.get("/detailone/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const JobDetails = await JobModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "ProfessionalDetails",
        },
      },
      {
        $lookup: {
          from: "job_applications",
          localField: "_id",
          foreignField: "jobId",
          as: "applications",
        },
      },
      {
        $addFields: {
          isApplied: {
            $in: [
              new mongoose.Types.ObjectId(decoded._id),
              "$applications.appliedBy",
            ],
          },
        },
      },
      { $project: { applications: 0 } },
    ]);

    if (JobDetails.length !== 0) {
      return res.json({ status: "success", data: JobDetails });
    } else {
      return res.json({
        status: "error",
        message: `No Job Post Found with this ID !! `,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To GET Job Details ${error.message}`,
    });
  }
});

// Get Job Details Only For Professional Who has Created This Job Requirement

JobRouter.get(
  "/detailone/professional/:id",
  [ProfessionalAuthentication],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const JobDetails = await JobModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
        {
          $lookup: {
            from: "job_applications",
            localField: "_id",
            foreignField: "jobId",
            as: "applications",
          },
        },
      ]);
      if (JobDetails.length !== 0) {
        return res.json({ status: "success", data: JobDetails });
      } else {
        return res.json({
          status: "error",
          message: `No Job Post Found with this ID !! `,
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To GET Job Details ${error.message}`,
      });
    }
  },
);

// Get Job Details Only For Admin

JobRouter.get("/detailone/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const JobDetails = await JobModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "job_applications",
          localField: "_id",
          foreignField: "jobId",
          as: "applications",
        },
      },
    ]);
    if (JobDetails.length !== 0) {
      return res.json({ status: "success", data: JobDetails });
    } else {
      return res.json({
        status: "error",
        message: `No Job Post Found with this ID !! `,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To GET Job Details ${error.message}`,
    });
  }
});

// Get All Job List Created By Professional

JobRouter.get(
  "/listall/professional",
  [ProfessionalAuthentication],
  async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const JobDetails = await JobModel.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(decoded._id) } },
        { $sort: { CreatedAt: -1 } },
      ]);

      if (JobDetails.length !== 0) {
        return res.json({ status: "success", data: JobDetails });
      } else {
        return res.json({ status: "error", message: `No Job Post Found !!` });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Get Job List ${error.message}`,
      });
    }
  },
);

// Apply For Job Only For Artists

JobRouter.post(
  "/apply/:id",
  [uploadMiddleWare.single("cv")],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    if (!req?.file) {
      return res.json({ status: "error", message: `Please Upload Your CV` });
    }
    try {
      const JobDetails = await JobModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
      ]);

      if (JobDetails.length > 0) {
        return res.json({
          status: "error",
          message: `You Cannot Apply For The Job Created By Youself !! `,
        });
      }

      const appliedJob = await JobAppliedModel.aggregate([
        {
          $match: {
            jobId: new mongoose.Types.ObjectId(id),
            appliedBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
      ]);

      if (appliedJob.length > 0) {
        return res.json({
          status: "error",
          message: `You Have Already Applied For This Job !!`,
        });
      }

      const newApplication = new JobAppliedModel({
        appliedBy: decoded._id,
        jobId: id,
        name: decoded.name,
        email: decoded.email,
        profile: decoded.profile,
        coverLetter: req.body.coverLetter,
        cv: req.file.location,
      });

      await newApplication.save();

      return res.json({
        status: "success",
        message: `You Have Successfully Applied For This Job !! `,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed to apply for this job ${error.message}`,
      });
    }
  },
);

// Upload Job Application Status By Professional

JobRouter.post(
  "/application/statusUpdate/:id",
  [ProfessionalAuthentication, JobCreationChecker],
  async (req, res) => {
    const { id } = req.params;
    try {
      const JobDetails = await JobAppliedModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ]);
      if (JobDetails.length === 0) {
        return res.json({
          status: "error",
          message: `No Job Application Found with this ID !! `,
        });
      }
      await JobAppliedModel.findByIdAndUpdate(id, { status: req.body?.status });
      return res.json({
        status: "success",
        message: `You Have Successfully Updated Job Application !! `,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed to apply for this job ${error.message}`,
      });
    }
  },
);

// List Of All The Job Application Applied By Artist

JobRouter.get("/listall/applied", [ArtistAuthentication], async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const JobDetails = await JobAppliedModel.aggregate([
      { $match: { appliedBy: new mongoose.Types.ObjectId(decoded._id) } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      profile: 1,
                      category: 1,
                    },
                  },
                ],
                as: "professionaldetails",
              },
            },
          ],
          as: "jobdetails",
        },
      },
    ]);
    if (JobDetails.length === 0) {
      return res.json({
        status: "error",
        message: `No Job Application Found with this ID !! `,
      });
    } else {
      return res.json({ status: "success", data: JobDetails });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed to apply for this job ${error.message}`,
    });
  }
});

// Find Job By Search

JobRouter.get("/find", UserAuthentication, async (req, res) => {
  const { search } = req.query;
  const regex = new RegExp(search, "i");
  try {
    const results = await JobModel.aggregate([
      {
        $match: {
          $or: [
            { education: { $regex: regex } },
            { salary: { $regex: regex } },
            { description: { $regex: regex } },
            { role: { $regex: regex } },
            { experience: { $regex: regex } },
            { "address.location": { $regex: regex } },
            { "address.state": { $regex: regex } },
            { "address.city": { $regex: regex } },
          ],
          endtime: { $gte: currentDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
    ]);
    if (results.length === 0) {
      return res.json({
        status: "error",
        message: "No matching records found",
      });
    }

    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed to Fetch Job Detail's ${error.message}`,
    });
  }
});

// Find Job By Search For Admin
JobRouter.get("/find/admin", AdminAuthentication, async (req, res) => {
  const { search } = req.query;
  const regex = new RegExp(search, "i");
  try {
    const results = await JobModel.aggregate([
      {
        $match: {
          $or: [
            { education: { $regex: regex } },
            { salary: { $regex: regex } },
            { description: { $regex: regex } },
            { role: { $regex: regex } },
            { experience: { $regex: regex } },
            { "address.location": { $regex: regex } },
            { "address.state": { $regex: regex } },
            { "address.city": { $regex: regex } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
    ]);
    if (results.length === 0) {
      return res.json({
        status: "error",
        message: "No matching records found",
      });
    }

    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed to Fetch Job Detail's ${error.message}`,
    });
  }
});

// Find Job By Search For Admin
JobRouter.post("/filter", UserAuthentication, async (req, res) => {
  const { salaryMax, salaryMin, experience, employmentType, category, workType } = req.body;
  const query = {};

  if (category !== '') {
    query.category = category;
  }

  if (salaryMin !== 0 && salaryMax !== 0) {
    query.salary = { $gte: salaryMin, $lte: salaryMax };
  } else if (salaryMin !== 0) {
    query.salary = { $gte: salaryMin };
  } else if (salaryMax !== 0) {
    query.salary = { $lte: salaryMax };
  }

  if (experience !== 0) {
    query.experience = { $gte: experience };
  }

  if (employmentType !== '') {
    query.employmentType = employmentType;
  }

  if (workType !== '') {
    query.workType = workType;
  }

  try {
    const jobs = await JobModel.find(query);
    if (jobs.length === 0) {
      return res.json({ status: 'error', message: 'No Job Found ' })

    } else {
      return res.json({ status: 'success', data: jobs })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Filter Jobs ${error.message}` })
  }

});

// Find Recommended Jobs 
JobRouter.get("/recommended", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userExists = await UserModel.find({ _id: decoded._id });
    if (userExists.length===0) {
      return res.json({status:'error',message:'User Detail No Foun '})
    }
    const jobs = await JobModel.find(query);
    if (jobs.length === 0) {
      return res.json({ status: 'error', message: 'No Job Found ' })

    } else {
      return res.json({ status: 'success', data: jobs })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Filter Jobs ${error.message}` })
  }

});
module.exports = { JobRouter };
