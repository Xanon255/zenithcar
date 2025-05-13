import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Service } from "@shared/schema";
import ServiceForm from "@/components/services/ServiceForm";
import ServicesTable from "@/components/services/ServicesTable";

export default function PriceList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  
  // Fetch services
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  const handleAddService = () => {
    setSelectedServiceId(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditService = (id: number) => {
    setSelectedServiceId(id.toString());
    setIsDialogOpen(true);
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Fiyat Listesi</h1>
        </div>
        <Button onClick={handleAddService} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Yeni Hizmet
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Hizmetler ve Fiyatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <ServicesTable 
            services={services || []} 
            isLoading={isLoading} 
            onEdit={handleEditService}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedServiceId ? "Hizmet Düzenle" : "Yeni Hizmet Ekle"}
            </DialogTitle>
          </DialogHeader>
          <ServiceForm serviceId={selectedServiceId} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
