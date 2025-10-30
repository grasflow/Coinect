import type { Environment, FeatureFlagConfig } from "./flags.config";
import { featureFlagsConfig } from "./flags.config";

function getEnvVar(name: string): string | undefined {
  return process.env[name] || import.meta.env[name];
}

export function getEnvironment(): Environment {
  const envName = getEnvVar("PUBLIC_ENV_NAME");

  if (!envName) {
    return "local";
  }

  const normalizedEnv = envName.toLowerCase().trim();

  if (normalizedEnv === "production" || normalizedEnv === "prod") {
    return "prod";
  }

  if (normalizedEnv === "integration") {
    return "integration";
  }

  return "local";
}

function getCurrentFlags(): FeatureFlagConfig {
  const env = getEnvironment();
  return featureFlagsConfig[env];
}

export function isFeatureEnabled(feature: keyof FeatureFlagConfig): boolean {
  const flags = getCurrentFlags();
  const flagValue = flags[feature];

  if (typeof flagValue === "boolean") {
    return flagValue;
  }

  if (typeof flagValue === "object" && flagValue !== null) {
    return Object.values(flagValue).some((value) => value === true);
  }

  return false;
}

export function isSubFeatureEnabled(feature: keyof FeatureFlagConfig, subFeature: string): boolean {
  const flags = getCurrentFlags();
  const flagValue = flags[feature];

  if (typeof flagValue === "boolean") {
    return flagValue;
  }

  if (typeof flagValue === "object" && flagValue !== null) {
    return (flagValue as Record<string, boolean>)[subFeature] ?? false;
  }

  return false;
}

export function getFeatureFlags(): FeatureFlagConfig {
  return getCurrentFlags();
}

export function isAuthEnabled(): boolean {
  return isFeatureEnabled("auth");
}

export function isAuthSubFeatureEnabled(subFeature: "signup" | "login" | "resetPassword"): boolean {
  return isSubFeatureEnabled("auth", subFeature);
}

export function isCollectionsEnabled(): boolean {
  return isFeatureEnabled("collections");
}

export { featureFlagsConfig };
export type { Environment, FeatureFlagConfig };
