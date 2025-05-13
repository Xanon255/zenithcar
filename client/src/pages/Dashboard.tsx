import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ReceiptCent, Receipt, Clock, Wallet, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/StatCard";
import JobsTable from "@/components/dashboard/JobsTable";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const [today] = useState(new Date());
  const formattedDate = format(today, "dd-MM-yyyy", { locale: tr });
  
  // Fetch daily statistics
  const statsQuery = useQuery({
    queryKey: [`/api/stats/daily?date=${format(today, "yyyy-MM-dd")}`],
  });
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">
            Gün Özeti - <span>{formattedDate}</span>
          </h1>
        </div>
        <div className="flex items-center text-sm">
          <Link href="/" className="text-primary hover:underline">Anasayfa</Link>
          <span className="mx-2 text-gray-medium">/</span>
          <span className="text-gray-dark">Gün Özeti</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          value={statsQuery.data?.totalAmount ? formatCurrency(statsQuery.data.totalAmount) : "0.00"}
          label="TOPLAM ALINAN TUTAR"
          date={formattedDate}
          icon={<ReceiptCent className="h-5 w-5" />}
          iconBgColor="bg-primary"
        />
        
        <StatCard
          value={statsQuery.data?.totalPaid ? formatCurrency(statsQuery.data.totalPaid) : "0.00"}
          label="TOPLAM FİŞ TUTARLARI"
          date={formattedDate}
          icon={<Receipt className="h-5 w-5" />}
          iconBgColor="bg-amber-500"
        />
        
        <StatCard
          value={statsQuery.data?.totalJobs || 0}
          label="TOPLAM İŞ SAYISI"
          date={formattedDate}
          icon={<Clock className="h-5 w-5" />}
          iconBgColor="bg-pink-500"
        />
        
        <StatCard
          value={statsQuery.data?.pendingPayments || 0}
          label="ÖDEME BEKLEYEN"
          date={formattedDate}
          icon={<Wallet className="h-5 w-5" />}
          iconBgColor="bg-blue-400"
        />
      </div>
      
      <JobsTable 
        title="Bugün Açılan İş Emirleri" 
        date={format(today, "yyyy-MM-dd")}
      />
      
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 no-print">
        <Button 
          asChild
          size="icon" 
          className="w-12 h-12 rounded-full shadow-lg"
        >
          <Link href="/new-job">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="w-12 h-12 rounded-full shadow-lg"
          onClick={handlePrint}
        >
          <Printer className="h-6 w-6" />
        </Button>
      </div>
    </main>
  );
}
