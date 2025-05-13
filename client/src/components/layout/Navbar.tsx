import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Moon, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useLocation();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    alert("Arama özelliği: " + search);
  };
  
  const handleLogout = () => {
    // Implement logout functionality
    alert("Çıkış yap");
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
                <span className="font-bold text-xl">Oto Yıkama</span>
                <span className="text-xs -mt-1">takip sistemi</span>
              </div>
            </Link>
            
            <form onSubmit={handleSearch} className="ml-8 relative">
              <Input
                type="search"
                placeholder="Genel Arama..."
                className="pl-10 pr-4 py-2 rounded-md text-gray-darkest focus:ring-2 focus:ring-blue-300 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-2 top-2 h-5 w-5 text-gray-medium" />
            </form>
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
                    <span className="text-sm font-bold">AD</span>
                  </div>
                  <span className="font-medium">Demo Admin</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
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
  );
}
