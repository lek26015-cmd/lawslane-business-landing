import { generateContent } from './gemini-edge';

/**
 * Compatibility layer to replace genkit with native Gemini SDK (Edge compatible)
 */
export const ai = {
  generate: async (options: any) => {
    // Map genkit options to our simplified generateContent
    if (typeof options === 'string') {
      return generateContent({ prompt: options });
    }
    return generateContent({
      prompt: options.prompt,
      system: options.system,
      config: options.config,
    });
  },
  definePrompt: (config: any) => {
    // Return a function that matches the genkit prompt calling signature
    return async (input: any) => {
      let prompt = config.prompt;
      if (typeof prompt === 'string') {
        // Simple template replacement
        for (const key in input) {
          prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), input[key]);
          prompt = prompt.replace(new RegExp(`{{{${key}}}}`, 'g'), input[key]);
        }
      }

      const result = await generateContent({
        prompt: prompt,
        system: config.system,
        output: config.output,
      });

      return { output: result.text, text: result.text };
    };
  },
  defineTool: (config: any, fn: any) => {
    // Minimal mock for tools if needed, but for now we'll just return the function
    return fn;
  }
};
