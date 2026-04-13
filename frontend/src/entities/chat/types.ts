export interface ChatMessage {
  id: string;
  routeId: string;
  userId: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface CreateChatMessageRequest {
  text: string;
}

export interface ChatSendResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}