export type Environment = "local" | "integration" | "prod";

export interface FeatureFlagConfig {
  auth:
    | boolean
    | {
        signup?: boolean;
        login?: boolean;
        resetPassword?: boolean;
      };
  collections: boolean;
}

export type FeatureFlagsConfig = Record<Environment, FeatureFlagConfig>;

export const featureFlagsConfig: FeatureFlagsConfig = {
  local: {
    auth: true,
    collections: true,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: true,
    collections: true,
  },
};
