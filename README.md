"# vectorius-prototype-next" 
Vectorius Prototype

A role-based dashboard prototype built with Next.js, React, and Tailwind CSS.
Supports three roles:

Student — view assignments, weekly planner, and progress.

Parent — see student’s progress, deadlines, and mentor notes.

Mentor — manage roster, add notes, and view student progress.

Hosted on Vercel.

Getting Started
1. Clone this repository
git clone https://github.com/YOUR_USERNAME/vectorius-prototype-next.git
cd vectorius-prototype-next

2. Install dependencies
npm install

3. Run locally
npm run dev


Visit http://localhost:3000 in your browser.

Branching Workflow

We use branches to safely develop features:

Create a new branch:

git checkout -b feature-name


Make changes and commit:

git add .
git commit -m "Describe your change"


Push to GitHub:

git push origin feature-name


Open a Pull Request on GitHub and merge when ready.

Tech Stack

Next.js — React framework for routing and builds.

React — component-based UI.

Tailwind CSS — utility-first styling.

Vercel — hosting and deployment.

Project Structure
vectorius-prototype-next/
├── app/                # Pages and layouts
│   ├── layout.js       # Global layout wrapper
│   ├── page.js         # Main dashboard logic
│   └── globals.css     # Global styles & Tailwind setup
├── components/         # Reusable UI parts (ProgressBar, Pill, etc.)
├── public/             # Static assets (images, icons)
├── package.json        # Project manifest (dependencies, scripts)
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.mjs  # PostCSS + Tailwind integration
└── README.md           # This file

Deployment

We use Vercel for continuous deployment:

Main branch → Production.

Feature branches → Preview URLs.

Future Plans

Replace mock data with live database (Supabase).

Role-based authentication.

Improved mobile experience.