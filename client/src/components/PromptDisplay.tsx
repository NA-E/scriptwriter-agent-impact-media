import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PromptDisplayProps {
  stepNumber: number;
}

export default function PromptDisplay({ stepNumber }: PromptDisplayProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('prompts')
          .select('user_prompt_text')
          .eq('step_number', stepNumber)
          .eq('is_active', true)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setPrompt(data.user_prompt_text || '');
        }
      } catch (err) {
        console.error('Error fetching prompt:', err);
        setError('Unable to load prompt');
        setPrompt('');
      } finally {
        setLoading(false);
      }
    }

    fetchPrompt();
  }, [stepNumber]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300">Prompt (Edit from Prompts dashboard)</Label>
        <div className="flex items-center space-x-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-gray-400">Loading prompt...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-300">Prompt (Edit from Prompts dashboard)</Label>
        <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">Prompt (Edit from Prompts dashboard)</Label>
      <Textarea
        value={prompt}
        readOnly
        className="h-[360px] bg-gray-700 border-gray-600 text-gray-300 resize-none cursor-default"
        placeholder="No prompt configured"
      />
    </div>
  );
}