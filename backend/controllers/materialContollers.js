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