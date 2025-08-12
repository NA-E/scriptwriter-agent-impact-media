import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const WEBHOOK_TIMEOUT_MS = 720000; // 12 minutes - single source of truth

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

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
        const errorText = await response.text();
        console.log('Outline generation error response:', errorText);
        throw new Error(`Outline generation webhook request failed: ${response.status} - ${errorText}`);
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

  // Delete project endpoint
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

  const httpServer = createServer(app);

  return httpServer;
}
