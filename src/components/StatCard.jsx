export default function StatCard({ icon: Icon, label, value, subtitle, color = "primary" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`h-10 w-10 rounded-lg bg-accent flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-accent-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}