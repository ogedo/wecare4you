import { z } from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const CreateConversationSchema = z.object({
  providerId: z.string(),
});

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
}

export interface ConversationResponse {
  id: string;
  patientId: string;
  providerId: string;
  lastMessage?: MessageResponse | null;
  createdAt: string;
}
