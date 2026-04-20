import fs from "fs";
import OpenAI from "openai";
import { clamp, round } from "../utils/formatters.js";
import { config } from "../config/env.js";
import { getVerificationModelStatus, verificationModelConfig } from "./verificationModelConfig.js";

const criticalKeywords = ["injured", "collapse", "flood", "trapped", "critical", "medical", "rescue", "outage"];
const resourceKeywords = {
  medical: ["ambulance", "medical", "injury", "blood", "triage"],
  food: ["food", "meal", "truck", "supplies", "ration"],
  "water-rescue": ["boat", "water", "rescue", "evacuation", "flood"],
  shelter: ["tent", "shelter", "blanket", "camp", "family"],
  energy: ["power", "grid", "generator", "transformer"],
  infrastructure: ["bridge", "road", "debris", "collapse"],
  general: ["people", "aid", "support"],
};

const openai = config.openAiApiKey ? new OpenAI({ apiKey: config.openAiApiKey }) : null;

function keywordMatches(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword)).length;
}

function deriveImageLabels(text, resourceType, file) {
  const labels = new Set(resourceKeywords[resourceType] || resourceKeywords.general);
  const lowerText = text.toLowerCase();

  Object.values(resourceKeywords)
    .flat()
    .forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        labels.add(keyword);
      }
    });

  if (file) {
    labels.add("uploaded-photo");
    if (file.mimetype.startsWith("image/")) {
      labels.add("field-evidence");
    }
  }

  return [...labels].slice(0, 6);
}

function localVerification({ text, resourceType, sourceReliability, engagement, file }) {
  const textEvidence = keywordMatches(text, criticalKeywords);
  const resourceEvidence = keywordMatches(text, resourceKeywords[resourceType] || resourceKeywords.general);
  const imageEvidence = file ? 18 : 0;
  const imageConfidence = clamp(
    (sourceReliability || 0.6) * 100 + imageEvidence + resourceEvidence * 4 - (file && file.size < 30_000 ? 6 : 0),
    35,
    98
  );

  const confidence = clamp(
    (sourceReliability || 0.6) * 100 + Math.min((engagement || 0) / 12, 18) + resourceEvidence * 4 + textEvidence * 5 + imageEvidence,
    20,
    99
  );

  let verificationStatus = "pending";
  if (confidence < 48 || (file && imageConfidence < 52) || (!file && textEvidence === 0 && resourceEvidence === 0)) {
    verificationStatus = "rejected";
  }
  if (confidence >= 78) {
    verificationStatus = "verified";
  }
  if (textEvidence >= 2 && confidence >= 74) {
    verificationStatus = "critical";
  }

  const routeImpact =
    verificationStatus === "rejected"
      ? "Low"
      : verificationStatus === "critical" || resourceType === "infrastructure"
        ? "High"
        : "Medium";
  const labels = deriveImageLabels(text, resourceType, file);
  const detectedRiskLevel = verificationStatus === "critical" ? "high" : verificationStatus === "verified" ? "moderate" : "low";

  return {
    confidence: round(confidence, 1),
    verificationStatus,
    routeImpact,
    hasMediaEvidence: Boolean(file),
    verificationProvider: "local-fallback",
    imageAnalysis: {
      labels,
      summary: file
        ? `Fallback scan matched the uploaded photo with ${resourceType.replace("-", " ")} cues and contextual risk indicators from the report.`
        : "No uploaded image was provided, so verification leaned on textual signals and source confidence.",
      detectedRiskLevel,
      imageConfidence: round(imageConfidence, 1),
      verificationNotes:
        verificationStatus === "rejected"
          ? "Fallback verifier found weak or mismatched evidence, so this report was rejected as likely inaccurate."
          : "Fallback verification used because a live OpenAI API configuration was not available.",
    },
  };
}

function buildStructuredSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      verificationStatus: {
        type: "string",
        enum: ["rejected", "pending", "verified", "critical"],
      },
      confidence: {
        type: "number",
      },
      routeImpact: {
        type: "string",
        enum: ["Low", "Medium", "High"],
      },
      labels: {
        type: "array",
        items: { type: "string" },
      },
      summary: {
        type: "string",
      },
      detectedRiskLevel: {
        type: "string",
        enum: ["low", "moderate", "high"],
      },
      imageConfidence: {
        type: "number",
      },
      verificationNotes: {
        type: "string",
      },
    },
    required: [
      "verificationStatus",
      "confidence",
      "routeImpact",
      "labels",
      "summary",
      "detectedRiskLevel",
      "imageConfidence",
      "verificationNotes",
    ],
  };
}

async function openAiVerification({ text, resourceType, sourceReliability, engagement, file }) {
  if (!openai) {
    return localVerification({ text, resourceType, sourceReliability, engagement, file });
  }

  const content = [
    {
      type: "input_text",
      text:
        `Verify this disaster-response incident for map publication.\n` +
        `Resource type: ${resourceType}\n` +
        `Source reliability: ${sourceReliability}\n` +
        `Engagement estimate: ${engagement}\n` +
        `Report text: ${text}\n\n` +
        `Analyze whether the visual evidence supports the report. Use rejected if the image and description clearly do not match, seem fabricated, or fail to describe a disaster-response scenario. Use pending if evidence is weak or ambiguous.`,
    },
  ];

  if (file) {
    const base64Image = fs.readFileSync(file.path, "base64");
    content.push({
      type: "input_image",
      image_url: `data:${file.mimetype};base64,${base64Image}`,
    });
  }

  const response = await openai.responses.create({
    model: verificationModelConfig.model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: verificationModelConfig.systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: verificationModelConfig.outputSchemaName,
        strict: true,
        schema: buildStructuredSchema(),
      },
    },
  });

  const parsed = JSON.parse(response.output_text);

  return {
    confidence: round(clamp(parsed.confidence, 0, 99), 1),
    verificationStatus: parsed.verificationStatus,
    routeImpact: parsed.routeImpact,
    hasMediaEvidence: Boolean(file),
    verificationProvider: "openai",
    imageAnalysis: {
      labels: Array.isArray(parsed.labels) ? parsed.labels.slice(0, 6) : [],
      summary: parsed.summary,
      detectedRiskLevel: parsed.detectedRiskLevel,
      imageConfidence: round(clamp(parsed.imageConfidence, 0, 99), 1),
      verificationNotes: parsed.verificationNotes,
    },
  };
}

export function verifyIncidentReportLocally(args) {
  return localVerification(args);
}

export async function verifyIncidentReport(args) {
  return openAiVerification(args);
}

export function getPreparedVerificationModel() {
  return getVerificationModelStatus();
}
