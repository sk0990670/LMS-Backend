import AppError from '../utils/error.util.js';
import User from '../models/user.model.js';
import cloudinary from 'cloudinary';
import fs from 'fs';

const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError('All fields are required', 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists with this email', 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
    },
  });

  // If user not created send message response
  if (!user) {
    return next(
      new AppError('User registration failed, please try again later', 400)
    );
  }

  console.log('File details', JSON.stringify(req.file));
  // Run only if user sends a file
  if (req.file) {
    console.log(req.file); //for check file details in console
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms', // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: 'fill',
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || 'File not uploaded, please try again', 400)
      );
    }
  }

  // Save the user object
  await user.save();

  user.password = undefined; // Don't send password back to client

  const token = await user.generateJWTToken();

  res.cookie('token', token, cookieOptions);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * LOGOUT
 * Clears the cookie containing the JWT token.
 */
const logout = (req, res) => {
  res.cookie('token', null, {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

/**
 * GET PROFILE
 * Returns the details of the currently logged-in user.
 * Note: This assumes you have an authentication middleware (like `isLoggedIn`)
 * that decodes the token and attaches `req.user`.
 */
const getProfile = async (req, res, next) => {
  try {
    // If your auth middleware sets req.user.id, fetch the full details:
    // const user = await User.findById(req.user.id);
    
    // If your auth middleware already attaches the full user object:
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'User details',
      user,
    });
  } catch (error) {
    return next(new AppError('Failed to fetch profile details', 500));
  }
};

export { register, login, logout, getProfile };