import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Link } from "wouter";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Job, Customer, Vehicle, Service } from "@shared/schema";
import { formatDate, formatCurrency, getJobStatusDisplay } from "@/lib/utils";
import { Printer, ChevronLeft } from "lucide-react";

interface JobDetailProps {
  jobId: string;
}

export default function JobDetail({ jobId }: JobDetailProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Fetch job details
  const jobQuery = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
  });
  
  // Fetch customer details
  const customerId = jobQuery.data?.customerId;
  const customerQuery = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });
  
  // Fetch vehicle details
  const vehicleId = jobQuery.data?.vehicleId;
  const vehicleQuery = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });
  
  // Fetch job services
  const jobServicesQuery = useQuery<Service[]>({
    queryKey: [`/api/jobs/${jobId}/services`],
    enabled: !!jobId,
  });
  
  const isLoading = 
    jobQuery.isLoading || 
    (customerId && customerQuery.isLoading) || 
    (vehicleId && vehicleQuery.isLoading) || 
    jobServicesQuery.isLoading;
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });
  
  if (isLoading) {
    return <div className="text-center py-10">Yükleniyor...</div>;
  }
  
  if (!jobQuery.data) {
    return <div className="text-center py-10">İş emri bulunamadı.</div>;
  }
  
  const job = jobQuery.data;
  const customer = customerQuery.data;
  const vehicle = vehicleQuery.data;
  const services = jobServicesQuery.data || [];
  
  const statusInfo = getJobStatusDisplay(job.status);
  const remaining = Number(job.totalAmount) - Number(job.paidAmount);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center text-primary hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Geri Dön
        </Link>
        
        <Button onClick={handlePrint} className="flex items-center">
          <Printer className="h-4 w-4 mr-2" />
          Yazdır
        </Button>
      </div>
      
      <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-8 print:mb-4">
          <div className="flex justify-center items-center mb-2">
            <svg 
              className="mr-2 h-6 w-6 text-primary"
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="5" cy="18" r="3" />
              <circle cx="19" cy="18" r="3" />
              <path d="M10 18H14" />
              <path d="M1 18v-4a4 4 0 0 1 4-4h13.5M8 9l-2-2V3h10l2 2" />
              <path d="M15 19v-3h-4v3" />
            </svg>
            <h2 className="text-2xl font-bold text-primary">Oto Yıkama</h2>
          </div>
          <p className="text-sm text-gray-500">İş Emri No: {job.id}</p>
          <p className="text-sm text-gray-500">Tarih: {formatDate(job.createdAt)}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Müşteri Bilgileri</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Ad Soyad:</span> {customer?.name || "-"}</p>
              <p><span className="font-medium">Telefon:</span> {customer?.phone || "-"}</p>
              <p><span className="font-medium">E-posta:</span> {customer?.email || "-"}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Araç Bilgileri</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Plaka:</span> {vehicle?.plate || "-"}</p>
              <p><span className="font-medium">Marka/Model:</span> {vehicle?.brand || "-"} {vehicle?.model || ""}</p>
              <p><span className="font-medium">Renk:</span> {vehicle?.color || "-"}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Yapılan İşlemler</h3>
          {services.length === 0 ? (
            <p className="text-gray-500 italic">Herhangi bir işlem kaydedilmemiş.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-4 border-b">İşlem</th>
                  <th className="text-left py-2 px-4 border-b">Açıklama</th>
                  <th className="text-right py-2 px-4 border-b">Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b">
                    <td className="py-2 px-4">{service.name}</td>
                    <td className="py-2 px-4">{service.description || "-"}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(service.price)} TL</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 px-4" colSpan={2}>Toplam</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(job.totalAmount)} TL</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Ödeme Bilgileri</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Toplam Tutar:</span> {formatCurrency(job.totalAmount)} TL</p>
              <p><span className="font-medium">Ödenen:</span> {formatCurrency(job.paidAmount)} TL</p>
              <p><span className="font-medium">Kalan:</span> {formatCurrency(remaining)} TL</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Durum</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">İş Durumu:</span>{" "}
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </p>
              {job.notes && (
                <>
                  <p className="font-medium">Notlar:</p>
                  <p className="text-gray-700">{job.notes}</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 text-center print:fixed print:bottom-10 print:left-0 print:right-0">
          <p className="text-sm text-gray-500">Bu belge bilgilendirme amaçlıdır. Kaşe ve imza olmaksızın geçerli değildir.</p>
        </div>
      </div>
    </div>
  );
}
