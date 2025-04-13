import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role');
    
    console.log('Sample log:', JSON.stringify(logs[0])); // Debug output
    
    res.status(200).json({ 
      success: true, 
      data: logs.map(log => ({
        ...log._doc,
        timestamp: log.timestamp.toISOString(),
        logoutTime: log.logoutTime?.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
};

export const getUserActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.params.userId })
      .sort({ timestamp: -1 });
      
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user activity logs' });
  }
};