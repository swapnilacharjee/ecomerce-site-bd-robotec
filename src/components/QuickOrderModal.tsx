import React, { useState, useEffect } from "react";
import { X, MessageSquare, ShieldCheck, MapPin, Phone, User, ShoppingBag, Plus, Minus, Trash2, Sparkles } from "lucide-react";
import { Product, CartItem, PromoCode, UserAccount } from "../types";
import { PRODUCTS } from "../data";
import { db, doc, setDoc } from "../lib/firebase";

interface QuickOrderModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  cart?: CartItem[];
  onClearCart?: () => void;
  promoCodes: PromoCode[];
  activeUser: UserAccount | null;
  onOrderSuccess?: (orderData: any) => void;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

export default function QuickOrderModal({
  isOpen,
  product,
  onClose,
  cart = [],
  onClearCart,
  promoCodes = [],
  activeUser,
  onOrderSuccess,
}: QuickOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [formError, setFormError] = useState("");

  // Keep track of all selected items in this order
  const [orderedItems, setOrderedItems] = useState<OrderItem[]>([]);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{ type: "percentage" | "flat"; value: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  // Initialize with the original product and existing cart items when opened
  useEffect(() => {
    if (isOpen && product) {
      const itemsMap = new Map<string, OrderItem>();

      // 1. Add current cart items
      if (cart && cart.length > 0) {
        cart.forEach((item) => {
          itemsMap.set(item.product.id, {
            product: item.product,
            quantity: item.quantity,
          });
        });
      }

      // 2. Add current selected product if not already there
      if (!itemsMap.has(product.id)) {
        itemsMap.set(product.id, {
          product,
          quantity: 1,
        });
      }

      setOrderedItems(Array.from(itemsMap.values()));
      setFormError("");
      setPromoCodeInput("");
      setAppliedPromo(null);
      setPromoDiscount(null);
      setPromoError("");

      // Pre-fill name from active session if available
      const stored = localStorage.getItem("bd_robotec_active_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.name) {
            setCustomerName(parsed.name);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleUpdateQty = (productId: string, delta: number) => {
    setOrderedItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    // Only allow removal if there's more than 1 item in the order list
    if (orderedItems.length <= 1) {
      setFormError("Your order must contain at least one component.");
      return;
    }
    setOrderedItems((prev) => prev.filter((item) => item.product.id !== productId));
    setFormError("");
  };

  const subtotal = orderedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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
      setPromoError("Invalid promo code. Check active codes or try again!");
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

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customerName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!customerPhone.trim()) {
      setFormError("Please enter your phone number.");
      return;
    }
    if (orderedItems.length === 0) {
      setFormError("Please add at least one component to order.");
      return;
    }
    if (!deliveryLocation.trim()) {
      setFormError("Please enter your delivery location.");
      return;
    }

    const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const orderData = {
      id: orderId,
      userId: activeUser?.uid || "anonymous",
      userEmail: activeUser?.email || "anonymous@example.com",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryLocation: deliveryLocation.trim(),
      items: orderedItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2)),
      createdAt: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      await setDoc(doc(db, "orders", orderId), orderData);
      console.log("Order saved to database successfully.");
    } catch (err) {
      console.error("Error saving order:", err);
    }

    // Generate beautifully formatted order lines
    const orderLines = orderedItems
      .map(
        (item) =>
          `• ${item.product.name} (SKU: ${item.product.sku}) x${item.quantity} - ৳${(
            item.product.price * item.quantity
          ).toFixed(2)}`
      )
      .join("\n");

    const promoLine = appliedPromo 
      ? `\n- **Promo Discount (${appliedPromo}):** -৳${discountAmount.toFixed(2)}`
      : "";

    // Generate a professional, structured WhatsApp message
    const messageText = `Hello BD Robotec! 🛠️\n\nI would like to place an order with the following specifications:\n\n*Customer Details:*\n- **Name:** ${customerName.trim()}\n- **Phone:** ${customerPhone.trim()}\n- **Delivery Location:** ${deliveryLocation.trim()}\n\n*Ordered Components:*\n${orderLines}\n-----------------------\n- **Subtotal:** ৳${subtotal.toFixed(2)}${promoLine}\n*TOTAL AMOUNT: ৳${finalTotal.toFixed(2)}*\n\nPlease verify and dispatch the order shipment details. Thank you!`;

    const encodedMessage = encodeURIComponent(messageText);
    
    // As explicitly specified, order message must route to the developer support number 01603670583.
    // We target 8801603670583 which is the standard WhatsApp format for Bangladesh.
    const whatsappUrl = `https://wa.me/8801603670583?text=${encodedMessage}`;

    // Open WhatsApp in a secure new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (onClearCart) {
      onClearCart();
    }
    if (onOrderSuccess) {
      onOrderSuccess(orderData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/85 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Quick Order Form Box */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/35 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="bg-[#1f2a3c] border-b border-[#00dbe7]/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00dbe7]" />
            <h3 className="font-space text-sm font-bold text-white tracking-wide uppercase">
              Configure Quick Order
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Items Ordered List */}
        <div className="p-4 bg-[#081425]/40 border-b border-white/5 space-y-3 max-h-[180px] overflow-y-auto">
          <span className="text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/40 block">
            COMPONENTS IN THIS ORDER:
          </span>
          
          <div className="space-y-2">
            {orderedItems.map((item) => (
              <div 
                key={item.product.id}
                className="flex items-center justify-between gap-3 bg-[#081425]/75 p-2.5 rounded border border-white/5 hover:border-[#00dbe7]/25 transition-all"
              >
                {/* Product details preview */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 bg-[#111c2d] rounded border border-white/10 flex items-center justify-center p-1 shrink-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-[10px] text-[#c3f400] font-mono font-semibold">
                      ৳{item.product.price.toFixed(2)} each
                    </p>
                  </div>
                </div>

                {/* Actions & Quantity */}
                <div className="flex items-center gap-3">
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-white/10 rounded overflow-hidden h-7 bg-[#111c2d]">
                    <button 
                      type="button"
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      className="px-2 text-[#d8e3fb]/60 hover:text-white hover:bg-white/5 h-full transition-colors cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-[11px] font-semibold font-mono text-white">
                      {item.quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      className="px-2 text-[#d8e3fb]/60 hover:text-white hover:bg-white/5 h-full transition-colors cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove component */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="p-1 text-[#d8e3fb]/40 hover:text-[#ffb4ab] transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Details */}
        <form onSubmit={handleConfirmOrder} className="p-6 space-y-4">
          
          {/* Form validation alert */}
          {formError && (
            <div className="p-2.5 bg-[#93000a]/35 border border-[#ffb4ab]/30 rounded text-xs text-[#ffb4ab]">
              {formError}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00dbe7]" />
              Your Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Adnan Rahman"
              className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#00dbe7]" />
              Your Phone Number
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00dbe7] transition-all"
            />
          </div>

          {/* Delivery Location Field */}
          <div>
            <label className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00dbe7]" />
              Delivery Location
            </label>
            <textarea
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              rows={2}
              placeholder="e.g. Dhanmondi, Dhaka, Bangladesh"
              className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all resize-none"
            />
          </div>

          {/* Promo Code Discount Section */}
          <div className="p-3 bg-[#081425]/50 border border-white/5 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c3f400]" />
                Promo Code
              </label>
              {appliedPromo && (
                <span className="text-[10px] bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
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
                className="flex-1 bg-[#081425] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00dbe7] transition-all disabled:opacity-50"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="px-3 py-1.5 bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-1.5 bg-[#00dbe7]/15 border border-[#00dbe7]/30 hover:bg-[#00dbe7]/30 text-[#00dbe7] hover:text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Apply
                </button>
              )}
            </div>

            {promoError && (
              <p className="text-[10px] text-[#ffb4ab] font-medium">{promoError}</p>
            )}

            {appliedPromo && promoDiscount && (
              <p className="text-[10px] text-[#c3f400] font-medium flex items-center gap-1">
                <span>✓ Code <strong>{appliedPromo}</strong> applied! Got {promoDiscount.type === "percentage" ? `${promoDiscount.value}%` : `৳${promoDiscount.value}`} off.</span>
              </p>
            )}

            {!appliedPromo && promoCodes.filter((p) => p.isPublic).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-[#d8e3fb]/40">
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
                      className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-[9px] text-[#00dbe7] cursor-pointer hover:border-[#00dbe7]/35 transition-all"
                    >
                      {p.code} ({p.discount}%)
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Pricing Details & Total Cost Display */}
          <div className="p-3 bg-[#081425]/70 rounded border border-white/5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[#d8e3fb]/60 text-[11px]">
              <span>Subtotal:</span>
              <span className="font-mono text-white">৳{subtotal.toFixed(2)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between items-center text-[#c3f400] text-[11px]">
                <span>Discount ({appliedPromo}):</span>
                <span className="font-mono">-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-white/5 pt-1.5 flex justify-between items-center">
              <span className="text-[#d8e3fb]/80 font-bold">Total Cost of Order:</span>
              <span className="font-sans font-bold text-[#c3f400] text-sm">
                ৳{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0266ff]/10"
          >
            <MessageSquare className="w-4.5 h-4.5 fill-current" />
            Confirm Order via WhatsApp
          </button>

          <div className="flex justify-center items-center gap-1.5 text-[9px] text-[#d8e3fb]/40 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c3f400]" />
            <span>Pre-addressed to Support Number // 01603670583</span>
          </div>

        </form>

      </div>
    </div>
  );
}
