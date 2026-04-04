# MyTravelBuddy Frontend Codebase Guide

This guide provides essential information for future agents maintaining the MyTravelBuddy frontend codebase. The application is built with React, TypeScript, Vite, and follows a feature-based architecture.

## Project Structure

The codebase follows a feature-based architecture with the following key directories:

```
src/
├── app/              # Application entry point and routing
├── pages/            # Page components that represent routes
├── widgets/          # Reusable UI components (headers, footers, etc.)
├── entities/         # Business entities and types
├── shared/           # Shared utilities, APIs, hooks
│   └── api/          # API integration layer
│       ├── hooks/    # React Query hooks for data fetching
│       └── types/    # API response types
```

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router v6+
- **HTTP Client**: Axios
- **Styling**: CSS modules (no CSS-in-JS library specified)

## Architecture Patterns

### Component Structure

1. **Pages** - Represent routes in the application
2. **Widgets** - Reusable UI components like headers, sidebars
3. **Entities** - Business entities and types
4. **Shared** - Reusable utilities, API clients, and hooks

### Data Flow

1. **API Layer** (`src/shared/api/`) - Raw API calls using Axios
2. **Query Hooks** (`src/shared/api/hooks/`) - React Query hooks wrapping API calls
3. **Components** - Use query hooks to fetch data and manage UI state

### Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Directories: kebab-case (`user-profile/`)
- Files: kebab-case (`user-profile.tsx`)
- Types: PascalCase with `interface` (`UserProfile`)
- Hooks: `use` prefix (`useUserProfile`)

## Creating New Components

### Page Component Template

```tsx
// src/pages/new-page/index.tsx
import React from 'react';

const NewPage: React.FC = () => {
  return (
    <div>
      <h1>New Page</h1>
      <p>Page content goes here</p>
    </div>
  );
};

export default NewPage;
```

### Widget Component Template

```tsx
// src/widgets/new-widget/index.tsx
import React from 'react';

interface NewWidgetProps {
  title: string;
}

const NewWidget: React.FC<NewWidgetProps> = ({ title }) => {
  return (
    <div>
      <h2>{title}</h2>
      <p>Widget content</p>
      {/* Widget implementation */}
    </div>
  );
};

export default NewWidget;
```

### Adding a New Route

1. Create a new page component in `src/pages/`
2. Export it in `src/pages/index.ts`
3. Add the route to `src/app/index.tsx`

## API Integration

### Creating New API Endpoints

1. **Define types** in `src/entities/` for request/response data
2. **Create API functions** in `src/shared/api/`
3. **Create React Query hooks** in `src/shared/api/hooks/`

### API Function Template

```ts
// src/shared/api/resource.ts
import { apiClient } from '.';

export interface Resource {
  id: string;
  name: string;
}

export interface CreateResourceRequest {
  name: string;
}

export const createResource = async (
  data: CreateResourceRequest
): Promise<Resource> => {
  const response = await apiClient.post<Resource>('/resources', data);
  return response.data;
};
```

### API Hook Template

```ts
// src/shared/api/hooks/resource.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource, type CreateResourceRequest, type Resource } from '../resource';

const RESOURCES_QUERY_KEY = 'resources';

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Resource, Error, CreateResourceRequest>({
    mutationFn: (data: CreateResourceRequest) => createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCES_QUERY_KEY] });
    },
  });
};
```

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Running Linting

```bash
npm run lint
```

## Key Conventions

### Path Aliases

The project uses path aliases for cleaner imports:
- `@/` maps to `src/`
- Example: `import Header from '@/widgets/header'`

### Error Handling

- API errors are handled through React Query's error states
- Use `isError` and `error` properties from query hooks
- Display user-friendly error messages in components

### Loading States

- Use `isPending` or `isLoading` properties from query hooks
- Show loading indicators during data fetching
- Disable interactive elements during operations

## Common Tasks

### Adding a New Entity

1. Create type definitions in `src/entities/new-entity/types.ts`
2. Export types in `src/entities/index.ts`
3. Add API functions in `src/shared/api/new-entity.ts`
4. Create query hooks in `src/shared/api/hooks/new-entity.ts`

### Creating a Form Component

1. Use React's `useState` for form state
2. Use React Query mutation hooks for form submission
3. Handle loading and error states appropriately
4. Implement proper form validation

### Adding Navigation

1. Add new route to `src/app/index.tsx`
2. Create page component in `src/pages/`
3. Add navigation link in `src/widgets/header/index.tsx` if needed

## Testing

Currently, no testing framework is configured. When adding tests:

1. Consider using React Testing Library for component tests
2. Use Vitest for unit tests
3. Add test scripts to `package.json`

## Deployment

The application is built as a static site with:

```bash
npm run build
```

The output is in the `dist/` directory and can be served statically.