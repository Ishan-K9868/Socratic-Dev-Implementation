import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client lazily
let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-3-flash-preview (correct model name)
    model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  }
  return model;
}

/**
 * System prompts for different modes
 */
const SYSTEM_PROMPTS = {
  learning: `You are a Socratic coding tutor named SocraticDev. Your teaching philosophy:

1. NEVER give direct answers immediately
2. Ask guiding questions to help the user discover the answer themselves
3. Start with simpler concepts and build up
4. Use analogies to explain complex topics
5. When the user is stuck after 2-3 questions, provide hints
6. Celebrate their discoveries and progress
7. If they ask for the direct answer after trying, provide it with explanation

Format your responses with:
- Clear questions in bold
- Code examples in proper markdown code blocks with language specification
- Key concepts highlighted

Remember: The goal is understanding, not just getting the answer.`,

  building: `You are SocraticDev in Building Mode. Your role:

1. Provide direct, actionable solutions
2. Give complete, working code examples
3. Explain the code briefly but focus on implementation
4. Suggest best practices and optimizations
5. Offer alternative approaches when relevant

Format your responses with:
- Code in proper markdown code blocks with language specification
- Step-by-step instructions when needed
- Brief explanations of key decisions`,

  challenge: `You are a coding challenge generator. Create challenges that:

1. Are clear and unambiguous
2. Have a single correct answer when possible
3. Test understanding, not just syntax recall
4. Include helpful context
5. Scale in difficulty appropriately

Always respond in valid JSON format as specified in the request.`,
};

/**
 * Generate a response from Gemini AI
 * @param {string} prompt - User's message
 * @param {string} mode - 'learning' | 'building' | 'challenge'
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} AI response
 */
export async function generateResponse(prompt, mode = 'learning', history = []) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const geminiModel = getModel();
      const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.learning;

      // Build conversation history for context
      const formattedHistory = history
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const fullPrompt = `${systemPrompt}

${formattedHistory ? `Previous conversation:\n${formattedHistory}\n\n` : ''}User: ${prompt}

Your response:`;

      console.log(`Sending to Gemini API (attempt ${attempt}/${maxRetries})...`);
      const result = await geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      console.log('Gemini API response received');
      return response.text();
    } catch (error) {
      lastError = error;
      console.error(`Gemini API Error (attempt ${attempt}):`, error.message);
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('retry')) {
        const waitMatch = error.message.match(/retry in (\d+)/i);
        const waitTime = waitMatch ? parseInt(waitMatch[1]) * 1000 : 5000;
        
        if (attempt < maxRetries) {
          console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 10000)));
          continue;
        }
      }
      
      // For non-rate-limit errors, don't retry
      if (!error.message?.includes('retry') && !error.message?.includes('429')) {
        break;
      }
    }
  }

  // All retries failed
  if (lastError?.message?.includes('retry') || lastError?.message?.includes('429')) {
    throw new Error('API rate limited. Please wait a moment and try again.');
  }
  throw new Error(`Failed to generate AI response: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Generate a coding challenge
 * @param {string} type - Challenge type
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {string} topic - Optional topic focus
 * @returns {Promise<object>} Challenge object
 */
export async function generateChallenge(type, difficulty = 'medium', topic = '') {
  const geminiModel = getModel();
  
  const challengePrompts = {
    parsons: `Generate a Parsons Problem challenge.
Return JSON with:
{
  "title": "Challenge title",
  "description": "What the code should do",
  "shuffledLines": ["line1", "line2", ...], // Shuffled code lines
  "correctOrder": [0, 2, 1, ...], // Correct indices
  "hints": ["hint1", "hint2"],
  "explanation": "Why this order is correct"
}
Difficulty: ${difficulty}. ${topic ? `Topic: ${topic}` : ''}`,

    codeSurgery: `Generate a Code Surgery (bug fix) challenge.
Return JSON with:
{
  "title": "Challenge title",
  "description": "Describe the expected behavior",
  "buggyCode": "code with bug(s)",
  "language": "javascript",
  "bugs": [{"line": 1, "issue": "description", "fix": "corrected line"}],
  "fixedCode": "complete corrected code",
  "explanation": "Why these were bugs"
}
Difficulty: ${difficulty}. ${topic ? `Topic: ${topic}` : ''}`,

    mentalCompiler: `Generate a Mental Compiler challenge.
Return JSON with:
{
  "title": "Challenge title",
  "code": "code to trace",
  "language": "javascript",
  "expectedOutput": "exact output",
  "steps": ["step 1 explanation", "step 2..."],
  "hints": ["hint1", "hint2"]
}
Difficulty: ${difficulty}. ${topic ? `Topic: ${topic}` : ''}`,

    fillBlanks: `Generate a Fill in the Blanks coding challenge.
Return JSON with:
{
  "title": "Challenge title",
  "description": "What the code should accomplish",
  "codeWithBlanks": "code with ___BLANK_1___ placeholders",
  "blanks": [{"id": "BLANK_1", "answer": "correct value", "hint": "hint"}],
  "language": "javascript",
  "explanation": "Why these are the correct answers"
}
Difficulty: ${difficulty}. ${topic ? `Topic: ${topic}` : ''}`,

    eli5: `Generate an ELI5 (Explain Like I'm 5) coding challenge.
Return JSON with:
{
  "title": "Challenge title",
  "code": "code to explain",
  "language": "javascript",
  "targetAudience": "Complete beginner",
  "keyConceptsToExplain": ["concept1", "concept2"],
  "sampleGoodExplanation": "Example of a good explanation",
  "gradingCriteria": ["criteria1", "criteria2"]
}
Difficulty: ${difficulty}. ${topic ? `Topic: ${topic}` : ''}`,
  };

  const prompt = challengePrompts[type] || challengePrompts.parsons;

  try {
    const result = await geminiModel.generateContent(`${SYSTEM_PROMPTS.challenge}\n\n${prompt}`);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }

    throw new Error('Failed to parse challenge JSON');
  } catch (error) {
    console.error('Challenge generation error:', error);
    throw new Error('Failed to generate challenge');
  }
}

/**
 * Evaluate a user's challenge answer
 * @param {string} type - Challenge type
 * @param {object} challenge - Original challenge
 * @param {any} userAnswer - User's submitted answer
 * @returns {Promise<object>} Evaluation result
 */
export async function evaluateAnswer(type, challenge, userAnswer) {
  const geminiModel = getModel();
  
  const prompt = `Evaluate this ${type} challenge answer.

Challenge: ${JSON.stringify(challenge)}

User's Answer: ${JSON.stringify(userAnswer)}

Return JSON with:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "Detailed feedback",
  "correctAnswer": "The correct answer if wrong",
  "xpEarned": number (0-50 based on performance)
}`;

  try {
    const result = await geminiModel.generateContent(`${SYSTEM_PROMPTS.challenge}\n\n${prompt}`);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }

    throw new Error('Failed to parse evaluation JSON');
  } catch (error) {
    console.error('Answer evaluation error:', error);
    throw new Error('Failed to evaluate answer');
  }
}

export default {
  generateResponse,
  generateChallenge,
  evaluateAnswer,
};
