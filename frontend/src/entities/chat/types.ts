export interface ChatMessage {
  id: string;
  routeId: string;
  userId: string;
  sender: 'user' | 'assistant';
  text: string;
  formattedText: string;
  createdAt: string;
}

export interface CreateChatMessageRequest {
  text: string;
}

export interface ChatMapPoint {
  location_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  day?: number;
  reason?: string;
}

export interface AssistantStructured {
  summary?: string | string[];
  plan?: string[];
  questions?: string[];
  places?: {
    name: string;
    day?: number;
    reason?: string;
    latitude?: number;
    longitude?: number;
    location_id?: string;
    category?: string;
  }[];
}

export interface ChatSendResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  map_points: ChatMapPoint[];
  assistant_structured: AssistantStructured;
}