import { contacts, campaigns, messageLog, type Contact, type Campaign, type MessageLog, type InsertContact, type InsertCampaign, type InsertMessageLog } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Campaigns
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  
  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByCampaign(campaignId: number): Promise<Contact[]>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  deleteContactsByCampaign(campaignId: number): Promise<void>;
  
  // Message Log
  createMessageLog(log: InsertMessageLog): Promise<MessageLog>;
  getMessageLogsByCampaign(campaignId: number): Promise<MessageLog[]>;
  updateMessageLog(id: number, updates: Partial<MessageLog>): Promise<MessageLog | undefined>;
}

export class MemStorage implements IStorage {
  private campaigns: Map<number, Campaign>;
  private contacts: Map<number, Contact>;
  private messageLogs: Map<number, MessageLog>;
  private currentCampaignId: number;
  private currentContactId: number;
  private currentMessageLogId: number;

  constructor() {
    this.campaigns = new Map();
    this.contacts = new Map();
    this.messageLogs = new Map();
    this.currentCampaignId = 1;
    this.currentContactId = 1;
    this.currentMessageLogId = 1;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      createdAt: new Date(),
      sentCount: 0,
      status: insertCampaign.status || 'draft',
      delayBetweenMessages: insertCampaign.delayBetweenMessages || 10,
      totalContacts: insertCampaign.totalContacts || 0,
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updated = { ...campaign, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByCampaign(campaignId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.campaignId === campaignId);
  }

  async createContacts(insertContacts: InsertContact[]): Promise<Contact[]> {
    const contacts: Contact[] = [];
    for (const insertContact of insertContacts) {
      const id = this.currentContactId++;
      const contact: Contact = {
        ...insertContact,
        id,
        campaignId: insertContact.campaignId || null,
        isValid: insertContact.isValid !== undefined ? insertContact.isValid : true,
      };
      this.contacts.set(id, contact);
      contacts.push(contact);
    }
    return contacts;
  }

  async deleteContactsByCampaign(campaignId: number): Promise<void> {
    const contactsToDelete: number[] = [];
    this.contacts.forEach((contact, id) => {
      if (contact.campaignId === campaignId) {
        contactsToDelete.push(id);
      }
    });
    contactsToDelete.forEach(id => this.contacts.delete(id));
  }

  async createMessageLog(insertLog: InsertMessageLog): Promise<MessageLog> {
    const id = this.currentMessageLogId++;
    const log: MessageLog = {
      ...insertLog,
      id,
      sentAt: null,
      error: insertLog.error || null,
    };
    this.messageLogs.set(id, log);
    return log;
  }

  async getMessageLogsByCampaign(campaignId: number): Promise<MessageLog[]> {
    return Array.from(this.messageLogs.values()).filter(log => log.campaignId === campaignId);
  }

  async updateMessageLog(id: number, updates: Partial<MessageLog>): Promise<MessageLog | undefined> {
    const log = this.messageLogs.get(id);
    if (!log) return undefined;
    
    const updated = { ...log, ...updates };
    this.messageLogs.set(id, updated);
    return updated;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Campaigns
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaigns(): Promise<Campaign[]> {
    const result = await db.select().from(campaigns).orderBy(campaigns.id);
    return result;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...insertCampaign,
        status: insertCampaign.status || 'draft',
        delayBetweenMessages: insertCampaign.delayBetweenMessages || 10,
        totalContacts: insertCampaign.totalContacts || 0,
        sentCount: 0,
      })
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  // Contacts
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactsByCampaign(campaignId: number): Promise<Contact[]> {
    const result = await db.select().from(contacts).where(eq(contacts.campaignId, campaignId));
    return result;
  }

  async createContacts(insertContacts: InsertContact[]): Promise<Contact[]> {
    if (insertContacts.length === 0) return [];
    
    const result = await db
      .insert(contacts)
      .values(insertContacts.map(contact => ({
        ...contact,
        campaignId: contact.campaignId || null,
        isValid: contact.isValid !== undefined ? contact.isValid : true,
      })))
      .returning();
    return result;
  }

  async deleteContactsByCampaign(campaignId: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.campaignId, campaignId));
  }

  // Message Log
  async createMessageLog(insertLog: InsertMessageLog): Promise<MessageLog> {
    const [log] = await db
      .insert(messageLog)
      .values({
        ...insertLog,
        error: insertLog.error || null,
      })
      .returning();
    return log;
  }

  async getMessageLogsByCampaign(campaignId: number): Promise<MessageLog[]> {
    const result = await db.select().from(messageLog).where(eq(messageLog.campaignId, campaignId));
    return result;
  }

  async updateMessageLog(id: number, updates: Partial<MessageLog>): Promise<MessageLog | undefined> {
    const [log] = await db
      .update(messageLog)
      .set(updates)
      .where(eq(messageLog.id, id))
      .returning();
    return log || undefined;
  }
}

export const storage = new DatabaseStorage();
