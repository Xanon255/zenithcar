import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Edit, Trash, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, getJobStatusDisplay } from "@/lib/utils";
import { Job, Customer, Vehicle } from "@shared/schema";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface JobsTableProps {
  title: string;
  date?: string;
}

export default function JobsTable({ title, date }: JobsTableProps) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  
  // Fetch jobs
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD' formatında bugünün tarihi
  const formattedDate = date || today;
  
  console.log("JobsTable - Tarih:", formattedDate);
  console.log(`JobsTable - API isteği: /api/jobs?date=${formattedDate}`);
  
  const jobsQuery = useQuery<Job[]>({
    queryKey: [`/api/jobs?date=${formattedDate}`],
    refetchInterval: 3000, // Her 3 saniyede bir otomatik yenileme
    staleTime: 0, // Her zaman en güncel veriyi alalım
  });
  
  // Fetch customers for displaying names
  const customersQuery = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchInterval: 3000, // Her 3 saniyede bir otomatik yenileme
    staleTime: 0, // Her zaman en güncel veriyi alalım
  });
  
  // Fetch vehicles for displaying details
  const vehiclesQuery = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    refetchInterval: 3000, // Her 3 saniyede bir otomatik yenileme
    staleTime: 0, // Her zaman en güncel veriyi alalım
  });
  
  const isLoading = jobsQuery.isLoading || customersQuery.isLoading || vehiclesQuery.isLoading;
  
  // Filter, sort, and paginate jobs
  const filteredJobs = jobsQuery.data?.filter(job => {
    if (!searchTerm) return true;
    
    const vehicle = vehiclesQuery.data?.find(v => v.id === job.vehicleId);
    const customer = customersQuery.data?.find(c => c.id === job.customerId);
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      vehicle?.plate.toLowerCase().includes(searchLower) ||
      vehicle?.brand.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (!sortBy) return 0;
    
    let valueA, valueB;
    
    switch (sortBy) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "plate":
        valueA = vehiclesQuery.data?.find(v => v.id === a.vehicleId)?.plate || "";
        valueB = vehiclesQuery.data?.find(v => v.id === b.vehicleId)?.plate || "";
        break;
      case "brand":
        const vehicleA = vehiclesQuery.data?.find(v => v.id === a.vehicleId);
        const vehicleB = vehiclesQuery.data?.find(v => v.id === b.vehicleId);
        valueA = `${vehicleA?.brand || ""} ${vehicleA?.model || ""}`;
        valueB = `${vehicleB?.brand || ""} ${vehicleB?.model || ""}`;
        break;
      case "customer":
        valueA = customersQuery.data?.find(c => c.id === a.customerId)?.name || "";
        valueB = customersQuery.data?.find(c => c.id === b.customerId)?.name || "";
        break;
      case "total":
        valueA = Number(a.totalAmount);
        valueB = Number(b.totalAmount);
        break;
      case "paid":
        valueA = Number(a.paidAmount);
        valueB = Number(b.paidAmount);
        break;
      case "remaining":
        valueA = Number(a.totalAmount) - Number(a.paidAmount);
        valueB = Number(b.totalAmount) - Number(b.paidAmount);
        break;
      case "date":
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        break;
      case "status":
        valueA = a.status;
        valueB = b.status;
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  
  // Paginate jobs
  const paginatedJobs = sortedJobs.slice(
    (page - 1) * parseInt(pageSize),
    page * parseInt(pageSize)
  );
  
  const totalPages = Math.ceil(filteredJobs.length / parseInt(pageSize));
  
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
  
  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/jobs/${jobToDelete}`);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      
      toast({
        title: "Başarılı",
        description: "İş emri silindi.",
        variant: "default",
      });
      
      setJobToDelete(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "İş emri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-darkest">{title}</h2>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <label className="text-sm text-gray-dark mr-2">Sayfada</label>
            <Select
              value={pageSize}
              onValueChange={setPageSize}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-dark ml-4 mr-2">kayıt göster</span>
          </div>
          
          <div className="flex items-center">
            <label className="text-sm text-gray-dark mr-2">Ara:</label>
            <Input
              type="text"
              className="border border-gray-300 rounded px-3 py-1 text-sm w-40 md:w-64"
              placeholder="Arama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="bg-gray-lightest border-b border-gray-300">
                <th className="py-3 font-medium" onClick={() => handleSort("id")}>
                  NO
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("plate")}>
                  PLAKA
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("brand")}>
                  MARKA / MODEL
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("customer")}>
                  MÜŞTERİ ADI
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("total")}>
                  TUTAR
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("paid")}>
                  ÖDENEN
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("remaining")}>
                  KALAN
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("date")}>
                  TARİH
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("time")}>
                  SAAT
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium" onClick={() => handleSort("status")}>
                  İŞ DURUM
                  <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </th>
                <th className="py-3 font-medium">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-4 text-center text-gray-medium">
                    Yükleniyor...
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-4 text-center text-gray-medium">
                    Tabloda herhangi bir veri mevcut değil
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => {
                  const vehicle = vehiclesQuery.data?.find(v => v.id === job.vehicleId);
                  const customer = customersQuery.data?.find(c => c.id === job.customerId);
                  const remaining = Number(job.totalAmount) - Number(job.paidAmount);
                  const statusInfo = getJobStatusDisplay(job.status);
                  
                  return (
                    <tr key={job.id} className="border-b border-gray-100">
                      <td className="py-3">{job.id}</td>
                      <td className="py-3 font-medium">{vehicle?.plate}</td>
                      <td className="py-3">{vehicle?.brand} {vehicle?.model}</td>
                      <td className="py-3">
                        <Link href={`/customer/${customer?.id}`} className="text-primary hover:underline">
                          {customer?.name}
                        </Link>
                      </td>
                      <td className="py-3">{formatCurrency(job.totalAmount)}</td>
                      <td className="py-3 text-green-600">{formatCurrency(job.paidAmount)}</td>
                      <td className="py-3">{formatCurrency(remaining)}</td>
                      <td className="py-3">{formatDate(job.createdAt)}</td>
                      <td className="py-3">{new Date(job.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3">
                        <Badge className={`rounded-full px-2 py-1 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex">
                          <Button 
                            asChild
                            variant="ghost" 
                            size="icon" 
                            className="text-primary"
                            title="Görüntüle"
                          >
                            <Link href={`/jobs/${job.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            asChild
                            variant="ghost" 
                            size="icon" 
                            className="text-amber-500"
                            title="Düzenle"
                          >
                            <Link href={`/new-job/${job.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            title="Sil"
                            onClick={() => setJobToDelete(job.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-4">
          <div className="text-sm text-gray-dark mb-2 sm:mb-0">
            Toplam {filteredJobs.length} kayıttan {Math.min(1 + (page - 1) * parseInt(pageSize), filteredJobs.length)}-
            {Math.min(page * parseInt(pageSize), filteredJobs.length)} arası gösteriliyor
          </div>
          
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        open={jobToDelete !== null}
        onOpenChange={() => setJobToDelete(null)}
        title="İş Emrini Sil"
        description="Bu iş emrini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteJob}
      />
    </div>
  );
}
