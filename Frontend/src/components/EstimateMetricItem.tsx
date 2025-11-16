function EstimateMetricItem({ label, value }: { label: string, value: number | string }) {
    return (
        <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">
                {label}
            </div>
            <div className="text-2xl font-bold text-foreground">
                {value}
            </div>
        </div>
    );
}

export default EstimateMetricItem;