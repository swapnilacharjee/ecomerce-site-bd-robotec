import { X, ShieldCheck, Mail, MessageCircle, AlertTriangle, FileText, Globe, ShoppingBag } from "lucide-react";

interface FooterDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy" | "contact" | null;
}

export default function FooterDocumentModal({ isOpen, onClose, type }: FooterDocumentModalProps) {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#040e1f]/80 backdrop-blur-md cursor-pointer transition-opacity duration-300 ease-out"
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-2xl bg-[#0b1524] border border-[#00dbe7]/20 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in-95 duration-250 ease-out"
      >
        {/* Header */}
        <div className="bg-[#152238] border-b border-[#00dbe7]/15 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {type === "terms" && <FileText className="w-5 h-5 text-[#00dbe7]" />}
            {type === "privacy" && <ShieldCheck className="w-5 h-5 text-[#00dbe7]" />}
            {type === "contact" && <Globe className="w-5 h-5 text-[#00dbe7]" />}
            <h3 className="font-space text-sm font-bold text-white tracking-wider uppercase">
              {type === "terms" && "Terms of Service"}
              {type === "privacy" && "Privacy Policy"}
              {type === "contact" && "Contact & Inquiries"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-[#d8e3fb]/80 leading-relaxed font-sans">
          {type === "terms" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="font-space text-xs font-bold text-[#00dbe7] uppercase tracking-wider">
                RoboBD Terms & Conditions
              </p>
              <p>
                Welcome to RoboBD! By creating an account or purchasing from our platform, you agree to these Terms of Service. Please read them carefully.
              </p>
              
              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                1. User Registration & Verification
              </h4>
              <p>
                When registering, users must provide accurate, current, and complete details. You are responsible for safeguarding your credentials. Any unauthorized action on your profile must be reported instantly.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                2. Orders, Invoices & Pricing
              </h4>
              <p>
                All products listed on RoboBD are subject to real-time availability. RoboBD reserves the right to revise prices, deny transactions, or cancel duplicate order sequences in case of system anomalies or parts restocking delays.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                3. Electronic Parts & System Usage
              </h4>
              <p>
                RoboBD provides automation nodes, microcontrollers, and electronic components for prototyping. Users must ensure safe wiring and operation. We are not liable for hardware misconfiguration or damage caused during user experimentation.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                4. Service Access & Security
              </h4>
              <p>
                We deploy secure Firebase Auth protection shields. Attempting to inject scripts, compromise user directories, or execute DDoS protocols will result in permanent account termination and legal action.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                5. Amendments & Notifications
              </h4>
              <p>
                These Terms of Service may be updated as our systems evolve. Continued usage of our website signifies automatic acceptance of revised guidelines.
              </p>
            </div>
          )}

          {type === "privacy" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="font-space text-xs font-bold text-[#00dbe7] uppercase tracking-wider">
                RoboBD Privacy Standards
              </p>
              <p>
                Your privacy is of critical importance to us. This policy describes how we collect, safeguard, and process your industrial user credentials and interaction records.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                1. Collected Credentials
              </h4>
              <p>
                We store secure profile datasets including names, email addresses, order histories, and cart choices. Google auth identities are tokenized securely through Google OAuth protocols.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                2. Database & Firebase Integration
              </h4>
              <p>
                All user account data is compiled, mapped, and synced in real-time with Google Cloud Firestore. We store passwords strictly via secure hash formulas and never expose plain-text entries.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                3. Third-Party Protocols
              </h4>
              <p>
                We do not sell, exchange, or rent user directories. Your contact information is exclusively shared with official local delivery providers in Bangladesh to dispatch your purchased components securely.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                4. Cookies & System Memory
              </h4>
              <p>
                We utilize persistent browser cookies to maintain local cart status, token validations, and responsive navigation workflows across tab closures.
              </p>

              <h4 className="font-space font-bold text-white uppercase tracking-wider text-[11px] pt-2">
                5. Contact & Support
              </h4>
              <p>
                For any queries regarding your data footprints or to request account/profile wiping, please contact our support desk through our direct live interface.
              </p>
            </div>
          )}

          {type === "contact" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <p className="font-space text-xs font-bold text-[#00dbe7] uppercase tracking-wider">
                  Contact Us
                </p>
                <p className="text-white text-base font-space font-bold">
                  Have inquiries or custom development projects?
                </p>
              </div>

              {/* Main Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp contact option */}
                <a
                  href="https://wa.me/8801865954203"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                >
                  <MessageCircle className="w-10 h-10 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-space font-bold text-white text-sm uppercase tracking-wider">
                    Chat on WhatsApp
                  </span>
                  <span className="text-[#d8e3fb]/60 text-xs mt-1">
                    01865954203
                  </span>
                </a>

                {/* Email contact option */}
                <a
                  href="mailto:swapnilacharjee2003@gmail.com"
                  className="p-5 bg-[#0266ff]/10 hover:bg-[#0266ff]/15 border border-[#0266ff]/20 hover:border-[#0266ff]/40 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                >
                  <Mail className="w-10 h-10 text-sky-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-space font-bold text-white text-sm uppercase tracking-wider">
                    Send Email
                  </span>
                  <span className="text-[#d8e3fb]/60 text-xs mt-1 break-all">
                    swapnilacharjee2003@gmail.com
                  </span>
                </a>
              </div>

              {/* Custom Guidelines / Information sections */}
              <div className="space-y-4 pt-2">
                {/* Website building */}
                <div className="p-4 bg-[#152238]/60 border border-white/5 rounded-lg flex gap-3 items-start">
                  <Globe className="w-5 h-5 text-[#00dbe7] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                      Custom Web Development Services
                    </h4>
                    <p className="text-xs text-[#d8e3fb]/70 mt-1">
                      If you are looking to build highly responsive, custom-tailored, and visually outstanding websites, please feel free to contact us for direct consultations.
                    </p>
                  </div>
                </div>

                {/* Bulk orders */}
                <div className="p-4 bg-[#152238]/60 border border-white/5 rounded-lg flex gap-3 items-start">
                  <ShoppingBag className="w-5 h-5 text-[#c3f400] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                      Wholesale & Bulk Sourcing
                    </h4>
                    <p className="text-xs text-[#d8e3fb]/70 mt-1">
                      For volume orders or specialized equipment sourcing, please contact our procurement team directly to secure dynamic commercial pricing and volume discounts.
                    </p>
                  </div>
                </div>

                {/* Warning label */}
                <div className="p-4 bg-[#93000a]/10 border border-[#ffb4ab]/15 rounded-lg flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-[#ffb4ab] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#ffb4ab] text-xs uppercase tracking-wide">
                      Policy Guidelines
                    </h4>
                    <p className="text-xs text-[#ffb4ab]/80 mt-1 font-semibold">
                      Important Notice: Please reserve inquiries for legitimate business, technical, or development projects to ensure optimal resource allocation and support availability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#152238]/40 border-t border-white/5 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
