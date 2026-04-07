// ============================================================
// SMARTNOTE — AI Prompts for Knowledge Extraction
// ============================================================

export const PROMPTS = {
  analyzeContent: (text: string) => `
You are a knowledge extraction system. Analyze the following text and create a structured knowledge hierarchy.

TEXT:
"""
${text.slice(0, 8000)}
"""

Create a JSON object with this exact structure:
{
  "title": "Main title of the content",
  "summary": "A comprehensive 2-3 sentence summary",
  "topics": [
    {
      "id": "topic-1",
      "name": "Topic Name",
      "summary": "Brief topic summary",
      "content": "Detailed explanation of the topic",
      "keyConcepts": ["concept1", "concept2"],
      "subtopics": [
        {
          "id": "subtopic-1-1",
          "name": "Subtopic Name",
          "summary": "Brief subtopic summary",
          "content": "Detailed explanation",
          "keyConcepts": ["concept1"],
          "subtopics": []
        }
      ]
    }
  ]
}

Extract ALL major topics and their subtopics. Be thorough and detailed.`,

  generateQuiz: (topic: string, content: string, count: number = 5) => `
Generate a quiz about "${topic}" based on this content:

"""
${content.slice(0, 4000)}
"""

Create ${count} questions as a JSON array with this structure:
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "Question text",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ...",
    "explanation": "Why this is correct",
    "difficulty": "easy"
  },
  {
    "id": "q2",
    "type": "true-false",
    "question": "Statement to evaluate",
    "options": ["True", "False"],
    "correctAnswer": "True",
    "explanation": "Explanation",
    "difficulty": "medium"
  },
  {
    "id": "q3",
    "type": "short-answer",
    "question": "Question requiring short answer",
    "correctAnswer": "Expected answer",
    "explanation": "Detailed explanation",
    "difficulty": "hard"
  }
]

Mix question types. Include at least 2 multiple-choice, 1 true-false, and 1 short-answer.`,

  generateFlashcards: (topic: string, content: string, count: number = 10) => `
Generate ${count} flashcards about "${topic}" from this content:

"""
${content.slice(0, 4000)}
"""

Return a JSON array:
[
  {
    "id": "f1",
    "front": "Question or term",
    "back": "Answer or definition",
    "difficulty": "easy"
  }
]

Make them concise and useful for studying. Cover key concepts.`,

  explainTopic: (topic: string, context: string) => `
Explain "${topic}" in detail based on this context:

"""
${context.slice(0, 4000)}
"""

Provide a clear, comprehensive explanation suitable for a student. Include examples where possible.`,

  simplifyTopic: (topic: string, content: string) => `
Simplify the following explanation of "${topic}" to make it easy for a beginner to understand:

"""
${content.slice(0, 3000)}
"""

Use simple language, analogies, and short sentences. Make it accessible.`,

  generateStudyPlan: (topics: string[], weakTopics: string[]) => `
Create a study plan for these topics: ${topics.join(', ')}

${weakTopics.length > 0 ? `The student is weak in: ${weakTopics.join(', ')}` : ''}

Return a JSON object:
{
  "plan": [
    {
      "day": 1,
      "focus": "Topic name",
      "duration": "30 minutes",
      "activities": ["Read chapter", "Do flashcards"],
      "priority": "high"
    }
  ],
  "totalDays": 7,
  "advice": "General study advice"
}

Prioritize weak topics. Create a realistic 7-day plan.`,

  generateSummary: (text: string) => `
Create a comprehensive structured summary of this content:

"""
${text.slice(0, 8000)}
"""

Format as clean HTML with:
- A main title in <h1>
- Section headers in <h2>
- Key points in <ul><li>
- Important terms in <strong>
- Side notes in <aside> tags
- Clean paragraphs in <p>

Make it well-organized and study-friendly.`,

  generateDocument: (tree: string) => `
Based on this knowledge tree structure:

"""
${tree}
"""

Generate a beautifully formatted study document as HTML. Include:
- Title page section
- Table of contents
- Each topic as a major section with <h2>
- Subtopics as <h3>
- Key concepts highlighted
- Side notes with explanations in <aside class="sidenote">
- Summary bullet points for each section
- Clean, academic formatting

Use semantic HTML. Make it suitable for PDF export.`,
};
