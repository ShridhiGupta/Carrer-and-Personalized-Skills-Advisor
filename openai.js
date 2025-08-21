import OpenAI from "openai";

function createClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function buildAdvicePrompt(profile) {
  return `You are an expert career advisor focusing on the Indian job market. A student has provided their profile. Based on their education, skills, and interests, suggest:

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
}

function buildPrepPrompt(profile, role) {
  return `You are an expert Indian job-market career coach. Create a crisp, actionable preparation plan for the role: "${role}".

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
}

export async function generateAdvice(profile) {
  const prompt = buildAdvicePrompt(profile);
  const client = createClient();
  if (!client) {
    return '';
  }
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a concise, structured, and practical career advisor." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  return response.choices[0]?.message?.content?.trim() || '';
}

export async function generatePrep(profile, role) {
  const prompt = buildPrepPrompt(profile, role);
  const client = createClient();
  if (!client) {
    return '';
  }
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a concise, structured, and practical career advisor." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  return response.choices[0]?.message?.content?.trim() || '';
}
