import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Edit, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Vehicle, Customer } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface VehiclesTableProps {
  vehicles: Vehicle[];
  customers: Customer[];
  isLoading: boolean;
  onEdit: (id: number) => void;
}

export default function VehiclesTable({ 
  vehicles, 
  customers,
  isLoading,
  onEdit
}: VehiclesTableProps) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  
  const getCustomerName = (customerId: number): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen Müşteri";
  };
  
  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customerName = getCustomerName(vehicle.customerId).toLowerCase();
    
    return (
      vehicle.plate.toLowerCase().includes(searchLower) ||
      vehicle.brand.toLowerCase().includes(searchLower) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchLower)) ||
      (vehicle.color && vehicle.color.toLowerCase().includes(searchLower)) ||
      customerName.includes(searchLower)
    );
  });
  
  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (!sortBy) return 0;
    
    let valueA, valueB;
    
    switch (sortBy) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "plate":
        valueA = a.plate;
        valueB = b.plate;
        break;
      case "brand":
        valueA = `${a.brand} ${a.model || ""}`;
        valueB = `${b.brand} ${b.model || ""}`;
        break;
      case "color":
        valueA = a.color || "";
        valueB = b.color || "";
        break;
      case "customer":
        valueA = getCustomerName(a.customerId);
        valueB = getCustomerName(b.customerId);
        break;
      case "createdAt":
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  
  // Paginate vehicles
  const totalPages = Math.ceil(filteredVehicles.length / pageSize);
  const paginatedVehicles = sortedVehicles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Başarılı",
        description: "Araç başarıyla silindi.",
      });
      setVehicleToDelete(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Araç silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteVehicle = () => {
    if (vehicleToDelete !== null) {
      deleteVehicleMutation.mutate(vehicleToDelete);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Araç ara..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("id")} className="cursor-pointer">
                ID <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("plate")} className="cursor-pointer">
                Plaka <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("brand")} className="cursor-pointer">
                Marka / Model <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("color")} className="cursor-pointer">
                Renk <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("customer")} className="cursor-pointer">
                Müşteri <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                Kayıt Tarihi <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : paginatedVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Araç bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.id}</TableCell>
                  <TableCell className="font-medium">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.brand} {vehicle.model || ""}</TableCell>
                  <TableCell>{vehicle.color || "-"}</TableCell>
                  <TableCell>{getCustomerName(vehicle.customerId)}</TableCell>
                  <TableCell>{formatDate(vehicle.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        asChild
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary"
                      >
                        <Link href={`/new-job?vehicleId=${vehicle.id}`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-amber-500"
                        onClick={() => onEdit(vehicle.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => setVehicleToDelete(vehicle.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Toplam {filteredVehicles.length} kayıttan {Math.min(1 + (page - 1) * pageSize, filteredVehicles.length)}-
            {Math.min(page * pageSize, filteredVehicles.length)} arası gösteriliyor
          </div>
          
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Önceki
            </Button>
            
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = page - 2 + i;
              if (pageNum < 1) pageNum += 5;
              if (pageNum > totalPages) pageNum -= 5;
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="rounded-none"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-r-md"
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        open={vehicleToDelete !== null}
        onOpenChange={() => setVehicleToDelete(null)}
        title="Aracı Sil"
        description="Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteVehicle}
      />
    </div>
  );
}
