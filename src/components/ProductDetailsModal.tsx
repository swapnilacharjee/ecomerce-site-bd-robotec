import { useState } from "react";
import { X, Check, ShieldCheck, ShoppingCart, Info } from "lucide-react";
import { Product } from "../types";

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };

  // Custom schematic interfacing helper text based on category
  const getInterfaceGuidelines = () => {
    switch (product.category) {
      case "MICROCONTROLLER":
        return "Connect to computer via USB Type-B cable. Recommended operating voltage is 7V to 12V through the DC barrel jack, or 5V through USB. Use Arduino IDE or Web Editor with standard avr toolchain.";
      case "ACTUATOR":
        return "Connect orange PWM signal pin to Arduino Digital Pin 9, red VCC pin to external 5V-6V power rail, and brown ground pin to common GND. Warning: Stall current can draw up to 1.2A under peak loads.";
      case "WIRELESS MCU":
        return "Connect CP2102 USB port to PC to power and flash. Ensure ESP32 board is selected in board manager (v1.0.6 or higher). Supports 3.3V logic level - do not apply 5V directly to GPIO pins.";
      case "SENSORS":
        return "Connect SDA to Arduino Pin A4 and SCL to Pin A5 for I2C configuration, or RXD to Pin 10 and TXD to Pin 11 for software serial UART communication. Ground to GND, power pin to 5V.";
      default:
        return "Ensure correct logic level matching (3.3V or 5V) before routing electrical traces.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/80 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* Modal Card */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/30 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Product Image Display */}
        <div className="flex-1 bg-[#040e1f]/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
          <div className="w-full aspect-square flex items-center justify-center max-h-[250px]">
            <img 
              src={product.image} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          <div className="mt-4 flex items-center gap-1.5 text-xs text-[#d8e3fb]/40 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#c3f400]" />
            <span>100% Genuine // Certified & Lab Tested</span>
          </div>
        </div>

        {/* Right Side: Product Technical Details */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-space font-bold text-[#d8e3fb]/50 tracking-widest uppercase">
                  {product.category}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {product.name}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-[#d8e3fb]/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[#c3f400] font-sans">
                ৳{product.price.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1f2a3c] border border-white/5 rounded text-[#d8e3fb]/70">
                SKU: {product.sku}
              </span>
            </div>

            <p className="text-xs text-[#d8e3fb]/80 leading-relaxed">
              {product.description}
            </p>

            {/* Technical Specifications */}
            <div className="space-y-2">
              <p className="text-[10px] font-space font-bold text-[#00dbe7] tracking-widest uppercase">
                PINOUT SPECIFICATIONS
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {product.specs.map((spec, i) => (
                  <li key={i} className="text-[11px] font-mono text-[#d8e3fb]/70 flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-[#00dbe7] rounded-full" />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interfacing Tip Box */}
            <div className="p-3 bg-[#081425] border border-white/5 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-[#00dbe7]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-space font-bold tracking-wider">INTERFACING DIRECTIVE</span>
              </div>
              <p className="text-[10px] text-[#d8e3fb]/60 leading-relaxed">
                {getInterfaceGuidelines()}
              </p>
            </div>
          </div>

          {/* Quantity selector & Add Action */}
          <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
            <div className="flex items-center border border-white/10 rounded overflow-hidden h-10 shrink-0">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-3 text-[#d8e3fb]/60 hover:text-white hover:bg-white/5 h-full transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-3 text-sm font-semibold font-mono text-white">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="px-3 text-[#d8e3fb]/60 hover:text-white hover:bg-white/5 h-full transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              className={`flex-1 h-10 text-xs font-space font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                added 
                  ? "bg-[#c3f400] text-[#081425]" 
                  : "bg-[#0266ff] hover:bg-[#0266ff]/85 text-white"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px]" />
                  ADDED TO CART
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  ADD TO CART
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
