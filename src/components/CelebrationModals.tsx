import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Award, ShieldCheck, CheckCircle2, ShoppingBag, Send, MapPin, DollarSign, Calendar } from "lucide-react";

interface WelcomeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function WelcomeMemberModal({ isOpen, onClose, userName }: WelcomeMemberModalProps) {
  // Simple mini floating particles
  const [particles, setParticles] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 4,
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#040e1f]/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-[#11233e] to-[#0a1526] border border-[#00dbe7]/40 rounded-3xl p-6 shadow-2xl shadow-[#00dbe7]/10 text-center text-white"
          >
            {/* Background glowing aura */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#00dbe7]/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#c3f400]/15 blur-3xl rounded-full pointer-events-none" />

            {/* Custom SVG Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute bottom-0 w-1.5 h-1.5 bg-[#00dbe7] rounded-full opacity-60"
                  style={{ left: `${p.left}%` }}
                  animate={{
                    y: [-20, -400],
                    x: [0, (Math.random() - 0.5) * 50],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Main Trophy Icon with micro-animation */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-[#c3f400]/20 to-[#00dbe7]/20 border border-[#c3f400]/40 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-[#c3f400]/5"
            >
              <Award className="w-9 h-9 text-[#c3f400]" />
            </motion.div>

            {/* Congratulations Header */}
            <h3 className="text-xl font-bold font-space text-white uppercase tracking-wider">
              Congratulations! 🎉
            </h3>
            <p className="text-[11px] text-[#00dbe7] font-mono tracking-widest uppercase mt-1">
              New Member Enrolled
            </p>

            <div className="h-px bg-white/5 my-4" />

            {/* Body content as requested */}
            <div className="space-y-4 px-2">
              <p className="text-sm text-[#d8e3fb]/90 leading-relaxed font-sans">
                Hey <strong className="text-[#00dbe7] font-bold select-all font-space">{userName}</strong>,
              </p>
              <p className="text-sm text-[#d8e3fb]/80 leading-relaxed font-sans">
                Congratulations from all of us at BD RoboTec! We are absolutely thrilled to welcome you as an esteemed member of our platform, and we deeply appreciate your trust in us.
              </p>
              <div className="bg-[#081425]/70 border border-white/5 rounded-xl p-3 text-xs text-[#d8e3fb]/60 text-left space-y-2 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Premium Account Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c3f400] shrink-0" />
                  <span>Member Exclusive Discounts Enabled</span>
                </div>
              </div>
            </div>

            {/* Start Exploring Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gradient-to-r from-[#0266ff] to-[#00dbe7] text-white font-space font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 shadow-lg shadow-[#0266ff]/20 cursor-pointer transition-all"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
}

export function OrderSuccessModal({ isOpen, onClose, orderData }: OrderSuccessModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && orderData) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, orderData]);

  if (!orderData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#040e1f]/90 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#0e1726] border border-[#c3f400]/30 rounded-3xl p-6 shadow-2xl shadow-[#c3f400]/5 text-white overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#c3f400]/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#00dbe7]/10 blur-3xl rounded-full pointer-events-none" />

            {/* Confetti Micro Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 25 }).map((_, i) => {
                const colors = ["#c3f400", "#00dbe7", "#0266ff", "#f59e0b", "#10b981"];
                const color = colors[i % colors.length];
                const rotate = Math.random() * 360;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                      backgroundColor: color,
                      left: `${Math.random() * 100}%`,
                      top: `-5%`,
                    }}
                    animate={{
                      y: ["0%", "1000%"],
                      x: [`0px`, `${(Math.random() - 0.5) * 150}px`],
                      rotate: [0, rotate * 2],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 2.5 + Math.random() * 3,
                      ease: "easeOut",
                      repeat: Infinity,
                    }}
                  />
                );
              })}
            </div>

            {/* Success Icon */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-full mb-3"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-lg font-bold font-space uppercase tracking-wider text-[#c3f400]">
                Order Confirmed! 🚀
              </h3>
              <p className="text-[10px] text-[#d8e3fb]/50 font-mono mt-0.5">
                SECURE PIPELINE DISPATCH INITIATED
              </p>
            </div>

            <div className="h-px bg-white/5 my-4" />

            {/* Interactive feedback card */}
            <div className="space-y-3.5 text-left">
              <div className="bg-[#08121f]/80 border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono text-[#00dbe7] bg-[#00dbe7]/5 px-2 py-0.5 rounded border border-[#00dbe7]/10 uppercase font-bold">
                      ID: {orderData.id ? orderData.id.replace("order_", "") : ""}
                    </span>
                    <h4 className="text-sm font-space font-bold mt-2 text-white">
                      Recipient: {orderData.customerName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-space font-bold text-[#d8e3fb]/40 uppercase">Total Paid</span>
                    <span className="text-base font-bold text-[#c3f400] font-mono">
                      ${parseFloat(orderData.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-1.5 text-xs text-[#d8e3fb]/80 border-t border-white/5 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00dbe7] mt-0.5 shrink-0" />
                    <span className="leading-tight">
                      <strong>Delivery Destination:</strong> {orderData.deliveryLocation}
                    </span>
                  </div>
                </div>

                {/* Ordered Items summary list */}
                <div className="bg-[#111c2d]/50 p-2.5 rounded-lg border border-white/5 text-[11px] text-[#d8e3fb]/70 space-y-1 max-h-[110px] overflow-y-auto">
                  <span className="block text-[8px] font-space font-bold text-white/40 uppercase tracking-widest mb-1">
                    Component Cargo Load:
                  </span>
                  {orderData.items && orderData.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between font-mono">
                      <span>• {item.name} <strong className="text-[#00dbe7]">x{item.quantity}</strong></span>
                      <span className="text-white">${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Congratulations Message */}
              <div className="bg-[#10b981]/10 border border-[#10b981]/25 rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm text-green-300 font-semibold font-space">
                  🎉 Your order has been successfully registered in our database!
                </p>
                <p className="text-[11px] text-[#d8e3fb]/80 font-sans">
                  We are currently redirecting you to WhatsApp to securely coordinate your delivery dispatch.
                </p>
              </div>

              {/* Waiting or Redirect progress info */}
              <div className="flex items-center justify-between text-[11px] text-[#d8e3fb]/40 font-mono bg-[#08121f]/40 p-2.5 rounded-lg border border-white/5">
                <span className="flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-[#00dbe7] animate-pulse" />
                  <span>Auto-Redirecting to WhatsApp support...</span>
                </span>
                <span className="text-[#c3f400] font-bold">
                  {countdown > 0 ? `${countdown}s` : "Redirecting..."}
                </span>
              </div>
            </div>

            {/* Action buttons to handle manually if needed */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 bg-white/5 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer border border-white/5 transition-all text-center"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => {
                  // Re-trigger whatsapp redirection manually
                  const orderLines = orderData.items
                    .map((item: any) => `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
                    .join("\n");
                  const messageText = `Hello BD Robotec! 🛠️\n\nI placed an order:\n\n*Customer Details:*\n- **Name:** ${orderData.customerName}\n- **Phone:** ${orderData.customerPhone}\n- **Delivery Location:** ${orderData.deliveryLocation}\n\n*Ordered Components:*\n${orderLines}\n-----------------------\n*TOTAL AMOUNT: $${parseFloat(orderData.total).toFixed(2)}*`;
                  const whatsappUrl = `https://wa.me/8801603670583?text=${encodeURIComponent(messageText)}`;
                  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                }}
                className="py-2.5 bg-gradient-to-r from-green-500 to-[#10b981] hover:opacity-90 text-white font-space font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer shadow-lg shadow-green-500/10 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Open WhatsApp
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
