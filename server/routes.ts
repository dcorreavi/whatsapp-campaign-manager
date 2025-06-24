import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertContactSchema } from "@shared/schema";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { whatsappService } from "./whatsapp";

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: any;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Get campaign by ID
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Create campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const validated = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validated);
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ message: "Invalid campaign data" });
    }
  });

  // Update campaign
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(id, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Get contacts for campaign
  app.get("/api/campaigns/:id/contacts", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const contacts = await storage.getContactsByCampaign(campaignId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Upload and process file
  app.post("/api/campaigns/:id/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let data: any[] = [];
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

      // Parse CSV
      if (fileExtension === 'csv') {
        const csvText = file.buffer.toString('utf8');
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        data = parsed.data as any[];
      }
      // Parse Excel
      else if (['xlsx', 'xls'].includes(fileExtension!)) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
      }
      else {
        return res.status(400).json({ message: "Unsupported file format. Please upload CSV or Excel files." });
      }

      // Validate required columns
      if (data.length === 0) {
        return res.status(400).json({ message: "File is empty or contains no valid data" });
      }

      // Check for required columns (flexible naming)
      const firstRow = data[0];
      const hasName = 'name' in firstRow;
      const hasPhone = 'phone' in firstRow || 'number' in firstRow;
      
      if (!hasName || !hasPhone) {
        const missing = [];
        if (!hasName) missing.push('name');
        if (!hasPhone) missing.push('phone (or number)');
        return res.status(400).json({ 
          message: `Missing required columns: ${missing.join(', ')}` 
        });
      }

      // Process and validate contacts
      const contacts = data.map(row => {
        const phone = String(row.phone || row.number || '').trim();
        const name = String(row.name || '').trim();
        
        // Basic phone validation
        const isValidPhone = /^[\+]?[1-9][\d]{3,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
        
        return {
          name,
          phone,
          isValid: isValidPhone && name.length > 0,
          campaignId
        };
      }).filter(contact => contact.name && contact.phone);

      // Delete existing contacts for this campaign
      await storage.deleteContactsByCampaign(campaignId);
      
      // Create new contacts
      const createdContacts = await storage.createContacts(contacts);
      
      // Update campaign with contact count
      await storage.updateCampaign(campaignId, { 
        totalContacts: createdContacts.length 
      });

      res.json({ 
        contacts: createdContacts,
        totalCount: createdContacts.length,
        validCount: createdContacts.filter(c => c.isValid).length
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // Start campaign (simulate message sending)
  app.post("/api/campaigns/:id/start", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'draft') {
        return res.status(400).json({ message: "Campaign is not in draft status" });
      }

      const contacts = await storage.getContactsByCampaign(campaignId);
      const validContacts = contacts.filter(c => c.isValid);

      if (validContacts.length === 0) {
        return res.status(400).json({ message: "No valid contacts found" });
      }

      // Update campaign status
      await storage.updateCampaign(campaignId, { status: 'active' });

      // Create message logs for all valid contacts
      for (const contact of validContacts) {
        await storage.createMessageLog({
          campaignId,
          contactId: contact.id,
          status: 'pending'
        });
      }

      res.json({ 
        message: "Campaign started successfully",
        totalContacts: validContacts.length
      });

      // Send real WhatsApp messages in background
      sendWhatsAppMessages(campaignId, validContacts, campaign);

    } catch (error) {
      res.status(500).json({ message: "Failed to start campaign" });
    }
  });

  // Get campaign progress
  app.get("/api/campaigns/:id/progress", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const logs = await storage.getMessageLogsByCampaign(campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      const sent = logs.filter(log => log.status === 'sent').length;
      const failed = logs.filter(log => log.status === 'failed').length;
      const pending = logs.filter(log => log.status === 'pending').length;
      
      res.json({
        total: logs.length,
        sent,
        failed,
        pending,
        status: campaign?.status || 'unknown'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Send real WhatsApp messages
async function sendWhatsAppMessages(campaignId: number, contacts: any[], campaign: any) {
  const delay = campaign.delayBetweenMessages || 10;
  
  for (const contact of contacts) {
    try {
      // Create or find message log entry
      const logs = await storage.getMessageLogsByCampaign(campaignId);
      let logEntry = logs.find(log => log.contactId === contact.id);
      
      if (!logEntry) {
        logEntry = await storage.createMessageLog({
          campaignId,
          contactId: contact.id,
          status: 'pending'
        });
      }

      // Personalize message
      const personalizedMessage = campaign.messageTemplate.replace(/\{name\}/g, contact.name);
      
      // Send WhatsApp message
      const success = await whatsappService.sendMessage(contact.phone, personalizedMessage);
      
      // Update log entry
      await storage.updateMessageLog(logEntry.id, {
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : null,
        error: success ? null : 'Failed to send WhatsApp message'
      });

      // Delay between messages
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
      
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      
      // Update log with error
      const logs = await storage.getMessageLogsByCampaign(campaignId);
      const logEntry = logs.find(log => log.contactId === contact.id);
      
      if (logEntry) {
        await storage.updateMessageLog(logEntry.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  // Mark campaign as completed
  await storage.updateCampaign(campaignId, { status: "completed" });
}
