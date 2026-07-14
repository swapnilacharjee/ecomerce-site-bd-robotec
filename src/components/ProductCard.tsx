import React, { useState, MouseEvent } from "react";
import { MessageSquare, Check, Cpu, Info } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  onQuickOrder: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductCard({
  product,
  onQuickOrder,
  onSelectProduct,
}: ProductCardProps) {
  const [showSpecs, setShowSpecs] = useState(false);

  const handleQuickOrder = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Avoid triggering card details click
    onQuickOrder(product);
  };

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="glass-card rounded-lg md:rounded-xl p-3 md:p-6 flex flex-col h-full group relative cursor-pointer border border-[#00dbe7]/15 hover:border-[#00dbe7]/50 transition-all duration-300"
    >
      {/* Product Image Stage */}
      <div className="relative w-full aspect-square mb-3 md:mb-6 bg-[#040e1f]/50 rounded border border-white/5 overflow-hidden flex items-center justify-center p-2 md:p-4">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Quick specs hover indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSpecs(!showSpecs);
          }}
          className="absolute top-1.5 right-1.5 p-1 bg-[#111c2d]/80 rounded border border-white/10 text-[#d8e3fb]/60 hover:text-[#00dbe7] transition-all"
          title="Toggle Pinout / Specs"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {/* Specs overlay panel */}
        {showSpecs && (
          <div className="absolute inset-0 bg-[#081425]/95 backdrop-blur-sm p-2 md:p-4 flex flex-col justify-center animate-in fade-in duration-200">
            <p className="text-[9px] md:text-[10px] font-space font-bold tracking-wider text-[#00dbe7] mb-1.5 md:mb-2">
              TECHNICAL SPECIFICATIONS
            </p>
            <ul className="space-y-1 md:space-y-1.5 overflow-y-auto max-h-[80%]">
              {product.specs.map((spec, i) => (
                <li key={i} className="text-[10px] md:text-xs text-[#d8e3fb]/80 flex items-start gap-1 font-mono">
                  <span className="text-[#c3f400] shrink-0">▪</span>
                  <span className="truncate">{spec}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSpecs(false);
              }}
              className="mt-2 md:mt-4 text-[9px] md:text-[10px] text-[#00dbe7] font-space font-bold uppercase tracking-wider text-left underline hover:text-[#00dbe7]/80"
            >
              Back to Image
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="font-space text-[8px] md:text-[10px] font-bold tracking-widest text-[#d8e3fb]/60 uppercase mb-0.5 md:mb-1">
          {product.category}
        </span>
        
        <h3 className="font-sans text-xs sm:text-sm md:text-lg font-bold mb-1 md:mb-2 text-white group-hover:text-[#00dbe7] transition-colors leading-snug line-clamp-1 md:line-clamp-none">
          {product.name}
        </h3>
        
        <p className="text-[11px] md:text-sm text-[#d8e3fb]/70 mb-3 md:mb-5 flex-1 line-clamp-2 md:line-clamp-3">
          {product.description}
        </p>

        {/* Price and SKU block */}
        <div className="flex flex-row items-center justify-between gap-1 mb-3 md:mb-5">
          <span className="font-sans text-sm sm:text-base md:text-xl font-bold neon-text-yellow">
            ৳{product.price.toFixed(2)}
          </span>
          <span className="text-[8px] md:text-[10px] font-mono bg-[#1f2a3c] px-1.5 py-0.5 md:px-2 md:py-1 rounded border border-white/10 text-[#d8e3fb]/80 max-w-[65px] truncate">
            {product.sku}
          </span>
        </div>

        {/* Checkout / Order via WhatsApp trigger */}
        <button
          onClick={handleQuickOrder}
          className="w-full py-1.5 md:py-3 text-[10px] md:text-[11px] font-space font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 cursor-pointer bg-[#0266ff] hover:bg-[#0266ff]/85 text-white shadow-md hover:shadow-[#0266ff]/20"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          <span>ORDER</span>
        </button>
      </div>
    </div>
  );
}
