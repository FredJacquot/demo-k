import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader 
        title="Configuration" 
        subtitle="Configurez les paramètres de l'application."
      />
      <div className="flex-1 p-8">
        {/* Content goes here */}
      </div>
    </div>
  );
}
