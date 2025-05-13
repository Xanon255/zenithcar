import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VehiclesTable from "@/components/vehicles/VehiclesTable";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { Vehicle, Customer } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VehicleList() {
  const [location] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  
  // Parse customerId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const customerId = params.get('customerId');
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [location]);
  
  // Fetch vehicles
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: [selectedCustomerId ? `/api/vehicles?customerId=${selectedCustomerId}` : "/api/vehicles"],
  });
  
  // Fetch customers for filter
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  const handleAddVehicle = () => {
    setSelectedVehicleId(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditVehicle = (id: number) => {
    setSelectedVehicleId(id.toString());
    setIsDialogOpen(true);
  };
  
  const handleCustomerChange = (value: string) => {
    if (value === "all") {
      setSelectedCustomerId(undefined);
    } else {
      setSelectedCustomerId(value);
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Araç Listesi</h1>
        </div>
        <Button onClick={handleAddVehicle} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Yeni Araç
        </Button>
      </div>
      
      <div className="mb-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Filtreler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <label className="text-sm font-medium mb-1 block">Müşteri</label>
                <Select
                  value={selectedCustomerId || "all"}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm müşteriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm müşteriler</SelectItem>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Araçlar</CardTitle>
        </CardHeader>
        <CardContent>
          <VehiclesTable 
            vehicles={vehicles || []} 
            customers={customers || []}
            isLoading={isLoading} 
            onEdit={handleEditVehicle}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicleId ? "Araç Düzenle" : "Yeni Araç Ekle"}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm 
            vehicleId={selectedVehicleId} 
            preselectedCustomerId={selectedCustomerId}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
