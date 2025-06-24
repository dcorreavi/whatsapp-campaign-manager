import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  campaignId: number;
  onUploadComplete: () => void;
}

export default function FileUpload({ campaignId, onUploadComplete }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/campaigns/${campaignId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/contacts`] });
      toast({
        title: "File Uploaded Successfully",
        description: `${data.totalCount} contacts loaded, ${data.validCount} valid.`,
      });
      onUploadComplete();
    },
    onError: (error: Error) => {
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadStatus('uploading');
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (uploadStatus === 'success') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upload Contact List</h3>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
              Complete
            </span>
          </div>
          <div className="flex items-center space-x-3 text-emerald-600">
            <CheckCircle size={24} />
            <span className="font-medium">File uploaded successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload Contact List</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Step 1
          </span>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : uploadStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              uploadStatus === 'uploading' 
                ? 'bg-blue-100 animate-pulse' 
                : uploadStatus === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
            }`}>
              {uploadStatus === 'uploading' ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : uploadStatus === 'error' ? (
                <FileText className="text-red-600 text-2xl" />
              ) : (
                <CloudUpload className="text-blue-600 text-2xl" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {uploadStatus === 'uploading' 
                  ? 'Processing file...' 
                  : 'Drop your file here, or browse'
                }
              </p>
              <p className="text-sm text-slate-500">
                Supports CSV, XLS, XLSX files up to 10MB
              </p>
            </div>
            {uploadStatus === 'idle' && (
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Browse Files
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">Required Columns:</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium">
              name
            </span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium">
              phone <span className="text-slate-500">or</span> number
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Your CSV uses "number" column which is perfectly supported!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
