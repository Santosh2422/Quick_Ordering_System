import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {Restaurant} from './restaurants.model.js'

const qrTableSchema = new mongoose.Schema({
  // Link to the Restaurant
  restaurantId: {
    type: String,
    required: true,
    index: true // Crucial for scalability
  },
  
  // What the customer scans (e.g., "T-A1") - shorter than a full ObjectID
  tableShortId: {
    type: String,
    unique: true,
    default: () => uuidv4().split('-')[0] // Generates a unique 8-char string
  },

  // What the cashier sees (e.g., "Balcony - Table 4")
  tableName: {
    type: String,
    required: true,
    trim: true
  }
});

qrTableSchema.virtual('restaurant_details', {
  ref: 'Restaurant',           // The model to join with
  localField: 'restaurantId',   // Find people where `localField`
  foreignField: 'uid',      // is equal to `foreignField`
  justOne: true             // Set to true if you expect only 1 match
});

//to enable json output
qrTableSchema.set('toObject', { virtuals: true });
qrTableSchema.set('toJSON', { virtuals: true });

// Compound Index: Quickly find a specific table within a specific restaurant
qrTableSchema.index({ restaurantId: 1, tableShortId: 1 });

const qrTable = mongoose.model('QRTable', qrTableSchema, 'qr_codes');
export default qrTable;