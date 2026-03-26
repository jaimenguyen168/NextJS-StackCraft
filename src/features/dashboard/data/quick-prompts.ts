export interface QuickPrompt {
  title: string;
  description: string;
  emoji: string;
  prompt: string;
}

export const quickPrompts: QuickPrompt[] = [
  {
    title: "Freelance SaaS",
    description: "Invoice management with Stripe and a client portal",
    emoji: "💼",
    prompt:
      "A project management SaaS for freelancers. Users can create projects, track time, send invoices to clients, and get paid via Stripe. There's a client portal where clients can view project progress, approve deliverables, and download invoices.",
  },
  {
    title: "AI Chatbot",
    description: "Customer support bot with knowledge base",
    emoji: "🤖",
    prompt:
      "An AI-powered customer support chatbot SaaS. Companies upload their documentation and the bot answers customer questions. Includes a dashboard to view chat history, unanswered questions, and bot performance analytics.",
  },
  {
    title: "E-commerce Store",
    description: "Online store with inventory and payments",
    emoji: "🛍️",
    prompt:
      "A multi-vendor e-commerce platform where sellers can list products, manage inventory, and receive payments via Stripe. Buyers get a storefront, cart, checkout, and order tracking. Includes an admin panel for platform management.",
  },
  {
    title: "Social Platform",
    description: "Community app with posts, follows, and feeds",
    emoji: "🌐",
    prompt:
      "A niche social platform for developers. Users can post code snippets, follow other developers, comment, and like posts. Includes a personalized feed, trending snippets, and GitHub OAuth login.",
  },
  {
    title: "Booking App",
    description: "Appointment scheduling with calendar sync",
    emoji: "📅",
    prompt:
      "An appointment booking platform for service businesses like salons and clinics. Clients can book time slots, receive email reminders, and reschedule. Business owners get a calendar view, staff management, and revenue reports.",
  },
  {
    title: "Learning Platform",
    description: "Course platform with video lessons and progress tracking",
    emoji: "🎓",
    prompt:
      "An online learning platform where instructors can create video courses with quizzes. Students can enroll, track progress, earn certificates, and leave reviews. Includes a Stripe-powered course marketplace.",
  },
];
