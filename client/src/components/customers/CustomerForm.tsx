import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { insertCustomerSchema, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CustomerFormProps {
  customerId?: string; // For editing an existing customer
}

export default function CustomerForm({ customerId }: CustomerFormProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Define the form
  const form = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });
  
  // Fetch customer details if editing
  const customerQuery = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });
  
  // Load customer data when editing
  React.useEffect(() => {
    if (customerId && customerQuery.data) {
      form.reset({
        name: customerQuery.data.name,
        phone: customerQuery.data.phone || "",
        email: customerQuery.data.email || "",
      });
    }
  }, [customerId, customerQuery.data, form]);
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerSchema>) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla oluşturuldu.",
      });
      navigate("/customers");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Müşteri oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof insertCustomerSchema> }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla güncellendi.",
      });
      navigate("/customers");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof insertCustomerSchema>) => {
    if (customerId) {
      updateCustomerMutation.mutate({
        id: parseInt(customerId),
        data,
      });
    } else {
      createCustomerMutation.mutate(data);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri Adı</FormLabel>
              <FormControl>
                <Input placeholder="Ahmet Yılmaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input placeholder="0555 123 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ornek@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            className="mr-4"
            onClick={() => navigate("/customers")}
          >
            İptal
          </Button>
          <Button 
            type="submit"
            disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
          >
            {customerId ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
