import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ollama = createOpenAICompatible({
    name: 'ollama',
    baseURL: 'http://localhost:11434/v1',
});

export const aiProvider = customProvider({
    languageModels: {
        'chat-model-reasoning-local': wrapLanguageModel({
            model: ollama('qwen3:4b'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'chat-model-reasoning-prod': wrapLanguageModel({
            model: openai('gpt-5.0-nano'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model-local': wrapLanguageModel({
            model: ollama('qwen3:4b'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model-prod': wrapLanguageModel({
            model: openai('gpt-5.0-nano'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
    },
});
