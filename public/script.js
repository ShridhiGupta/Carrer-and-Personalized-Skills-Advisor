async function submitForm(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const resultEl = document.getElementById('result');
    const cardsEl = document.getElementById('resultCards');
    submitBtn.disabled = true;
    resultEl.style.display = 'block';
    cardsEl.innerHTML = '';
    resultEl.textContent = 'Generating personalized career advice...';
  
    const education = `${document.getElementById('degree').value}, ${document.getElementById('major').value}, ${document.getElementById('gradYear').value}, CGPA ${document.getElementById('cgpa').value}`;
    const skills = document.getElementById('skills').value;
    const interests = document.getElementById('interests').value;
    const careerGoals = `${document.getElementById('goals').value} | Location: ${document.getElementById('location').value} | Timeframe: ${document.getElementById('timeframe').value}`;
    const optional = {
      projects: document.getElementById('projects').value,
      internships: document.getElementById('internships').value,
      portfolio: document.getElementById('portfolio').value,
      constraints: document.getElementById('constraints').value,
      companyType: document.getElementById('companyType').value
    };
  
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ education, skills, interests, careerGoals, optional })
      });
      const data = await res.json();
      const text = data.result || data.error || 'No response.';
      // Try to parse structured blocks into cards
      const cards = parseCareerAdvice(text);
      if (cards.length) {
        renderCards(cardsEl, cards);
        resultEl.style.display = 'none';
      } else {
        resultEl.textContent = text;
        resultEl.style.display = 'block';
      }
    } catch (e) {
      resultEl.textContent = 'Failed to fetch advice.';
    } finally {
      submitBtn.disabled = false;
    }
  }

function parseCareerAdvice(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const titleMatch = line.match(/^Career Path\s*\d+\s*:\s*(.+)$/i);
    if (titleMatch) {
      if (current) blocks.push(current);
      current = { title: titleMatch[1].trim(), why: '', skills: '', resources: '' };
      continue;
    }
    if (!current) continue;
    const why = line.match(/^-\s*Why suitable:\s*(.+)$/i);
    const skills = line.match(/^-\s*Required Skills:\s*(.+)$/i);
    const lr = line.match(/^-\s*Learning Resources:\s*(.+)$/i);
    if (why) current.why += (current.why ? ' ' : '') + why[1].trim();
    else if (skills) current.skills += (current.skills ? ' ' : '') + skills[1].trim();
    else if (lr) current.resources += (current.resources ? ' ' : '') + lr[1].trim();
  }
  if (current) blocks.push(current);
  return blocks;
}

function renderCards(container, cards) {
  const frag = document.createDocumentFragment();
  cards.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'career-card';
    card.dataset.role = c.title;

    const title = document.createElement('h4');
    title.className = 'career-title';
    title.textContent = `Career Path ${idx + 1}: ${c.title}`;
    card.appendChild(title);

    if (c.why) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Why suitable:</strong> ${c.why}`;
      card.appendChild(sec);
    }
    if (c.skills) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Required Skills:</strong> ${c.skills}`;
      card.appendChild(sec);
    }
    if (c.resources) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Learning Resources:</strong> ${c.resources}`;
      card.appendChild(sec);
    }

    card.addEventListener('click', () => openPrepForRole(c.title));
    frag.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(frag);
}

async function openPrepForRole(role) {
  const modal = document.getElementById('prepModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  modalTitle.textContent = `Preparation Plan: ${role}`;
  modalContent.textContent = 'Generating preparation plan...';
  modal.style.display = 'flex';

  // Reuse current form values as profile context
  const profile = {
    education: `${document.getElementById('degree').value}, ${document.getElementById('major').value}, ${document.getElementById('gradYear').value}, CGPA ${document.getElementById('cgpa').value}`,
    skills: document.getElementById('skills').value,
    interests: document.getElementById('interests').value,
    careerGoals: `${document.getElementById('goals').value} | Location: ${document.getElementById('location').value} | Timeframe: ${document.getElementById('timeframe').value}`,
  };

  try {
    const data = await postJsonWithFallback('/api/prep', { profile, role });
    if (data.ok) {
      modalContent.textContent = data.body.result || 'No response.';
    } else {
      modalContent.textContent = data.body?.error || data.raw || 'Request failed.';
    }
  } catch (e) {
    modalContent.textContent = 'Failed to fetch preparation plan.';
  }
}

function closeModal() {
  const modal = document.getElementById('prepModal');
  modal.style.display = 'none';
}

async function postJsonWithFallback(path, payload) {
  const headers = { 'Content-Type': 'application/json' };
  // First try same-origin
  try {
    const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(payload) });
    const raw = await res.text();
    let body = {};
    try { body = JSON.parse(raw); } catch (_) {}
    if (res.ok) return { ok: true, body };
    // If 404 on same-origin, try alt port
    if (res.status === 404) {
      const alt = getAltOrigin() + path;
      const res2 = await fetch(alt, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw2 = await res2.text();
      let body2 = {};
      try { body2 = JSON.parse(raw2); } catch (_) {}
      return { ok: res2.ok, body: body2, raw: raw2 };
    }
    return { ok: false, body, raw };
  } catch (err) {
    // Network error → try alt origin
    try {
      const alt = getAltOrigin() + path;
      const res2 = await fetch(alt, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw2 = await res2.text();
      let body2 = {};
      try { body2 = JSON.parse(raw2); } catch (_) {}
      return { ok: res2.ok, body: body2, raw: raw2 };
    } catch (err2) {
      return { ok: false, body: {}, raw: String(err2) };
    }
  }
}

function getAltOrigin() {
  const m = location.origin.match(/:(\d+)$/);
  const port = m ? m[1] : '';
  if (port === '3000') return location.origin.replace(/:(\d+)$/, ':3001');
  if (port === '3001') return location.origin.replace(/:(\d+)$/, ':3000');
  return location.origin; // fallback
}

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize theme
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeChatbot();
  initializeSkillsAnalysis();
  initializeTagSelectors();
  initializeDashboard();
});

function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const themeText = themeToggle.querySelector('.theme-text');
  
  // Apply saved theme
  applyTheme(currentTheme);
  
  // Add click handler
  themeToggle.addEventListener('click', toggleTheme);
  
  // Update button text and icon
  updateThemeButton(themeIcon, themeText);
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  
  applyTheme(currentTheme);
  
  // Update button
  const themeIcon = document.querySelector('.theme-icon');
  const themeText = document.querySelector('.theme-text');
  updateThemeButton(themeIcon, themeText);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeButton(icon, text) {
  if (currentTheme === 'dark') {
    icon.textContent = '☀️';
    text.textContent = 'Light Mode';
  } else {
    icon.textContent = '🌙';
    text.textContent = 'Dark Mode';
  }
}

// Chatbot functionality
let chatHistory = [];

// Initialize chatbot
document.addEventListener('DOMContentLoaded', function() {
  initializeChatbot();
});

function initializeChatbot() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  const exampleQuestions = document.querySelectorAll('.example-question');

  // Send message on Enter key
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  // Send message on button click
  sendBtn.addEventListener('click', sendChatMessage);

  // Add click handlers for example questions
  exampleQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const text = this.textContent.replace(/[""]/g, '');
      chatInput.value = text;
      sendChatMessage();
    });
  });
}

async function sendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  const message = chatInput.value.trim();

  if (!message) return;

  // Disable input and button
  chatInput.disabled = true;
  sendBtn.disabled = true;

  // Add user message to chat
  addMessageToChat('user', message);
  chatInput.value = '';

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // Get AI response
    const response = await getChatResponse(message);
    
    // Remove typing indicator and add AI response
    removeTypingIndicator(typingId);
    addMessageToChat('bot', response);
    
    // Store in chat history
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator(typingId);
    addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.');
  }

  // Re-enable input and button
  chatInput.disabled = false;
  sendBtn.disabled = false;
  chatInput.focus();
}

function addMessageToChat(role, content) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  
  messageDiv.innerHTML = `
    <div class="message-content">
      ${role === 'bot' ? '<strong>AI Mentor:</strong> ' : ''}${content}
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  const typingDiv = document.createElement('div');
  const typingId = 'typing-' + Date.now();
  typingDiv.id = typingId;
  typingDiv.className = 'message bot-message';
  
  typingDiv.innerHTML = `
    <div class="message-content">
      <strong>AI Mentor:</strong> <span class="typing-dots">Thinking...</span>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return typingId;
}

function removeTypingIndicator(typingId) {
  const typingDiv = document.getElementById(typingId);
  if (typingDiv) {
    typingDiv.remove();
  }
}

async function getChatResponse(message) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        chatHistory: chatHistory.slice(-10) // Send last 10 messages for context
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.';
    
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
  
// Skills Gap Analysis functionality
let skillsAnalysisData = null;

// Initialize skills analysis
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeChatbot();
  initializeSkillsAnalysis();
  initializeTagSelectors();
});

function initializeSkillsAnalysis() {
  const analyzeBtn = document.getElementById('analyzeSkillsBtn');
  const generateReportBtn = document.getElementById('generateReportBtn');
  const resetSkillsBtn = document.getElementById('resetSkillsBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', performSkillsAnalysis);
  }

  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', generateDetailedReport);
  }

  if (resetSkillsBtn) {
    resetSkillsBtn.addEventListener('click', resetSkillsAnalysis);
  }

  // Tab functionality
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function performSkillsAnalysis() {
  const currentSkills = document.getElementById('currentSkills').value.trim();
  const targetCareer = document.getElementById('targetCareer').value;
  const experienceLevel = document.getElementById('experienceLevel').value;

  if (!currentSkills || !targetCareer) {
    alert('Please fill in both your current skills and target career path.');
    return;
  }

  // Show loading state
  const analyzeBtn = document.getElementById('analyzeSkillsBtn');
  const originalText = analyzeBtn.innerHTML;
  analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
  analyzeBtn.disabled = true;

  // Parse current skills
  const currentSkillsList = parseSkills(currentSkills);
  
  // Get required skills for target career
  const requiredSkills = getRequiredSkills(targetCareer, experienceLevel);
  
  // Analyze skills gap
  const analysis = analyzeSkillsGap(currentSkillsList, requiredSkills, targetCareer);
  
  // Store analysis data
  skillsAnalysisData = analysis;
  
  // Display results
  displaySkillsResults(analysis);
  
  // Reset button state
  analyzeBtn.innerHTML = originalText;
  analyzeBtn.disabled = false;
}

function parseSkills(skillsText) {
  return skillsText
    .split(/[,\n]/)
    .map(skill => skill.trim().toLowerCase())
    .filter(skill => skill.length > 0);
}

function getRequiredSkills(career, experienceLevel) {
  const skillsDatabase = {
    'data-scientist': {
      beginner: ['python', 'statistics', 'data analysis', 'excel', 'sql', 'mathematics'],
      intermediate: ['machine learning', 'pandas', 'numpy', 'scikit-learn', 'data visualization', 'jupyter'],
      advanced: ['deep learning', 'tensorflow', 'pytorch', 'mlops', 'big data', 'spark']
    },
    'software-developer': {
      beginner: ['programming basics', 'html', 'css', 'javascript', 'git', 'problem solving'],
      intermediate: ['react', 'node.js', 'python', 'java', 'databases', 'apis'],
      advanced: ['system design', 'microservices', 'cloud computing', 'devops', 'testing', 'architecture']
    },
    'product-manager': {
      beginner: ['communication', 'project management', 'market research', 'user research', 'analytics'],
      intermediate: ['agile', 'scrum', 'product strategy', 'data analysis', 'stakeholder management'],
      advanced: ['product vision', 'go-to-market strategy', 'team leadership', 'business strategy', 'metrics']
    },
    'cybersecurity-analyst': {
      beginner: ['networking basics', 'operating systems', 'security fundamentals', 'incident response'],
      intermediate: ['penetration testing', 'vulnerability assessment', 'security tools', 'threat intelligence'],
      advanced: ['security architecture', 'forensics', 'compliance', 'risk management', 'security operations']
    },
    'ai-engineer': {
      beginner: ['python', 'mathematics', 'statistics', 'machine learning basics', 'data structures'],
      intermediate: ['deep learning', 'neural networks', 'tensorflow', 'pytorch', 'nlp', 'computer vision'],
      advanced: ['mlops', 'model deployment', 'ai ethics', 'research', 'optimization', 'distributed systems']
    },
    'devops-engineer': {
      beginner: ['linux', 'bash scripting', 'git', 'networking', 'cloud basics'],
      intermediate: ['docker', 'kubernetes', 'ci/cd', 'aws', 'monitoring', 'automation'],
      advanced: ['infrastructure as code', 'microservices', 'security', 'scaling', 'disaster recovery']
    },
    'ui-ux-designer': {
      beginner: ['design principles', 'user research', 'wireframing', 'prototyping', 'visual design'],
      intermediate: ['figma', 'sketch', 'user testing', 'information architecture', 'interaction design'],
      advanced: ['design systems', 'accessibility', 'design leadership', 'research methods', 'strategy']
    },
    'business-analyst': {
      beginner: ['requirements gathering', 'documentation', 'stakeholder communication', 'process analysis'],
      intermediate: ['data analysis', 'sql', 'business process modeling', 'change management', 'agile'],
      advanced: ['strategic analysis', 'business intelligence', 'data governance', 'enterprise architecture']
    },
    'cloud-architect': {
      beginner: ['cloud fundamentals', 'networking', 'security basics', 'virtualization'],
      intermediate: ['aws', 'azure', 'gcp', 'containerization', 'microservices', 'monitoring'],
      advanced: ['multi-cloud', 'serverless', 'edge computing', 'disaster recovery', 'cost optimization']
    },
    'data-engineer': {
      beginner: ['sql', 'python', 'data modeling', 'etl basics', 'databases'],
      intermediate: ['apache spark', 'hadoop', 'airflow', 'data warehousing', 'streaming'],
      advanced: ['data architecture', 'mlops', 'real-time systems', 'data governance', 'scaling']
    }
  };

  return skillsDatabase[career]?.[experienceLevel] || [];
}

function analyzeSkillsGap(currentSkills, requiredSkills, targetCareer) {
  const existingSkills = currentSkills.filter(skill => 
    requiredSkills.some(required => 
      required.toLowerCase().includes(skill) || skill.includes(required.toLowerCase())
    )
  );

  const missingSkills = requiredSkills.filter(skill => 
    !existingSkills.some(existing => 
      existing.toLowerCase().includes(skill) || skill.includes(existing.toLowerCase())
    )
  );

  const matchPercentage = Math.round((existingSkills.length / requiredSkills.length) * 100);

  return {
    targetCareer,
    currentSkills: currentSkills,
    requiredSkills: requiredSkills,
    existingSkills: existingSkills,
    missingSkills: missingSkills,
    matchPercentage: matchPercentage,
    experienceLevel: document.getElementById('experienceLevel').value
  };
}

function displaySkillsResults(analysis) {
  const resultsDiv = document.getElementById('skillsResults');
  const targetCareerInfo = document.querySelector('.target-career-info');
  
  // Update target career info
  targetCareerInfo.textContent = `Target: ${formatCareerName(analysis.targetCareer)} (${analysis.experienceLevel})`;
  
  // Update metrics
  document.getElementById('currentSkillCount').textContent = analysis.currentSkills.length;
  document.getElementById('requiredSkillCount').textContent = analysis.requiredSkills.length;
  document.getElementById('skillMatchPercentage').textContent = `${analysis.matchPercentage}%`;
  
  // Display existing skills
  const existingSkillsDiv = document.getElementById('existingSkills');
  existingSkillsDiv.innerHTML = analysis.existingSkills.length > 0 
    ? analysis.existingSkills.map(skill => `<span class="skill-tag existing">${skill}</span>`).join('')
    : '<p class="no-skills">No matching skills found</p>';
  
  // Display missing skills
  const missingSkillsDiv = document.getElementById('missingSkills');
  missingSkillsDiv.innerHTML = analysis.missingSkills.length > 0 
    ? analysis.missingSkills.map(skill => `<span class="skill-tag missing">${skill}</span>`).join('')
    : '<p class="no-skills">All required skills covered!</p>';
  
  // Generate learning roadmap
  generateLearningRoadmap(analysis);
  
  // Generate certification recommendations
  generateCertificationRecommendations(analysis);
  
  // Show results
  resultsDiv.style.display = 'block';
  resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function generateLearningRoadmap(analysis) {
  const shortTermRoadmap = document.getElementById('shortTermRoadmap');
  const longTermRoadmap = document.getElementById('longTermRoadmap');
  
  // Short term roadmap (3-6 months)
  const shortTermSkills = analysis.missingSkills.slice(0, Math.ceil(analysis.missingSkills.length / 2));
  shortTermRoadmap.innerHTML = shortTermSkills.map(skill => `
    <div class="roadmap-item">
      <h5>${skill}</h5>
      <p>Focus on building foundational knowledge and practical projects. Allocate 2-3 hours daily for learning and practice.</p>
    </div>
  `).join('');
  
  // Long term roadmap (6-12 months)
  const longTermSkills = analysis.missingSkills.slice(Math.ceil(analysis.missingSkills.length / 2));
  longTermRoadmap.innerHTML = longTermSkills.map(skill => `
    <div class="roadmap-item">
      <h5>${skill}</h5>
      <p>Advanced implementation and real-world applications. Build portfolio projects and seek mentorship opportunities.</p>
    </div>
  `).join('');
}

function generateCertificationRecommendations(analysis) {
  const certificationGrid = document.getElementById('certificationGrid');
  
  const certifications = getCertificationRecommendations(analysis.targetCareer, analysis.experienceLevel);
  
  certificationGrid.innerHTML = certifications.map(cert => `
    <div class="certification-card">
      <h5>${cert.name}</h5>
      <p>${cert.description}</p>
      <div class="certification-meta">
        <span>${cert.provider}</span>
        <span class="certification-price">${cert.price}</span>
      </div>
    </div>
  `).join('');
}

function getCertificationRecommendations(career, experienceLevel) {
  const certifications = {
    'data-scientist': [
      { name: 'Google Data Analytics Professional Certificate', provider: 'Coursera', price: 'Free', description: 'Comprehensive data analysis and visualization skills' },
      { name: 'IBM Data Science Professional Certificate', provider: 'Coursera', price: 'Free', description: 'Python, SQL, and machine learning fundamentals' },
      { name: 'Microsoft Certified: Azure Data Scientist Associate', provider: 'Microsoft', price: '$165', description: 'Advanced ML and AI on Azure platform' }
    ],
    'software-developer': [
      { name: 'Meta Front-End Development Professional Certificate', provider: 'Coursera', price: 'Free', description: 'React, JavaScript, and modern web development' },
      { name: 'AWS Certified Developer Associate', provider: 'AWS', price: '$150', description: 'Cloud development and deployment' },
      { name: 'Google IT Automation with Python', provider: 'Coursera', price: 'Free', description: 'Python programming and automation' }
    ],
    'product-manager': [
      { name: 'Google Project Management Professional Certificate', provider: 'Coursera', price: 'Free', description: 'Project management fundamentals and tools' },
      { name: 'Certified Scrum Product Owner (CSPO)', provider: 'Scrum Alliance', price: '$395', description: 'Agile product management certification' },
      { name: 'Digital Product Management', provider: 'Coursera', price: 'Free', description: 'Modern product management practices' }
    ],
    'cybersecurity-analyst': [
      { name: 'CompTIA Security+', provider: 'CompTIA', price: '$370', description: 'Entry-level cybersecurity certification' },
      { name: 'Certified Ethical Hacker (CEH)', provider: 'EC-Council', price: '$1,199', description: 'Penetration testing and ethical hacking' },
      { name: 'CISSP', provider: 'ISC²', price: '$749', description: 'Advanced cybersecurity management' }
    ],
    'ai-engineer': [
      { name: 'Deep Learning Specialization', provider: 'Coursera', price: 'Free', description: 'Neural networks and deep learning by Andrew Ng' },
      { name: 'TensorFlow Developer Certificate', provider: 'Google', price: '$100', description: 'TensorFlow and ML model development' },
      { name: 'IBM AI Engineering Professional Certificate', provider: 'Coursera', price: 'Free', description: 'Machine learning and AI engineering' }
    ]
  };
  
  return certifications[career] || [
    { name: 'General Professional Development', provider: 'Various', price: 'Free-$500', description: 'Focus on building relevant skills for your target career' }
  ];
}

function switchTab(tabName) {
  // Remove active class from all tabs and content
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab and content
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-content`).classList.add('active');
}

function generateDetailedReport() {
  if (!skillsAnalysisData) return;
  
  const report = generateSkillsReport(skillsAnalysisData);
  
  // Create a new window with the report
  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Skills Gap Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric { display: inline-block; margin: 20px; text-align: center; }
        .metric-value { font-size: 2em; color: #667eea; font-weight: bold; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
        .skill-tag { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .skill-tag.existing { background: #4CAF50; }
        .skill-tag.missing { background: #f093fb; }
        .roadmap-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .certification-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      ${report}
    </body>
    </html>
  `);
  reportWindow.document.close();
}

function generateSkillsReport(analysis) {
  const careerName = formatCareerName(analysis.targetCareer);
  
  return `
    <div class="header">
      <h1>🎯 Skills Gap Analysis Report</h1>
      <h2>${careerName} - ${analysis.experienceLevel}</h2>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
      <h3>📊 Executive Summary</h3>
      <div class="metric">
        <div class="metric-value">${analysis.matchPercentage}%</div>
        <div>Skills Match Rate</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analysis.existingSkills.length}</div>
        <div>Skills You Have</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analysis.missingSkills.length}</div>
        <div>Skills to Develop</div>
      </div>
    </div>
    
    <div class="section">
      <h3>✅ Skills You Already Have</h3>
      <div class="skills-list">
        ${analysis.existingSkills.map(skill => `<span class="skill-tag existing">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="section">
      <h3>🚀 Skills to Develop</h3>
      <div class="skills-list">
        ${analysis.missingSkills.map(skill => `<span class="skill-tag missing">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="section">
      <h3>📚 Learning Roadmap</h3>
      <h4>Short Term (3-6 months)</h4>
      ${analysis.missingSkills.slice(0, Math.ceil(analysis.missingSkills.length / 2)).map(skill => `
        <div class="roadmap-item">
          <h5>${skill}</h5>
          <p>Focus on building foundational knowledge and practical projects.</p>
        </div>
      `).join('')}
      
      <h4>Long Term (6-12 months)</h4>
      ${analysis.missingSkills.slice(Math.ceil(analysis.missingSkills.length / 2)).map(skill => `
        <div class="roadmap-item">
          <h5>${skill}</h5>
          <p>Advanced implementation and real-world applications.</p>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h3>🏆 Recommended Certifications</h3>
      ${getCertificationRecommendations(analysis.targetCareer, analysis.experienceLevel).map(cert => `
        <div class="certification-card">
          <h5>${cert.name}</h5>
          <p><strong>Provider:</strong> ${cert.provider}</p>
          <p><strong>Price:</strong> ${cert.price}</p>
          <p>${cert.description}</p>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h3>💡 Next Steps</h3>
      <ol>
        <li>Prioritize skills based on your timeline and resources</li>
        <li>Start with foundational skills before moving to advanced topics</li>
        <li>Build practical projects to demonstrate your skills</li>
        <li>Consider pursuing relevant certifications</li>
        <li>Network with professionals in your target field</li>
        <li>Regularly reassess your skills and update your learning plan</li>
      </ol>
    </div>
  `;
}

function resetSkillsAnalysis() {
  document.getElementById('currentSkills').value = '';
  document.getElementById('targetCareer').value = '';
  document.getElementById('experienceLevel').value = 'beginner';
  document.getElementById('skillsResults').style.display = 'none';
  skillsAnalysisData = null;
}

function formatCareerName(careerKey) {
  return careerKey
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function initializeTagSelectors() {
  // Career tags
  const careerTags = document.querySelectorAll('#careerTags .tag');
  const careerSelect = document.getElementById('targetCareer');
  careerTags.forEach(tag => {
    tag.addEventListener('click', function() {
      careerTags.forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
      careerSelect.value = tag.dataset.value;
    });
  });

  // Experience tags
  const expTags = document.querySelectorAll('#experienceTags .tag');
  const expSelect = document.getElementById('experienceLevel');
  expTags.forEach(tag => {
    tag.addEventListener('click', function() {
      expTags.forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
      expSelect.value = tag.dataset.value;
    });
  });
}

function initializeDashboard() {
  // Example: Fetch recommendations, skill gap, and job market snapshot (mock/demo)
  const careerList = [
    "Data Analyst",
    "Product Analyst",
    "AI/ML Associate",
    "Software Developer",
    "Cybersecurity Analyst"
  ];
  const skillgapPercent = 40;
  const skillgapCareer = "Data Analyst";
  const jobMarketText = "AI Engineers up by 25% in India this year 🚀";

  // Career Recommendations
  const dashboardCareerList = document.getElementById('dashboardCareerList');
  dashboardCareerList.innerHTML = careerList.map(c => `<li>${c}</li>`).join('');

  // Skill Gap Tracker
  document.getElementById('skillgapPercent').textContent = `${skillgapPercent}%`;
  document.getElementById('skillgapCareer').textContent = skillgapCareer;
  document.getElementById('skillgapBar').style.width = `${skillgapPercent}%`;

  // Job Market Snapshot
  document.getElementById('dashboardJobMarket').textContent = jobMarketText;
}

// Quick Actions
function switchToChatbot() {
  document.querySelector('.chatbot-section').scrollIntoView({ behavior: 'smooth' });
}
function switchToMainForm() {
  document.querySelector('.grid').scrollIntoView({ behavior: 'smooth' });
}
function switchToSkillsAnalysis() {
  document.querySelector('.skills-analysis-section').scrollIntoView({ behavior: 'smooth' });
}
