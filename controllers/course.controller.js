import Course from '../models/course.model.js';
import AppError from '../utils/error.util.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';

const getAllCourses = asyncHandler(async (req, res, next) => {
  // Implementation for fetching all courses

  // Find all the courses without lectures
  const courses = await Course.find({}).select('-lectures');

  res.status(200).json({
    success: true,
    message: 'All courses',
    courses,
  });
});

const getLectureByCourseId = asyncHandler(async (req, res, next) => {
  // Implementation for fetching lectures by course ID

  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError('Invalid course id or course not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Course lectures fetched successfully',
    lectures: course.lectures,
  });
});

const createCourse = asyncHandler(async (req, res, next) => {
  // Implementation for creating a new course

  try {
    // Extracting required fields from req.body
    const { title, description, category, createdBy } = req.body;

    // Check if all required fields are provided
    if (!title || !description || !category || !createdBy) {
      return next(new AppError('All fields are required', 400));
    }

    // Creating a new course instance (not saving yet)
    const course = new Course({
      title,
      description,
      category,
      createdBy,
    });

    // Run only if user sends a file
    if (req.file) {
      try {
        // Uploading thumbnail to Cloudinary
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files inside lms folder
        });

        // If upload is successful
        if (result) {
          // Initialize and assign thumbnail object safely
          course.thumbnail = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }

        // After successful upload remove file from local storage
        // ✅ SAFE FILE DELETE (Node 22 compatible)
        await fs.promises.rm(req.file.path, { force: true });
      } catch (error) {
        // If Cloudinary upload fails, delete uploaded local file (if exists)
        if (req.file?.path) {
          await fs.promises.rm(req.file.path, { force: true });
        }

        // Send error response
        return next(
          new AppError('Thumbnail upload failed, please try again', 400)
        );
      }
    }

    // Save course to database
    await course.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    // Handle unexpected server/database errors
    return next(new AppError(error.message, 500));
  }
});


const updateCourse = asyncHandler(async (req, res, next) => {
  // Controller for updating an existing course

  try {
    // Extracting course id from request params
    const { id } = req.params;

    // Whitelisting allowed fields to update
    const allowedFields = ['title', 'description', 'category'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updateData[field] = req.body[field];
      }
    });

    // Finding the course first (needed for thumbnail update)
    const course = await Course.findById(id);

    // If no course found
    if (!course) {
      return next(new AppError('Invalid course id or course not found.', 400));
    }

    // Run only if user sends a new thumbnail
    if (req.file) {
      // Delete old thumbnail from Cloudinary (if exists)
      if (course.thumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
      }

      // Upload new thumbnail
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms',
      });

      // Update thumbnail fields
      course.thumbnail = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };

      // Remove local file
      await fs.promises.rm(req.file.path, { force: true });
    }

    // Update allowed fields
    Object.assign(course, updateData);

    // Save updated course
    await course.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});


const removeCourse = asyncHandler(async (req, res, next) => {
  // Controller for removing a course

  try {
    // Extracting id from the request parameters
    const { id } = req.params;

    // Finding the course via the course ID
    const course = await Course.findById(id);

    // If course not found, send error response
    if (!course) {
      return next(new AppError('Course with given id does not exist.', 404));
    }

    // If course has a thumbnail, delete it from Cloudinary
    if (course.thumbnail?.public_id) {
      await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
    }

    // Delete course from database
    await course.deleteOne();

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    // Handle unexpected errors
    return next(new AppError(error.message, 500));
  }
});


const addLectureToCourseById = asyncHandler(async (req, res, next) => {
  // Controller for adding a lecture to a course by ID

  try {
    // Extracting title and description from request body
    const { title, description } = req.body;

    // Extracting course id from request params
    const { id } = req.params;

    // Check if required fields are provided
    if (!title || !description) {
      return next(new AppError('Title and Description are required', 400));
    }

    // Finding the course using the course id
    const course = await Course.findById(id);

    // If course not found
    if (!course) {
      return next(new AppError('Invalid course id or course not found.', 400));
    }

    let lectureData = {};

    // Run only if user sends a video file
    if (req.file) {
      try {
        // Uploading video to Cloudinary
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms',
          resource_type: 'video',
          chunk_size: 50000000, // 50MB
        });

        // If upload successful
        lectureData = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };

        // Remove uploaded file from local storage
        await fs.promises.rm(req.file.path, { force: true });
      } catch (error) {
        // Delete local file if upload fails
        if (req.file?.path) {
          await fs.promises.rm(req.file.path, { force: true });
        }

        return next(
          new AppError('Lecture video upload failed, please try again', 400)
        );
      }
    } else {
      // If no video file sent
      return next(new AppError('Lecture video is required', 400));
    }

    // Pushing lecture into course lectures array
    course.lectures.push({
      title,
      description,
      lecture: lectureData,
    });

    // Updating number of lectures
    course.numberOfLectures = course.lectures.length;

    // Saving course object
    await course.save();

    // Sending success response
    res.status(200).json({
      success: true,
      message: 'Course lecture added successfully',
      course,
    });
  } catch (error) {
    // Handle unexpected errors
    return next(new AppError(error.message, 500));
  }
});

const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
  // Controller for removing a lecture from a course

  try {
    // ✅ Correct param names
    const { courseId, lectureId } = req.params;

    // Find the course using courseId
    const course = await Course.findById(courseId);

    // If course not found
    if (!course) {
      return next(new AppError('Course with given id does not exist.', 404));
    }

    // Find lecture index
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId
    );

    // If lecture not found
    if (lectureIndex === -1) {
      return next(new AppError('Lecture not found.', 404));
    }

    // Delete lecture video from Cloudinary
    const lecture = course.lectures[lectureIndex];

    if (lecture.lecture?.public_id) {
      await cloudinary.v2.uploader.destroy(
        lecture.lecture.public_id,
        { resource_type: 'video' }
      );
    }

    // Remove lecture from array
    course.lectures.splice(lectureIndex, 1);

    // Update number of lectures
    course.numberOfLectures = course.lectures.length;

    // Save course
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully',
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});



export { 
  getAllCourses, 
  getLectureByCourseId, 
  createCourse, 
  updateCourse, 
  removeCourse , 
  addLectureToCourseById,
  removeLectureFromCourse
};