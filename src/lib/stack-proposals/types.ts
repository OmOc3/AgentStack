export type StackProposalId =
  | "next-saas-starter"
  | "ai-chatbot-starter"
  | "marketing-content-starter";

export type StackProposalIcon = "next";

export type StackProposalDefinition = {
  id: StackProposalId;
  name: string;
  description: string;
  icon: StackProposalIcon;
};

export type GeneratedProposalFile = {
  path: string;
  content: string;
};

export type StackProposal = {
  definition: StackProposalDefinition;
  buildFiles: (projectName: string) => GeneratedProposalFile[];
};
