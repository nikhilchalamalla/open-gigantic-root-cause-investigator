# Founding AI Engineer Assignment - Root-Cause Investigator

This document serves as the final submission for the Founding AI Engineer position at **Open Gigantic**. It outlines the product vision, architectural design, critical decisions made under ambiguity, developer observations of Superbrain, and product strategy suggestions.

---

## 🚀 Live Submission Links
* **GitHub Repository**: [nikhilchalamalla/open-gigantic-root-cause-investigator](https://github.com/nikhilchalamalla/open-gigantic-root-cause-investigator)
* **Live Deployment (Vercel)**: [open-gigantic-investigator-application-r67r6xxkh.vercel.app](https://open-gigantic-investigator-application-r67r6xxkh.vercel.app/)

---

## 1. What I Built & Why

### The Product: **Root-Cause Investigator**
I built an AI-powered site reliability and developer utility that ingests application crash logs or stack traces, parses them to extract exception details, matches them against similar historical incidents via vector search, and outputs a ranked list of likely root causes alongside an actionable code fix.

### The "Why" (Product Context)
Debugging stack traces in production or local environments is highly repetitive. Developers often search stack traces on Google, look up past internal Slack messages, or search Git issues. 
By compiling a tool that:
1. **Automates parsing** across different languages (Java, Python, JS/TS, SQL).
2. **Retrieves local historical context** dynamically.
3. **Applies LLM synthesis** to output direct code diffs.
4. **Captures developer feedback** (Useful / Not Useful + actual code resolutions) to continually improve retrieval.

We create a self-learning loop that speeds up MTTR (Mean Time to Resolution) for engineering teams.

---

## 2. Architecture & Design

The application is built in a single **Next.js 14 App Router** repository in TypeScript.

```mermaid
graph TD
  User[Developer / Client] -->|Paste Log / Select Dialect| UI[Next.js Interactive Dashboard]
  UI -->|POST /api/analyze| Router[API Router]
  Router -->|Orchestrate| Service[Orchestration Service]
  Service -->|Parse Trace| Parser[Stack Trace Parser]
  Service -->|Deterministic Hash / OpenAI| Embed[Embedding Generator]
  Service -->|Dot Product Search| DB[(PostgreSQL)]
  Service -->|Retrieve Incidents| Retriever[Historical Matcher]
  Service -->|Synthesize Fix| LLM[LLM Generator]
  Service -->|Sort Confidence| Ranker[Cause Ranker]
  Service -->|Store Record| DB
  Service -->|Return Package| UI
```

### Component Breakdown
1. **Stack Trace Parser (`src/server/parser/parseErrorLog.ts`)**: A rule-based parser that reads lines to extract language, error types, error messages, and maps the top 5 stack frames.
2. **Vector Retriever (`src/server/retriever/retrieveIncidents.ts`)**: Connects to the database and retrieves historical seed incidents. It computes the dot product of normalized embedding vectors in-memory (cosine similarity).
3. **Structured AI Generator (`src/server/generator/openai.ts`)**: Integrates with OpenAI's Chat Completions. It uses structured JSON output schemas to guarantee Zod validation conforms to the frontend.
4. **Cause Ranker (`src/server/ranker/rankCauses.ts`)**: Sorts root causes returned by the LLM by confidence level in descending order and clamps values.
5. **Database ORM (`src/lib/db/`)**: PostgreSQL storage using **Drizzle ORM**. It stores incidents, generated diagnoses, and developer feedback logs.

---

## 3. Important Design Decisions & Trade-Offs

### A. Database Vector Storage: JSONB vs. `pgvector`
* **Options considered**: Restricting database installation to require the native compiled `pgvector` C-extension, or storing vectors as standard JSONB arrays and calculating cosine similarity in Node.js.
* **The decision**: I chose to store embedding arrays as standard PostgreSQL `jsonb` float arrays.
* **Rationale**: Compiling and installing the `pgvector` binary on Windows/macOS local developer environments is notoriously complex and prone to permission/path issues. By utilizing standard JSONB fields and performing dot product calculations of normalized unit vectors in-memory in Node.js, we get sub-millisecond execution times for search corpora < 1000 items, while ensuring **zero-setup compatibility** for any evaluator running the project.

### B. Heuristic Mock Fallback Engine
* **Options considered**: Throwing database/network errors if no valid `OPENAI_API_KEY` is present.
* **The decision**: I built a local heuristic fallback engine that runs rule-based diagnostic synthesis if the OpenAI API key is missing or set to a placeholder.
* **Rationale**: Evaluators should be able to run and interact with the application immediately without being forced to set up billing accounts or supply active API keys. The mock engine parses the trace and matches it to seed data, generating a fully populated dashboard layout to test.

### C. Developer Feedback Resolution Capture
* **Options considered**: Capturing a simple thumbs-up/down binary click.
* **The decision**: If a developer votes, we display input textareas to log what the actual resolved code block was.
* **Rationale**: Gathering the actual code patch that fixed the error is the gold mine. In future iterations, these actual resolutions are fed back into the seed incident corpus, creating a self-learning vector database that gives increasingly precise code fixes.

---

## 4. How I Used Superbrain

I utilized Superbrain throughout the lifecycle of this project:
1. **Product Planning**: I used the Superbrain agent chat to map out the initial feature list and narrow the scope to a highly polished MVP.
2. **TypeScript & TSConfig Debugging**: Superbrain analyzed compiler outputs when Drizzle-Kit was failing due to target mismatches (ES5 vs ES2020), helping correct the environment constraints.
3. **Orchestrator scaffolding**: The agent assisted in sketching clean interfaces, ensuring proper dependency injection patterns between the AI generator and service layers.

---

## 5. Product Strategy Recommendations

### A. What would I change/add next in Superbrain and why?
1. **Visual Agent Execution Pipeline**: 
   * *What*: An interactive, node-based pipeline visualizer showing what the agent is doing (e.g. `File Read` → `AST Parsing` → `Diff Calculation` → `Lint Testing`).
   * *Why*: Developers feel anxious when an agent acts in a "black box" manner. Seeing real-time progress steps builds trust, increases predictability, and allows early cancellation before incorrect modifications.
2. **Context Density Map**: 
   * *What*: A UI visualization (like a heat map) showing which files/methods are currently loaded in the LLM's active context.
   * *Why*: Since token compression cuts context by 60-80%, developers need to verify if the agent actually has critical library definitions in memory. An interactive map allows developers to manually pin files to context.
3. **Sandboxed Dry-Run Mode**:
   * *What*: A configuration setting that allows the agent to run command executions and code edits inside a temporary container or sandboxed folder before committing them to the host file system.
   * *Why*: It protects working trees from corrupt changes, preventing the need for manual git rollbacks when an agent goes down an incorrect path.

### B. What major UI issues do you dislike in Superbrain, and why?
1. **Fixed Right-Panel Chat Space**: 
   * *Issue*: The chat panel occupies a rigid right-side column. When debugging code, developers often split editor windows.
   * *Why it annoys*: It squeezes the code editor area, forcing horizontal scrolls on small laptop displays.
   * *Fix*: Make the chat window collapsible, floatable, or dockable to the bottom panel beside the terminal.
2. **Implicit Background Tasks**:
   * *Issue*: When the agent runs terminal commands (like npm installs or builds), it sends them to a background daemon, showing a status notification like "Task running".
   * *Why it annoys*: Developers want absolute control over shell commands executed on their host machines for security and safety.
   * *Fix*: Require a preview of the CLI command and an explicit "Approve" button before the agent executes shell commands.
3. **Lack of Inline Code Diffs in Chat**:
   * *Issue*: When code is modified, the agent lists file paths in chat, but users must manually open git panels to inspect what changed.
   * *Why it annoys*: Increases friction.
   * *Fix*: Render inline expandable diff frames directly inside chat bubbles with a manual "Apply Change" click option.

---

## 6. How to Run Locally

### Prerequisites
- Node.js (v20+)
- PostgreSQL service running locally on port 5432

### Setup Instructions
1. Clone the repository and navigate to the project directory:
   ```bash
   cd OpenGigantic_Assignment
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables in a `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:12345678@localhost:5432/postgres
   OPENAI_API_KEY=your-openai-api-key-here # Optional (will use local heuristic fallback if dummy)
   ```
4. Run Drizzle migrations to set up database tables:
   ```bash
   npx drizzle-kit push
   ```
5. Seed the database with historical incident cases:
   ```bash
   npx tsx src/lib/db/seed.ts
   ```
6. Run unit tests to verify:
   ```bash
   npm run test
   ```
7. Start the local development server:
   ```bash
   npm run dev
   ```
8. Open [http://localhost:3000](http://localhost:3000) in your browser.
