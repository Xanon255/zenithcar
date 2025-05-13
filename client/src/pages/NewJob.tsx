import { useParams } from "wouter";
import JobForm from "@/components/jobs/JobForm";

export default function NewJob() {
  const params = useParams<{ id?: string }>();
  const jobId = params?.id;
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-darkest">
          {jobId ? "İş Emri Düzenle" : "Yeni İş Emri Oluştur"}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <JobForm jobId={jobId} />
        </div>
      </div>
    </main>
  );
}
