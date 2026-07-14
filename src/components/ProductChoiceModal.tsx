import React from "react";
import { X, ShoppingCart, MessageSquare, ShieldCheck, Cpu } from "lucide-react";
import { Product } from "../types";

interface ProductChoiceModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onConfirmOrder: (product: Product) => void;
  activeUser: any;
  onOpenLogin: () => void;
}

export default function ProductChoiceModal({
  isOpen,
  product,
  onClose,
  onAddToCart,
  onConfirmOrder,
  activeUser,
  onOpenLogin,
}: ProductChoiceModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/85 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Choice Dialog Box */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/35 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 md:p-6 text-center space-y-4 md:space-y-6">
          {/* Visual Header */}
          <div className="flex flex-col items-center gap-1.5 md:gap-2">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-[#00dbe7]/10 border border-[#00dbe7]/30 rounded-full flex items-center justify-center">
              <Cpu className="w-5 h-5 md:w-6 md:h-6 text-[#00dbe7]" />
            </div>
            <h3 className="font-space text-xs md:text-sm font-bold text-white tracking-wide uppercase mt-1 md:mt-2">
              Order Options
            </h3>
            <p className="text-[11px] md:text-xs text-[#d8e3fb]/60 leading-relaxed max-w-[280px] mx-auto">
              Choose how you would like to procure the <span className="text-white font-semibold">{product.name}</span> component.
            </p>
          </div>

          {/* Product card micro-preview */}
          <div className="flex items-center gap-3 bg-[#081425]/50 p-2.5 md:p-3 rounded-lg border border-white/5 text-left">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#111c2d] rounded border border-white/10 flex items-center justify-center p-1 md:p-1.5 shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{product.name}</p>
              <p className="text-[10px] text-[#c3f400] font-mono font-semibold">৳{product.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Core Actions */}
          <div className="flex flex-col gap-2.5 md:gap-3">
            {/* Action 1: Add to Cart */}
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full py-2.5 md:py-3 bg-[#1f2a3c] hover:bg-[#1f2a3c]/80 border border-white/10 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#00dbe7]" />
              Add to Cart
            </button>

            {/* Action 2: Confirm Quick Order via WhatsApp */}
            <button
              onClick={() => {
                if (!activeUser) {
                  onClose();
                  onOpenLogin();
                  return;
                }
                onConfirmOrder(product);
                onClose();
              }}
              className="w-full py-2.5 md:py-3 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0266ff]/15"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              Confirm Order
            </button>
          </div>


        </div>

      </div>
    </div>
  );
}
