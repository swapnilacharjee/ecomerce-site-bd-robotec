import { useState, useEffect } from "react";
import { X, FileText, Download, Check, Clipboard, Sparkles } from "lucide-react";
import { PRODUCTS } from "../data";

interface BulkQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkQuoteModal({ isOpen, onClose }: BulkQuoteModalProps) {
  if (!isOpen) return null;

  const [clientName, setClientName] = useState("Southeastern Lab Center");
  const [clientEmail, setClientEmail] = useState("2023100000622@seu.edu.bd");
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "arduino-uno": 200,
    "servo-mg996r": 350,
    "esp32-devkit": 100,
    "lidar-tf-luna": 50,
  });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteId, setQuoteId] = useState("");

  // Generate unique Quote reference ID on load
  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setQuoteId(`QT-2026-${randomNum}`);
  }, [isOpen]);

  const handleQtyChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10) || 0;
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, parsed),
    }));
  };

  // Calculate dynamic totals & tiered discount rates
  const itemsBreakdown = PRODUCTS.map((product) => {
    const qty = quantities[product.id] || 0;
    const itemTotal = qty * product.price;
    return {
      product,
      quantity: qty,
      originalTotal: itemTotal,
    };
  });

  const totalQuantity = Object.keys(quantities).reduce((sum, key) => sum + (quantities[key] || 0), 0);
  const rawSubtotal = itemsBreakdown.reduce((sum, item) => sum + item.originalTotal, 0);

  // Determine dynamic discount tier based on total quantity
  let discountRate = 0;
  let tierLabel = "No Volume Tier";

  if (totalQuantity >= 1000) {
    discountRate = 0.20; // 20%
    tierLabel = "PRO ACADEMIC & ENTERPRISE (-20%)";
  } else if (totalQuantity >= 500) {
    discountRate = 0.10; // 10%
    tierLabel = "MID-TIER LAB STARTUP (-10%)";
  } else if (totalQuantity >= 100) {
    discountRate = 0.05; // 5%
    tierLabel = "INTRO LABORATORY INTEGRATION (-5%)";
  }

  const discountAmount = rawSubtotal * discountRate;
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  
  // Free freight for 500+ items, else standard 1% or flat
  const shippingFee = totalQuantity === 0 ? 0 : totalQuantity >= 500 ? 0 : 75.00; 
  const estimatedTaxes = subtotalAfterDiscount * 0.0825;
  const grandTotal = subtotalAfterDiscount + shippingFee + estimatedTaxes;

  const getQuoteSummaryText = () => {
    const itemLines = itemsBreakdown
      .filter((i) => i.quantity > 0)
      .map(
        (i) =>
          `- ${i.product.name} [${i.product.sku}]: ${i.quantity} units @ ৳${i.product.price.toFixed(
            2
          )} = ৳${i.originalTotal.toFixed(2)}`
      )
      .join("\n");

    return `==========================================
BD ROBOTEC WHOLESALE & BULK SUPPLY QUOTE
==========================================
Reference ID: ${quoteId}
Status: PENDING EXECUTIVE SIGN-OFF
Date Generated: 2026-07-08

Client Entity: ${clientName}
Client Contact: ${clientEmail}

Ordered Components:
${itemLines || "No products selected."}

Financial Breakdown:
- Raw Item Subtotal: ৳${rawSubtotal.toFixed(2)}
- Volume Applied Discount: ${tierLabel} (-৳${discountAmount.toFixed(2)})
- Consolidated Freight: ${shippingFee === 0 ? "FREE FREIGHT SHIPPED" : `৳${shippingFee.toFixed(2)}`}
- Estimated Sales Tax (8.25%): ৳${estimatedTaxes.toFixed(2)}
------------------------------------------
ESTIMATED ACQUISITION BUDGET: ৳${grandTotal.toFixed(2)}
==========================================`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getQuoteSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitQuote = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert(`Quote ${quoteId} submitted successfully to BD Robotec! Our administrators will reach out to ${clientEmail} with the routing dispatch.`);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Dark Blur Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/85 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Main Container */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/35 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Parameters / Input Form */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00dbe7]" />
              <h3 className="font-space text-lg font-bold text-white tracking-wide">
                WHOLESALE & BULK SUPPLY
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="md:hidden p-1 text-[#d8e3fb]/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-space font-semibold tracking-wider text-[#d8e3fb]/50 uppercase mb-2">
                Client Entity Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-colors"
                placeholder="e.g. Southeastern Lab Center"
              />
            </div>
            <div>
              <label className="block text-xs font-space font-semibold tracking-wider text-[#d8e3fb]/50 uppercase mb-2">
                Contact E-mail
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-colors"
                placeholder="2023100000622@seu.edu.bd"
              />
            </div>
          </div>

          {/* Component Selection Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-space font-bold text-[#00dbe7] tracking-wider uppercase border-b border-white/5 pb-2">
              Configure Component Volumes
            </h4>
            
            <div className="space-y-3">
              {PRODUCTS.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between gap-4 bg-[#081425]/40 p-3 rounded border border-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#d8e3fb]/50 font-mono shrink-0">
                      {product.sku}
                    </span>
                    <span className="text-sm font-semibold text-white truncate">
                      {product.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#d8e3fb]/60 font-mono">
                      ৳{product.price.toFixed(2)}/ea
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={quantities[product.id] === 0 ? "" : quantities[product.id]}
                      onChange={(e) => handleQtyChange(product.id, e.target.value)}
                      className="w-20 bg-[#081425] border border-white/15 rounded text-center py-1 text-sm font-semibold text-white focus:border-[#00dbe7] outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tiered Discount Info card */}
          <div className="p-3 bg-[#111c2d] border border-[#c3f400]/20 rounded flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-[#c3f400] shrink-0 mt-0.5" />
            <div className="text-xs text-[#d8e3fb]/70 leading-relaxed">
              <span className="text-[#c3f400] font-bold">Dynamic Discount Tiers:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>100+ items: <span className="text-white font-semibold">5% Discount</span></li>
                <li>500+ items: <span className="text-white font-semibold">10% Discount + Free Freight</span></li>
                <li>1000+ items: <span className="text-white font-semibold">20% Discount + Engineering Support</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Quote Preview Card */}
        <div className="w-full md:w-[360px] bg-[#081425] p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs text-[#00dbe7] font-space font-bold tracking-widest uppercase">
                QUOTE SPECIFICATION
              </span>
              <button 
                onClick={onClose}
                className="hidden md:block p-1 text-[#d8e3fb]/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Invoice Receipt */}
            <div className="bg-[#111c2d] border border-white/10 p-4 rounded-lg font-mono text-[11px] leading-relaxed text-[#d8e3fb]/90 space-y-4 shadow-inner">
              <div className="text-center border-b border-dashed border-white/15 pb-2">
                <p className="font-bold text-white text-xs">BD ROBOTEC</p>
                <p className="text-[#d8e3fb]/50">Official Bulk Pro Forma Invoice</p>
                <p className="text-[#00dbe7] font-semibold mt-1">{quoteId}</p>
              </div>

              <div className="space-y-1">
                <p><span className="text-[#d8e3fb]/50">CLIENT:</span> {clientName}</p>
                <p><span className="text-[#d8e3fb]/50">EMAIL:</span> {clientEmail}</p>
                <p><span className="text-[#d8e3fb]/50">DATE:</span> 2026-07-08 11:00 UTC</p>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-white/15 pt-2 space-y-1 max-h-[140px] overflow-y-auto">
                {itemsBreakdown.filter(i => i.quantity > 0).length > 0 ? (
                  itemsBreakdown
                    .filter((i) => i.quantity > 0)
                    .map((item) => (
                      <div key={item.product.id} className="flex justify-between gap-2">
                        <span className="truncate flex-1">{item.product.name}</span>
                        <span>{item.quantity}x</span>
                        <span className="font-semibold text-white">
                          ৳{item.originalTotal.toFixed(2)}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-[#d8e3fb]/40 text-center py-2">No units specified</p>
                )}
              </div>

              {/* Totals Section */}
              <div className="border-t border-dashed border-white/15 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Items:</span>
                  <span>৳{rawSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#c3f400]">
                  <span>Tier Disc:</span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freight Cost:</span>
                  <span>{shippingFee === 0 ? "FREE" : `৳${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (8.25%):</span>
                  <span>৳{estimatedTaxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 text-sm font-bold text-[#c3f400]">
                  <span>NET TOTAL:</span>
                  <span>৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Applied Tier Badge */}
            {totalQuantity > 0 && (
              <div className="text-center py-1.5 px-3 bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400] text-[10px] font-space font-bold rounded-lg uppercase tracking-wider">
                {tierLabel}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleCopy}
              className="w-full py-2 bg-white/5 border border-white/10 text-white text-xs font-space font-bold uppercase tracking-wider rounded transition-all hover:bg-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#c3f400]" />
                  QUOTE SUMMARY COPIED
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  COPY INVOICE CODE
                </>
              )}
            </button>

            <button
              onClick={handleSubmitQuote}
              disabled={totalQuantity === 0 || submitting}
              className="w-full py-3 bg-[#0266ff] hover:bg-[#0266ff]/85 disabled:opacity-40 text-white text-xs font-space font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Download className="w-4 h-4" />
              {submitting ? "SUBMITTING ACQUISITION..." : "APPROVE ACQUISITION BUDGET"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
