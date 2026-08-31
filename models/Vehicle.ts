import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleDocument {
  blobId: string;
  fileName: string;
  category: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

export interface IVehicle extends Document {
  name: string;
  plate_number: string;
  status: string;
  user_id: mongoose.Types.ObjectId;
  documents: IVehicleDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  plate_number: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Armed', 'Driving', 'Immobilized', 'Parked', 'Maintenance'] 
  },
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  documents: [{
    blobId: String,
    fileName: String,
    category: String,
    contentType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    url: String
  }]
}, { timestamps: true });

VehicleSchema.index({ user_id: 1 });
VehicleSchema.index({ status: 1 });

const Vehicle = (mongoose.models.Vehicle as mongoose.Model<IVehicle>) || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;
