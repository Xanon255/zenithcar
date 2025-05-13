import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  date: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

export default function StatCard({
  value,
  label,
  date,
  icon,
  iconBgColor = "bg-primary"
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-start p-6">
        <div className="flex-1">
          <h2 className="text-3xl font-medium text-gray-darkest">{value}</h2>
          <p className="text-xs uppercase tracking-wider text-gray-medium mt-1">{label}</p>
          <p className="text-xs text-gray-medium mt-2">{date}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-full text-white flex items-center justify-center", iconBgColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
