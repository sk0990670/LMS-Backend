import { Router } from "express";
import { get } from "mongoose";
import { addLectureToCourseById, createCourse, getAllCourses, getLectureByCourseId, removeCourse, removeLectureFromCourse, updateCourse } from "../controllers/course.controller.js";
import { authorizeRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
import Upload from "../middlewares/multer.middleware.js";

const router = Router();

// Define your course routes here
// router.get('/', getAllCourses);
router.route('/')
    .get(getAllCourses)
    .post(
        isLoggedIn,
        authorizeRoles('ADMIN'),
        Upload.single('thumbnail'),
        createCourse
    );

router.route('/:id')
    .get(isLoggedIn, getLectureByCourseId)
    .put(
        isLoggedIn,
        authorizeRoles('ADMIN'),
        updateCourse
    )
    .delete(
        isLoggedIn,
        authorizeRoles('ADMIN'),
        removeCourse
    )
    .post(
        isLoggedIn,
        authorizeRoles('ADMIN'),
        Upload.single('lecture'),
        addLectureToCourseById
    );

    // Lecture delete route ✅
    router.delete(
        '/:courseId/lectures/:lectureId',
        isLoggedIn,
        authorizeRoles('ADMIN'),
        removeLectureFromCourse
    );



export default router;