import { Link } from "wouter";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ActionButtons() {
  const [location] = useLocation();
  
  // Don't show action buttons on the new job page
  if (location.startsWith("/new-job")) {
    return null;
  }
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
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
  );
}
