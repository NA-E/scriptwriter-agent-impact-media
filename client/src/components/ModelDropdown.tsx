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
        <Label className="text-gray-300">Model</Label>
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
        <Label className="text-gray-300">Model</Label>
        <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  // Sort models alphabetically for clean display
  const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">Model</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {sortedModels.map(model => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
            >
              {model.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}