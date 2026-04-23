export const PRIVACY_CONTENT = {
  dataProtection: {
    title: "How we protect your data",
    paragraphs: [
      "StackCraft reads your repository's source files, README, and configuration files to generate technical documentation. When you import a GitHub repository, we fetch a snapshot of your codebase — including route files, component files, config files, and your Prisma schema if one exists. This snapshot is stored in our database and used exclusively to power AI-assisted editing and context-aware generation.",

      "Your source code is never used to train AI models. We use Groq as our inference provider, running Meta's Llama 4 Scout model. Requests are processed in real-time and are not retained by Groq beyond the duration of the inference call. No third party receives persistent access to your code.",

      "All data is stored in a Prisma Postgres database hosted on Prisma's managed infrastructure, with encrypted connections enforced via SSL. Authentication and identity management is handled by Clerk, which is SOC 2 Type II certified and CCPA compliant. Clerk does not store or process your payment information — payments are processed directly by Stripe.",

      "File uploads (project logos and images) are stored in Cloudflare R2 object storage, which provides end-to-end encryption at rest and in transit. Uploaded files are served via a public CDN URL, so anything you upload to a project's image gallery is publicly accessible via its direct URL.",

      "You can delete any project at any time. Deleting a project permanently removes all associated data from our database, including generated content, chat history, section data, and the stored GitHub context snapshot. Uploaded images in R2 are also deleted as part of this operation.",
    ],
  },

  dataUsage: {
    title: "How we use your data",
    paragraphs: [
      "StackCraft uses your project descriptions, repository context, and existing documentation solely to generate, improve, and update your technical documentation. We do not analyze your code for purposes outside of documentation generation, and we do not build user profiles or behavioral models from your content.",

      "When you submit a prompt in the AI chat editor, your prompt and the relevant project context (existing blocks, section structure, and optionally the GitHub snapshot) are sent to Groq's inference API to generate a response. The prompt and response are saved to your project's chat history so you can review and restore past states.",

      "Usage metrics — including the number of manual generates, GitHub imports, and AI edit token counts — are tracked in our database to enforce your plan's monthly limits. These counters reset on your billing anniversary date each month. We do not sell or share usage data with advertisers or data brokers.",

      "If you enable GitHub auto-sync, StackCraft registers a webhook on your repository. When you push to your default branch or merge a pull request, GitHub notifies our server, which re-fetches and updates the stored context snapshot for your project. This is the only time we proactively access your repository outside of an explicit import action.",

      "Public projects — those you have marked as Published — are accessible to anyone with the link, including search engines. The project's name, description, generated documentation, diagrams, and tags are all visible. If you want to restrict access, you can unpublish a project at any time from the project settings. Unpublishing takes effect immediately and removes the project from public URLs.",
    ],
  },
} as const;
