

const currentDate = new Date();
const dateObj = new Date(currentDate.setDate(currentDate.getDate() + 30));
// Creating Date
const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();
const endDate = year + "-" + month + "-" + day;


JobRouter.get("/listall/active", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    try {
        const dateObj = new Date();
        // Creating Date
        const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
        const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
        const year = dateObj.getUTCFullYear();
        const currentDate = year + "-" + month + "-" + day;

        //const activeJobs = await JobModel.aggregate([{ $match: { endtime: { $gte: currentDate } } }])
        const activeJobs = await JobModel.aggregate([{ $match: { createdBy: new mongoose.Types.ObjectId(decoded._id) } }, { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'ProfessionalDetails' } }])

        if (activeJobs.lenght > 0) {
            res.json({ status: "success", data: activeJobs })
        } else {
            res.json({ status: "error", message: `No Job Post Found !!` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Job List ${error.message}` })
    }
})


// New Google Login

{
    "user": {
      "status": "pending",
      "name": "Uttam kumar Shaw (UTTAM)",
      "email": "uttamkr5599@gmail.com"
    },
    "success": true
  }

// Basic Detail Filled Up User Login

{
    "user": {
      "status": "success",
      "message": "Login Successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzdiYjVjYzc2ZGMwMzM2NDZkYzllM2UiLCJuYW1lIjoiVXR0YW0gS3VtYXIgU2hhdyIsImVtYWlsIjoidXR0YW1rcjU1OTlAZ21haWwuY29tIiwiYWNjb3VudFR5cGUiOiJhcnRpc3QiLCJwcm9maWxlIjoiaHR0cHM6Ly9kcGpiYWNrZW5kLnMzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS8xNzM4MzIyMjI2NzI4IiwidmVyaWZpZWQiOnRydWUsInN1YnNjcmlwdGlvbiI6IjY3OGRkY2Q2NzI4MTFlYjc2MzAzZTMyMSIsInBsYW5FeHBpcmVBdCI6IjIwMjUtMDgtMjUiLCJleHAiOjE3NDEyODQxNTEsImlhdCI6MTczODY5MjE1MX0._F2SMYi9Tnt4pq-5M0-bbueVI7x3PnOqcbECLb3-GTE",
      "type": "artist"
    },
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzdiYjVjYzc2ZGMwMzM2NDZkYzllM2UiLCJuYW1lIjoiVXR0YW0gS3VtYXIgU2hhdyIsImVtYWlsIjoidXR0YW1rcjU1OTlAZ21haWwuY29tIiwiYWNjb3VudFR5cGUiOiJhcnRpc3QiLCJwcm9maWxlIjoiaHR0cHM6Ly9kcGpiYWNrZW5kLnMzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS8xNzM4MzIyMjI2NzI4IiwidmVyaWZpZWQiOnRydWUsInN1YnNjcmlwdGlvbiI6IjY3OGRkY2Q2NzI4MTFlYjc2MzAzZTMyMSIsInBsYW5FeHBpcmVBdCI6IjIwMjUtMDgtMjUiLCJleHAiOjE3NDEyODQxNTEsImlhdCI6MTczODY5MjE1MX0._F2SMYi9Tnt4pq-5M0-bbueVI7x3PnOqcbECLb3-GTE"
  }

  // Basic Detail Missed Up User Login
