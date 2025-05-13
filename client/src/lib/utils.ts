import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd-MM-yyyy", { locale: tr });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd-MM-yyyy HH:mm", { locale: tr });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

export const jobStatusOptions = [
  { label: "Bekliyor", value: "bekliyor" },
  { label: "Devam Ediyor", value: "devam_ediyor" },
  { label: "Tamamlandı", value: "tamamlandi" },
  { label: "İptal", value: "iptal" }
];

export function getJobStatusDisplay(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case "bekliyor":
      return { 
        label: "Bekliyor", 
        className: "bg-yellow-100 text-yellow-800" 
      };
    case "devam_ediyor":
      return { 
        label: "Devam Ediyor", 
        className: "bg-blue-100 text-blue-800" 
      };
    case "tamamlandi":
      return { 
        label: "Tamamlandı", 
        className: "bg-green-100 text-green-800" 
      };
    case "iptal":
      return { 
        label: "İptal", 
        className: "bg-red-100 text-red-800" 
      };
    default:
      return { 
        label: "Bilinmiyor", 
        className: "bg-gray-100 text-gray-800" 
      };
  }
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
