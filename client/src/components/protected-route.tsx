import { ReactNode, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
}

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Kullanıcı durumuna göre yönlendirme
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

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
          // Kullanıcı giriş yapmamış, ancak useEffect zaten yönlendirme yapacak
          // Geçiş süresinde bir içerik gösterebiliriz
          return (
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <p className="mb-2">Giriş yapmanız gerekiyor...</p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            </div>
          );
        }

        // Kullanıcı giriş yapmış, children'ı render et
        return children;
      }}
    </Route>
  );
}