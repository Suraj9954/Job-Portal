import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import {User} from "../models/user.model.js"
import sendEmail from '../utils/email.js';


export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });


        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId).populate('company');
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();

        const user = await User.findById(userId);
        const company = job.company;
        if (user && user.email) {
            await sendEmail(
                user.email,
                `Application Received for ${job.title}`,
                `<p>Thank you for applying to <strong>${job.title}</strong> at <strong>${company.name}</strong>.Our team will review your application and get back to you soon.</p>`
            );
        }

        return res.status(201).json({
            message: "Job applied successfully. Confirmation email sent.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            match: { status: "pending" }, 
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;


    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
        success: false
      });
    }

    // find and populate the applicant
const application = await Application.findById(applicationId)
  .populate({
    path: 'job',
    populate: {
      path: 'company'
    }
  })
  .populate('applicant');

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
        success: false
      });
    }
   const company = application.job.company;
    // update the status
    application.status = status.toLowerCase();
    await application.save();

    const userEmail = application.applicant.email;

    if (status.toLowerCase() === "accepted") {
      await sendEmail(
        userEmail,
        "Your Job Application Has Been Accepted",
        `Congratulations! Your application for the position of ${application.job.title} has been accepted at <strong>${company.name}</strong>. We’ll be in touch with further details soon.`
      );
    } else if (status.toLowerCase() === "rejected") {
      await sendEmail(
        userEmail,
        "Update on Your Job Application",
        `Thank you for applying. After careful consideration, we regret to inform you that you have not been selected for this position. We truly appreciate your interest and encourage you to apply at <strong>${company.name}</strong> for any future position`
      );
    }

    return res.status(200).json({
      message: "Status updated successfully.",
      success: true
    });

    } catch (error) {
        console.log(error);
    }
}