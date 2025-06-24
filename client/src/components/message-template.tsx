import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Contact } from "@shared/schema";

interface MessageTemplateProps {
  campaign: Campaign;
  onTemplateUpdate: () => void;
  onTemplateChange: (template: string) => void;
}

export default function MessageTemplate({ campaign, onTemplateUpdate, onTemplateChange }: MessageTemplateProps) {
  const [messageTemplate, setMessageTemplate] = useState(campaign.messageTemplate || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize parent state with current template
  useEffect(() => {
    onTemplateChange(messageTemplate);
  }, []);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: [`/api/campaigns/${campaign.id}/contacts`],
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (template: string) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${campaign.id}`, {
        messageTemplate: template,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onTemplateUpdate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save message template.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messageTemplate && messageTemplate.trim() !== (campaign.messageTemplate || '').trim()) {
        updateCampaignMutation.mutate(messageTemplate);
      }
    }, 500); // Reduced delay for faster updates

    return () => clearTimeout(timeoutId);
  }, [messageTemplate, campaign.messageTemplate]);

  const sampleContact = contacts.find(c => c.isValid) || { name: "Sample Name" };
  const previewMessage = messageTemplate.replace(/\{name\}/g, sampleContact.name);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Create Message Template</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            messageTemplate.trim().length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {messageTemplate.trim().length > 0 ? 'Complete' : 'Step 2'}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="message-template" className="text-sm font-medium text-slate-700 mb-2">
              Message Template
            </Label>
            <Textarea
              id="message-template"
              value={messageTemplate}
              onChange={(e) => {
                setMessageTemplate(e.target.value);
                onTemplateChange(e.target.value);
              }}
              className="w-full mt-2 resize-none"
              rows={6}
              placeholder="¡Hola {name}! Te escribo para..."
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Info size={16} />
            <span>
              Use <code className="px-1 bg-slate-100 rounded">{"{name}"}</code> to personalize messages with contact names
            </span>
          </div>

          {/* Message Preview */}
          {messageTemplate && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="font-medium text-slate-900 mb-2">
                Preview for: <span className="text-blue-600">{sampleContact.name}</span>
              </h4>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-slate-900 whitespace-pre-line">{previewMessage}</p>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Character count: {previewMessage.length}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
