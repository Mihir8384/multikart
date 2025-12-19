import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // e.g., "Standard 30-Day Return"
    },
    type: {
      type: String,
      enum: ["warranty", "return", "refund"], // The 3 types you requested
      required: true,
    },
    description: {
      type: String, // The actual text content of the policy
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.models.Policy || mongoose.model("Policy", policySchema);
export default Policy;
