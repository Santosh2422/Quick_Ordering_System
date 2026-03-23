import mongoose from 'mongoose'
import { Schema } from 'mongoose'
import Menu from './menu.model.js'


const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Automatically creates a unique index
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    trim: true,
    select: false, // Prevents password from being returned in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'owner', 'admin', 'staff', 'kitchen', 'cashier'],
      message: '{VALUE} is not a supported role'
    },
    default: 'customer'
  },
  restaurantId: {
    type: String, // ⚠️ MUST match the type of 'uid' in Restaurant Schema
    required: false, // You wanted this optional
    index: true      // Important: Makes searching by restaurantId fast
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true }, // ⚡️ Enable virtuals for res.json()
  toObject: { virtuals: true }
});


// 1. Index on email is already handled by unique: true
// 2. Index on restaurantId for faster lookups is handled in the schema definition

// 3. Compound index if you often search for users by role within a specific restaurant
userSchema.index({ restaurantId: 1, role: 1 });

const User = mongoose.model('User', userSchema);

export default User;