import { describe, it, expectTypeOf } from 'vitest';
import type {
  ChatMessage,
  ChatMapPoint,
  AssistantStructured,
  ChatSendResponse,
} from '@/entities/chat/types';

describe('ChatMessage type', () => {
  it('has all required fields from APICONTRACT', () => {
    expectTypeOf<ChatMessage>().toHaveProperty('id');
    expectTypeOf<ChatMessage>().toHaveProperty('routeId');
    expectTypeOf<ChatMessage>().toHaveProperty('userId');
    expectTypeOf<ChatMessage>().toHaveProperty('sender');
    expectTypeOf<ChatMessage>().toHaveProperty('text');
    expectTypeOf<ChatMessage>().toHaveProperty('formattedText');
    expectTypeOf<ChatMessage>().toHaveProperty('createdAt');
  });

  it('sender is constrained to user | assistant', () => {
    expectTypeOf<ChatMessage['sender']>().toEqualTypeOf<'user' | 'assistant'>();
  });
});

describe('ChatMapPoint type', () => {
  it('has required location fields', () => {
    expectTypeOf<ChatMapPoint>().toHaveProperty('location_id');
    expectTypeOf<ChatMapPoint>().toHaveProperty('name');
    expectTypeOf<ChatMapPoint>().toHaveProperty('category');
    expectTypeOf<ChatMapPoint>().toHaveProperty('latitude');
    expectTypeOf<ChatMapPoint>().toHaveProperty('longitude');
  });

  it('day and reason are optional', () => {
    expectTypeOf<ChatMapPoint['day']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ChatMapPoint['reason']>().toEqualTypeOf<string | undefined>();
  });
});

describe('AssistantStructured type', () => {
  it('all fields are optional', () => {
    expectTypeOf<AssistantStructured['summary']>().toEqualTypeOf<string | string[] | undefined>();
    expectTypeOf<AssistantStructured['plan']>().toEqualTypeOf<string[] | undefined>();
    expectTypeOf<AssistantStructured['questions']>().toEqualTypeOf<string[] | undefined>();
  });

  it('places items have name, optional day and reason', () => {
    type Place = NonNullable<AssistantStructured['places']>[number];
    expectTypeOf<Place>().toHaveProperty('name');
    expectTypeOf<Place['day']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<Place['reason']>().toEqualTypeOf<string | undefined>();
  });
});

describe('ChatSendResponse type', () => {
  it('has user_message, assistant_message, map_points, assistant_structured', () => {
    expectTypeOf<ChatSendResponse>().toHaveProperty('user_message');
    expectTypeOf<ChatSendResponse>().toHaveProperty('assistant_message');
    expectTypeOf<ChatSendResponse>().toHaveProperty('map_points');
    expectTypeOf<ChatSendResponse>().toHaveProperty('assistant_structured');
  });

  it('map_points is an array of ChatMapPoint', () => {
    expectTypeOf<ChatSendResponse['map_points']>().toEqualTypeOf<ChatMapPoint[]>();
  });
});
