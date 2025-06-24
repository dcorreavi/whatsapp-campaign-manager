import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Contact } from "@shared/schema";

interface CampaignSettingsProps {
  campaign: Campaign;
  onStartCampaign: () => void;
  isStarting: boolean;
  currentMessageTemplate: string;
}

export default function CampaignSettings({ campaign, onStartCampaign, isStarting, currentMessageTemplate }: CampaignSettingsProps) {
  const [campaignName, setCampaignName] = useState(campaign.name || "");
  const [delay, setDelay] = useState(campaign.delayBetweenMessages?.toString() || "10");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: [`/api/campaigns/${campaign.id}/contacts`],
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (updates: Partial<Campaign>) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${campaign.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save campaign settings.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (campaignName !== campaign.name || parseInt(delay) !== campaign.delayBetweenMessages) {
        updateCampaignMutation.mutate({
          name: campaignName,
          delayBetweenMessages: parseInt(delay),
        });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [campaignName, delay, campaign.name, campaign.delayBetweenMessages]);

  const validContacts = contacts.filter(c => c.isValid);
  const estimatedDuration = Math.ceil((validContacts.length * parseInt(delay)) / 60);
  const messageLength = currentMessageTemplate?.length || 0;

  // Enhanced validation with detailed checks
  const hasContacts = validContacts.length > 0;
  const hasMessage = currentMessageTemplate && currentMessageTemplate.trim().length > 0;
  const hasName = campaignName.trim().length > 0;
  
  const canStart = hasContacts && hasMessage && hasName;
  
  // Get missing requirements
  const missingRequirements = [];
  if (!hasContacts) missingRequirements.push("Upload valid contacts");
  if (!hasMessage) missingRequirements.push("Create message template");
  if (!hasName) missingRequirements.push("Enter campaign name");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Campaign Settings</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            canStart ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {canStart ? '✓ Ready' : 'Step 3'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="campaign-name" className="text-sm font-medium text-slate-700 mb-2">
              Campaign Name
            </Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Summer Promotion 2024"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="delay" className="text-sm font-medium text-slate-700 mb-2">
              Delay Between Messages (seconds)
            </Label>
            <Select value={delay} onValueChange={setDelay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-slate-900 mb-3">Campaign Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Recipients:</span>
              <span className="font-medium text-slate-900 ml-2">{validContacts.length}</span>
            </div>
            <div>
              <span className="text-slate-600">Est. Duration:</span>
              <span className="font-medium text-slate-900 ml-2">~{estimatedDuration} min</span>
            </div>
            <div>
              <span className="text-slate-600">Message Length:</span>
              <span className="font-medium text-slate-900 ml-2">{messageLength} chars</span>
            </div>
            <div>
              <span className="text-slate-600">Status:</span>
              <span className={`font-medium ml-2 ${canStart ? 'text-emerald-600' : 'text-amber-600'}`}>
                {canStart ? 'Ready to Send' : 'Missing Requirements'}
              </span>
            </div>
          </div>
        </div>

        {/* Missing Requirements Alert */}
        {!canStart && missingRequirements.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Complete these steps to start your campaign:</h4>
            <ul className="space-y-1">
              {missingRequirements.map((requirement, index) => (
                <li key={index} className="flex items-center text-sm text-amber-700">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Start Campaign Button */}
        <div className="mt-6">
          <Button
            onClick={onStartCampaign}
            disabled={!canStart || isStarting}
            className={`w-full ${canStart ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            size="lg"
          >
            {isStarting ? "Connecting to WhatsApp..." : canStart ? "Connect WhatsApp & Start" : "Complete Requirements First"}
          </Button>
          
          {canStart && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                📱 WhatsApp Authentication Required
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You'll need to scan a QR code with your phone to connect WhatsApp Web
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
