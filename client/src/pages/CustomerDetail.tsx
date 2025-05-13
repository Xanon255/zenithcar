import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getJobStatusDisplay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer, Job, Vehicle } from "@shared/schema";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch customer data
  const customerQuery = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !isNaN(customerId),
    refetchInterval: 3000
  });

  // Fetch customer vehicles
  const vehiclesQuery = useQuery<Vehicle[]>({
    queryKey: [`/api/customers/${customerId}/vehicles`],
    enabled: !isNaN(customerId),
    refetchInterval: 3000,
  });

  // Fetch customer jobs
  const jobsQuery = useQuery<Job[]>({
    queryKey: [`/api/customers/${customerId}/jobs`],
    enabled: !isNaN(customerId),
    refetchInterval: 3000,
  });

  // Fetch customer analytics
  const analyticsQuery = useQuery<{ totalAmount: number; totalJobs: number }>({
    queryKey: [`/api/customers/${customerId}/analytics`],
    enabled: !isNaN(customerId),
    refetchInterval: 3000,
  });

  if (customerQuery.isLoading || vehiclesQuery.isLoading || jobsQuery.isLoading || analyticsQuery.isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Yükleniyor...</div>;
  }

  // If any queries failed or returned no data
  if (!customerQuery.data) {
    return <div className="container mx-auto px-4 py-8 text-center">Müşteri bulunamadı.</div>;
  }

  const customer = customerQuery.data;
  const vehicles = vehiclesQuery.data || [];
  const jobs = jobsQuery.data || [];
  const totalAmount = analyticsQuery.data?.totalAmount || 0;
  const totalJobs = analyticsQuery.data?.totalJobs || 0;

  // Sort jobs by date, descending
  const sortedJobs = [...jobs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination for jobs
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const currentJobs = sortedJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const lastVisit = sortedJobs.length > 0 ? new Date(sortedJobs[0].createdAt) : null;

  if (isNaN(customerId)) {
    return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Geçersiz müşteri ID'si</h1>
          <Link href="/customers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Müşteri Listesine Dön
            </Button>
          </Link>
        </div>
    );
  }

  return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link href="/customers">
              <Button variant="outline" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Müşteri Detayları</h1>
          </div>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
        </div>

        <div ref={printRef} className="space-y-6">
          {customerQuery.isLoading ? (
            <div className="text-center py-10">Yükleniyor...</div>
          ) : !customer ? (
            <div className="text-center py-10">Müşteri bulunamadı</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Toplam Tutar</CardTitle>
                    <CardDescription>Tüm zamanlar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Toplam İş Sayısı</CardTitle>
                    <CardDescription>Tüm zamanlar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{totalJobs}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Kayıtlı Araç</CardTitle>
                    <CardDescription>Toplam</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{vehicles.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Son Ziyaret</CardTitle>
                    <CardDescription>Tarih</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-primary">
                      {lastVisit ? formatDate(lastVisit) : "Ziyaret yok"}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Müşteri Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">İsim</h3>
                    <p className="mt-1">{customer.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telefon</h3>
                    <p className="mt-1">{customer.phone || "-"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">E-posta</h3>
                    <p className="mt-1">{customer.email || "-"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Müşteri Numarası</h3>
                    <p className="mt-1">{customer.id}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="araçlar" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                  <TabsTrigger value="araçlar">Araçlar</TabsTrigger>
                  <TabsTrigger value="iş-geçmişi">İş Geçmişi</TabsTrigger>
                </TabsList>
                <TabsContent value="araçlar" className="mt-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 flex justify-between items-center border-b">
                      <h2 className="text-lg font-medium">Kayıtlı Araçlar</h2>
                      <Button size="sm" className="gap-1" onClick={() => alert("Araç ekle modalı")}>
                        + Araç Ekle
                      </Button>
                    </div>
                    
                    {vehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Bu müşteriye ait kayıtlı araç bulunmamaktadır.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plaka</TableHead>
                            <TableHead>Marka</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Yıl</TableHead>
                            <TableHead>İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">{vehicle.plate}</TableCell>
                              <TableCell>{vehicle.brand}</TableCell>
                              <TableCell>{vehicle.model}</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>
                                <Link href={`/vehicles/${vehicle.id}`}>
                                  <Button variant="link" size="sm">Detay</Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="iş-geçmişi" className="mt-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b">
                      <h2 className="text-lg font-medium">İş Geçmişi</h2>
                    </div>
                    
                    {jobs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Bu müşteriye ait iş kaydı bulunmamaktadır.
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tarih</TableHead>
                              <TableHead>Plaka</TableHead>
                              <TableHead>Hizmetler</TableHead>
                              <TableHead>Tutar</TableHead>
                              <TableHead>Durum</TableHead>
                              <TableHead>İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentJobs.map((job) => {
                              const vehicle = vehicles.find(v => v.id === job.vehicleId);
                              return (
                                <TableRow key={job.id}>
                                  <TableCell>
                                    {formatDate(job.createdAt)}
                                  </TableCell>
                                  <TableCell>{vehicle?.plate || "-"}</TableCell>
                                  <TableCell>
                                    {job.notes || "Standart yıkama"}
                                  </TableCell>
                                  <TableCell>{formatCurrency(job.totalAmount)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        job.status === "tamamlandi"
                                          ? "bg-green-100 text-green-800"
                                          : job.status === "bekliyor"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : job.status === "iptal"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-blue-100 text-blue-800"
                                      }
                                    >
                                      {getJobStatusDisplay(job.status).text}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Link href={`/jobs/${job.id}`}>
                                      <Button variant="link" size="sm">Detay</Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>

                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="text-sm text-gray-500">
                              Toplam {jobs.length} kayıt, Sayfa {currentPage} / {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
  );
}