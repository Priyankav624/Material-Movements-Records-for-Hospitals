import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 'LOGOUT'] 
  },
  entityType: { 
    type: String,
    enum: ['User', 'Material', 'MaterialRequest', null] 
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String, required: true },
  sessionDuration: { type: Number }, 
}, { timestamps: true });

activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;