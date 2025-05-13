import { useParams } from "wouter";
import JobDetail from "@/components/jobs/JobDetail";

export default function ViewJob() {
  const params = useParams<{ id: string }>();
  
  if (!params.id) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-medium text-gray-darkest mb-4">
            İş Emri Bulunamadı
          </h1>
          <p>Görüntülemek istediğiniz iş emri ID'si belirtilmemiş.</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-darkest">
          İş Emri #{params.id}
        </h1>
      </div>
      
      <JobDetail jobId={params.id} />
    </main>
  );
}
