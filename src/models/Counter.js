import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Helper function to get next counter value
export async function getNextCounterValue(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  return counter.value;
}

export default Counter;
