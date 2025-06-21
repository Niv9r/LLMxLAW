# **App Name**: Tribunal Genesis

## Core Features:

- User Authentication: Secure user authentication with Google Sign-In via Firebase Authentication.
- Strategy Submission: Form to submit legal strategies (case facts and initial strategy) with a Textarea; includes loading state and error handling.
- AI Analysis Dashboard: Display structured AI analysis results (Advocate's Brief, Adversary's Rebuttal, Arbiter's Synthesis) with Accordion and Badge components for collapsibility and highlighting.
- AI Chat: Interactive chat interface with streaming responses from the AI using the EventSource API, providing a real-time debate experience with the Arbiter; uses Firebase to save the complete chat history.
- Action Plan Generation: Dynamically generate an action plan from AI analysis; includes editable checklist items, Checkbox components (state saved to Firestore), and integration with the Firebase database.
- Scoped Chats: Create scoped chats for individual action items using Dialog modals, allowing focused discussions and organized task management; Firestore saves the chat history distinct to each task.
- Legal Case Summarization: Uses a legal summarization tool to provide a concise legal breakdown for any case cited. It will function as a tool for the LLM.

## Style Guidelines:

- Primary color: Slate blue (#708090) to evoke a sense of authority and intellect, reminiscent of legal documents and classic courtroom aesthetics.
- Background color: Light gray (#F0F0F0) providing a clean and neutral backdrop that ensures readability and reduces eye strain.
- Accent color: Soft gold (#D4A27A) to highlight key elements such as vulnerability scores, action items, and the 'Arbiter's Synthesis', providing a subtle touch of elegance.
- Headline font: 'Playfair Display', serif, to convey elegance, high-end quality, and intelligence. Note: currently only Google Fonts are supported.
- Body font: 'PT Sans', sans-serif, for the body to keep readability high. Note: currently only Google Fonts are supported.
- Use professional, minimalist icons from Lucide, emphasizing clarity and legal precision.
- Subtle transitions and animations (e.g., loading spinners) to maintain a smooth, responsive user experience without distractions.
- Three-panel layout with clear sections for Advocate, Adversary, and Arbiter views, ensuring structured data presentation.