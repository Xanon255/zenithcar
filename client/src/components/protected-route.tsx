import { ReactNode, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ path, children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Kullanıcı durumuna göre yönlendirme
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
        setLocation('/auth');
      } else if (adminOnly && !user.isAdmin) {
        // Admin gerektiren sayfa ve kullanıcı admin değilse ana sayfaya yönlendir
        setLocation('/');
      }
    }
  }, [user, isLoading, setLocation, adminOnly]);

  // Route bileşeni
  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          // Kullanıcı giriş yapmamış, useEffect zaten yönlendirme yapacak
          return (
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <p className="mb-2">Giriş yapmanız gerekiyor...</p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            </div>
          );
        }
        
        if (adminOnly && !user.isAdmin) {
          // Admin gerektiren sayfa ve kullanıcı admin değilse yetki hatası göster
          return (
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-red-500">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                <p>Yönetici hesabı gerektiren bir sayfaya erişmeye çalışıyorsunuz.</p>
              </div>
            </div>
          );
        }

        // Kullanıcı giriş yapmış ve yetkisi varsa, children'ı render et
        return children;
      }}
    </Route>
  );
}