import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertJobSchema, jobStatusEnum, paymentMethodEnum, Customer, Vehicle, Service, Job } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobFormProps {
  jobId?: string; // For editing an existing job
}

export default function JobForm({ jobId }: JobFormProps) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  
  // Create an extended schema with required validation
  const formSchema = insertJobSchema.extend({
    // Additional fields not in the job schema
    customerName: z.string().min(1, "Müşteri adı zorunludur").optional().superRefine((val, ctx) => {
      if (isNewCustomer && (!val || val.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Müşteri adı zorunludur",
        });
      }
    }),
    customerPhone: z.string().optional(),
    customerEmail: z.string().optional(),
    
    vehiclePlate: z.string().optional().superRefine((val, ctx) => {
      if (isNewVehicle && (!val || val.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Plaka zorunludur",
        });
      }
    }),
    vehicleBrand: z.string().optional().superRefine((val, ctx) => {
      if (isNewVehicle && (!val || val.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marka zorunludur",
        });
      }
    }),
    vehicleModel: z.string().optional(),
    vehicleColor: z.string().optional(),
    
    selectedServices: z.array(z.number()).optional(),
    
    // Override required fields
    status: jobStatusEnum,
    paymentMethod: paymentMethodEnum,

    // Validate customer and vehicle selections
    customerId: z.number().optional().superRefine((val, ctx) => {
      if (!isNewCustomer && (!val || val <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lütfen müşteri seçiniz",
        });
      }
    }),
    vehicleId: z.number().optional().superRefine((val, ctx) => {
      if (!isNewVehicle && (!val || val <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lütfen araç seçiniz",
        });
      }
    }),
  });
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "bekliyor",
      paymentMethod: "nakit",
      totalAmount: "0",
      paidAmount: "0",
      notes: "",
      selectedServices: [],
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      vehiclePlate: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleColor: "",
    },
  });
  
  // Fetch customers
  const customersQuery = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Fetch vehicles
  const vehiclesQuery = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  
  // Fetch services
  const servicesQuery = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  // Fetch job details if editing
  const jobQuery = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });
  
  // Fetch job services if editing
  const jobServicesQuery = useQuery<Service[]>({
    queryKey: [`/api/jobs/${jobId}/services`],
    enabled: !!jobId,
  });
  
  // Calculate total price based on selected services
  const calculateTotalPrice = (selectedServiceIds: number[]) => {
    if (!servicesQuery.data) return 0;
    
    return selectedServiceIds.reduce((total, serviceId) => {
      const service = servicesQuery.data.find(s => s.id === serviceId);
      return total + (service ? Number(service.price) : 0);
    }, 0);
  };
  
  // Watch selected services to update total amount
  const selectedServices = form.watch("selectedServices") || [];
  
  // Update total amount when services change
  useEffect(() => {
    const totalPrice = calculateTotalPrice(selectedServices);
    form.setValue("totalAmount", totalPrice.toString());
  }, [selectedServices, form, servicesQuery.data]);
  
  // Filter vehicles by selected customer
  const customerVehicles = vehiclesQuery.data?.filter(
    vehicle => vehicle.customerId === selectedCustomerId
  ) || [];
  
  // Load job data when editing
  useEffect(() => {
    if (jobId && jobQuery.data && vehiclesQuery.data && customersQuery.data && jobServicesQuery.data) {
      const job = jobQuery.data;
      const vehicle = vehiclesQuery.data.find(v => v.id === job.vehicleId);
      
      if (vehicle) {
        setSelectedCustomerId(vehicle.customerId);
        
        // Cast status and payment method to the proper enum types to fix type issues
        const typedStatus = job.status as "bekliyor" | "devam_ediyor" | "tamamlandi" | "iptal";
        const typedPaymentMethod = job.paymentMethod as "nakit" | "kredi_karti" | "havale_eft";
        
        form.reset({
          vehicleId: job.vehicleId,
          customerId: job.customerId,
          totalAmount: job.totalAmount.toString(),
          paidAmount: job.paidAmount.toString(),
          status: typedStatus,
          paymentMethod: typedPaymentMethod || "nakit",
          notes: job.notes,
          selectedServices: jobServicesQuery.data.map(s => s.id),
        });
      }
    }
  }, [jobId, jobQuery.data, vehiclesQuery.data, customersQuery.data, jobServicesQuery.data, form]);
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string }) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
  });
  
  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: { 
      plate: string; 
      brand: string; 
      model?: string; 
      color?: string; 
      customerId: number 
    }) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
  
  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertJobSchema>) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      return data.id;
    },
  });
  
  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof insertJobSchema>> }) => {
      const res = await apiRequest("PUT", `/api/jobs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
  
  // Add job service mutation
  const addJobServiceMutation = useMutation({
    mutationFn: async ({ jobId, serviceId }: { jobId: number; serviceId: number }) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/services`, { serviceId });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${variables.jobId}/services`] });
    },
  });
  
  // Remove job service mutation
  const removeJobServiceMutation = useMutation({
    mutationFn: async ({ jobId, serviceId }: { jobId: number; serviceId: number }) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}/services/${serviceId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${variables.jobId}/services`] });
    },
  });
  
  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      console.log("onSubmit çağrıldı", formData);
      // Form verilerini kontrol etme ve validasyon
      if (isNewCustomer && (!formData.customerName || formData.customerName.trim() === "")) {
        toast({
          title: "Hata",
          description: "Müşteri adı zorunludur",
          variant: "destructive",
        });
        return;
      }
      
      if (isNewVehicle && (!formData.vehiclePlate || formData.vehiclePlate.trim() === "")) {
        toast({
          title: "Hata",
          description: "Araç plakası zorunludur",
          variant: "destructive",
        });
        return;
      }
      
      if (isNewVehicle && (!formData.vehicleBrand || formData.vehicleBrand.trim() === "")) {
        toast({
          title: "Hata",
          description: "Araç markası zorunludur",
          variant: "destructive",
        });
        return;
      }
      
      if (!isNewCustomer && (!formData.customerId || typeof formData.customerId !== 'number')) {
        toast({
          title: "Hata",
          description: "Lütfen müşteri seçiniz",
          variant: "destructive",
        });
        return;
      }
      
      let customerId = formData.customerId;
      let vehicleId = formData.vehicleId;
      
      // Yeni müşteri oluştur
      if (isNewCustomer && formData.customerName) {
        try {
          const newCustomer = await createCustomerMutation.mutateAsync({
            name: formData.customerName,
            phone: formData.customerPhone || "",
            email: formData.customerEmail || "",
          });
          customerId = newCustomer.id;
        } catch (error) {
          toast({
            title: "Hata",
            description: "Müşteri oluşturulurken bir hata oluştu",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Müşteri ID'si kontrol edilsin
      if (!customerId) {
        toast({
          title: "Hata",
          description: "Müşteri bilgisi eksik",
          variant: "destructive",
        });
        return;
      }
      
      // Yeni araç oluştur
      if (isNewVehicle && formData.vehiclePlate && formData.vehicleBrand && customerId) {
        try {
          const newVehicle = await createVehicleMutation.mutateAsync({
            plate: formData.vehiclePlate,
            brand: formData.vehicleBrand,
            model: formData.vehicleModel || "",
            color: formData.vehicleColor || "",
            customerId,
          });
          vehicleId = newVehicle.id;
        } catch (error) {
          toast({
            title: "Hata",
            description: "Araç oluşturulurken bir hata oluştu",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Araç ID'si kontrol edilsin
      if (!vehicleId) {
        toast({
          title: "Hata",
          description: "Araç bilgisi eksik",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare job data
      const jobData = {
        vehicleId,
        customerId,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes,
      };
      
      let newJobId: number;
      
      // Create or update job
      if (jobId) {
        // Update existing job
        try {
          await updateJobMutation.mutateAsync({
            id: parseInt(jobId),
            data: {
              vehicleId: vehicleId as number,
              customerId: customerId as number,
              totalAmount: formData.totalAmount,
              paidAmount: formData.paidAmount || "0",
              paymentMethod: formData.paymentMethod,
              status: formData.status as "bekliyor" | "devam_ediyor" | "tamamlandi" | "iptal",
              notes: formData.notes
            },
          });
          newJobId = parseInt(jobId);
        } catch (error) {
          toast({
            title: "Hata",
            description: "İş emri güncellenirken bir hata oluştu",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new job
        try {
          const newJob = await createJobMutation.mutateAsync({
            vehicleId: vehicleId as number,
            customerId: customerId as number,
            totalAmount: formData.totalAmount,
            paidAmount: formData.paidAmount || "0",
            paymentMethod: formData.paymentMethod,
            status: formData.status,
            notes: formData.notes
          });
          newJobId = newJob.id;
        } catch (error) {
          toast({
            title: "Hata",
            description: "İş emri oluşturulurken bir hata oluştu",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Handle services
      if (newJobId && formData.selectedServices) {
        // If editing, we need to sync the services
        if (jobId && jobServicesQuery.data) {
          const existingServiceIds = jobServicesQuery.data.map(s => s.id);
          
          // Remove services that were deselected
          for (const existingId of existingServiceIds) {
            if (!formData.selectedServices.includes(existingId)) {
              await removeJobServiceMutation.mutateAsync({
                jobId: newJobId,
                serviceId: existingId,
              });
            }
          }
          
          // Add services that were newly selected
          for (const selectedId of formData.selectedServices) {
            if (!existingServiceIds.includes(selectedId)) {
              await addJobServiceMutation.mutateAsync({
                jobId: newJobId,
                serviceId: selectedId,
              });
            }
          }
        } else {
          // Add all selected services for a new job
          for (const serviceId of formData.selectedServices) {
            await addJobServiceMutation.mutateAsync({
              jobId: newJobId,
              serviceId,
            });
          }
        }
      }
      
      // İnvalidate all relevant queries to refresh data
      // Tüm ilgili sorguları geçersiz kıl ve yeniden yükle
      queryClient.invalidateQueries();
      queryClient.refetchQueries({ queryKey: ["/api/jobs"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats/daily"] });
      
      toast({
        title: "Başarılı",
        description: `İş emri başarıyla ${jobId ? "güncellendi" : "oluşturuldu"}`,
      });
      
      // Navigate back to dashboard with refresh flag
      navigate("/jobs?refresh=true");
    } catch (error) {
      toast({
        title: "Hata",
        description: "İş emri kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  // Handle customer selection
  const handleCustomerChange = (value: string) => {
    if (value === "new") {
      setIsNewCustomer(true);
      setSelectedCustomerId(null);
      form.setValue("customerId", undefined);
      form.setValue("vehicleId", undefined);
    } else {
      setIsNewCustomer(false);
      const customerId = parseInt(value);
      setSelectedCustomerId(customerId);
      form.setValue("customerId", customerId);
    }
  };
  
  // Handle vehicle selection
  const handleVehicleChange = (value: string) => {
    if (value === "new") {
      setIsNewVehicle(true);
      form.setValue("vehicleId", undefined);
    } else {
      setIsNewVehicle(false);
      form.setValue("vehicleId", parseInt(value));
    }
  };
  
  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log("Form gönderiliyor...");
          
          // Manuel olarak form verilerini toplayıp submit edelim
          const formValues = form.getValues();
          onSubmit(formValues);
        }} 
        className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-darkest font-medium mb-4">Müşteri Bilgileri</h4>
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Müşteri</FormLabel>
                  <Select
                    value={isNewCustomer ? "new" : field.value?.toString()}
                    onValueChange={handleCustomerChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">+ Yeni Müşteri</SelectItem>
                      {customersQuery.data?.map((customer) => (
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
            
            {isNewCustomer && (
              <>
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          
          <div>
            <h4 className="text-gray-darkest font-medium mb-4">Araç Bilgileri</h4>
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Araç</FormLabel>
                  <Select
                    value={isNewVehicle ? "new" : field.value?.toString()}
                    onValueChange={handleVehicleChange}
                    disabled={!selectedCustomerId && !isNewCustomer}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Araç seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">+ Yeni Araç</SelectItem>
                      {customerVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.plate} - {vehicle.brand} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isNewVehicle && (
              <>
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                  name="vehicleBrand"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem className="mb-4">
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
                  name="vehicleColor"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Renk</FormLabel>
                      <FormControl>
                        <Input placeholder="Beyaz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>
        
        <hr className="my-6" />
        
        <div>
          <h4 className="text-gray-darkest font-medium mb-4">Yapılacak İşlemler</h4>
          <FormField
            control={form.control}
            name="selectedServices"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {servicesQuery.data?.map((service) => (
                    <FormField
                      key={service.id}
                      control={form.control}
                      name="selectedServices"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={service.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  const updated = checked
                                    ? [...current, service.id]
                                    : current.filter((id) => id !== service.id);
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {service.name} ({service.price} TL)
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Özel Notlar</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ek notlar buraya yazılabilir..."
                    rows={3}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Toplam Tutar (₺)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paidAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödenen (₺)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={form.watch("totalAmount")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İş Durumu</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İş durumu seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bekliyor">Bekliyor</SelectItem>
                      <SelectItem value="devam_ediyor">Devam Ediyor</SelectItem>
                      <SelectItem value="tamamlandi">Tamamlandı</SelectItem>
                      <SelectItem value="iptal">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Yöntemi</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nakit">Nakit</SelectItem>
                      <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                      <SelectItem value="havale_eft">Havale/EFT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <Button
            type="button"
            variant="secondary"
            className="mr-4"
            onClick={() => navigate("/")}
          >
            İptal
          </Button>
          <Button 
            type="submit"
            disabled={
              createJobMutation.isPending || 
              updateJobMutation.isPending || 
              createCustomerMutation.isPending || 
              createVehicleMutation.isPending
            }
          >
            {jobId ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
