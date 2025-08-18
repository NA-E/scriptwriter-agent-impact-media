import { Express } from "express";
import { WEBHOOK_TIMEOUT_MS } from "../shared/constants";

export function registerRoutes(app: Express): void {
  // Webhook endpoint for transcript analysis
  app.post("/api/webhook/transcript-analysis", async (req, res) => {
    try {
      const webhookUrl = process.env.TRANSCRIPT_ANALYSIS_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return res.status(500).json({ 
          success: false, 
          message: "Webhook URL not configured" 
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Log detailed error information for debugging
        const responseText = await response.text();
        const headers = Object.fromEntries(response.headers.entries());
        console.error('Webhook failed with status:', response.status);
        console.error('Response headers:', JSON.stringify(headers, null, 2));
        console.error('Response body:', responseText);
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transcript analysis webhook response:', JSON.stringify(result, null, 2));
      console.log('Cost data in transcript response - cost:', result.cost, 'processing_cost:', result.processing_cost, 'price:', result.price);
      res.json(result);
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Webhook request failed" 
      });
    }
  });

  // Webhook endpoint for research
  app.post("/api/webhook/research", async (req, res) => {
    try {
      const webhookUrl = process.env.RESEARCH_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return res.status(500).json({ 
          success: false, 
          message: "Research webhook URL not configured" 
        });
      }

      // Set timeout for research webhook
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      console.log('Research webhook URL:', webhookUrl);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Making POST request with 5 minute timeout...');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Research webhook response status:', response.status);

      if (!response.ok) {
        // Log detailed error information for debugging
        const responseText = await response.text();
        const headers = Object.fromEntries(response.headers.entries());
        console.error('Research webhook failed with status:', response.status);
        console.error('Response headers:', JSON.stringify(headers, null, 2));
        console.error('Response body:', responseText);
        throw new Error(`Research webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Research webhook response:', JSON.stringify(result, null, 2));
      console.log('Cost data in research response - cost:', result.cost, 'processing_cost:', result.processing_cost, 'price:', result.price);
      res.json(result);
    } catch (error: any) {
      console.error('Research webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Research webhook request failed" 
      });
    }
  });

  // Webhook endpoint for outline generation  
  app.post("/api/webhook/outline-generation", async (req, res) => {
    try {
      const webhookUrl = process.env.OUTLINE_GENERATION_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return res.status(500).json({ 
          success: false, 
          message: "Outline generation webhook URL not configured" 
        });
      }

      console.log('Outline generation webhook URL:', webhookUrl);
      console.log('Request method: POST');
      console.log('Request headers:', { 'Content-Type': 'application/json' });
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Making POST request to external webhook...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('External webhook response received - Status:', response.status);
      console.log('Response method validation - sent POST, received status:', response.status);

      console.log('Outline generation response status:', response.status);
      console.log('Outline generation response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Log detailed error information for debugging
        const responseText = await response.text();
        const headers = Object.fromEntries(response.headers.entries());
        console.error('Outline generation webhook failed with status:', response.status);
        console.error('Response headers:', JSON.stringify(headers, null, 2));
        console.error('Response body:', responseText);
        throw new Error(`Outline generation webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Outline generation success result:', JSON.stringify(result, null, 2));
      console.log('Cost data in outline response - cost:', result.cost, 'processing_cost:', result.processing_cost, 'price:', result.price);
      res.json(result);
    } catch (error: any) {
      console.error('Outline generation webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Outline generation webhook request failed" 
      });
    }
  });

  // Get all active prompts
  app.get("/api/prompts", async (req, res) => {
    try {
      // This is a placeholder - in a real implementation, you would connect to your database
      // For now, return a success response
      res.json({ 
        success: true, 
        message: "Prompts endpoint ready - connect to database to fetch actual data",
        data: []
      });
    } catch (error: any) {
      console.error('Get prompts error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch prompts" 
      });
    }
  });

  // Update prompt with version control
  app.put("/api/prompts/:stepNumber", async (req, res) => {
    try {
      const { stepNumber } = req.params;
      const { user_prompt_text } = req.body;
      
      if (!stepNumber || !user_prompt_text) {
        return res.status(400).json({ 
          success: false, 
          message: "Step number and prompt text are required" 
        });
      }

      // This is a placeholder for the transaction implementation
      // In a real implementation, you would:
      // 1. Get current version number
      // 2. Update current prompt to is_active = false
      // 3. Insert new prompt with version + 1 and is_active = true
      
      console.log('Update prompt request:', { stepNumber, user_prompt_text });
      
      res.json({ 
        success: true, 
        message: "Prompt update endpoint ready - implement database transaction",
        data: { stepNumber, user_prompt_text }
      });
    } catch (error: any) {
      console.error('Update prompt error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update prompt" 
      });
    }
  });

  // Delete project endpoint (existing)
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: "Project ID is required" 
        });
      }

      // For now, just return success (since we're using Supabase on frontend)
      // The actual deletion will be handled by the frontend
      res.json({ 
        success: true, 
        message: "Project deletion endpoint ready" 
      });
    } catch (error: any) {
      console.error('Delete project error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to delete project" 
      });
    }
  });
}