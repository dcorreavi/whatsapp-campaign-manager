import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bell, User, MessageSquare } from "lucide-react";
import FileUpload from "@/components/file-upload";
import ContactPreview from "@/components/contact-preview";
import MessageTemplate from "@/components/message-template";
import CampaignSettings from "@/components/campaign-settings";
import ProgressModal from "@/components/progress-modal";
import Sidebar from "@/components/sidebar";
import WhatsAppAuth from "@/components/whatsapp-auth";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showWhatsAppAuth, setShowWhatsAppAuth] = useState(false);
  const [currentMessageTemplate, setCurrentMessageTemplate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: { name: string; messageTemplate: string; delayBetweenMessages: number }) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: (campaign) => {
      setActiveCampaign(campaign);
      setCurrentMessageTemplate(campaign.messageTemplate || "");
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      });
    },
  });

  // Start campaign mutation
  const startCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/start`);
      return response.json();
    },
    onSuccess: () => {
      setShowProgressModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Started",
        description: "Your WhatsApp messages are being sent.",
      });
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.requiresAuth) {
        setShowWhatsAppAuth(true);
        toast({
          title: "WhatsApp Not Connected",
          description: "Please authenticate WhatsApp Web first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Start Campaign",
          description: error.message || "Please check your campaign settings.",
          variant: "destructive",
        });
      }
    },
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate({
      name: "New Campaign",
      messageTemplate: "",
      delayBetweenMessages: 10,
    });
  };

  const handleStartCampaign = () => {
    if (!activeCampaign) {
      toast({
        title: "No Active Campaign",
        description: "Please create a campaign first.",
        variant: "destructive",
      });
      return;
    }
    setShowWhatsAppAuth(true);
  };

  const handleWhatsAppAuthenticated = () => {
    setShowWhatsAppAuth(false);
    if (activeCampaign) {
      startCampaignMutation.mutate(activeCampaign.id);
    }
  };

  const steps = [
    { number: 1, title: "Upload Contacts", active: currentStep >= 1 },
    { number: 2, title: "Create Message", active: currentStep >= 2 },
    { number: 3, title: "Review & Send", active: currentStep >= 3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white text-lg" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">WhatsApp Campaign Manager</h1>
                <p className="text-sm text-slate-500">Automate your messaging campaigns</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-slate-600 hover:text-slate-900 transition-colors">
                <Bell size={18} />
              </button>
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <User className="text-slate-600" size={14} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Create New Campaign</h2>
            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Campaign History
            </button>
          </div>
          
          <div className="flex items-center space-x-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center space-x-2 ${step.active ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.active ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {step.number}
                  </div>
                  <span className={step.active ? 'font-medium' : ''}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-slate-300 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!activeCampaign ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Get Started</h3>
                <p className="text-slate-600 mb-6">Create a new campaign to begin sending messages.</p>
                <button
                  onClick={handleCreateCampaign}
                  disabled={createCampaignMutation.isPending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            ) : (
              <>
                <FileUpload 
                  campaignId={activeCampaign.id} 
                  onUploadComplete={() => setCurrentStep(2)}
                />
                <ContactPreview campaignId={activeCampaign.id} />
                <MessageTemplate 
                  campaign={activeCampaign}
                  onTemplateUpdate={() => setCurrentStep(3)}
                  onTemplateChange={setCurrentMessageTemplate}
                />
                <CampaignSettings
                  campaign={activeCampaign}
                  onStartCampaign={handleStartCampaign}
                  isStarting={startCampaignMutation.isPending}
                  currentMessageTemplate={currentMessageTemplate}
                />
              </>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar campaigns={campaigns} onStartCampaign={handleStartCampaign} />
        </div>
      </div>

        {/* Progress Modal */}
        {showProgressModal && activeCampaign && (
          <ProgressModal
            campaignId={activeCampaign.id}
            onClose={() => setShowProgressModal(false)}
          />
        )}

        {/* WhatsApp Authentication Modal */}
        {showWhatsAppAuth && (
          <WhatsAppAuth
            isOpen={showWhatsAppAuth}
            onClose={() => setShowWhatsAppAuth(false)}
            onAuthenticated={handleWhatsAppAuthenticated}
          />
        )}
    </div>
  );
}
