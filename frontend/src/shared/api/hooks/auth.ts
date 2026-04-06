import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register } from '../auth';
import type { LoginRequest, RegisterRequest } from '../types/auth';


export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};


export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (data) => {
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};