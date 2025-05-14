import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, RegisterData>;
  changePasswordMutation: UseMutationResult<{ success: boolean }, Error, ChangePasswordData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
};

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<Omit<User, 'password'> | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        
        if (res.ok) {
          return res.json();
        }
        
        // Eğer 401 döndüyse kullanıcı giriş yapmamış demektir
        if (res.status === 401) {
          return null;
        }
        
        throw new Error('Kullanıcı bilgileri alınırken bir hata oluştu');
      } catch (err) {
        return null;
      } finally {
        if (!initialCheckDone) {
          setInitialCheckDone(true);
        }
      }
    },
    // Başlangıçta auth durumunu kontrol et
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kullanıcı adı veya şifre hatalı');
      }
      
      return res.json();
    },
    onSuccess: (userData) => {
      toast({
        title: 'Giriş başarılı',
        description: 'Hoş geldiniz!',
      });
      
      // Kullanıcı verisini güncelle
      queryClient.setQueryData(['/api/user'], userData);
      
      // Auth durumunu yenile
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Giriş başarısız',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest('POST', '/api/register', userData);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kayıt başarısız');
      }
      
      return res.json();
    },
    onSuccess: (userData) => {
      toast({
        title: 'Kayıt başarılı',
        description: 'Hesabınız oluşturuldu ve giriş yapıldı.',
      });
      
      // Kullanıcı verisini güncelle
      queryClient.setQueryData(['/api/user'], userData);
      
      // Auth durumunu yenile
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Kayıt başarısız',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      
      if (!res.ok) {
        throw new Error('Çıkış yapılırken bir hata oluştu');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Çıkış yapıldı',
        description: 'Güvenli bir şekilde çıkış yaptınız.',
      });
      
      // Kullanıcı verisini temizle
      queryClient.setQueryData(['/api/user'], null);
      
      // Auth durumunu yenile
      refetch();
      
      // Önbelleği temizle
      queryClient.clear();
    },
    onError: (error: Error) => {
      toast({
        title: 'Çıkış başarısız',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const res = await apiRequest('POST', '/api/change-password', data);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Şifre değiştirme başarısız');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Şifre değiştirildi',
        description: 'Şifreniz başarıyla değiştirildi.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Şifre değiştirme başarısız',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !initialCheckDone,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}