import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    //create the instance of schema and define configuration over here

    fullName: {
        type: String,
        required: [true, 'Name is required'],
        minLength: [5, 'Name must be at least 5 characters long'],
        maxLength: [50, 'Name must be at most 50 characters long'],
        lowercase: true,
        trim: true,
    },

    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
            match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters long'],
        select: false, // Exclude password field by default when querying
    },

    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        secure_url: {
            type: String,
            required: true,
        },
    },

    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER',
    },

    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,

}, {
    timestamps: true 
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


userSchema.methods = {
    generateJWTToken: async function() {
        return await jwt.sign(
            { id: this._id, email: this.email, subscription: this.subscription }, 
            process.env.JWT_SECRET, 
            {
                expiresIn: process.env.JWT_EXPIRE,
        });
    },
    comparePassword: async function(plainTextPassword) {
        return await bcrypt.compare(plainTextPassword, this.password);
    },
}

const User = model("User", userSchema);


export default User;