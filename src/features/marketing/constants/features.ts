import {
  ZapIcon,
  LayersIcon,
  GitBranchIcon,
  UsersIcon,
  BarChart2Icon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: ZapIcon,
    title: "AI-Powered Blueprints",
    description:
      "Describe your idea in plain English and get a full technical blueprint in seconds — architecture, schema, and timeline included.",
  },
  {
    icon: LayersIcon,
    title: "Architecture Docs",
    description:
      "Auto-generate structured documentation covering your tech stack, data models, API design, and component breakdown.",
  },
  {
    icon: GitBranchIcon,
    title: "GitHub Integration",
    description:
      "Connect your repository and keep your docs in sync with your codebase as your project evolves.",
  },
  {
    icon: UsersIcon,
    title: "Team Collaboration",
    description:
      "Invite collaborators, share public project pages, and keep your whole team aligned on architecture decisions.",
  },
  {
    icon: BarChart2Icon,
    title: "Usage Analytics",
    description:
      "Track how your documentation is being used and understand which parts of your architecture get the most attention.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure by Default",
    description:
      "Your API keys are encrypted at rest. Publish only what you want — keep sensitive details private.",
  },
];
