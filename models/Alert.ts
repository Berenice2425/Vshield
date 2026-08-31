import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  vehicle_id: mongoose.Types.ObjectId;
  type: string;
  severity: string;
  message: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema: Schema = new Schema({
  vehicle_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: [
      'Unauthorized Movement', 
      'Geofence Breach', 
      'Vehicle Tampering', 
      'Immobilization', 
      'Biometric Failure', 
      'Threat Detected', 
      'Other'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  message: { 
    type: String, 
    required: true, 
    trim: true 
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Acknowledged', 'Resolved'],
    default: 'Active'
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  timestamp: { 
    type: Date, 
    required: true, 
    default: Date.now 
  }
}, { timestamps: true });

AlertSchema.index({ vehicle_id: 1 });
AlertSchema.index({ status: 1 });
AlertSchema.index({ severity: 1 });
AlertSchema.index({ timestamp: -1 });

const Alert = (mongoose.models.Alert as mongoose.Model<IAlert>) || mongoose.model<IAlert>('Alert', AlertSchema);
export default Alert;
