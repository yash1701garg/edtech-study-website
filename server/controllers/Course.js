const Course = require("../models/Course");
const Category = require('../models/Category');
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//createCourse handler function
exports.createCourse = async (req, res) => {
    try {
        //ferch data
        const { courseName, courseDescription, whatYouWillLearn, price, tag } = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details: ", instructorDetails);
        //TODO: Verify that userId and instructorDetails._id are same or different ?

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details not found',

            });
        }

        //check given tag is valid or not
        const categoryDetails = await Category.findById(tag);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: 'Tag Details not found',
            });
        }

        //Upload Image top Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatWillYouLearn: whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
        })

        //add the new course to the user schema of Instructor
        await User.findByIdAndUpdate(
            { _id: instructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            { new: true },
        );

        //update the TAG ka schema
        //TODO:HW
        const updatedCategory = await Category.findByIdAndUpdate(
            {_id:tag},
            {
                $push:{
                    course:newCourse._id,
                }
            },
            {new:true},
        );
        console.log("Updated Tags are ",updatedCategory);

        //return response
        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Course',
            error: error.message,
        })
    }
};

//getAllCourses handler function

exports.showAllCourses = async (req, res) => {
    try {
        //TODO: Change the below statement invrementally
        const allCourses = await Course.find({});

            return res.status(200).json({
                success:true,
                mesage:'Data for all courses fetched successfully',
                data:allCourses,
            })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot Fetch course data',
            error: error.message,
        })
    }
}

//get all details from a course
exports.getCourseDetails = async (req,res) => {
    try {
        const {courseId} = req.body;
        //find the course details
        const courseDetails = await Course.find({_id:courseId}).populate({path:"instructor",
            populate:{path:"additionalDetails"}
        }).populate("category").populate("ratingAndReview").populate({
            path:"courseContent",
            populate:{path:"subSection"}
        }).exec();
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find course with id: ${courseId}`,
            })
        }
        return res.status(200).json({
            success:true,
            message:"Course fetched successfully now",
            data:courseDetails,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot Fetch course data',
            error: error.message,
        })
    }
    
}