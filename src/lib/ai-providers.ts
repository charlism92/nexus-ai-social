// AI Provider integrations for bot content generation
// Supports OpenAI, Google Gemini, Azure OpenAI, and custom endpoints

export interface AIProviderConfig {
  provider: 'openai' | 'gemini' | 'azure-openai' | 'copilot-studio' | 'custom';
  apiKey: string;
  model?: string;
  endpoint?: string; // For custom/Azure endpoints
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
}

// Provider configurations
const PROVIDER_DEFAULTS: Record<string, { url: string; model: string }> = {
  'openai': { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  'gemini': { url: 'https://generativelanguage.googleapis.com/v1beta/models', model: 'gemini-2.0-flash' },
  'azure-openai': { url: '', model: 'gpt-4o-mini' }, // endpoint required
  'copilot-studio': { url: '', model: 'copilot' }, // endpoint required
};

export async function callAIProvider(
  config: AIProviderConfig,
  messages: AIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<AIResponse> {
  switch (config.provider) {
    case 'openai':
      return callOpenAI(config, messages, temperature, maxTokens);
    case 'gemini':
      return callGemini(config, messages, temperature, maxTokens);
    case 'azure-openai':
      return callAzureOpenAI(config, messages, temperature, maxTokens);
    case 'copilot-studio':
      return callCopilotStudio(config, messages);
    case 'custom':
      return callCustomEndpoint(config, messages, temperature, maxTokens);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

async function callOpenAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  const model = config.model || PROVIDER_DEFAULTS.openai.model;
  const res = await fetch(PROVIDER_DEFAULTS.openai.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return { content: data.choices[0].message.content, provider: 'openai', model };
}

async function callGemini(
  config: AIProviderConfig,
  messages: AIMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  const model = config.model || PROVIDER_DEFAULTS.gemini.model;
  const url = `${PROVIDER_DEFAULTS.gemini.url}/${model}:generateContent?key=${config.apiKey}`;

  // Convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return { content: data.candidates[0].content.parts[0].text, provider: 'gemini', model };
}

async function callAzureOpenAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  if (!config.endpoint) throw new Error('Azure OpenAI requires an endpoint URL');
  const model = config.model || PROVIDER_DEFAULTS['azure-openai'].model;

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({ messages, temperature, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`Azure OpenAI API error: ${res.status}`);
  const data = await res.json();
  return { content: data.choices[0].message.content, provider: 'azure-openai', model };
}

async function callCopilotStudio(
  config: AIProviderConfig,
  messages: AIMessage[]
): Promise<AIResponse> {
  if (!config.endpoint) throw new Error('Copilot Studio requires a bot endpoint URL');

  const lastMessage = messages[messages.length - 1]?.content || '';
  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: lastMessage }),
  });

  if (!res.ok) throw new Error(`Copilot Studio error: ${res.status}`);
  const data = await res.json();
  const content = data.text || data.message || data.response || JSON.stringify(data);
  return { content, provider: 'copilot-studio', model: 'copilot' };
}

async function callCustomEndpoint(
  config: AIProviderConfig,
  messages: AIMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  if (!config.endpoint) throw new Error('Custom provider requires an endpoint URL');

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ messages, temperature, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`Custom API error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || data.text || data.response || '';
  return { content, provider: 'custom', model: config.model || 'custom' };
}

// Helper: Generate a bot post using AI
export async function generateBotPost(
  config: AIProviderConfig,
  botName: string,
  personality: string,
  instructions: string,
  temperature: number = 0.7
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are ${botName}, a social media bot on the NEXUS platform. ${instructions}. 
Your personality: ${personality}. 
Write a single engaging social media post (max 280 characters). Be authentic to your personality. Include relevant hashtags. Do NOT use quotes around the post.`,
    },
    { role: 'user', content: 'Write a new post for the NEXUS feed.' },
  ];

  const response = await callAIProvider(config, messages, temperature);
  return response.content.trim();
}

// Helper: Generate a bot comment using AI
export async function generateBotComment(
  config: AIProviderConfig,
  botName: string,
  personality: string,
  instructions: string,
  originalPost: string,
  temperature: number = 0.7
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are ${botName}, a social media bot on the NEXUS platform. ${instructions}.
Your personality: ${personality}.
Write a short, authentic reply to the post below. Stay in character. Max 200 characters.`,
    },
    { role: 'user', content: `Reply to this post: "${originalPost}"` },
  ];

  const response = await callAIProvider(config, messages, temperature);
  return response.content.trim();
}

export const AI_PROVIDER_OPTIONS = [
  { value: 'nexus-v4', label: 'NEXUS Templates', desc: 'Built-in content (no API key needed)', external: false },
  { value: 'nexus-creative', label: 'NEXUS Creative', desc: 'Creative templates (no API key needed)', external: false },
  { value: 'nexus-reasoning', label: 'NEXUS Reasoning', desc: 'Analytical templates (no API key needed)', external: false },
  { value: 'openai', label: 'OpenAI (GPT-4o)', desc: 'Requires OpenAI API key', external: true },
  { value: 'gemini', label: 'Google Gemini', desc: 'Requires Gemini API key', external: true },
  { value: 'azure-openai', label: 'Azure OpenAI', desc: 'Requires Azure endpoint + key', external: true },
  { value: 'copilot-studio', label: 'Copilot Studio', desc: 'Requires bot endpoint URL', external: true },
  { value: 'custom', label: 'Custom API', desc: 'Any OpenAI-compatible endpoint', external: true },
];
