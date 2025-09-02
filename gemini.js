import dotenv from "dotenv";
dotenv.config();

function createClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return apiKey;
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

function buildChatPrompt(message, chatHistory) {
  let contextPrompt = '';
  
  if (chatHistory && chatHistory.length > 0) {
    contextPrompt = '\n\nPrevious conversation context:\n';
    chatHistory.forEach(msg => {
      contextPrompt += `${msg.role === 'user' ? 'Student' : 'AI Mentor'}: ${msg.content}\n`;
    });
  }

  return `You are an expert AI career mentor specializing in the Indian and global job market. You provide personalized, practical career guidance to students and professionals.

Your role is to:
1. Answer career-related questions with specific, actionable advice
2. Compare different career paths and their 5-year trajectories
3. Suggest skills and learning paths based on interests and constraints
4. Provide realistic salary expectations and job market insights
5. Consider current industry trends and emerging roles

Current question: ${message}${contextPrompt}

Please provide a helpful, conversational response that:
- Addresses the specific question directly
- Offers practical, actionable advice
- Includes relevant examples and career paths
- Considers the Indian job market context when relevant
- Maintains a supportive, encouraging tone
- Keeps responses concise but comprehensive (2-4 paragraphs)

Format your response in a conversational, helpful manner without bullet points unless specifically requested.`;
}

async function callGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateAdvice(profile) {
  const prompt = buildAdvicePrompt(profile);
  const apiKey = createClient();
  if (!apiKey) {
    return '';
  }
  
  try {
    const result = await callGeminiAPI(apiKey, prompt);
    return result.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generatePrep(profile, role) {
  const prompt = buildPrepPrompt(profile, role);
  const apiKey = createClient();
  if (!apiKey) {
    return '';
  }
  
  try {
    const result = await callGeminiAPI(apiKey, prompt);
    return result.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generateChatResponse(message, chatHistory) {
  const prompt = buildChatPrompt(message, chatHistory);
  const apiKey = createClient();
  if (!apiKey) {
    return '';
  }
  
  try {
    const result = await callGeminiAPI(apiKey, prompt);
    return result.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

function buildSkillsAnalysisPrompt(currentSkills, targetCareer, experienceLevel) {
  return `You are an expert career advisor and skills assessment specialist. Analyze the skills gap for a student transitioning to a new career path.

Current Skills: ${currentSkills}
Target Career: ${targetCareer}
Experience Level: ${experienceLevel}

Please provide a comprehensive skills gap analysis in the following JSON format:

{
  "targetCareer": "${targetCareer}",
  "experienceLevel": "${experienceLevel}",
  "currentSkills": ["skill1", "skill2"],
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "existingSkills": ["skill1"],
  "missingSkills": ["skill2", "skill3"],
  "matchPercentage": 33,
  "learningRoadmap": {
    "shortTerm": [
      {
        "skill": "skill name",
        "timeline": "3-4 months",
        "resources": ["resource1", "resource2"],
        "priority": "High/Medium/Low"
      }
    ],
    "longTerm": [
      {
        "skill": "skill name",
        "timeline": "6-12 months",
        "resources": ["resource1", "resource2"],
        "priority": "High/Medium/Low"
      }
    ]
  },
  "certifications": [
    {
      "name": "certification name",
      "provider": "provider name",
      "price": "price or Free",
      "relevance": "High/Medium/Low",
      "description": "brief description"
    }
  ],
  "insights": "Personalized insights about the career transition",
  "estimatedTimeline": "6-12 months",
  "difficulty": "Easy/Medium/Hard"
}

Focus on:
1. Accurate skills mapping and gap identification
2. Realistic learning timelines based on experience level
3. Practical learning resources (free and paid)
4. Relevant certifications for the target career
5. Personalized insights and recommendations

Ensure the response is valid JSON and includes all required fields.`;
}

export async function generateEnhancedSkillsAnalysis(currentSkills, targetCareer, experienceLevel) {
  const prompt = buildSkillsAnalysisPrompt(currentSkills, targetCareer, experienceLevel);
  const apiKey = createClient();
  if (!apiKey) {
    return null;
  }
  
  try {
    const result = await callGeminiAPI(apiKey, prompt);
    
    // Try to parse the JSON response
    try {
      const analysis = JSON.parse(result.trim());
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      // Return a fallback analysis
      return generateFallbackAnalysis(currentSkills, targetCareer, experienceLevel);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackAnalysis(currentSkills, targetCareer, experienceLevel);
  }
}

function generateFallbackAnalysis(currentSkills, targetCareer, experienceLevel) {
  // Fallback analysis when Gemini API fails
  const skillsList = currentSkills.split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(s => s);
  
  const baseSkills = {
    'data-scientist': ['python', 'statistics', 'data analysis', 'sql', 'machine learning'],
    'software-developer': ['programming', 'html', 'css', 'javascript', 'git', 'problem solving'],
    'product-manager': ['communication', 'project management', 'analytics', 'user research'],
    'cybersecurity-analyst': ['networking', 'security fundamentals', 'incident response'],
    'ai-engineer': ['python', 'mathematics', 'machine learning', 'data structures'],
    'devops-engineer': ['linux', 'bash scripting', 'git', 'networking', 'cloud basics'],
    'ui-ux-designer': ['design principles', 'user research', 'wireframing', 'prototyping'],
    'business-analyst': ['requirements gathering', 'documentation', 'stakeholder communication'],
    'cloud-architect': ['cloud fundamentals', 'networking', 'security basics'],
    'data-engineer': ['sql', 'python', 'data modeling', 'databases']
  };
  
  const requiredSkills = baseSkills[targetCareer] || ['general skills', 'problem solving', 'communication'];
  const existingSkills = skillsList.filter(skill => 
    requiredSkills.some(required => 
      required.toLowerCase().includes(skill) || skill.includes(required.toLowerCase())
    )
  );
  const missingSkills = requiredSkills.filter(skill => 
    !existingSkills.some(existing => 
      existing.toLowerCase().includes(skill) || skill.includes(existing.toLowerCase())
    )
  );
  
  return {
    targetCareer,
    experienceLevel,
    currentSkills: skillsList,
    requiredSkills,
    existingSkills,
    missingSkills,
    matchPercentage: Math.round((existingSkills.length / requiredSkills.length) * 100),
    learningRoadmap: {
      shortTerm: missingSkills.slice(0, Math.ceil(missingSkills.length / 2)).map(skill => ({
        skill,
        timeline: '3-6 months',
        resources: ['Online courses', 'Practice projects', 'Documentation'],
        priority: 'High'
      })),
      longTerm: missingSkills.slice(Math.ceil(missingSkills.length / 2)).map(skill => ({
        skill,
        timeline: '6-12 months',
        resources: ['Advanced courses', 'Real projects', 'Mentorship'],
        priority: 'Medium'
      }))
    },
    certifications: [
      {
        name: 'General Professional Development',
        provider: 'Various',
        price: 'Free-$500',
        relevance: 'High',
        description: 'Focus on building relevant skills for your target career'
      }
    ],
    insights: `Based on your current skills and target career in ${targetCareer}, you have a ${Math.round((existingSkills.length / requiredSkills.length) * 100)}% skills match. Focus on developing the missing skills through structured learning and practical projects.`,
    estimatedTimeline: '6-12 months',
    difficulty: experienceLevel === 'beginner' ? 'Medium' : 'Easy'
  };
}
