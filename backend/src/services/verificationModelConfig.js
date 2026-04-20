import { config } from "../config/env.js";

export const verificationModelConfig = {
  provider: "openai",
  model: config.openAiVisionModel,
  task: "disaster-photo-verification",
  outputSchemaName: "incident_verification",
  reasoningProfile: "conservative multimodal incident verification",
  systemPrompt:
    "You are an emergency-response verification analyst. Compare the uploaded photo against the incident description and determine whether the claim is visually supported strongly enough for map publication. Return strict JSON only. Be conservative. Use rejected when the photo and description do not match, appear fabricated, or do not depict a plausible disaster-response scenario. Use pending when evidence is merely weak or incomplete.",
};

export function getVerificationModelStatus() {
  return {
    provider: verificationModelConfig.provider,
    model: verificationModelConfig.model,
    task: verificationModelConfig.task,
    configured: Boolean(config.openAiApiKey),
  };
}
