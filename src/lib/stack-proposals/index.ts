import {
  aiChatbotStarterDefinition,
  aiChatbotStarterProposal,
  buildAiChatbotStarterFiles,
} from "./ai-chatbot-starter";
import {
  buildMarketingContentStarterFiles,
  marketingContentStarterDefinition,
  marketingContentStarterProposal,
} from "./marketing-content-starter";
import {
  buildNextSaasStarterFiles,
  nextSaasStarterDefinition,
  nextSaasStarterProposal,
} from "./next-saas-starter";
import type {
  GeneratedProposalFile,
  StackProposal,
  StackProposalId,
} from "./types";

export type {
  GeneratedProposalFile,
  StackProposal,
  StackProposalDefinition,
  StackProposalIcon,
  StackProposalId,
} from "./types";

export {
  aiChatbotStarterDefinition,
  aiChatbotStarterProposal,
  buildAiChatbotStarterFiles,
  buildMarketingContentStarterFiles,
  buildNextSaasStarterFiles,
  marketingContentStarterDefinition,
  marketingContentStarterProposal,
  nextSaasStarterDefinition,
  nextSaasStarterProposal,
};

export const stackProposals = [
  nextSaasStarterProposal,
  aiChatbotStarterProposal,
  marketingContentStarterProposal,
] as const satisfies readonly StackProposal[];

export const stackProposalDefinitions = [
  nextSaasStarterDefinition,
  aiChatbotStarterDefinition,
  marketingContentStarterDefinition,
] as const;

export const stackProposalFileBuilders = {
  "next-saas-starter": buildNextSaasStarterFiles,
  "ai-chatbot-starter": buildAiChatbotStarterFiles,
  "marketing-content-starter": buildMarketingContentStarterFiles,
} satisfies Record<
  StackProposalId,
  (projectName: string) => GeneratedProposalFile[]
>;
