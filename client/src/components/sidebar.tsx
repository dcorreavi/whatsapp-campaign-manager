import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Download } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface SidebarProps {
  campaigns: Campaign[];
  onStartCampaign: () => void;
}

export default function Sidebar({ campaigns, onStartCampaign }: SidebarProps) {
  const recentCampaigns = campaigns.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const thisMonthCampaigns = campaigns.filter(c => {
    const campaignDate = new Date(c.createdAt!);
    const now = new Date();
    return campaignDate.getMonth() === now.getMonth() && campaignDate.getFullYear() === now.getFullYear();
  });

  const totalMessagesSent = thisMonthCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const successRate = thisMonthCampaigns.length > 0 ? 
    (thisMonthCampaigns.filter(c => c.status === 'completed').length / thisMonthCampaigns.length * 100).toFixed(1) :
    0;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button onClick={onStartCampaign} className="w-full" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Campaign
            </Button>
            <Button variant="outline" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Campaigns</h3>
          {recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{campaign.name}</p>
                    <p className="text-xs text-slate-500">
                      {campaign.sentCount || 0} sent • {
                        new Date(campaign.createdAt!).toLocaleDateString()
                      }
                    </p>
                  </div>
                  <Badge className={`text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No campaigns yet</p>
          )}
          <Button variant="ghost" className="w-full mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
            View All Campaigns
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-4">This Month</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Messages Sent</span>
              <span className="font-semibold text-slate-900">{totalMessagesSent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Campaigns</span>
              <span className="font-semibold text-slate-900">{thisMonthCampaigns.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Success Rate</span>
              <span className="font-semibold text-emerald-600">{successRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
