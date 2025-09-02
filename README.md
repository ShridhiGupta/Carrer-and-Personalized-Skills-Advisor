# AI Personal Career Advisor

An intelligent career guidance platform that combines conversational AI mentoring with detailed career analysis and skills gap assessment.

## Features

### 💬 AI Career Mentor Chat
- **Conversational Career Guidance**: Ask questions like "What career suits me if I like coding but not maths?"
- **Scenario Simulation**: Compare career paths like "Data Science vs. Cybersecurity - where will I be in 5 years?"
- **Contextual Responses**: AI remembers conversation history for personalized advice
- **Example Questions**: Click on suggested questions to get started quickly

### 🔍 Skills Gap Analysis
- **Personalized Skills Assessment**: Compare your current skills vs. required skills for target careers
- **Intelligent Gap Identification**: AI-powered analysis of skills overlap and missing competencies
- **Learning Roadmaps**: Short-term (3-6 months) and long-term (6-12 months) skill development plans
- **Certification Recommendations**: Curated list of relevant certifications from Google, AWS, Coursera, NPTEL, and more
- **Experience-Based Analysis**: Tailored recommendations based on beginner, intermediate, or advanced levels
- **Detailed Reports**: Generate comprehensive PDF-style reports for offline reference

### 📊 Detailed Career Analysis
- **Profile-Based Recommendations**: Get top 3 career paths based on your complete profile
- **Skills Assessment**: Identify required skills and learning resources for each path
- **Preparation Plans**: 90-day roadmaps with portfolio projects and milestones
- **Indian Job Market Focus**: Tailored advice considering local industry trends

### 🌙 Dark Mode Support
- **Theme Toggle**: Switch between light and dark modes with a single click
- **Persistent Settings**: Your theme preference is saved and restored automatically
- **Responsive Design**: Beautiful UI that adapts to both light and dark themes
- **Eye-Friendly**: Reduce eye strain with carefully crafted dark mode colors

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the application**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Access the application**:
   Open `http://localhost:3000` (or `http://localhost:3002` for dev mode) in your browser

## Usage

### Chat Mode
- Simply type your career questions in the chat interface
- Ask about specific skills, career comparisons, or general guidance
- The AI will provide contextual, actionable advice

### Skills Gap Analysis
- **Input Your Skills**: List your current skills (separated by commas or new lines)
- **Select Target Career**: Choose from 10+ career paths (Data Scientist, Software Developer, Product Manager, etc.)
- **Set Experience Level**: Beginner (0-1 years), Intermediate (1-3 years), or Advanced (3+ years)
- **Get Analysis**: Receive comprehensive skills assessment with match percentage
- **View Roadmap**: Access personalized learning timelines and resource recommendations
- **Explore Certifications**: Discover relevant certifications with pricing and provider information
- **Generate Reports**: Create detailed offline reports for your career planning

### Profile Analysis Mode
- Fill out your complete profile (education, skills, interests, goals)
- Get comprehensive career path recommendations
- Request detailed preparation plans for specific roles

### Theme Switching
- Click the theme toggle button (🌙/☀️) in the top-right corner
- Switch between light and dark modes instantly
- Your preference is automatically saved for future visits

## API Endpoints

- `POST /api/chat` - Conversational career mentoring
- `POST /api/skills-analysis` - Skills gap analysis and learning roadmaps
- `POST /api/advice` - Profile-based career advice
- `POST /api/prep` - Detailed preparation plans

## Supported Career Paths

The Skills Gap Analysis covers 10+ career paths:
- **Data Scientist** - ML, statistics, data analysis
- **Software Developer** - Programming, web development, system design
- **Product Manager** - Strategy, analytics, stakeholder management
- **Cybersecurity Analyst** - Security, networking, incident response
- **AI Engineer** - Machine learning, deep learning, MLOps
- **DevOps Engineer** - Infrastructure, automation, cloud computing
- **UI/UX Designer** - Design principles, user research, prototyping
- **Business Analyst** - Requirements, process analysis, data interpretation
- **Cloud Architect** - Multi-cloud, serverless, infrastructure design
- **Data Engineer** - Data pipelines, warehousing, ETL processes

## Technologies Used

- **Backend**: Node.js, Express
- **AI Integration**: Google Gemini API for enhanced analysis
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with animations, responsive design, and theme support
- **State Management**: LocalStorage for theme persistence
- **Skills Database**: Comprehensive skills mapping for 10+ career paths

## Example Questions

Try asking the AI mentor:
- "What skills do I need for a career in AI?"
- "Should I choose web development or mobile app development?"
- "What's the job market like for data analysts in India?"
- "How do I transition from engineering to product management?"

## Skills Gap Analysis Example

**Input:**
- Current Skills: "Python, Excel, Communication, Problem Solving"
- Target Career: "Data Scientist"
- Experience Level: "Beginner"

**Output:**
- Skills Match: 40%
- Existing Skills: Python, Communication, Problem Solving
- Missing Skills: SQL, Machine Learning, Statistics, Data Visualization
- Learning Roadmap: 3-6 months for SQL and ML basics, 6-12 months for advanced topics
- Certifications: Google Data Analytics, IBM Data Science, Microsoft Azure ML

## Contributing

Feel free to submit issues and enhancement requests!