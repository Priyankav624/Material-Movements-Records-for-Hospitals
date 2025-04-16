import mongoose from "mongoose";

const movementLogSchema = new mongoose.Schema(
  {
    materialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Material', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    action: { 
      type: String, 
      enum: ["Issued", "Returned", "Transferred", "Disposed"], 
      required: true 
    },
    from: { 
      type: String, 
      required: true 
    }, // Source location/department
    to: { 
      type: String, 
      required: function() {
        return this.action !== "Disposed";
      }
    }, // Destination location/department
    purpose: { 
      type: String, 
      required: true 
    }, // Usage/repair/disposal reason
    performedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Store manager who performed the action
    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }, // Doctor/nurse/lab tech assigned
    requestId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'MaterialRequest' 
    }, // If action was from a request
    condition: { 
      type: String, 
      enum: ["Good", "Damaged", "Expired"], 
      required: function() {
        return this.action === "Returned";
      }
    }, // Condition when returned
    relatedMovement: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'MovementLog' 
    }, // For return/disposal references
    notes: String, // Additional information
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

const MovementLog = mongoose.model("MovementLog", movementLogSchema);
export default MovementLog;