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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertVehicleSchema, Vehicle, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

interface VehicleFormProps {
  vehicleId?: string; // For editing an existing vehicle
  preselectedCustomerId?: string; // For pre-selected customer
}

export default function VehicleForm({ vehicleId, preselectedCustomerId }: VehicleFormProps) {
  const { toast } = useToast();
  
  // Define the form
  const form = useForm<z.infer<typeof insertVehicleSchema>>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plate: "",
      brand: "",
      model: "",
      color: "",
      customerId: preselectedCustomerId ? parseInt(preselectedCustomerId) : undefined,
    },
  });
  
  // Fetch customers
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Fetch vehicle details if editing
  const vehicleQuery = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });
  
  // Load vehicle data when editing
  useEffect(() => {
    if (vehicleId && vehicleQuery.data) {
      form.reset({
        plate: vehicleQuery.data.plate,
        brand: vehicleQuery.data.brand,
        model: vehicleQuery.data.model || "",
        color: vehicleQuery.data.color || "",
        customerId: vehicleQuery.data.customerId,
      });
    } else if (preselectedCustomerId) {
      form.setValue("customerId", parseInt(preselectedCustomerId));
    }
  }, [vehicleId, vehicleQuery.data, form, preselectedCustomerId]);
  
  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertVehicleSchema>) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Başarılı",
        description: "Araç başarıyla oluşturuldu.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Araç oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof insertVehicleSchema> }) => {
      const res = await apiRequest("PUT", `/api/vehicles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Başarılı",
        description: "Araç başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Araç güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof insertVehicleSchema>) => {
    if (vehicleId) {
      updateVehicleMutation.mutate({
        id: parseInt(vehicleId),
        data,
      });
    } else {
      createVehicleMutation.mutate(data);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plaka</FormLabel>
              <FormControl>
                <Input placeholder="34ABC123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marka</FormLabel>
              <FormControl>
                <Input placeholder="Audi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input placeholder="A3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Renk</FormLabel>
              <FormControl>
                <Input placeholder="Beyaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri</FormLabel>
              <Select
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir müşteri seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}
          >
            {vehicleId ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
