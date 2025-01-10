

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

        console.log("All Job List", activeJobs)

        console.log("All Job List type ", typeof (activeJobs));

        console.log("All Job List Length", activeJobs.lenght);


        if (activeJobs.lenght > 0) {
            res.json({ status: "success", data: activeJobs })
        } else {
            res.json({ status: "error", message: `No Job Post Found !!` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Job List ${error.message}` })
    }
})
