import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Edit, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown,
  Car
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
import { Customer } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit: (id: number) => void;
}

export default function CustomersTable({ 
  customers, 
  isLoading,
  onEdit
}: CustomersTableProps) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });
  
  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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
      case "phone":
        valueA = a.phone || "";
        valueB = b.phone || "";
        break;
      case "email":
        valueA = a.email || "";
        valueB = b.email || "";
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
  
  // Paginate customers
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = sortedCustomers.slice(
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
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi.",
      });
      setCustomerToDelete(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteCustomer = () => {
    if (customerToDelete !== null) {
      deleteCustomerMutation.mutate(customerToDelete);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Müşteri ara..."
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
                Müşteri Adı <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("phone")} className="cursor-pointer">
                Telefon <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                E-posta <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                Kayıt Tarihi <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead>Araçlar</TableHead>
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
            ) : paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Müşteri bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <Button 
                      asChild
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                    >
                      <Link href={`/vehicle-list?customerId=${customer.id}`}>
                        <Car className="h-4 w-4 mr-1" />
                        Araçlar
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-amber-500"
                        onClick={() => onEdit(customer.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => setCustomerToDelete(customer.id)}
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
            Toplam {filteredCustomers.length} kayıttan {Math.min(1 + (page - 1) * pageSize, filteredCustomers.length)}-
            {Math.min(page * pageSize, filteredCustomers.length)} arası gösteriliyor
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
        open={customerToDelete !== null}
        onOpenChange={() => setCustomerToDelete(null)}
        title="Müşteriyi Sil"
        description="Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteCustomer}
      />
    </div>
  );
}
