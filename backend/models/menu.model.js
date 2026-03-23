import mongoose from "mongoose";
import { Schema } from "mongoose";

// 1. Dish Schema (Same as before)
const menuItemSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: { type: String },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  mostLoved: { type: Boolean, default: false},
  isDeleted: { type: Boolean, default: false }
});

// 2. Category Schema (Same as before)
const categorySchema = new Schema({
  name: { type: String, required: true },
  items: [menuItemSchema],
  isDeleted: { type: Boolean, default: false }
});

// 3. Main Menu Schema (UPDATED)
const menuSchema = new Schema({
  // CHANGE 1: This is now a String, matching your Restaurant UID
  restaurantId: {
    type: String,
    required: true,
    unique: true, // 1 Restaurant UID = 1 Menu
    index: true   // for faster performance
  },

  categories: [categorySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Enable virtuals when converting to JSON
  toObject: { virtuals: true }
});

// This tells Mongoose: "If I ask for 'restaurantDetails', go find the Restaurant where 'uid' matches my 'restaurantId'"
// this is more like joining two collections
menuSchema.virtual('restaurantDetails', {
  ref: 'Restaurant',      // The model to use
  localField: 'restaurantId', // Find people who match this field in Menu
  foreignField: 'uid',    // Match it against this field in Restaurant
  justOne: true           // There is only one restaurant per menu
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;




