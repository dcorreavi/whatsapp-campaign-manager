import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Pause, Square } from "lucide-react";

interface ProgressModalProps {
  campaignId: number;
  onClose: () => void;
}

interface ProgressData {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  status: string;
}

export default function ProgressModal({ campaignId, onClose }: ProgressModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { data: progress } = useQuery<ProgressData>({
    queryKey: [`/api/campaigns/${campaignId}/progress`],
    refetchInterval: 2000, // Refresh every 2 seconds
    enabled: isOpen,
  });

  useEffect(() => {
    if (progress?.status === 'completed') {
      // Close modal after campaign completes
      setTimeout(() => {
        setIsOpen(false);
        onClose();
      }, 3000);
    }
  }, [progress?.status, onClose]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!progress) return null;

  const progressPercentage = progress.total > 0 ? ((progress.sent + progress.failed) / progress.total) * 100 : 0;
  const isCompleted = progress.status === 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-blue-600 text-2xl" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {isCompleted ? 'Campaign Completed' : 'Sending Campaign'}
          </h3>
          
          <p className="text-slate-600 mb-6">Campaign Progress</p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Progress</span>
              <span>{progress.sent + progress.failed} / {progress.total}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="font-medium text-emerald-700">{progress.sent}</div>
              <div className="text-emerald-600">Sent</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="font-medium text-red-700">{progress.failed}</div>
              <div className="text-red-600">Failed</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-700">{progress.pending}</div>
              <div className="text-blue-600">Pending</div>
            </div>
          </div>
          
          {/* Status */}
          <div className="text-left bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-600">Status:</p>
            <p className="font-medium text-slate-900 capitalize">{progress.status}</p>
            {progressPercentage > 0 && !isCompleted && (
              <p className="text-sm text-slate-500 mt-1">
                Estimated time remaining: {Math.ceil((progress.pending * 10) / 60)} minutes
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3">
            {!isCompleted ? (
              <>
                <Button variant="outline" className="flex-1" disabled>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="destructive" className="flex-1" disabled>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
