// Basic fetch to get all available models
async function fetchOpenRouterModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${YOUR_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Optional headers for app attribution
        'HTTP-Referer': 'https://your-site.com', // Your site URL
        'X-Title': 'Your App Name' // Your app name
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data; // Returns array of model objects
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

// Function to extract provider from model ID
function getProviderFromModelId(modelId) {
  return modelId.split('/')[0];
}

// Function to format models for dropdown use
function formatModelsForDropdown(models) {
  return models.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    context_length: model.context_length,
    pricing: model.pricing,
    top_provider: model.top_provider,
    provider: getProviderFromModelId(model.id) // Extract provider
  }));
}

// Function to filter models by provider
function filterModelsByProvider(models, providers) {
  if (!providers || providers.length === 0) return models;
  
  return models.filter(model => {
    const provider = getProviderFromModelId(model.id);
    return providers.includes(provider);
  });
}

// Function to get unique providers from models list
function getUniqueProviders(models) {
  const providers = models.map(model => getProviderFromModelId(model.id));
  return [...new Set(providers)].sort();
}


// Example usage with provider filtering
async function populateModelDropdown(selectedProviders = []) {
  try {
    const models = await fetchOpenRouterModels();
    let formattedModels = formatModelsForDropdown(models);
    
    // Filter by specific providers if specified
    if (selectedProviders.length > 0) {
      formattedModels = filterModelsByProvider(formattedModels, selectedProviders);
    }
    
    // Example: populate a select element
    const dropdown = document.getElementById('model-dropdown');
    dropdown.innerHTML = '<option value="">Select a model</option>';
    
    formattedModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = `${model.provider}/${model.name} (${model.context_length} tokens)`;
      option.title = model.description;
      dropdown.appendChild(option);
    });
    
    console.log(`Loaded ${formattedModels.length} models from providers: ${selectedProviders.join(', ') || 'all'}`);
  } catch (error) {
    console.error('Failed to populate dropdown:', error);
  }
}

// Example: Filter to only show OpenAI and Anthropic models
async function showOnlyOpenAIAndAnthropic() {
  await populateModelDropdown(['openai', 'anthropic']);
}


// React component example with provider filtering
function ModelDropdown({ allowedProviders = [] }) {
  const [models, setModels] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedModel, setSelectedModel] = React.useState('');
  const [availableProviders, setAvailableProviders] = React.useState([]);

  React.useEffect(() => {
    async function loadModels() {
      try {
        const modelData = await fetchOpenRouterModels();
        let formatted = formatModelsForDropdown(modelData);
        
        // Get unique providers for reference
        const providers = getUniqueProviders(formatted);
        setAvailableProviders(providers);
        
        // Filter by allowed providers if specified
        if (allowedProviders.length > 0) {
          formatted = filterModelsByProvider(formatted, allowedProviders);
        }
        
        setModels(formatted);
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadModels();
  }, [allowedProviders]);

  if (loading) {
    return <div>Loading models...</div>;
  }

  return (
    <div>
      <select 
        value={selectedModel} 
        onChange={(e) => setSelectedModel(e.target.value)}
        className="model-dropdown"
      >
        <option value="">Select a model</option>
        {models.map(model => (
          <option key={model.id} value={model.id} title={model.description}>
            {model.provider}/{model.name} ({model.context_length} tokens)
          </option>
        ))}
      </select>
      <p>{models.length} models available</p>
    </div>
  );
}

// Usage examples:
// <ModelDropdown /> // Shows all models
// <ModelDropdown allowedProviders={['openai', 'anthropic']} /> // Only OpenAI and Anthropic
// <ModelDropdown allowedProviders={['openai']} /> // Only OpenAI models

// Common provider filtering examples
const PROVIDER_FILTERS = {
  MAJOR_PROVIDERS: ['openai', 'anthropic', 'google', 'perplexity'],
  OPEN_SOURCE: ['meta-llama', 'mistralai', 'microsoft'],
  REASONING_MODELS: ['openai', 'anthropic'], // For models with advanced reasoning
  COST_EFFECTIVE: ['meta-llama', 'mistralai', 'google'],
  ALL_PROVIDERS: [] // Empty array = no filtering
};

// Example: Create separate dropdowns for different use cases
async function createCategorizedDropdowns() {
  const models = await fetchOpenRouterModels();
  const formattedModels = formatModelsForDropdown(models);
  
  // Create dropdown for major commercial providers
  const majorProviderModels = filterModelsByProvider(formattedModels, PROVIDER_FILTERS.MAJOR_PROVIDERS);
  console.log('Major provider models:', majorProviderModels.length);
  
  // Create dropdown for open source models
  const openSourceModels = filterModelsByProvider(formattedModels, PROVIDER_FILTERS.OPEN_SOURCE);
  console.log('Open source models:', openSourceModels.length);
}