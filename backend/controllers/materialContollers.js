import Material from "../models/material.js";

export const addMaterial = async (req, res) => {
  try {
    let { name, category, serialNumber, quantity, expiryDate, source, vendorName, vendorContact } = req.body;

    // Basic validation
    name = name?.trim();
    if (!name || !category || !source) {
      return res.status(400).json({
        success: false,
        message: "Name, category and source are required"
      });
    }

    // Quantity validation
    quantity = Number(quantity);
    if (isNaN(quantity) ){
      return res.status(400).json({
        success: false,
        message: "Quantity must be a number"
      });
    }

    // Handle expiry date
    let status = "Available";
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= new Date()) {
        status = "Expired";
      }
    }

    // Generate serial number if not provided
    serialNumber = serialNumber?.trim();
    if (!serialNumber) {
      const lastMaterial = await Material.findOne().sort("-createdAt");
      serialNumber = lastMaterial ? `MAT-${lastMaterial._id}` : "MAT-1";
    }

    // Check for duplicate serial
    const exists = await Material.findOne({ serialNumber });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Material with this serial number already exists"
      });
    }

    // Create material
    const material = new Material({
      name,
      category,
      serialNumber,
      quantity,
      expiryDate: expiryDate || undefined, // Only set if provided
      source,
      vendorDetails: source === "Vendor" ? {
        name: vendorName,
        contact: vendorContact
      } : undefined,
      addedBy: req.user.id,
      status: quantity <= 0 ? "Low Stock" : status
    });

    await material.save();

    res.status(201).json({
      success: true,
      message: "Material added successfully",
      material
    });
  } catch (error) {
    console.error("Error adding material:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add material",
      error: error.message
    });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material || material.status === "Deleted") {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    // Update fields
    if (req.body.name) material.name = req.body.name.trim();
    if (req.body.category) material.category = req.body.category;
    if (req.body.source) material.source = req.body.source;
    if (req.body.vendorDetails) material.vendorDetails = req.body.vendorDetails;

    // Quantity update
    if (req.body.quantity !== undefined) {
      if (isNaN(req.body.quantity) || req.body.quantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number"
        });
      }
      material.quantity = req.body.quantity;
    }

    // Status update
    if (req.body.status) {
      material.status = req.body.status;
    } else if (material.status !== "Issued") { // Don't auto-update Issued status
      material.status = material.quantity === 0 ? "Low Stock" :
                       material.quantity < 5 ? "Low Stock" : "Available";
    }

    // Expiry date
    if (req.body.expiryDate) {
      material.expiryDate = req.body.expiryDate;
      if (new Date(req.body.expiryDate) <= new Date()) {
        material.status = "Expired";
      }
    }

    await material.save();

    res.status(200).json({
      success: true,
      message: "Material updated successfully",
      material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update material",
      error: error.message
    });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    if (material.status === "Deleted") {
      return res.status(400).json({
        success: false,
        message: "Material already deleted"
      });
    }

    material.status = "Deleted";
    await material.save();

    res.status(200).json({
      success: true,
      message: "Material deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete material",
      error: error.message
    });
  }
};
// In controllers/materialControllers.js
export const searchMaterials = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const materials = await Material.find(
      { 
        $text: { $search: query },
        status: { $ne: "Deleted" }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(20);

    res.status(200).json({
      success: true,
      materials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search materials",
      error: error.message
    });
  }
};
export const getAllMaterials = async (req, res) => {
  try {
    const { category, source, status, page = 1, limit = 10, search } = req.query;
    const filters = { status: { $ne: "Deleted" } };

    // Apply filters
    if (category && category !== "All") filters.category = category;
    if (source && source !== "All") filters.source = source;
    if (status && status !== "All") filters.status = status;
    
    // Search
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Material.countDocuments(filters);
    const materials = await Material.find(filters)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('addedBy', 'name email');

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      materials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch materials",
      error: error.message
    });
  }
};

export const updateMaterialBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const material = await Material.findById(req.params.id).session(session);
    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    const batchIndex = material.batches.findIndex(b => b._id.toString() === req.params.batchId);
    if (batchIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const batch = material.batches[batchIndex];
    const { quantity, expiryDate, status } = req.body;

    // Update batch fields
    if (quantity !== undefined) batch.quantity = Number(quantity);
    if (expiryDate !== undefined) batch.expiryDate = expiryDate;
    if (status !== undefined) batch.status = status;

    // Update material status
    updateMaterialStatus(material);

    await material.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      material
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: "Failed to update batch",
      error: error.message
    });
  }
};


export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" }
    }).populate('addedBy', 'name email');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    res.status(200).json({
      success: true,
      material: {
        _id: material._id,
        name: material.name,
        category: material.category,
        quantity: material.quantity,
        expiryDate: material.expiryDate,
        source: material.source,
        vendorDetails: material.vendorDetails || {},
        status: material.status,
        addedBy: material.addedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch material",
      error: error.message
    });
  }
};

export const addMaterialBatch = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    const { batchNumber, quantity, expiryDate, manufacturingDate, supplier, purchasePrice } = req.body;

    // Validate batch
    if (!batchNumber || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Batch number and quantity are required"
      });
    }

    // Check for duplicate batch
    if (material.batches.some(b => b.batchNumber === batchNumber)) {
      return res.status(400).json({
        success: false,
        message: "Batch number already exists"
      });
    }

    // Add new batch
    material.batches.push({
      batchNumber,
      quantity: Number(quantity),
      expiryDate: expiryDate || undefined,
      manufacturingDate: manufacturingDate || undefined,
      supplier,
      purchasePrice: purchasePrice || undefined,
      status: 'active'
    });

    // Update material status based on batches
    updateMaterialStatus(material);

    await material.save();

    res.status(201).json({
      success: true,
      message: "Batch added successfully",
      material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add batch",
      error: error.message
    });
  }
};

function updateMaterialStatus(material) {
  const now = new Date();
  
  // Check for expired batches
  const hasExpired = material.batches.some(b => 
    b.expiryDate && new Date(b.expiryDate) <= now
  );
  
  // Check for low stock (sum of all batches)
  const totalQty = material.batches.reduce((sum, b) => sum + b.quantity, 0);
  
  if (hasExpired) {
    material.status = 'Expired';
  } else if (totalQty === 0) {
    material.status = 'Issued';
  } else if (material.minStockLevel && totalQty <= material.minStockLevel) {
    material.status = 'Low Stock';
  } else {
    material.status = 'Available';
  }
}


// Updated disposeMaterial in controllers/materialControllers.js
export const disposeMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, reason, disposalMethod, batchNumber } = req.body;
    
    // Validate input
    if (!materialId || !quantity || quantity <= 0 || !reason || !disposalMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Invalid input data" 
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

    // Check if material can be disposed
    if (material.status === 'Deleted') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Cannot dispose a deleted material" 
      });
    }

    let updatedQuantity = 0;
    
    // Handle batch disposal
    if (batchNumber && material.batches?.length > 0) {
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

      batch.quantity -= quantity;
      updatedQuantity = batch.quantity;
      
      if (batch.quantity === 0) {
        batch.status = 'depleted';
      }
    } 
    // Handle non-batch disposal
    else {
      if (material.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Only ${material.quantity} available` 
        });
      }
      material.quantity -= quantity;
      updatedQuantity = material.quantity;
    }

    // Update material status only if all quantity is disposed
    if (updatedQuantity === 0) {
      material.status = 'Disposed';
    }

    // Create disposal log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Disposed',
      from: 'Inventory',
      purpose: reason,
      disposalMethod,
      performedBy: req.user.id,
      batchNumber: batchNumber || undefined,
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
      material,
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

export const getExpiringMaterials = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + Number(days));

    // Find materials with batches expiring soon
    const expiringMaterials = await Material.aggregate([
      { $unwind: "$batches" },
      { 
        $match: { 
          "batches.expiryDate": { 
            $lte: thresholdDate,
            $gt: new Date() // Not expired yet
          },
          "batches.status": "active"
        } 
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          category: { $first: "$category" },
          batches: {
            $push: {
              batchNumber: "$batches.batchNumber",
              quantity: "$batches.quantity",
              expiryDate: "$batches.expiryDate",
              daysUntilExpiry: {
                $ceil: {
                  $divide: [
                    { $subtract: ["$batches.expiryDate", new Date()] },
                    1000 * 60 * 60 * 24 // Milliseconds to days
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { "batches.daysUntilExpiry": 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: expiringMaterials.length,
      expiringMaterials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring materials",
      error: error.message
    });
  }
};