import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Lock, User, AlertCircle } from "lucide-react";

// Login form şeması
const loginSchema = z.object({
  username: z.string()
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır" })
    .max(50, { message: "Kullanıcı adı en fazla 50 karakter olabilir" }),
  password: z.string()
    .min(6, { message: "Şifre en az 6 karakter olmalıdır" })
});

// Register form şeması 
const registerSchema = z.object({
  username: z.string()
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır" })
    .max(50, { message: "Kullanıcı adı en fazla 50 karakter olabilir" }),
  password: z.string()
    .min(6, { message: "Şifre en az 6 karakter olmalıdır" }),
  name: z.string().optional(),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz" }).optional(),
});

// Form tipleri
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Sunucuya gönderilecek kayıt verileri
type ServerRegisterData = {
  username: string;
  password: string;
  name?: string; // Sunucu tarafında fullName'e dönüştürülecek
  isAdmin?: boolean;
};

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // Login form için RHF hook
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Login hatası olduğunda form hatasını güncelle
  useEffect(() => {
    if (loginMutation.isError) {
      setFormError((loginMutation.error as Error)?.message || "Giriş başarısız oldu. Lütfen bilgilerinizi kontrol edin.");
    } else {
      setFormError(null);
    }
  }, [loginMutation.isError, loginMutation.error]);

  const handleLoginSubmit = (values: LoginFormValues) => {
    setFormError(null);
    loginMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Hero Bölümü */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-center items-center">
        <div className="max-w-md space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">ZENITH CAR</h1>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Oto Yıkama Takip Sistemi</h2>
          <p className="text-lg mb-6">
            İşletmenizi daha verimli yönetmek için tüm ihtiyaçlarınızı karşılayan 
            dijital yönetim platformuna hoş geldiniz.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Müşteri ve araç bilgilerini kolayca yönetin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>İş emirlerini hızlıca oluşturun ve takip edin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Günlük, aylık ve yıllık rapor analizleri oluşturun</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Gelir ve giderlerinizi kolayca izleyin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Bölümü */}
      <div className="w-full md:w-1/2 p-4 sm:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              ZENITH CAR sistemine erişmek için giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Kullanıcı adınızı girin"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Şifrenizi girin"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-2">
            <p className="text-xs text-center text-gray-500">
              © 2025 ZENITH CAR - Oto Yıkama Takip Sistemi
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}