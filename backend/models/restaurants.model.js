import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import User from "./user.model.js"

const restaurantSchema = new Schema({
  uid: {
    type: String, // String is safer than Number for IDs (preserves formatting)
    unique: true,
    index: true   // specific index for faster lookup
  },

  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  address: {
    street: { type: String, required: true },
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },

  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }, 
  image: { type: String }
}, {
  timestamps: true
});

// this hook runs before saving
restaurantSchema.pre('save', async function () {
  // 1. If uid already exists, skip this logic
  //this points to this model ie restaurant
  // if uid exists, then dont use it and move further
  if (this.uid) return;

  let isUnique = false;
  let randomId = "";

  // 2. Loop until we find a unique ID (Handling collisions)
  while (!isUnique) {
    // Generate random number between 10000 and 99999
    randomId = Math.floor(10000 + Math.random() * 90000).toString();

    // Check if this ID already exists in the DB
    // 'this.constructor' refers to the Restaurant model itself
    const existingRestaurant = await this.constructor.findOne({ uid: randomId });

    if (!existingRestaurant) {
      isUnique = true; // Found a free spot!
    }
  }

  // 3. Assign the unique ID
  this.uid = randomId;
});

// --- INDICES ---
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ 'address.zipCode': 1 });
// restaurantSchema.index({ location: '2dsphere' }); // Uncomment when ready

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export { Restaurant };
export default Restaurant;