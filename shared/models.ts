// OpenRouter API configuration and model management

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
  };
}

export interface FormattedModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  provider: string;
}

// Allowed providers for our application
export const ALLOWED_PROVIDERS = ['openai', 'google', 'anthropic', 'perplexity'];

// Default models for each workflow step
export const DEFAULT_MODELS = {
  1: 'anthropic/claude-3.5-sonnet-20241022', // Transcript Analysis
  2: 'perplexity/llama-3.1-sonar-large-128k-online', // Research  
  3: 'anthropic/claude-3-opus-20240229'  // Script Outline
};

// Extract provider from model ID
export function getProviderFromModelId(modelId: string): string {
  return modelId.split('/')[0];
}

// Format models for dropdown display
export function formatModelsForDropdown(models: OpenRouterModel[]): FormattedModel[] {
  return models.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    context_length: model.context_length,
    pricing: model.pricing,
    provider: getProviderFromModelId(model.id)
  }));
}

// Filter models by allowed providers
export function filterModelsByProvider(models: FormattedModel[]): FormattedModel[] {
  return models.filter(model => 
    ALLOWED_PROVIDERS.includes(model.provider)
  );
}

// Fetch models from OpenRouter API
export async function fetchOpenRouterModels(): Promise<FormattedModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'A Impact Media - YouTube Script Writer Agent'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const formattedModels = formatModelsForDropdown(data.data);
    return filterModelsByProvider(formattedModels);
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    throw error;
  }
}

// Get step name for display
export function getStepName(stepNumber: number): string {
  switch (stepNumber) {
    case 1: return 'Transcript Analysis';
    case 2: return 'Research';
    case 3: return 'Script Outline';
    default: return 'Unknown Step';
  }
}