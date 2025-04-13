import mongoose from 'mongoose';

// models/ActivityLog.js
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 'LOGOUT', 'CREATE_USER', 'CREATE_MATERIAL', 'UPDATE_MATERIAL', 
           'CREATE_REQUEST', 'APPROVE_REQUEST', 'REJECT_REQUEST'] // Add all possible actions
  },
  entityType: { 
    type: String,
    enum: ['User', 'Material', 'MaterialRequest', null] // All possible entities
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { 
    type: mongoose.Schema.Types.Mixed, // More flexible than Object
    required: function() {
      return !['LOGIN', 'LOGOUT'].includes(this.action);
    } 
  },
  ipAddress: { type: String, required: true },
  sessionDuration: { type: Number }, 
}, { timestamps: true });

activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;