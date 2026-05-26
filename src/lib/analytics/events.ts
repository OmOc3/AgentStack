import type { StackId } from "@/lib/stacks";

export const analyticsEventNames = [
  "project_name_entered",
  "stack_selected",
  "preview_requested",
  "preview_succeeded",
  "preview_failed",
  "github_login_clicked",
  "generation_requested",
  "generation_succeeded",
  "generation_failed",
  "zip_download_clicked",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsSurface =
  | "generate_form"
  | "preview_api"
  | "generate_api"
  | "success_page";

export type AnalyticsFailureReason =
  | "auth_required"
  | "github_api_error"
  | "github_auth_rejected"
  | "github_repo_conflict"
  | "network_error"
  | "preview_missing"
  | "rate_limited"
  | "unexpected_response"
  | "upstream_generation_error"
  | "validation_error";

export type GithubLoginSource =
  | "generate_form_button"
  | "generate_submit_gate";

export type AnalyticsUserContext = Readonly<{
  anonymousIdHash?: string;
  accountIdHash?: string;
}>;

export type AnalyticsEventContext = Readonly<{
  route?: string;
  surface?: AnalyticsSurface;
  user?: AnalyticsUserContext;
}>;

export type AnalyticsEventPayloadMap = {
  project_name_entered: {
    projectNameLength: number;
    isValid: boolean;
  };
  stack_selected: {
    stackId: StackId;
    previousStackId?: StackId;
    hadPreview: boolean;
  };
  preview_requested: {
    stackId: StackId;
    projectNameLength: number;
  };
  preview_succeeded: {
    stackId: StackId;
    fileCount: number;
    durationMs?: number;
  };
  preview_failed: {
    stackId?: StackId;
    reason: AnalyticsFailureReason;
    statusCode?: number;
    durationMs?: number;
  };
  github_login_clicked: {
    source: GithubLoginSource;
  };
  generation_requested: {
    stackId: StackId;
    projectNameLength: number;
    hadPreview: boolean;
  };
  generation_succeeded: {
    stackId: StackId;
    fileCount?: number;
    durationMs?: number;
  };
  generation_failed: {
    stackId?: StackId;
    reason: AnalyticsFailureReason;
    statusCode?: number;
    durationMs?: number;
  };
  zip_download_clicked: {
    source: "success_page";
    fileCount?: number;
  };
};

export type TrackEventInput<
  Name extends AnalyticsEventName = AnalyticsEventName,
> = {
  [EventName in Name]: Readonly<{
    name: EventName;
    payload: Readonly<AnalyticsEventPayloadMap[EventName]>;
    context?: AnalyticsEventContext;
  }>;
}[Name];

type AnalyticsEventSchema = {
  [EventName in AnalyticsEventName]: Readonly<{
    allowedPayloadKeys: readonly (keyof AnalyticsEventPayloadMap[EventName])[];
    description: string;
  }>;
};

export const analyticsEventSchema = {
  project_name_entered: {
    allowedPayloadKeys: ["projectNameLength", "isValid"],
    description: "Project name input was completed without storing the name.",
  },
  stack_selected: {
    allowedPayloadKeys: ["stackId", "previousStackId", "hadPreview"],
    description: "The user selected a stack option.",
  },
  preview_requested: {
    allowedPayloadKeys: ["stackId", "projectNameLength"],
    description: "The user requested a file preview.",
  },
  preview_succeeded: {
    allowedPayloadKeys: ["stackId", "fileCount", "durationMs"],
    description: "The preview API returned generated files.",
  },
  preview_failed: {
    allowedPayloadKeys: ["stackId", "reason", "statusCode", "durationMs"],
    description: "Preview generation did not complete.",
  },
  github_login_clicked: {
    allowedPayloadKeys: ["source"],
    description: "The user clicked a GitHub sign-in control.",
  },
  generation_requested: {
    allowedPayloadKeys: ["stackId", "projectNameLength", "hadPreview"],
    description: "The user requested repo generation.",
  },
  generation_succeeded: {
    allowedPayloadKeys: ["stackId", "fileCount", "durationMs"],
    description: "The generation API created a GitHub repo.",
  },
  generation_failed: {
    allowedPayloadKeys: ["stackId", "reason", "statusCode", "durationMs"],
    description: "Repo generation did not complete.",
  },
  zip_download_clicked: {
    allowedPayloadKeys: ["source", "fileCount"],
    description: "The user clicked a ZIP download control.",
  },
} as const satisfies AnalyticsEventSchema;

export const analyticsPrivacyRules = [
  "Do not send raw project briefs, prompts, or freeform input.",
  "Do not send generated file contents.",
  "Do not send GitHub access tokens or other credentials.",
  "Do not send raw user identifiers, names, or email addresses.",
  "Use hashed identifiers only when an identity is required; otherwise omit identity fields.",
] as const;
