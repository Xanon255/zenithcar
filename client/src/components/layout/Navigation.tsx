import { Link, useLocation } from "wouter";
import { 
  Home, 
  PlusCircle, 
  Eye, 
  Users, 
  BarChart2, 
  FileText, 
  Car, 
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "ANASAYFA" },
  { href: "/new-job", icon: PlusCircle, label: "YENİ İŞ EMRİ" },
  { href: "/view-job", icon: Eye, label: "İŞ EMRİ GÖSTER" },
  { href: "/customers", icon: Users, label: "MÜŞTERİLER" },
  { href: "/reports", icon: BarChart2, label: "RAPORLAR" },
  { href: "/price-list", icon: FileText, label: "FİYAT LİSTESİ" },
  { href: "/vehicle-list", icon: Car, label: "ARAÇ LİSTESİ" },
  { href: "/users", icon: User, label: "KULLANICILAR" },
];

export default function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white shadow-sm py-3 no-print">
      <div className="container mx-auto px-4">
        <div className="flex items-center overflow-x-auto whitespace-nowrap">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center mx-3 transition-colors",
                location === item.href
                  ? "text-primary font-medium"
                  : "text-gray-dark hover:text-primary"
              )}
            >
              <item.icon className="mr-1 h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
