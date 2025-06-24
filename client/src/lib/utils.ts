import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add + if it's missing and starts with a digit
  if (/^\d/.test(cleaned)) {
    return '+' + cleaned;
  }
  
  return cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = formatPhoneNumber(phone);
  // Basic international phone number validation
  return /^\+[1-9]\d{1,14}$/.test(cleaned);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function estimateDuration(contactCount: number, delaySeconds: number): string {
  const totalSeconds = contactCount * delaySeconds;
  const minutes = Math.ceil(totalSeconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

export function generatePreviewMessage(template: string, contactName: string): string {
  return template.replace(/\{name\}/g, contactName);
}
