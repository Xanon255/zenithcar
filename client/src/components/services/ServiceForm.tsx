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
import { Textarea } from "@/components/ui/textarea";
import { insertServiceSchema, Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

interface ServiceFormProps {
  serviceId?: string; // For editing an existing service
}

export default function ServiceForm({ serviceId }: ServiceFormProps) {
  const { toast } = useToast();
  
  // Define the form with extended schema that requires price to be a string
  const formSchema = insertServiceSchema.extend({
    price: z.string().min(1, "Fiyat zorunludur"),
  });
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
    },
  });
  
  // Fetch service details if editing
  const serviceQuery = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId,
  });
  
  // Load service data when editing
  useEffect(() => {
    if (serviceId && serviceQuery.data) {
      form.reset({
        name: serviceQuery.data.name,
        price: serviceQuery.data.price.toString(),
        description: serviceQuery.data.description || "",
      });
    }
  }, [serviceId, serviceQuery.data, form]);
  
  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const serviceData = {
        ...data,
        price: parseFloat(data.price), // Convert string to number for API
      };
      const res = await apiRequest("POST", "/api/services", serviceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla oluşturuldu.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hizmet oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const serviceData = {
        ...data,
        price: parseFloat(data.price), // Convert string to number for API
      };
      const res = await apiRequest("PUT", `/api/services/${id}`, serviceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hizmet güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (serviceId) {
      updateServiceMutation.mutate({
        id: parseInt(serviceId),
        data,
      });
    } else {
      createServiceMutation.mutate(data);
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
              <FormLabel>Hizmet Adı</FormLabel>
              <FormControl>
                <Input placeholder="Dış Yıkama" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fiyat</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="50.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Hizmet açıklaması..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
          >
            {serviceId ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
