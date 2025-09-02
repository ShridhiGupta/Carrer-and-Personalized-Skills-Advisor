// Gemini API integration for career advice and preparation plan
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAdvice, generatePrep, generateChatResponse } from './gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const geminiApiKey = process.env.GEMINI_API_KEY;

app.post('/api/advice', async (req, res) => {
  try {
    const profile = req.body;

    if (!geminiApiKey) {
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
    const message = (error && (error.message || error.toString())) || 'Failed to generate advice';
    res.status(500).json({ error: message });
  }
});

app.post('/api/prep', async (req, res) => {
  try {
    const { profile, role } = req.body || {};

    if (!geminiApiKey) {
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
    const message = (error && (error.message || error.toString())) || 'Failed to generate preparation plan';
    res.status(500).json({ error: message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    if (!geminiApiKey) {
      // Mock responses for common career questions
      const mockResponses = {
        'coding but not maths': 'Great question! If you enjoy coding but prefer to avoid heavy mathematics, consider these career paths:\n\n1. **Frontend Development** - Focus on user interfaces, design, and user experience\n2. **Web Development** - Build websites and web applications with minimal math\n3. **DevOps Engineering** - Infrastructure and deployment automation\n4. **Technical Writing** - Documentation and technical communication\n5. **Product Management** - Bridge between technical and business teams\n\nThese roles emphasize creativity, problem-solving, and technical skills without requiring advanced mathematics.',
        'data science vs cybersecurity': 'Excellent question! Let me break down where you might be in 5 years with each path:\n\n**Data Science Path (5 years):**\n- Senior Data Scientist or Lead Analyst\n- Working with machine learning models and business intelligence\n- Salary: $80K-150K+ depending on location and company\n- Roles: Data Science Manager, ML Engineer, Analytics Director\n\n**Cybersecurity Path (5 years):**\n- Senior Security Engineer or Security Architect\n- Leading security initiatives and threat response\n- Salary: $90K-160K+ with high demand\n- Roles: Security Manager, Penetration Tester, CISO\n\n**Key Differences:**\n- Data Science: More analytical, business-focused, requires statistics\n- Cybersecurity: More technical, incident response, constant learning\n\nBoth have excellent job security and growth potential!',
        'ai career skills': 'To build a career in AI, focus on these core skills:\n\n**Technical Skills:**\n- Python programming (essential)\n- Machine Learning frameworks (TensorFlow, PyTorch)\n- Data manipulation (Pandas, NumPy)\n- Statistics and mathematics\n- Deep learning fundamentals\n\n**Practical Skills:**\n- Building and deploying ML models\n- Data preprocessing and feature engineering\n- Model evaluation and validation\n- Understanding business problems\n\n**Learning Path:**\n1. Start with Python and basic ML concepts\n2. Learn supervised/unsupervised learning\n3. Practice with real datasets (Kaggle)\n4. Build portfolio projects\n5. Specialize in areas like NLP, Computer Vision, or MLOps\n\n**Entry Points:**\n- Data Analyst → ML Engineer → AI Engineer\n- Software Developer → ML Developer → AI Developer\n- Research Assistant → ML Researcher → AI Researcher'
      };

      // Find best matching mock response
      let bestResponse = 'I\'d be happy to help you with career guidance! Could you please provide more specific details about your interests, skills, or the career path you\'re considering?';
      
      for (const [key, response] of Object.entries(mockResponses)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
          bestResponse = response;
          break;
        }
      }
      
      return res.json({ response: bestResponse });
    }

    const response = await generateChatResponse(message, chatHistory);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    const message = (error && (error.message || error.toString())) || 'Failed to generate chat response';
    res.status(500).json({ error: message });
  }
});

app.post('/api/skills-analysis', async (req, res) => {
  try {
    const { currentSkills, targetCareer, experienceLevel } = req.body;

    if (!geminiApiKey) {
      // Mock skills analysis response
      const mockAnalysis = {
        targetCareer: targetCareer,
        experienceLevel: experienceLevel,
        currentSkills: currentSkills.split(/[,\n]/).map(s => s.trim()).filter(s => s),
        requiredSkills: ['python', 'sql', 'machine learning', 'data analysis', 'statistics'],
        existingSkills: ['python', 'data analysis'],
        missingSkills: ['sql', 'machine learning', 'statistics'],
        matchPercentage: 40,
        learningRoadmap: {
          shortTerm: [
            { skill: 'SQL', timeline: '3-4 months', resources: ['SQLBolt', 'Mode SQL Tutorial', 'Practice on Kaggle'] },
            { skill: 'Machine Learning Basics', timeline: '4-6 months', resources: ['Coursera ML Course', 'Hands-on ML Book', 'Kaggle Competitions'] }
          ],
          longTerm: [
            { skill: 'Advanced Statistics', timeline: '6-12 months', resources: ['Statistics Course', 'Research Papers', 'Real Projects'] }
          ]
        },
        certifications: [
          { name: 'Google Data Analytics Professional Certificate', provider: 'Coursera', price: 'Free', relevance: 'High' },
          { name: 'IBM Data Science Professional Certificate', provider: 'Coursera', price: 'Free', relevance: 'High' }
        ]
      };
      
      return res.json({ analysis: mockAnalysis });
    }

    // Enhanced analysis using Gemini API
    const enhancedAnalysis = await generateEnhancedSkillsAnalysis(currentSkills, targetCareer, experienceLevel);
    res.json({ analysis: enhancedAnalysis });
  } catch (error) {
    console.error('Skills analysis error:', error);
    const message = (error && (error.message || error.toString())) || 'Failed to generate skills analysis';
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


