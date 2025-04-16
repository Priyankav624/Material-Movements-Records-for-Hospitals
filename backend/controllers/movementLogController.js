import Material from "../models/material.js";
import MovementLog from "../models/movementLog.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

export const returnMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { movementId, condition, notes } = req.body;

    // Find the original issuance
    const originalIssuance = await MovementLog.findById(movementId)
      .populate('materialId')
      .session(session);
    
    if (!originalIssuance || originalIssuance.action !== 'Issued') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid movement record for return"
      });
    }

    // Update material quantity
    const materialUpdate = {
      $inc: { quantity: originalIssuance.quantity },
      $set: { status: condition === 'Damaged' ? 'Damaged' : 'Available' }
    };

    // Handle batch tracking if applicable
    if (originalIssuance.batchNumber && originalIssuance.materialId.batches) {
      const batchIndex = originalIssuance.materialId.batches.findIndex(
        b => b.batchNumber === originalIssuance.batchNumber
      );
      
      if (batchIndex >= 0) {
        materialUpdate.$inc[`batches.${batchIndex}.quantity`] = originalIssuance.quantity;
        materialUpdate.$set[`batches.${batchIndex}.status`] = 'available';
      }
    }

    await Material.findByIdAndUpdate(
      originalIssuance.materialId._id,
      materialUpdate,
      { session, new: true }
    );

    // Create return log
    const returnLog = new MovementLog({
      materialId: originalIssuance.materialId._id,
      quantity: originalIssuance.quantity,
      action: 'Returned',
      from: originalIssuance.to,
      to: 'Inventory',
      purpose: notes || 'Material returned',
      performedBy: req.user.id,
      assignedTo: originalIssuance.assignedTo,
      condition,
      relatedMovement: originalIssuance._id,
      batchNumber: originalIssuance.batchNumber
    });

    await returnLog.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Material returned successfully",
      returnLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error returning material:", error);
    res.status(500).json({
      success: false,
      message: "Failed to return material",
      error: error.message
    });
  }
};

export const getMovementStats = async (req, res) => {
  try {
    const stats = await MovementLog.aggregate([
      {
        $match: {
          action: { $in: ['Issued', 'Returned', 'Disposed'] }
        }
      },
      {
        $group: {
          _id: "$action",
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          action: "$_id",
          totalQuantity: 1,
          _id: 0
        }
      }
    ]);

    // Convert array to object for easier access
    const result = {
      totalIssued: stats.find(s => s.action === 'Issued')?.totalQuantity || 0,
      totalReturned: stats.find(s => s.action === 'Returned')?.totalQuantity || 0,
      totalDisposed: stats.find(s => s.action === 'Disposed')?.totalQuantity || 0
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movement stats",
      error: error.message
    });
  }
};

export const getMovementLogs = async (req, res) => {
  try {
    const { 
      action, 
      materialId, 
      department, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filters = {};
    
    if (action) filters.action = action;
    if (materialId) filters.materialId = materialId;
    if (department) {
      filters.$or = [
        { from: department },
        { to: department }
      ];
    }
    
    // Date range filter
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    const total = await MovementLog.countDocuments(filters);
    const logs = await MovementLog.find(filters)
      .populate('materialId', 'name serialNumber batches')
      .populate('performedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      logs,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching movement logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch movement logs",
      error: error.message
    });
  }
};

export const generateMovementReport = async (req, res) => {
  try {
    const { startDate, endDate, department, action } = req.query;
    
    const filters = {};
    if (startDate && endDate) {
      filters.timestamp = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (department) filters.$or = [{ from: department }, { to: department }];
    if (action) filters.action = action;

    const logs = await MovementLog.find(filters)
      .populate('materialId', 'name')
      .populate('performedBy', 'name')
      .sort({ timestamp: -1 });

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data available for the selected filters"
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=movement-report.pdf');
    
    // Pipe directly to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Material Movement Report', { align: 'center' });
    doc.moveDown(0.5);
    
    // Add report details
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    
    // Add filter information
    if (startDate || endDate || department || action) {
      doc.fontSize(12).text('Filters Applied:', { underline: true });
      doc.moveDown(0.5);
      
      if (startDate && endDate) {
        doc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`);
      }
      if (department) doc.text(`Department: ${department}`);
      if (action) doc.text(`Action: ${action}`);
      doc.moveDown();
    }

    // Add summary statistics
    const stats = {
      issued: logs.filter(l => l.action === 'Issued').reduce((sum, l) => sum + l.quantity, 0),
      returned: logs.filter(l => l.action === 'Returned').reduce((sum, l) => sum + l.quantity, 0),
      disposed: logs.filter(l => l.action === 'Disposed').reduce((sum, l) => sum + l.quantity, 0)
    };

    doc.fontSize(12).text('Summary Statistics:', { underline: true });
    doc.moveDown(0.5);
    doc.text(`Total Issued: ${stats.issued}`);
    doc.text(`Total Returned: ${stats.returned}`);
    doc.text(`Total Disposed: ${stats.disposed}`);
    doc.moveDown();

    // Add table header
    doc.fontSize(12).text('Movement Details:', { underline: true });
    doc.moveDown(0.5);
    
    const tableHeaders = ['Date', 'Material', 'Action', 'From/To', 'Qty', 'Performed By'];
    const columnWidths = [80, 120, 80, 120, 50, 100];
    let y = doc.y;
    
    // Draw table header
    doc.font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: columnWidths[i],
        align: 'left'
      });
    });
    doc.font('Helvetica');
    y += 20;
    
    // Draw table rows
    logs.forEach(log => {
      if (y > 700) { // Add new page if we're at the bottom
        doc.addPage();
        y = 50;
      }
      
      const row = [
        dayjs(log.timestamp).format('DD/MM/YYYY'),
        log.materialId?.name || 'N/A',
        log.action,
        `${log.from} → ${log.to || 'N/A'}`,
        log.quantity.toString(),
        log.performedBy?.name || 'System'
      ];
      
      row.forEach((cell, i) => {
        doc.text(cell, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: columnWidths[i],
          align: 'left'
        });
      });
      
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate report",
      error: error.message 
    });
  }
};

// Other controller functions (issueMaterial, disposeMaterial, getExpiredItems) remain the same as in your original code


// Enhanced issue material function with batch tracking
export const issueMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, department, purpose, assignedTo, batchNumber } = req.body;
    
    // Validate input
    if (!materialId || !quantity || !department || !purpose) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Get material with batches
    const material = await Material.findById(materialId)
      .session(session);

    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    // Check if material is available
    if (material.status === 'Expired' || material.status === 'Damaged' || material.status === 'Disposed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Material is ${material.status.toLowerCase()} and cannot be issued` 
      });
    }

    // Handle batch tracking if material has batches
    if (material.batches && material.batches.length > 0) {
      if (!batchNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Batch number is required for this material" 
        });
      }

      const batch = material.batches.find(b => b.batchNumber === batchNumber);
      if (!batch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Batch not found" 
        });
      }

      if (batch.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity in batch. Only ${batch.quantity} available` 
        });
      }

      // Update batch quantity
      batch.quantity -= quantity;
      if (batch.quantity === 0) {
        batch.status = 'depleted';
      }
    } else {
      // Regular quantity tracking
      if (material.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Only ${material.quantity} available` 
        });
      }
      material.quantity -= quantity;
    }

    // Update material status if needed
    if (material.minStockLevel && material.totalQuantity <= material.minStockLevel) {
      material.status = 'Low Stock';
    }

    // Create movement log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Issued',
      from: 'Inventory',
      to: department,
      purpose,
      performedBy: req.user.id,
      assignedTo,
      batchNumber: material.batches?.length > 0 ? batchNumber : undefined,
      notes: `Issued to ${department} for ${purpose}`
    });

    await Promise.all([
      material.save({ session }),
      movementLog.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      success: true, 
      message: "Material issued successfully",
      movementLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error issuing material:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to issue material",
      error: error.message 
    });
  }
};

// Disposal function for waste management
export const disposeMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, reason, disposalMethod, batchNumber } = req.body;
    
    // Validate input
    if (!materialId || !quantity || !reason || !disposalMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const material = await Material.findById(materialId).session(session);
    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    // Handle batch tracking if material has batches
    if (material.batches && material.batches.length > 0) {
      if (!batchNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Batch number is required for this material" 
        });
      }

      const batch = material.batches.find(b => b.batchNumber === batchNumber);
      if (!batch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Batch not found" 
        });
      }

      if (batch.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity in batch. Only ${batch.quantity} available` 
        });
      }

      // Update batch quantity
      batch.quantity -= quantity;
      if (batch.quantity === 0) {
        batch.status = 'depleted';
      }
    } else {
      // Regular quantity tracking
      if (material.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Only ${material.quantity} available` 
        });
      }
      material.quantity -= quantity;
    }

    // Update material status
    material.status = 'Disposed';

    // Create disposal log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Disposed',
      from: 'Inventory',
      purpose: reason,
      disposalMethod,
      performedBy: req.user.id,
      batchNumber: material.batches?.length > 0 ? batchNumber : undefined,
      notes: `Disposed due to: ${reason}. Method: ${disposalMethod}`
    });

    await Promise.all([
      material.save({ session }),
      movementLog.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      success: true, 
      message: "Material disposal recorded successfully",
      movementLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error disposing material:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to record disposal",
      error: error.message 
    });
  }
};

// Get expired items
export const getExpiredItems = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Find materials with expired batches
    const expiredMaterials = await Material.aggregate([
      { $unwind: "$batches" },
      { 
        $match: { 
          "batches.expiryDate": { $lte: currentDate },
          "batches.status": { $ne: "depleted" }
        } 
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          category: { $first: "$category" },
          totalExpired: { $sum: "$batches.quantity" },
          batches: { 
            $push: {
              batchNumber: "$batches.batchNumber",
              quantity: "$batches.quantity",
              expiryDate: "$batches.expiryDate"
            }
          }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      expiredMaterials 
    });
  } catch (error) {
    console.error("Error fetching expired items:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch expired items",
      error: error.message 
    });
  }
};