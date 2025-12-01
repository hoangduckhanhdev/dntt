// models/FeedReaction.js
const mongoose = require("mongoose");

const FeedReactionSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like"], default: "like" },
  },
  { timestamps: true }
);

FeedReactionSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("FeedReaction", FeedReactionSchema);
