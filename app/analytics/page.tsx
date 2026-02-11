import { PageHeader } from "@/components/page-header";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Analytiques" 
        subtitle="Visualisez les statistiques et métriques de la plateforme."
      />
      <div className="flex-1 p-8">
        {/* Content goes here */}
      </div>
    </div>
  );
}
