# Vercel AI SDK Patterns

## Basic Setup

### AI Provider Configuration
```typescript
// lib/ai.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

// Default provider
export const ai = openai('gpt-4o');

// Custom provider
export const customAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

// Multiple providers
export const providers = {
  openai: openai('gpt-4o'),
  anthropic: anthropic('claude-3-opus-20240229'),
};
```

### Streaming Chat
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    temperature: 0.7,
    maxTokens: 1000,
    
    onFinish: ({ text, usage, finishReason }) => {
      // Log usage
      console.log('Tokens used:', usage.totalTokens);
      console.log('Finish reason:', finishReason);
    },
  });
  
  return result.toDataStreamResponse();
}
```

### Tool Calling
```typescript
// tools/weather.ts
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ location, unit = 'celsius' }) => {
    const weather = await fetchWeather(location);
    return {
      location,
      temperature: weather.temp,
      unit,
      description: weather.description,
    };
  },
});

// Usage
const result = await generateText({
  model: openai('gpt-4o'),
  messages,
  tools: {
    weather: weatherTool,
  },
  maxSteps: 5,
});
```

### Embeddings
```typescript
// lib/embeddings.ts
import { embedMany, embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  
  return embedding;
}

export async function generateEmbeddings(texts: string[]) {
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: texts,
  });
  
  return embeddings;
}
```