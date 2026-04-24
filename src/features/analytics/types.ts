export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  tokensUsed?: number;
  createdAt: Date;
};

export type AnalyticsProject = {
  id: string;
  name: string;
  status: string;
  published: boolean;
  githubUrl: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AnalyticsCollaborator = {
  id: string;
  role: string;
  status: string;
  createdAt: Date;
};
