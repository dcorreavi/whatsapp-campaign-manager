import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Wifi, CheckCircle, AlertCircle, QrCode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

interface WhatsAppStatus {
  isReady: boolean;
  isAuthenticating: boolean;
  qrCode: string;
}

export default function WhatsAppAuth({ isOpen, onClose, onAuthenticated }: WhatsAppAuthProps) {
  const [step, setStep] = useState<'connecting' | 'qr' | 'authenticated' | 'ready'>('connecting');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize WhatsApp connection
  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/init");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'ready') {
        setStep('ready');
        onAuthenticated();
      } else {
        setStep('qr');
      }
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to initialize WhatsApp connection",
        variant: "destructive",
      });
    },
  });

  // Poll WhatsApp status
  const { data: status } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 2000,
    enabled: isOpen && step !== 'ready',
  });

  useEffect(() => {
    if (status) {
      if (status.isReady) {
        setStep('ready');
        onAuthenticated();
      } else if (status.isAuthenticating && status.qrCode) {
        setStep('qr');
      }
    }
  }, [status, onAuthenticated]);

  const handleInitialize = () => {
    setStep('connecting');
    initMutation.mutate();
  };

  const handleClose = () => {
    if (step === 'ready') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Connect WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'connecting' && (
            <Card>
              <CardContent className="p-6 text-center">
                <Wifi className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Initializing Connection</h3>
                <p className="text-slate-600 mb-4">
                  Setting up WhatsApp Web connection...
                </p>
                {!initMutation.isPending && (
                  <Button onClick={handleInitialize} className="w-full">
                    Start Connection
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'qr' && (
            <Card>
              <CardContent className="p-6 text-center">
                <QrCode className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <p className="text-slate-600 mb-4">
                  Open WhatsApp on your phone and scan the QR code that appears in the server console.
                </p>
                
                <div className="bg-slate-100 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <ol className="text-sm text-slate-600 text-left space-y-1">
                    <li>1. Open a new browser tab</li>
                    <li>2. Go to <strong>web.whatsapp.com</strong></li>
                    <li>3. Scan the QR code with your phone's WhatsApp</li>
                    <li>4. Keep the WhatsApp Web tab open</li>
                  </ol>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Demo Mode: Messages will be logged to console</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    In production, this would open WhatsApp Web automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'authenticated' && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Authentication Successful</h3>
                <p className="text-slate-600">
                  WhatsApp is being prepared for message sending...
                </p>
              </CardContent>
            </Card>
          )}

          {step === 'ready' && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">WhatsApp Ready!</h3>
                <p className="text-slate-600 mb-4">
                  Your WhatsApp is connected and ready to send messages.
                </p>
                <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
                  Continue to Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}