import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";

// Define the stats interface
interface DailyStats {
  totalAmount: number;
  totalPaid: number;
  totalJobs: number;
  pendingPayments: number;
}
import { Calendar as CalendarIcon, ChevronRight, Download, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import JobsTable from "@/components/dashboard/JobsTable";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Reports() {
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("daily");
  const printRef = useRef<HTMLDivElement>(null);
  
  // Calculate date ranges based on active tab
  const getDateRange = () => {
    if (activeTab === "daily") {
      return { start: date, end: date };
    } else if (activeTab === "weekly") {
      const start = new Date(date);
      start.setDate(start.getDate() - 6);
      return { start, end: date };
    } else if (activeTab === "monthly") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start, end };
    }
    return { start: date, end: date };
  };
  
  const dateRange = getDateRange();
  const formattedStartDate = format(dateRange.start, "yyyy-MM-dd");
  const formattedEndDate = format(dateRange.end, "yyyy-MM-dd");
  
  // Fetch statistics for the date range
  const statsQuery = useQuery<DailyStats>({
    queryKey: [`/api/stats/daily?date=${format(date, "yyyy-MM-dd")}`],
  });
  
  // Fetch jobs to generate chart data
  const jobsQuery = useQuery<any[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Create daily revenue data based on actual jobs
  const dailyRevenueData = [
    { date: "Pazartesi", total: 0 },
    { date: "Salı", total: 0 },
    { date: "Çarşamba", total: 0 },
    { date: "Perşembe", total: 0 },
    { date: "Cuma", total: 0 },
    { date: "Cumartesi", total: 0 },
    { date: "Pazar", total: 0 }
  ];
  
  // Populate daily revenue from actual job data if available
  if (jobsQuery.data && jobsQuery.data.length > 0) {
    const dayMap = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    jobsQuery.data.forEach(job => {
      const jobDate = new Date(job.createdAt);
      const dayName = dayMap[jobDate.getDay()];
      const dayData = dailyRevenueData.find(item => item.date === dayName);
      
      if (dayData) {
        dayData.total += Number(job.totalAmount);
      }
    });
  }
  
  // Create service distribution data based on jobs
  const servicesQuery = useQuery({
    queryKey: ["/api/services"],
  });
  
  // Initialize service distribution with actual service names but zero values
  const serviceDistributionData = servicesQuery.data 
    ? servicesQuery.data.map(service => ({ 
        name: service.name, 
        value: 0 
      }))
    : [];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];
  
  const handlePrint = useReactToPrint({
    documentTitle: `Oto Yıkama Raporu - ${format(date, "dd.MM.yyyy")}`,
    onBeforeGetContent: () => {
      if (!printRef.current) {
        console.error("Print ref is not available");
      }
      return Promise.resolve();
    },
    onPrintError: (error) => console.error("Print failed:", error),
    // @ts-ignore - content property exists in react-to-print
    content: () => printRef.current,
  });
  
  return (
    <main className="container mx-auto px-4 py-6" ref={printRef}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Raporlar</h1>
          <div className="text-sm text-gray-500 mt-1">
            {activeTab === "daily" 
              ? format(date, "d MMMM yyyy", { locale: tr })
              : `${format(dateRange.start, "d MMMM", { locale: tr })} - ${format(dateRange.end, "d MMMM yyyy", { locale: tr })}`
            }
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal w-[240px]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {activeTab === "daily" 
                  ? format(date, "PPP", { locale: tr })
                  : `${format(dateRange.start, "d MMMM", { locale: tr })} - ${format(dateRange.end, "d MMMM", { locale: tr })}`
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="daily" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="daily">Günlük</TabsTrigger>
          <TabsTrigger value="weekly">Haftalık</TabsTrigger>
          <TabsTrigger value="monthly">Aylık</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam Tutar</CardDescription>
                <CardTitle className="text-2xl">
                  {statsQuery.data?.totalAmount 
                    ? `${formatCurrency(statsQuery.data.totalAmount)} TL` 
                    : "0.00 TL"
                  }
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam İş Sayısı</CardDescription>
                <CardTitle className="text-2xl">
                  {statsQuery.data?.totalJobs || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplanan Ödemeler</CardDescription>
                <CardTitle className="text-2xl">
                  {statsQuery.data?.totalPaid 
                    ? `${formatCurrency(statsQuery.data.totalPaid)} TL` 
                    : "0.00 TL"
                  }
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bekleyen Ödemeler</CardDescription>
                <CardTitle className="text-2xl">
                  {statsQuery.data?.pendingPayments || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Servis Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>En Çok Tercih Edilen Hizmetler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={serviceDistributionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Hizmet Sayısı" fill="#1E88E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Gelir Grafiği</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyRevenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} TL`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="Günlük Gelir" 
                      stroke="#1E88E5" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Haftalık Toplam</CardDescription>
                <CardTitle className="text-2xl">9,700.00 TL</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ortalama Günlük Gelir</CardDescription>
                <CardTitle className="text-2xl">1,385.71 TL</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Toplam İş Sayısı</CardDescription>
                <CardTitle className="text-2xl">74</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Özet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Finansal Özet</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Toplam Gelir:</span>
                      <span className="font-medium">32,450.00 TL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tahsil Edilen:</span>
                      <span className="font-medium text-green-600">30,120.00 TL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bekleyen Ödemeler:</span>
                      <span className="font-medium text-amber-600">2,330.00 TL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Ortalama İş Başı Gelir:</span>
                      <span className="font-medium">135.21 TL</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">İş İstatistikleri</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Toplam İş Sayısı:</span>
                      <span className="font-medium">240</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Günlük Ortalama İş:</span>
                      <span className="font-medium">8.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>En Yoğun Gün:</span>
                      <span className="font-medium">Cumartesi (58 iş)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>En Çok Tercih Edilen Hizmet:</span>
                      <span className="font-medium">Dış Yıkama (112)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <JobsTable 
        title={
          activeTab === "daily" 
            ? "Günlük İş Emirleri" 
            : activeTab === "weekly" 
              ? "Haftalık İş Emirleri" 
              : "Aylık İş Emirleri"
        }
        date={format(date, "yyyy-MM-dd")}
      />
    </main>
  );
}
