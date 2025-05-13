import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Edit, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown
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
import { Service } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ServicesTableProps {
  services: Service[];
  isLoading: boolean;
  onEdit: (id: number) => void;
}

export default function ServicesTable({ 
  services, 
  isLoading,
  onEdit
}: ServicesTableProps) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  
  // Filter services
  const filteredServices = services.filter(service => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      (service.description && service.description.toLowerCase().includes(searchLower))
    );
  });
  
  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (!sortBy) return 0;
    
    let valueA, valueB;
    
    switch (sortBy) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "name":
        valueA = a.name;
        valueB = b.name;
        break;
      case "price":
        valueA = Number(a.price);
        valueB = Number(b.price);
        break;
      case "description":
        valueA = a.description || "";
        valueB = b.description || "";
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  
  // Paginate services
  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const paginatedServices = sortedServices.slice(
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
  
  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla silindi.",
      });
      setServiceToDelete(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hizmet silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteService = () => {
    if (serviceToDelete !== null) {
      deleteServiceMutation.mutate(serviceToDelete);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Hizmet ara..."
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
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                Hizmet Adı <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                Fiyat <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("description")} className="cursor-pointer">
                Açıklama <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : paginatedServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Hizmet bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.id}</TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{formatCurrency(service.price)} TL</TableCell>
                  <TableCell>{service.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-amber-500"
                        onClick={() => onEdit(service.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => setServiceToDelete(service.id)}
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
            Toplam {filteredServices.length} kayıttan {Math.min(1 + (page - 1) * pageSize, filteredServices.length)}-
            {Math.min(page * pageSize, filteredServices.length)} arası gösteriliyor
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
        open={serviceToDelete !== null}
        onOpenChange={() => setServiceToDelete(null)}
        title="Hizmeti Sil"
        description="Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteService}
      />
    </div>
  );
}
