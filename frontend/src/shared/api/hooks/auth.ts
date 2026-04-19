import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/contexts/auth-context';
import { login, register } from '../auth';
import type { LoginRequest, RegisterRequest } from '../types/auth';


export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login: authLogin } = useAuth();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      // Use auth context to update authentication state
      authLogin(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name
      });
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};


export const useRegister = () => {
  const queryClient = useQueryClient();
  const { login: authLogin } = useAuth();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (data) => {
      // Use auth context to update authentication state
      authLogin(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name
      });
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};