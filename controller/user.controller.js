import AppError from '../utils/AppError.js';
import User from '../models/user.model.js';

const cookieOptions = {
  secure: process.env.NODE_ENV === 'production' ? true : false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
};


const register = async(req, res, next) => {
  // Registration logic here
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
      secure_url:
        'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
    },
  });

  if (!user) {
    return next(new AppError('Failed to create user', 500));
  }

  //TODO: File upload 

  await user.save();

  user.password = undefined; // Hide password in response

  const token = await user.generateJWTToken();

  res.cookie('token', token, cookieOptions);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
  })

}

const login = async (req, res, next) => {
  // Login logic here
  try {
      const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const user = await User.findOne({
      email
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = await user.generateJWTToken();
    user.password = undefined; // Hide password in response

    res.cookie('token', token, cookieOptions);
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user,
    });
  }
  catch (error) {
    return next(new AppError(error.message, 500));
  }

};


const logout = (req, res) => {
  // Logout logic here

}

const getProfile = (req, res) => {
  // Get user profile logic here

}

//export all the methods
export { register, login, logout, getProfile };