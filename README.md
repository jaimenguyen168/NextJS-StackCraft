# NextJS-StackCraft

<img width="1200" height="600" alt="stackcraft" src="https://github.com/user-attachments/assets/592afbca-d076-467e-bf5a-3234f551f3b2" />

<br />

<div align="center">
  <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="Next.js" />
  <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/-React-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/-tRPC-black?style=for-the-badge&logoColor=white&logo=trpc&color=2596BE" alt="tRPC" />
  <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="Prisma" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/-OpenAI-black?style=for-the-badge&logoColor=white&logo=openai&color=412991" alt="OpenAI" />
  <img src="https://img.shields.io/badge/-Clerk-black?style=for-the-badge&logoColor=white&logo=clerk&color=6C47FF" alt="Clerk" />
  <img src="https://img.shields.io/badge/-shadcn/ui-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=000000" alt="shadcn/ui" />
</div>

## 📋 <a name="table-of-contents">Table of Contents</a>

1. 📋 [Project Overview](#project-overview)
2. 🔋 [Key Features](#key-features)
3. 📌 [Getting Started](#getting-started)

---

## <a name="project-overview">📋 Project Overview</a>

StackCraft is an innovative platform designed to revolutionize the way developers and project teams create, document, and manage their projects. It serves as an all-in-one solution for project ideation, planning, and execution, catering to the needs of both individual developers and teams. By integrating cutting-edge AI technology, StackCraft enables users to generate comprehensive project blueprints, including technical specifications, architecture diagrams, and project timelines, in a matter of seconds. The platform aims to streamline the project development process, enhance collaboration, and reduce the time and effort required to bring projects to life.

---

## <a name="key-features">🔋 Key Features</a>

- 👉 **AI-Powered Project Generation**: generate comprehensive project blueprints, technical specs, and architecture diagrams in seconds <br />
- 👉 **AI Chat Assistant**: chat with AI to modify, add content, and refine your project documentation interactively <br />
- 👉 **Diagram Generation**: auto-generate architecture and system diagrams from your project details <br />
- 👉 **GitHub Repo Import**: generate full project documentation by reading directly from a GitHub repository <br />
- 👉 **Push Docs to GitHub**: publish your documentation or architecture directly to a GitHub README <br />
- 👉 **Publish Documentation**: share and publish your project docs to a public-facing page <br />
- 👉 **User Authentication**: secure login and registration using Clerk <br />
- 👉 **Project Management**: create, edit, and manage your projects and documentation <br />
- 👉 **GitHub Integration**: connect and sync your projects with GitHub repositories <br />
- 👉 **Collaboration**: invite contributors to view and suggest changes to project plans <br />
- 👉 **Analytics & Dashboard**: track and monitor your projects from a centralized dashboard <br />
- 👉 **Dark & Light Mode**: fully themed UI with support for both dark and light modes <br />

## 🚀 Upcoming Features

- 👉 **Auto-Update Docs on Merge**: automatically update documentation when new changes are merged into GitHub <br />
- 👉 **Community Doc Channels**: get feedback and suggestions from other users on your documentation <br />
- 👉 **Image & Icon Generation**: generate custom images and icons for your project docs <br />
- 👉 **Customizable Themes**: personalize the look and feel of your documentation with custom themes <br />

---

## <a name="getting-started">📌 Getting Started</a>

### Installation

**Clone the repository**

```bash
git clone https://github.com/jaimenguyen168/NextJS-StackCraft.git
cd NextJS-StackCraft
```

**Install dependencies**

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SIGNING_SECRET=

# App URL
APP_URL=http://localhost:3000

# Prisma
DATABASE_URL=

# Groq
GROQ_API_KEY=

# R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
R2_TOKEN=

# Modal
STACKCRAFT_LOGO_URL=
STACKCRAFT_LOGO_API_KEY=
HUGGING_FACE_HUB_TOKEN=

# GitHub
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
GITHUB_FEEDBACK_TOKEN=

# Encryption
ENCRYPTION_KEY=
```

### Running the App

**Run the development server**

```bash
pnpm dev
```

**Run Prisma Studio**

```bash
pnpm dlx prisma studio
```

**Push Prisma schema to database**

```bash
pnpm dlx prisma db push
```

---

<div align="center">
  <p>Built with ❤️ using <a href="https://stackcraft.dev">StackCraft</a> · <a href="https://github.com/jaimenguyen168/NextJS-StackCraft">View Repository</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
