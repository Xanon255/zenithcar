import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomersTable from "@/components/customers/CustomersTable";
import { Customer } from "@shared/schema";

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  
  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  const handleAddCustomer = () => {
    setSelectedCustomerId(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditCustomer = (id: number) => {
    setSelectedCustomerId(id.toString());
    setIsDialogOpen(true);
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Müşteriler</h1>
        </div>
        <Button onClick={handleAddCustomer} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Yeni Müşteri
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable 
            customers={customers || []} 
            isLoading={isLoading} 
            onEdit={handleEditCustomer}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomerId ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm customerId={selectedCustomerId} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
