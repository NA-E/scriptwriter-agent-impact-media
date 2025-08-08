import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const result = await response.json();
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

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        throw new Error(`Research webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      console.error('Research webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Research webhook request failed" 
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
