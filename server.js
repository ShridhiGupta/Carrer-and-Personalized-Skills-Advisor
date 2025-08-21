import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { generateAdvice, generatePrep } from './openai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

console.log("API Key:", process.env.OPENAI_API_KEY);

app.post('/api/advice', async (req, res) => {
  try {
    const profile = req.body;

    const prompt = `You are an expert career advisor focusing on the Indian job market. A student has provided their profile. Based on their education, skills, and interests, suggest:

1. Top 3 suitable career paths for them.
2. Why each career path is suitable (2-3 sentences).
3. Key skills they need to develop for each career.
4. Learning resources (free or popular platforms) for each skill.

Student Profile:
- Education: ${profile.education || ''}
- Skills: ${profile.skills || ''}
- Interests: ${profile.interests || ''}
- Career Goals: ${profile.careerGoals || ''}

Consider current trends in the Indian job market and emerging roles when recommending careers and skills.

Format the output clearly like this:

Career Path 1: [Name]
- Why suitable: ...
- Required Skills: ...
- Learning Resources: ...

Career Path 2: [Name]
- Why suitable: ...
- Required Skills: ...
- Learning Resources: ...

Career Path 3: [Name]
- Why suitable: ...
- Required Skills: ...
- Learning Resources: ...`;

    if (!openai) {
      const mock = `Career Path 1: Data Analyst
- Why suitable: Leverages your quantitative background and interest in data storytelling. Strong demand across Indian IT services, startups, fintech, and healthcare.
- Required Skills: SQL, Excel/Spreadsheets, Data Visualization (Power BI/Tableau), Python for data analysis, Business communication.
- Learning Resources: SQL (Khan Academy, Mode SQL Tutorial), Excel (Microsoft Learn), Power BI (Microsoft Learn), Tableau (Tableau Public), Python/Pandas (freeCodeCamp, Kaggle).

Career Path 2: Product Analyst / Growth Analyst
- Why suitable: Bridges business goals with data-driven decision-making. Indian SaaS and consumer startups value analytical problem-solvers who can run experiments and interpret metrics.
- Required Skills: Experimentation (A/B testing), Metrics & funnels, SQL, Dashboarding, Stakeholder communication, Basic statistics.
- Learning Resources: Experimentation (Google Analytics Academy), Metrics (Reforge articles), SQL (SQLBolt), Dashboards (Looker Studio docs), Stats (Khan Academy Stats).

Career Path 3: AI/ML Associate (Applied)
- Why suitable: Aligns with your interest in emerging tech; many Indian firms hire entry-level ML associates for model evaluation, prompt design, and data pipelines.
- Required Skills: Python, scikit-learn basics, Data cleaning, Prompt engineering, Model evaluation, MLOps fundamentals.
- Learning Resources: Python/ML (scikit-learn tutorials, Kaggle), Prompting (OpenAI Cookbook), Data cleaning (Pandas docs), MLOps (Made With ML, Coursera MLOps).`;
      return res.json({ result: mock });
    }

    const text = await generateAdvice(profile);
    res.json({ result: text });
  } catch (error) {
    console.error('Advice error:', error);
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

app.post('/api/prep', async (req, res) => {
  try {
    const { profile, role } = req.body || {};

    const prepPrompt = `You are an expert Indian job-market career coach. Create a crisp, actionable preparation plan for the role: "${role}".

Student Profile:
- Education: ${profile?.education || ''}
- Skills: ${profile?.skills || ''}
- Interests: ${profile?.interests || ''}
- Career Goals: ${profile?.careerGoals || ''}

Focus on India-specific realities (hiring patterns, certifications accepted locally, salary bands not needed). Keep it practical and short-bulleted.

Return in this format:

Title: Preparation Plan for [Role]

1) 90-Day Roadmap (Weeks 1-12)
- Week 1-2: ...
- Week 3-4: ...
...

2) Portfolio Projects (3)
- Project 1: ... (what to build, datasets/APIs, evaluation, expected outcome)
- Project 2: ...
- Project 3: ...

3) Skills & Resources
- Skill: [name] — Resources: [specific free/popular platforms]
- Skill: ...

4) Certifications (Optional, India-relevant)
- ...

5) Interview Prep
- Topics: ...
- Question types: ...
- Practice sources: ...

6) Target Companies & Roles (India)
- Companies: ...
- Sample job titles: ...

7) Milestones & Checkpoints
- By Day 30: ...
- By Day 60: ...
- By Day 90: ...`;

    if (!openai) {
      const mock = `Title: Preparation Plan for ${role || 'Target Role'}

1) 90-Day Roadmap (Weeks 1-12)
- Week 1-2: Audit current skills, shortlist gaps, set study blocks; refresh foundations.
- Week 3-4: Build Project 1; document learnings; post weekly updates on LinkedIn.
- Week 5-6: Deepen core tools; complete 2 structured courses; start interview notebook.
- Week 7-8: Build Project 2; add dashboards/notebooks; request peer reviews.
- Week 9-10: Mock interviews; refine resume to India roles; apply to 10 curated jobs/week.
- Week 11-12: Build Project 3; final polish; targeted outreach and referrals.

2) Portfolio Projects (3)
- Project 1: Real-world data analysis on Indian open datasets (e.g., data.gov.in); create a dashboard; write insights.
- Project 2: End-to-end pipeline with APIs/automation; publish code and README.
- Project 3: Domain-focused demo (e.g., fintech/healthcare); emphasize business impact.

3) Skills & Resources
- SQL — SQLBolt, Mode SQL, Khan Academy
- Visualization — Power BI Microsoft Learn, Tableau Public
- Python/Pandas — freeCodeCamp, Kaggle
- Communication — Toastmasters videos, Write the Docs

4) Certifications (Optional, India-relevant)
- Microsoft or Google data certs; Power BI/Analytics certs.

5) Interview Prep
- Topics: case questions, SQL joins/windows, metrics, storytelling.
- Question types: business cases, take-home analysis, SQL live coding.
- Practice sources: StrataScratch, Interview Query blogs, LeetCode SQL.

6) Target Companies & Roles (India)
- Companies: IT services, SaaS, fintech, startups; product companies in Bengaluru/Hyderabad.
- Sample job titles: Analyst, Product Analyst, Business Analyst.

7) Milestones & Checkpoints
- By Day 30: Project 1 + one course done.
- By Day 60: Project 2 + mock interviews started.
- By Day 90: Project 3 + 30-40 targeted applications.`;
      return res.json({ result: mock });
    }

    const text = await generatePrep(profile, role);
    res.json({ result: text });
  } catch (error) {
    console.error('Prep error:', error);
    res.status(500).json({ error: 'Failed to generate preparation plan' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


