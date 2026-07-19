export default function ProductSkeleton() {
  return (
    <div className="glass-card rounded-lg md:rounded-xl p-3 md:p-6 flex flex-col h-full border border-white/5 animate-pulse">
      <div className="w-full aspect-square mb-3 md:mb-6 bg-[#1f2a3c] rounded" />
      <div className="h-2.5 w-16 bg-[#1f2a3c] rounded mb-2" />
      <div className="h-4 w-3/4 bg-[#1f2a3c] rounded mb-2" />
      <div className="h-3 w-full bg-[#1f2a3c] rounded mb-1" />
      <div className="h-3 w-2/3 bg-[#1f2a3c] rounded mb-5" />
      <div className="flex justify-between mb-5">
        <div className="h-5 w-20 bg-[#1f2a3c] rounded" />
        <div className="h-5 w-14 bg-[#1f2a3c] rounded" />
      </div>
      <div className="h-9 w-full bg-[#1f2a3c] rounded" />
    </div>
  );
}
