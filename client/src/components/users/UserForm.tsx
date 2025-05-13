import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { insertUserSchema, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

interface UserFormProps {
  userId?: string; // For editing an existing user
}

export default function UserForm({ userId }: UserFormProps) {
  const { toast } = useToast();
  
  // Define the form with extended schema to handle password confirmation
  const formSchema = insertUserSchema.extend({
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string(),
    isAdmin: z.boolean().default(false),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      isAdmin: false
    },
  });
  
  // Fetch user details if editing
  const userQuery = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Load user data when editing
  useEffect(() => {
    if (userId && userQuery.data) {
      form.reset({
        username: userQuery.data.username,
        password: "", // Don't populate password field for security
        confirmPassword: "",
        fullName: userQuery.data.fullName,
        isAdmin: userQuery.data.isAdmin
      });
    }
  }, [userId, userQuery.data, form]);
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: Omit<z.infer<typeof formSchema>, "confirmPassword">) => {
      const userData = {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        isAdmin: data.isAdmin
      };
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kullanıcı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<z.infer<typeof formSchema>, "confirmPassword">> }) => {
      // Only send password if it's not empty
      const userData: Partial<User> = {
        username: data.username,
        fullName: data.fullName,
        isAdmin: data.isAdmin
      };
      
      if (data.password && data.password.length > 0) {
        userData.password = data.password;
      }
      
      const res = await apiRequest("PUT", `/api/users/${id}`, userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kullanıcı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const { confirmPassword, ...userData } = data;
    
    if (userId) {
      updateUserMutation.mutate({
        id: parseInt(userId),
        data: userData,
      });
    } else {
      createUserMutation.mutate(userData);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kullanıcı Adı</FormLabel>
              <FormControl>
                <Input placeholder="admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Demo Admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{userId ? "Yeni Şifre (Boş bırakılırsa değişmez)" : "Şifre"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre (Tekrar)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Admin Yetkileri</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Bu kullanıcıya yönetici yetkileri verir
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
          >
            {userId ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
