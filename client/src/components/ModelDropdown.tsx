import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { fetchOpenRouterModels, type FormattedModel } from '@shared/models';

interface ModelDropdownProps {
  value: string;
  onChange: (value: string) => void;
  stepNumber: number;
  disabled?: boolean;
}

export default function ModelDropdown({ value, onChange, stepNumber, disabled = false }: ModelDropdownProps) {
  const [models, setModels] = useState<FormattedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        setLoading(true);
        setError(null);
        const fetchedModels = await fetchOpenRouterModels();
        setModels(fetchedModels);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load models. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300">AI Model</Label>
        <div className="flex items-center space-x-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-gray-400">Loading models...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300">AI Model</Label>
        <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  // Group models by provider for better organization
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, FormattedModel[]>);

  const providerOrder = ['openai', 'anthropic', 'google', 'perplexity'];
  const sortedProviders = providerOrder.filter(provider => groupedModels[provider]);

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">
        AI Model for Step {stepNumber}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {sortedProviders.map(provider => (
            <div key={provider}>
              <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {provider}
              </div>
              {groupedModels[provider].map(model => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{model.id}</span>
                    <span className="text-xs text-gray-400 truncate">
                      {model.name} • {model.context_length.toLocaleString()} tokens
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
      {models.length > 0 && (
        <p className="text-xs text-gray-500">
          {models.length} models available from {sortedProviders.length} providers
        </p>
      )}
    </div>
  );
}