import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

export interface GenerateOptions {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; content: Array<{ text: string }> }>;
  system?: string;
  tools?: any[];
  output?: { schema: any };
  config?: {
    temperature?: number;
    topP?: number;
    topK?: number;
  };
}

export async function generateContent(options: GenerateOptions) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: options.system,
    generationConfig: options.config,
  });

  // Handle simple generation or history
  if (options.history && options.history.length > 0) {
    const chat = model.startChat({
      history: options.history.map(h => ({
        role: h.role,
        parts: h.content.map(c => ({ text: c.text })),
      })),
    });
    const result = await chat.sendMessage(options.prompt);
    return { text: result.response.text() };
  } else {
    const result = await model.generateContent(options.prompt);
    return { text: result.response.text() };
  }
}
