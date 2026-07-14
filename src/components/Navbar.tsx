import { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, User, Cpu, Settings, X, Mail } from "lucide-react";
import { Product, CartItem, UserAccount, BrandSettings } from "../types";

interface NavbarProps {
  products: Product[];
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onSelectProduct: (product: Product) => void;
  activeUser: UserAccount | null;
  onOpenUserModal: () => void;
  onOpenAdminPanel: () => void;
  onOpenContact: () => void;
  brandSettings?: BrandSettings;
}

export default function Navbar({
  products,
  cart,
  setIsCartOpen,
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  onSelectProduct,
  activeUser,
  onOpenUserModal,
  onOpenAdminPanel,
  onOpenContact,
  brandSettings,
}: NavbarProps) {
  const {
    name = "BD ROBOTEC",
    logoUrl = "",
    logoType = "icon",
    showName = true,
  } = brandSettings || {};

  const [showPredictions, setShowPredictions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const predictionRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Filter products for dropdown suggestion
  const suggestions = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (predictionRef.current && !predictionRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkClick = (category: string) => {
    setActiveCategory(category);
    const catalogElement = document.getElementById("precision-inventory");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/10 shadow-sm h-14 md:h-16 transition-all duration-300">
      <div className="flex justify-between items-center px-4 md:px-6 py-2 w-full max-w-[1440px] mx-auto h-full gap-3 md:gap-8">
        
        {/* Brand Logo & Navigation */}
        <div className={`items-center gap-6 lg:gap-10 ${isMobileSearchExpanded ? "hidden md:flex" : "flex"}`}>
          <button 
            onClick={() => handleLinkClick("ALL")}
            className="flex items-center gap-1.5 md:gap-2 font-space text-xs md:text-sm font-black tracking-widest text-[#00dbe7] cursor-pointer hover:opacity-85 transition-opacity"
            id="nav-logo"
          >
            {logoType === "icon" && (
              <Cpu className="w-4 h-4 md:w-5 md:h-5 text-[#00dbe7]" />
            )}
            {logoType === "custom" && logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-6 md:h-8 max-w-[120px] object-contain rounded" 
                referrerPolicy="no-referrer"
              />
            )}
            {showName && (
              <span>{name}</span>
            )}
          </button>
          
          <nav className="hidden md:flex gap-4 lg:gap-6">
            <button
              onClick={() => handleLinkClick("ALL")}
              className={`text-sm font-medium transition-colors cursor-pointer hover:text-[#00dbe7] ${
                activeCategory === "ALL" 
                  ? "text-[#00dbe7] border-b-2 border-[#00dbe7] pb-1" 
                  : "text-[#d8e3fb]/75"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleLinkClick("MICROCONTROLLER")}
              className={`text-sm font-medium transition-colors cursor-pointer hover:text-[#00dbe7] ${
                activeCategory === "MICROCONTROLLER" 
                  ? "text-[#00dbe7] border-b-2 border-[#00dbe7] pb-1" 
                  : "text-[#d8e3fb]/75"
              }`}
            >
              Components
            </button>
            <button
              onClick={() => handleLinkClick("ACTUATOR")}
              className={`text-sm font-medium transition-colors cursor-pointer hover:text-[#00dbe7] ${
                activeCategory === "ACTUATOR" 
                  ? "text-[#00dbe7] border-b-2 border-[#00dbe7] pb-1" 
                  : "text-[#d8e3fb]/75"
              }`}
            >
              Kits
            </button>
            <button
              onClick={() => handleLinkClick("SENSORS")}
              className={`text-sm font-medium transition-colors cursor-pointer hover:text-[#00dbe7] ${
                activeCategory === "SENSORS" 
                  ? "text-[#00dbe7] border-b-2 border-[#00dbe7] pb-1" 
                  : "text-[#d8e3fb]/75"
              }`}
            >
              Sensors
            </button>
          </nav>
        </div>

        {/* Dynamic Search Component with Dropdown Suggestions */}
        <div 
          ref={predictionRef} 
          className={`relative ${isMobileSearchExpanded ? "flex flex-1" : "hidden md:block md:flex-1 md:max-w-lg"} group`}
        >
          <div className="flex items-center w-full bg-[#111c2d] border border-white/10 rounded-lg pl-3 pr-2 py-1 md:py-1.5 search-glow transition-all duration-300">
            <Search className="w-3.5 h-3.5 text-[#d8e3fb]/60 mr-2 shrink-0" />
            <input
              type="text"
              id="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowPredictions(true);
              }}
              onFocus={() => setShowPredictions(true)}
              placeholder="Search high-quality components..."
              className="bg-transparent border-none outline-none text-[#d8e3fb] w-full text-xs md:text-sm placeholder-[#d8e3fb]/40 focus:ring-0 py-0.5"
            />
            {isMobileSearchExpanded && (
              <button 
                type="button" 
                onClick={() => {
                  setIsMobileSearchExpanded(false);
                  setSearchTerm("");
                }}
                className="p-1 text-[#d8e3fb]/60 hover:text-white md:hidden ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
 
          {/* Predictive Dropdown Suggestions */}
          {showPredictions && (searchTerm || suggestions.length > 0) && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#111c2d]/95 backdrop-blur-xl border border-[#00dbe7]/25 rounded-lg overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 bg-[#1f2a3c]/70 text-[10px] font-space font-semibold tracking-widest text-[#00dbe7] opacity-80 border-b border-white/5">
                SUGGESTED COMPONENTS
              </div>
              <div className="flex flex-col max-h-[250px] overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product);
                        setShowPredictions(false);
                        setIsMobileSearchExpanded(false);
                      }}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#00dbe7]/15 cursor-pointer transition-colors border-b border-white/5"
                    >
                      <div className="w-8 h-8 bg-[#081425] rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#d8e3fb] font-semibold truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-[#d8e3fb]/60 truncate font-space">
                          {product.category} • {product.sku}
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-[#c3f400] shrink-0 font-space">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#d8e3fb]/40">
                    No components match your search
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Cart & Profile controls */}
        <div className={`items-center gap-2 md:gap-4 shrink-0 ${isMobileSearchExpanded ? "hidden md:flex" : "flex"}`}>
          
          {/* Mobile search trigger icon */}
          <button
            onClick={() => setIsMobileSearchExpanded(true)}
            className="p-1.5 text-[#d8e3fb]/85 hover:text-[#00dbe7] transition-all cursor-pointer rounded-full hover:bg-white/5 md:hidden"
            title="Search Products"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Contact support trigger */}
          <button
            onClick={onOpenContact}
            className="p-1.5 md:p-2 text-[#d8e3fb]/85 hover:text-white transition-all cursor-pointer rounded-full hover:bg-white/5 flex items-center gap-1 shrink-0"
            title="Contact Support"
          >
            <Mail className="w-4.5 h-4.5 md:w-5 md:h-5" />
            <span className="hidden sm:inline text-xs font-semibold font-space tracking-wider uppercase ml-1">Contact</span>
          </button>

          {/* Shopping Cart button with neon badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-1.5 md:p-2 text-[#d8e3fb]/85 hover:text-[#00dbe7] transition-all cursor-pointer rounded-full hover:bg-white/5"
            id="nav-cart-btn"
            title="Open Shopping Cart"
          >
            <ShoppingCart className="w-4.5 h-4.5 md:w-5 md:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0266ff] text-[9px] font-bold text-white shadow-lg animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account with Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-1.5 md:p-2 text-[#d8e3fb]/85 hover:text-[#00dbe7] transition-all cursor-pointer rounded-full hover:bg-white/5 relative"
              id="nav-profile-btn"
              title="View Account Status"
            >
              <User className="w-4.5 h-4.5 md:w-5 md:h-5" />
              {(activeUser?.email.toLowerCase() === "swapnilacharjee2003@gmail.com" || activeUser?.email.toLowerCase() === "2023100000622@seu.edu.bd") && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c3f400] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c3f400]"></span>
                </span>
              )}
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 bg-[#111c2d] border border-[#00dbe7]/20 rounded-lg p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col gap-3">
                  {activeUser ? (
                    <>
                      <div className="pb-1">
                        <p className="text-xs text-[#00dbe7] font-space font-semibold tracking-wider">
                          ACCOUNT STATUS
                        </p>
                        <p className="text-sm font-semibold text-[#d8e3fb] truncate mt-1">
                          {activeUser.name}
                        </p>
                        <p className="text-xs text-[#d8e3fb]/60 truncate font-mono">
                          {activeUser.email}
                        </p>
                        <span className="inline-block px-2 py-0.5 mt-2 text-[10px] font-semibold bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/25 rounded">
                          {activeUser.role || "Customer"}
                        </span>
                      </div>
                      {(activeUser.email.toLowerCase() === "swapnilacharjee2003@gmail.com" || activeUser.email.toLowerCase() === "2023100000622@seu.edu.bd") && (
                        <button
                          onClick={() => {
                            setShowProfile(false);
                            onOpenAdminPanel();
                          }}
                          className="w-full mt-1 bg-[#c3f400]/10 hover:bg-[#c3f400]/25 border border-[#c3f400]/40 text-[#c3f400] hover:text-white rounded py-2 text-xs font-space font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5 animate-spin" />
                          Admin Control Panel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          onOpenUserModal();
                        }}
                        className="w-full mt-1.5 py-1.5 bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 border border-[#00dbe7]/30 text-[#00dbe7] hover:text-white rounded text-[10px] font-space font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Manage Settings
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="pb-2 border-b border-white/5 text-center">
                        <p className="text-xs text-[#ffb4ab] font-space font-semibold tracking-wider">
                          NO ACTIVE SESSION
                        </p>
                        <p className="text-xs text-[#d8e3fb]/50 mt-1">
                          Authorize to unlock local data autosave and checkout presets.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          onOpenUserModal();
                        }}
                        className="w-full py-2 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-md"
                      >
                        Create Account / Login
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
