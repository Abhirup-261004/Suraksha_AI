import mongoose from "mongoose";

const incidentReportSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      default: "field-upload",
      trim: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ["medical", "food", "water-rescue", "shelter", "energy", "infrastructure", "general"],
      default: "general",
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageName: {
      type: String,
      default: "",
    },
    imageMimeType: {
      type: String,
      default: "",
    },
    imageSize: {
      type: Number,
      default: 0,
    },
    imageAnalysis: {
      labels: [{ type: String }],
      summary: { type: String, default: "" },
      detectedRiskLevel: { type: String, default: "moderate" },
      imageConfidence: { type: Number, default: 0 },
      verificationNotes: { type: String, default: "" },
    },
    sourceReliability: {
      type: Number,
      default: 0.6,
    },
    engagement: {
      type: Number,
      default: 0,
    },
    hasMediaEvidence: {
      type: Boolean,
      default: false,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ["rejected", "pending", "verified", "critical"],
      default: "pending",
    },
    routeImpact: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    verificationProvider: {
      type: String,
      default: "local-fallback",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderation: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        default: "",
      },
      overriddenByHuman: {
        type: Boolean,
        default: false,
      },
    },
    reviewHistory: [
      {
        reviewerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        reviewerName: {
          type: String,
          default: "",
        },
        action: {
          type: String,
          enum: ["pending", "verified", "critical", "rejected"],
          required: true,
        },
        notes: {
          type: String,
          default: "",
        },
        reviewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    seeded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const IncidentReport = mongoose.model("IncidentReport", incidentReportSchema);
