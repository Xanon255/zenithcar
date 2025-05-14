import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Moon, ChevronDown, Search, X, Car, UserRound, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { logoutMutation } = useAuth();
  
  // Veri sorgulama
  const customersQuery = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });
  
  const vehiclesQuery = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
  });
  
  const servicesQuery = useQuery<any[]>({
    queryKey: ["/api/services"],
  });
  
  // Klavye kısayolu için etki
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(true);
  };
  
  const handleSelect = (path: string) => {
    setLocation(path);
    setOpen(false);
  };
  
  const handleLogout = () => {
    // API'ye çıkış isteği gönder
    logoutMutation.mutate();
    
    // Anasayfaya yönlendir
    setLocation("/auth");
  };
  
  const toggleDarkMode = () => {
    const html = document.querySelector("html");
    if (html) {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        html.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }
    }
  };
  
  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const html = document.querySelector("html");
    if (savedTheme === "dark" && html) {
      html.classList.add("dark");
    }
  }, []);
  
  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Müşteri, araç, hizmet ara..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {search ? `"${search}" için sonuç bulunamadı` : "Arama için birşeyler yazın..."}
          </CommandEmpty>
          
          {/* Müşteri sonuçları */}
          <CommandGroup heading="Müşteriler">
            {customersQuery.data && customersQuery.data
              .filter(customer => customer.name.toLowerCase().includes(search.toLowerCase()) || 
                customer.phone?.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 5)
              .map((customer) => (
                <CommandItem 
                  key={customer.id}
                  value={`customer-${customer.id}`}
                  onSelect={() => handleSelect(`/customers/${customer.id}`)}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  <span>{customer.name}</span>
                  {customer.phone && <span className="text-gray-500 ml-2 text-xs">{customer.phone}</span>}
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Araç sonuçları */}
          <CommandGroup heading="Araçlar">
            {vehiclesQuery.data && vehiclesQuery.data
              .filter(vehicle => 
                vehicle.plate.toLowerCase().includes(search.toLowerCase()) || 
                vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
                (vehicle.model && vehicle.model.toLowerCase().includes(search.toLowerCase()))
              )
              .slice(0, 5)
              .map((vehicle) => (
                <CommandItem 
                  key={vehicle.id}
                  value={`vehicle-${vehicle.id}`}
                  onSelect={() => handleSelect(`/vehicles/${vehicle.id}`)}
                >
                  <Car className="mr-2 h-4 w-4" />
                  <span>{vehicle.plate}</span>
                  <span className="text-gray-500 ml-2 text-xs">{vehicle.brand} {vehicle.model}</span>
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Hizmet sonuçları */}
          <CommandGroup heading="Hizmetler">
            {servicesQuery.data && servicesQuery.data
              .filter(service => 
                service.name.toLowerCase().includes(search.toLowerCase()) ||
                (service.description && service.description.toLowerCase().includes(search.toLowerCase()))
              )
              .slice(0, 5)
              .map((service) => (
                <CommandItem 
                  key={service.id}
                  value={`service-${service.id}`}
                  onSelect={() => handleSelect('/services')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{service.name}</span>
                  <span className="text-gray-500 ml-2 text-xs">{service.price} TL</span>
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Sayfalar */}
          <CommandGroup heading="Hızlı Erişim">
            <CommandItem onSelect={() => handleSelect('/')}>
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Ana Sayfa</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/customers')}>
              <UserRound className="mr-2 h-4 w-4" />
              <span>Müşteriler</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/vehicles')}>
              <Car className="mr-2 h-4 w-4" />
              <span>Araçlar</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/new-job')}>
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>Yeni İş Emri</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/reports')}>
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <span>Raporlar</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <header className="bg-primary text-white shadow-md no-print">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <svg 
                  className="mr-2 h-6 w-6"
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
                <div className="flex flex-col">
                  <span className="font-bold text-xl">ZENITH CAR</span>
                  <span className="text-xs -mt-1">Oto Yıkama Sistemi</span>
                </div>
              </Link>
              
              <div className="ml-8 relative">
                <Button
                  variant="outline"
                  className="pl-10 pr-4 py-2 rounded-md text-gray-darkest focus:ring-2 focus:ring-blue-300 w-64 flex items-center justify-between"
                  onClick={() => setOpen(true)}
                >
                  <div className="flex-grow text-left text-gray-600">Genel Arama...</div>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-300 bg-gray-100 px-1.5 font-mono text-xs font-medium text-gray-600">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-medium" />
              </div>
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-2 rounded-full hover:bg-blue-600 mr-2"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                <Moon className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center ml-4">
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center mr-2">
                      <span className="text-sm font-bold">ZC</span>
                    </div>
                    <span className="font-medium">ZENITH CAR</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSelect("/profile")}>
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelect("/settings")}>
                    Ayarlar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
