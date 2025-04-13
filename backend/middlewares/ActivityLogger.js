import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (req, action, entityType = null, entityId = null, details = {}) => {
  try {
    await ActivityLog.create({
      userId: req.user.id,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const activityLogger = (action, entityType = null) => {
  return async (req, res, next) => {
    try {
      const logData = {
        userId: req.user?.id || null,
        action,
        entityType,
        entityId: req.params.id || req.body._id || null,
        details: req.body,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      };

      await ActivityLog.create(logData);
      next();
    } catch (error) {
      console.error('Activity logging failed:', error);
      next(); 
    }
  };
};