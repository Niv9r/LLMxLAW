import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAIErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API_KEY_SERVICE_BLOCKED') || error.message.includes('403 Forbidden')) {
      return 'AI request failed: The API key is invalid or the service is blocked. Please check your Google AI API key and ensure the Generative Language API is enabled in your Google Cloud project.';
    }
    if (error.message.includes('400')) {
        return 'AI request failed: The input was invalid. Please check the provided information.';
    }
  }
  return 'An unexpected error occurred with the AI service.';
}
