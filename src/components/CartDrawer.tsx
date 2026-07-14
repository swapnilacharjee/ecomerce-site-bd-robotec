import { useState } from "react";
import { X, Trash2, Plus, Minus, MessageSquare, ShieldCheck, Sparkles, LogIn } from "lucide-react";
import { CartItem, PromoCode } from "../types";
import { db, doc, setDoc } from "../lib/firebase";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  promoCodes: PromoCode[];
  activeUser: any;
  onOpenLogin: () => void;
  onOrderSuccess?: (orderData: any) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  promoCodes = [],
  activeUser,
  onOpenLogin,
  onOrderSuccess,
}: CartDrawerProps) {
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{ type: "percentage" | "flat"; value: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal === 0 ? 0 : subtotal > 50 ? 0 : 4.99;
  const taxes = subtotal * 0.0825; // 8.25% tax

  const handleApplyPromo = () => {
    setPromoError("");
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a promo code.");
      return;
    }
    
    const foundPromo = promoCodes.find((p) => p.code.toUpperCase() === code);
    if (foundPromo) {
      setAppliedPromo(foundPromo.code);
      setPromoDiscount({ type: "percentage", value: foundPromo.discount });
    } else {
      setPromoError("Invalid promo code. Please check your spelling or ask support!");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(null);
    setPromoCodeInput("");
    setPromoError("");
  };

  let discountAmount = 0;
  if (promoDiscount) {
    if (promoDiscount.type === "percentage") {
      discountAmount = subtotal * (promoDiscount.value / 100);
    } else if (promoDiscount.type === "flat") {
      discountAmount = Math.min(subtotal, promoDiscount.value);
    }
  }

  const total = Math.max(0, subtotal - discountAmount + shipping + taxes);

  const handleCheckout = async () => {
    if (!activeUser) {
      onClose();
      onOpenLogin();
      return;
    }

    setDeliveryError("");
    if (!deliveryPhone.trim()) {
      setDeliveryError("Please enter your phone number.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setDeliveryError("Please enter your delivery location.");
      return;
    }

    const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const orderData = {
      id: orderId,
      userId: activeUser?.uid || "anonymous",
      userEmail: activeUser?.email || "anonymous@example.com",
      customerName: activeUser?.name || "Guest User",
      customerPhone: deliveryPhone.trim(),
      deliveryLocation: deliveryAddress.trim(),
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      createdAt: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      await setDoc(doc(db, "orders", orderId), orderData);
      console.log("Order saved to database successfully.");
    } catch (err) {
      console.error("Error saving order to Firestore:", err);
    }

    // Generate a beautiful WhatsApp Order message
    const orderItemsText = cart
      .map(
        (item) =>
          `• ${item.product.name} (SKU: ${item.product.sku}) x${item.quantity} - ৳${(
            item.product.price * item.quantity
          ).toFixed(2)}`
      )
      .join("\n");

    const promoLine = appliedPromo 
      ? `\n- Promo Discount (${appliedPromo}): -৳${discountAmount.toFixed(2)}`
      : "";

    const messageText = `Hello BD Robotec! 🛠️\n\nI would like to place an official order with the following specifications:\n\n*Customer Details:*\n- **Name:** ${activeUser.name}\n- **Phone:** ${deliveryPhone.trim()}\n- **Delivery Location:** ${deliveryAddress.trim()}\n\n*Ordered Components:*\n${orderItemsText}\n\n*Financial breakdown:*\n- Subtotal: ৳${subtotal.toFixed(2)}${promoLine}\n- Shipping: ${shipping === 0 ? "FREE" : `৳${shipping.toFixed(2)}`}\n- Taxes (8.25%): ৳${taxes.toFixed(2)}\n-----------------------\n*TOTAL AMOUNT: ৳${total.toFixed(2)}*\n\nPlease advise on the payment routing link and estimated delivery dispatch. Thank you!`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/8801603670583?text=${encodedMessage}`;
    
    // Open in new window safely
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    if (onOrderSuccess) {
      onOrderSuccess(orderData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Blur Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#040e1f]/70 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* Drawer Body */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111c2d] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-space text-base font-bold tracking-wider text-white">
              YOUR CART
            </h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-[#d8e3fb]/60 hover:text-white transition-all cursor-pointer rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex items-center gap-4 bg-[#081425]/60 p-3 rounded-lg border border-white/5"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 bg-[#111c2d] rounded border border-white/10 overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-[#d8e3fb]/50 font-mono mt-0.5">
                      SKU: {item.product.sku}
                    </p>
                    <p className="text-xs font-semibold text-[#c3f400] font-space mt-1">
                      ৳{item.product.price.toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity & Action controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button 
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 text-[#d8e3fb]/40 hover:text-[#ffb4ab] transition-colors cursor-pointer"
                      title="Remove component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2 bg-[#1f2a3c] rounded border border-white/5 p-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1 font-mono text-white">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="h-16 w-16 bg-[#1f2a3c] border border-white/5 rounded-full flex items-center justify-center text-[#d8e3fb]/30 mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <p className="text-sm text-[#d8e3fb]/50 font-space">
                  Your cart is empty.
                </p>
                <button 
                  onClick={onClose}
                  className="mt-4 text-xs font-space font-bold tracking-wider text-[#00dbe7] underline hover:text-[#00dbe7]/80"
                >
                  Browse components
                </button>
              </div>
            )}
          </div>

          {/* Pricing breakdown & checkout footer */}
          {cart.length > 0 && (
            <div className="px-6 py-6 bg-[#081425]/90 border-t border-white/10 space-y-4 shrink-0">
              
              {/* Promo Code Discount Section */}
              <div className="p-3 bg-[#081425]/50 border border-white/5 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#c3f400]" />
                    Promo Code
                  </label>
                  {appliedPromo && (
                    <span className="text-[9px] bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError("");
                    }}
                    disabled={!!appliedPromo}
                    placeholder="Enter promo code (e.g. ROBOBD10)"
                    className="flex-1 bg-[#081425] border border-white/10 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-[#00dbe7] transition-all disabled:opacity-50"
                  />
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="px-2.5 py-1 bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] rounded text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3 py-1 bg-[#00dbe7]/15 border border-[#00dbe7]/30 hover:bg-[#00dbe7]/30 text-[#00dbe7] hover:text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {promoError && (
                  <p className="text-[9px] text-[#ffb4ab] font-medium">{promoError}</p>
                )}

                {appliedPromo && promoDiscount && (
                  <p className="text-[9px] text-[#c3f400] font-medium">
                    ✓ Code <strong>{appliedPromo}</strong> applied! Got {promoDiscount.type === "percentage" ? `${promoDiscount.value}%` : `৳${promoDiscount.value}`} off.
                  </p>
                )}

                {!appliedPromo && promoCodes.filter((p) => p.isPublic).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-[#d8e3fb]/40">
                    <span>Tap to apply:</span>
                    {promoCodes
                      .filter((p) => p.isPublic)
                      .slice(0, 5)
                      .map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => {
                            setPromoCodeInput(p.code);
                            setAppliedPromo(p.code);
                            setPromoDiscount({ type: "percentage", value: p.discount });
                            setPromoError("");
                          }}
                          className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-[8px] text-[#00dbe7] cursor-pointer"
                        >
                          {p.code} ({p.discount}%)
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Delivery Details Section */}
              <div className="p-3 bg-[#081425]/50 border border-white/5 rounded-lg space-y-2.5">
                <label className="text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00dbe7]" />
                  Delivery Details
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Phone Number (e.g. 01712345678)"
                    value={deliveryPhone}
                    onChange={(e) => {
                      setDeliveryPhone(e.target.value);
                      setDeliveryError("");
                    }}
                    className="w-full bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Delivery Address / Lab Location"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setDeliveryError("");
                    }}
                    className="w-full bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                  />
                  {deliveryError && (
                    <p className="text-[9px] text-[#ffb4ab] font-medium font-mono">{deliveryError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#d8e3fb]/70">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">৳{subtotal.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-[#c3f400]">
                    <span>Discount ({appliedPromo}):</span>
                    <span className="font-mono">-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-mono text-white">
                    {shipping === 0 ? (
                      <span className="text-[#c3f400] font-semibold">FREE</span>
                    ) : (
                      `৳${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Taxes (8.25%):</span>
                  <span className="font-mono text-white">৳{taxes.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>TOTAL AMOUNT:</span>
                  <span className="font-sans text-[#c3f400]">৳{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#0266ff]/20"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                CHECKOUT VIA WHATSAPP
              </button>
              
              <p className="text-[10px] text-center text-[#d8e3fb]/40 font-mono leading-relaxed">
                By ordering, you connect to our secure business WhatsApp portal where a BD Robotec support engineer will approve your invoice.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
