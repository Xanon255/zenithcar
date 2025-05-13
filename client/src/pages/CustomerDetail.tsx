import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getJobStatusDisplay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
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
  const analyticsQuery = useQuery<any>({
    queryKey: [`/api/customers/${customerId}/analytics`],
    enabled: !isNaN(customerId),
    refetchInterval: 3000,
  });

  const customer = customerQuery.data;
  const vehicles = vehiclesQuery.data || [];
  const jobs = jobsQuery.data || [];
  
  // Pagination
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const paginatedJobs = jobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Calculate customer stats
  const totalAmount = jobs.reduce((sum, job) => sum + Number(job.totalAmount), 0);
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.status === 'tamamlandi').length;
  const pendingJobs = jobs.filter(job => job.status === 'bekliyor' || job.status === 'devam_ediyor').length;
  
  // Get recent visit
  const sortedJobs = [...jobs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const lastVisit = sortedJobs.length > 0 ? new Date(sortedJobs[0].createdAt) : null;

  if (isNaN(customerId)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Geçersiz müşteri ID'si</h1>
          <Link href="/customers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Müşteri Listesine Dön
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                      {lastVisit 
                        ? format(lastVisit, 'dd MMM yyyy') 
                        : "Ziyaret yok"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-500">İsim</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Telefon</p>
                    <p className="font-medium">{customer.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">E-posta</p>
                    <p className="font-medium">{customer.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Müşteri Numarası</p>
                    <p className="font-medium">{customer.id}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="vehicles">
                <TabsList className="mb-4">
                  <TabsTrigger value="vehicles">Araçlar</TabsTrigger>
                  <TabsTrigger value="jobs">İş Geçmişi</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vehicles">
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b">
                      <h2 className="text-xl font-semibold">Kayıtlı Araçlar</h2>
                    </div>
                    
                    {vehiclesQuery.isLoading ? (
                      <div className="p-6 text-center">Yükleniyor...</div>
                    ) : vehicles.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">Bu müşteriye ait araç bulunmamaktadır</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plaka</TableHead>
                            <TableHead>Marka</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Renk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">{vehicle.plate}</TableCell>
                              <TableCell>{vehicle.brand || "-"}</TableCell>
                              <TableCell>{vehicle.model || "-"}</TableCell>
                              <TableCell>{vehicle.color || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="jobs">
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b">
                      <h2 className="text-xl font-semibold">İş Geçmişi</h2>
                    </div>
                    
                    {jobsQuery.isLoading ? (
                      <div className="p-6 text-center">Yükleniyor...</div>
                    ) : jobs.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">Bu müşteriye ait iş geçmişi bulunmamaktadır</div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>İş No</TableHead>
                              <TableHead>Araç</TableHead>
                              <TableHead>Tutar</TableHead>
                              <TableHead>Ödenen</TableHead>
                              <TableHead>Kalan</TableHead>
                              <TableHead>Tarih</TableHead>
                              <TableHead>Saat</TableHead>
                              <TableHead>Durum</TableHead>
                              <TableHead>İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedJobs.map((job) => {
                              const vehicle = vehicles.find(v => v.id === job.vehicleId);
                              const remaining = Number(job.totalAmount) - Number(job.paidAmount);
                              const statusInfo = getJobStatusDisplay(job.status);
                              
                              return (
                                <TableRow key={job.id}>
                                  <TableCell>{job.id}</TableCell>
                                  <TableCell className="font-medium">{vehicle?.plate || "-"}</TableCell>
                                  <TableCell>{formatCurrency(job.totalAmount)}</TableCell>
                                  <TableCell className="text-green-600">{formatCurrency(job.paidAmount)}</TableCell>
                                  <TableCell>{formatCurrency(remaining)}</TableCell>
                                  <TableCell>{formatDate(job.createdAt)}</TableCell>
                                  <TableCell>{new Date(job.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                  <TableCell>
                                    <Badge className={`rounded-full px-2 py-1 ${statusInfo.className}`}>
                                      {statusInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex">
                                      <Button 
                                        asChild
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-primary"
                                        title="Görüntüle"
                                      >
                                        <Link href={`/jobs/${job.id}`}>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </Link>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-4 border-t">
                            <div>
                              Toplam {jobs.length} kayıttan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, jobs.length)} arası gösteriliyor
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="text-sm">
                                Sayfa {currentPage} / {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
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
    </Layout>
  );
}