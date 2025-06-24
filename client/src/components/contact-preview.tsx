import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Contact } from "@shared/schema";

interface ContactPreviewProps {
  campaignId: number;
}

export default function ContactPreview({ campaignId }: ContactPreviewProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: [`/api/campaigns/${campaignId}/contacts`],
    enabled: !!campaignId,
  });

  if (isLoading || contacts.length === 0) {
    return null;
  }

  const validContacts = contacts.filter(c => c.isValid);
  const invalidContacts = contacts.filter(c => !c.isValid);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(validContacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (contactId: number, checked: boolean) => {
    const newSelection = new Set(selectedContacts);
    if (checked) {
      newSelection.add(contactId);
    } else {
      newSelection.delete(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const isAllSelected = validContacts.length > 0 && validContacts.every(c => selectedContacts.has(c.id));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Contact Preview</h3>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            {contacts.length} contacts loaded
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-900">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.slice(0, 10).map((contact) => (
                <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Checkbox
                      checked={selectedContacts.has(contact.id)}
                      onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                      disabled={!contact.isValid}
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{contact.name}</td>
                  <td className="py-3 px-4 text-slate-600">{contact.phone}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={contact.isValid ? "default" : "destructive"}
                      className={contact.isValid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                    >
                      {contact.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {contacts.length > 10 && (
          <div className="text-center text-sm text-slate-500 mt-4">
            Showing first 10 contacts of {contacts.length} total
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleSelectAll(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Select All Valid
            </button>
            <button 
              onClick={() => setSelectedContacts(new Set())}
              className="text-sm font-medium text-slate-600 hover:text-slate-700"
            >
              Clear Selection
            </button>
          </div>
          <span className="text-sm text-slate-500">
            {selectedContacts.size} of {validContacts.length} selected
          </span>
        </div>
        
        {invalidContacts.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>{invalidContacts.length}</strong> contacts have invalid phone numbers and will be skipped.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
