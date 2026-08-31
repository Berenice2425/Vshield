import mongoose, { Schema, Document } from 'mongoose';

export interface IBiometricLog extends Document {
  vehicle_id: mongoose.Types.ObjectId;
  result: string;
  confidence: number;
  device_id: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BiometricLogSchema: Schema = new Schema({
  vehicle_id: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  result: { type: String, required: true, enum: ['Success', 'Failure'] },
  confidence: { type: Number, required: true },
  device_id: { type: String, required: true, default: 'EDGE-UNKNOWN' },
  timestamp: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

BiometricLogSchema.index({ vehicle_id: 1 });
BiometricLogSchema.index({ timestamp: -1 });
BiometricLogSchema.index({ result: 1 });

const BiometricLog = (mongoose.models.BiometricLog as mongoose.Model<IBiometricLog>) || mongoose.model<IBiometricLog>('BiometricLog', BiometricLogSchema);
export default BiometricLog;
