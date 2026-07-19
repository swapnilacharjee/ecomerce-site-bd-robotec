import { useState, useEffect } from "react";
import { Award, Package, ShieldCheck } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import BulkQuoteModal from "./components/BulkQuoteModal";
import WhatsAppSupportChat from "./components/WhatsAppSupportChat";
import ProductDetailsModal from "./components/ProductDetailsModal";
import QuickOrderModal from "./components/QuickOrderModal";
import ProductChoiceModal from "./components/ProductChoiceModal";
import UserAccountModal from "./components/UserAccountModal";
import AdminPanelModal from "./components/AdminPanelModal";
import FooterDocumentModal from "./components/FooterDocumentModal";
import { WelcomeMemberModal, OrderSuccessModal } from "./components/CelebrationModals";
import QAComplianceModal from "./components/QAComplianceModal";
import { CartItem, Product, UserAccount, PromoCode, Certificate, Banner, BrandSettings } from "./types";
import { PRODUCTS } from "./data";
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "./lib/firebase";

const DEFAULT_PROMOS: PromoCode[] = [
  { code: "ROBOBD10", discount: 10, isPublic: true },
  { code: "ROBOPRO20", discount: 20, isPublic: false },
  { code: "FIRSTBD", discount: 15, isPublic: false },
  { code: "FREE5", discount: 5, isPublic: false }
];

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "banner_1",
    badge: "AUTHORIZED HARDWARE DISTRIBUTOR",
    title: "Professional Components for",
    gradientText: "Next-Gen Engineering",
    description: "Power your industrial and research projects with premium electronic components. From certified microcontrollers to precision environmental sensors, we distribute high-fidelity hardware.",
    buttonText: "Explore Components Catalog",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFGyTjnauOon5pSBmsV1mM7m11QyMZ6bRpz2httNLibNeyO9SWG97qa3gshw3WnmjDeYrQT3k8VMsdag6BxhybG2r_U4DZFO76xk6Q-48gMhaWhpP2zvJRrqdDvYpPNjSrf83iqhuis0DFASv_Prg32AaSpCyd2UdEUfJiZ7zhbuJhWIyuG0-P9RWpYN8JnO-aNcigsCxr-KBcgZPb2fMH3sp28fM7wr017om1Wbhsdtw0VsphQ0Of",
    caption: "Precision Testing Lab"
  }
];

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeUser, setActiveUser] = useState<UserAccount | null>(() => {
    const stored = localStorage.getItem("bd_robotec_active_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [footerDocType, setFooterDocType] = useState<"terms" | "privacy" | "contact" | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAutoOpenedLogin, setHasAutoOpenedLogin] = useState(false);
  const [registeredMemberName, setRegisteredMemberName] = useState<string | null>(null);
  const [celebratingOrder, setCelebratingOrder] = useState<any | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    name: "BD ROBOTEC",
    logoUrl: "",
  });

  // Sync authentication state from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            const emailLower = (firebaseUser.email || "").toLowerCase();
            const isAdmin = emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd";
            const fullUser: UserAccount = {
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || "Customer",
              email: firebaseUser.email || "",
              role: isAdmin ? "System Administrator" : (data.role || "Customer"),
            };
            setActiveUser(fullUser);
            localStorage.setItem("bd_robotec_active_user", JSON.stringify(fullUser));
          } else {
            // Seeding user profile if not in Firestore
            const emailLower = (firebaseUser.email || "").toLowerCase();
            const isAdmin = emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd";
            const defaultUser: UserAccount = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Customer",
              email: firebaseUser.email || "",
              role: isAdmin ? "System Administrator" : "Customer",
            };
            await setDoc(userDocRef, defaultUser);
            setActiveUser(defaultUser);
            localStorage.setItem("bd_robotec_active_user", JSON.stringify(defaultUser));
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          const emailLower = (firebaseUser.email || "").toLowerCase();
          const isAdmin = emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd";
          const fallbackUser: UserAccount = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Customer",
            email: firebaseUser.email || "",
            role: isAdmin ? "System Administrator" : "Customer",
          };
          setActiveUser(fallbackUser);
        }
      } else {
        setActiveUser(null);
        localStorage.removeItem("bd_robotec_active_user");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Auto-open login modal on startup if guest user
  // Auto-open admin panel if admin logs in
  useEffect(() => {
    if (authChecked && !activeUser && !hasAutoOpenedLogin) {
      setIsUserModalOpen(true);
      setHasAutoOpenedLogin(true);
    }
    if (authChecked && activeUser) {
      const email = activeUser.email.toLowerCase();
      const isAdmin = email === "swapnilacharjee2003@gmail.com" || email === "2023100000622@seu.edu.bd";
      if (isAdmin && !isAdminModalOpen && !hasAutoOpenedLogin) {
        setIsAdminModalOpen(true);
      }
    }
  }, [authChecked, activeUser, hasAutoOpenedLogin]);

  useEffect(() => {
    if (localStorage.getItem("open_account_modal_on_load") === "true") {
      setIsUserModalOpen(true);
      localStorage.removeItem("open_account_modal_on_load");
    }
  }, []);

  // Fetch products from Firestore, seed if empty
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        setDbError(null);
        if (!querySnapshot.empty) {
          const loadedProducts: Product[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            if (data.price < 150) {
              data.price = Math.round(data.price * 120);
            }
            loadedProducts.push(data);
          });
          setProducts(loadedProducts);
          localStorage.setItem("bd_robotec_products_seeded_once", "true");
        } else {
          if (localStorage.getItem("bd_robotec_products_seeded_once") === "true") {
            setProducts([]);
          } else {
            console.log("Seeding initial products to Firestore...");
            try {
              // Seed products unconditionally now that rules are published
              for (const prod of PRODUCTS) {
                await setDoc(doc(db, "products", prod.id), prod);
              }
              localStorage.setItem("bd_robotec_products_seeded_once", "true");
              console.log("Products successfully seeded in Firestore!");
              setProducts(PRODUCTS);
            } catch (seedErr: any) {
              console.warn("Could not seed products directly (permissions might be restricted):", seedErr);
              setProducts(PRODUCTS);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading products from Firestore:", err);
        if (err?.message?.includes("permission") || err?.message?.includes("Permission")) {
          setDbError("Firestore permission denied! Please go to your Firebase Console -> Firestore Database -> Rules, and make sure read/write is enabled for 'products' and 'users'.");
        }
        // Fallback to local storage if Firestore has error
        const stored = localStorage.getItem("bd_robotec_products");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Product[];
            const mapped = parsed.map(p => ({
              ...p,
              price: p.price < 150 ? Math.round(p.price * 120) : p.price
            }));
            setProducts(mapped);
          } catch {
            setProducts(PRODUCTS);
          }
        } else {
          setProducts(PRODUCTS);
        }
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [activeUser]);

  // Fetch promo codes from Firestore, seed if empty
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "promos"));
        if (!querySnapshot.empty) {
          const loadedPromos: PromoCode[] = [];
          querySnapshot.forEach((docSnap) => {
            loadedPromos.push(docSnap.data() as PromoCode);
          });
          setPromoCodes(loadedPromos);
          localStorage.setItem("bd_robotec_promos_seeded_once", "true");
        } else {
          if (localStorage.getItem("bd_robotec_promos_seeded_once") === "true") {
            setPromoCodes([]);
          } else {
            console.log("Seeding initial promo codes to Firestore...");
            try {
              for (const pr of DEFAULT_PROMOS) {
                await setDoc(doc(db, "promos", pr.code), pr);
              }
              localStorage.setItem("bd_robotec_promos_seeded_once", "true");
              setPromoCodes(DEFAULT_PROMOS);
            } catch (seedErr) {
              console.warn("Could not seed promos directly (permissions might be restricted):", seedErr);
              setPromoCodes(DEFAULT_PROMOS);
            }
          }
        }
      } catch (err) {
        console.error("Error loading promos from Firestore:", err);
        const stored = localStorage.getItem("bd_robotec_promos");
        if (stored) {
          try {
            setPromoCodes(JSON.parse(stored));
          } catch {
            setPromoCodes(DEFAULT_PROMOS);
          }
        } else {
          setPromoCodes(DEFAULT_PROMOS);
        }
      }
    };
    fetchPromos();
  }, [activeUser]);

  // Fetch certificates from Firestore, seed if empty
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        setIsLoadingCerts(true);
        const querySnapshot = await getDocs(collection(db, "certificates"));
        if (!querySnapshot.empty) {
          const loadedCerts: Certificate[] = [];
          querySnapshot.forEach((docSnap) => {
            loadedCerts.push(docSnap.data() as Certificate);
          });
          setCertificates(loadedCerts);
          localStorage.setItem("bd_robotec_certificates_seeded_once", "true");
        } else {
          if (localStorage.getItem("bd_robotec_certificates_seeded_once") === "true") {
            setCertificates([]);
          } else {
            console.log("Seeding initial certificates...");
            const initialCerts: Certificate[] = [
              {
                id: "cert_iso9001",
                title: "ISO 9001:2015 Quality Management Standard Certificate",
                pic: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyDua4tWw2xEAbEAybMT5YrUYLHW7Nmrrfq5zy779yckbiav3AVtZnQQ6GJjhqTYztGlu-LBEfMh0hR0nQW5aNoFkcAlsxAaOQu5lv42QI57FknPSxHzo3foVUlM_vBxPUvKCvA8VB5t4nsSHfp-CCQZs4n-2wyWbmgxSvj0irgXsbWu7YcngLNFb6F_8DGOcvhWhbiKjWS71zjUUq82tn50LWmE069iEkZanBjf9r4h21FY6TXyhP",
                address: "BD RoboTec QA Division, Dhaka, Bangladesh • ID: ISO-QMS-2026",
              },
              {
                id: "cert_ce_compliance",
                title: "CE Electromagnetic Compatibility Validation Pass",
                pic: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyDua4tWw2xEAbEAybMT5YrUYLHW7Nmrrfq5zy779yckbiav3AVtZnQQ6GJjhqTYztGlu-LBEfMh0hR0nQW5aNoFkcAlsxAaOQu5lv42QI57FknPSxHzo3foVUlM_vBxPUvKCvA8VB5t4nsSHfp-CCQZs4n-2wyWbmgxSvj0irgXsbWu7YcngLNFb6F_8DGOcvhWhbiKjWS71zjUUq82tn50LWmE069iEkZanBjf9r4h21FY6TXyhP",
                address: "SGS Lab International Certification • Verifier ID: CE-EMC-2026-BD",
              }
            ];
            try {
              for (const cert of initialCerts) {
                await setDoc(doc(db, "certificates", cert.id), cert);
              }
              localStorage.setItem("bd_robotec_certificates_seeded_once", "true");
              setCertificates(initialCerts);
            } catch (seedErr) {
              console.warn("Could not seed certificates directly in Firestore:", seedErr);
              setCertificates(initialCerts);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching certificates from Firestore:", err);
        const stored = localStorage.getItem("bd_robotec_certificates");
        if (stored) {
          try {
            setCertificates(JSON.parse(stored));
          } catch {
            // fallback
          }
        }
      } finally {
        setIsLoadingCerts(false);
      }
    };
    fetchCerts();
  }, [activeUser]);

  // Fetch banners from Firestore, seed if empty
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        if (!querySnapshot.empty) {
          const loadedBanners: Banner[] = [];
          querySnapshot.forEach((docSnap) => {
            loadedBanners.push(docSnap.data() as Banner);
          });
          setBanners(loadedBanners);
        } else {
          console.log("Seeding initial banners to Firestore...");
          try {
            for (const b of DEFAULT_BANNERS) {
              await setDoc(doc(db, "banners", b.id), b);
            }
            setBanners(DEFAULT_BANNERS);
          } catch (seedErr) {
            console.warn("Could not seed banners directly (permissions might be restricted):", seedErr);
            setBanners(DEFAULT_BANNERS);
          }
        }
      } catch (err) {
        console.error("Error loading banners from Firestore:", err);
        const stored = localStorage.getItem("bd_robotec_banners");
        if (stored) {
          try {
            setBanners(JSON.parse(stored));
          } catch {
            setBanners(DEFAULT_BANNERS);
          }
        } else {
          setBanners(DEFAULT_BANNERS);
        }
      }
    };
    fetchBanners();
  }, [activeUser]);

  // Fetch brand settings from Firestore, fallback to local storage
  useEffect(() => {
    const fetchBrandSettings = async () => {
      try {
        const docRef = doc(db, "brand_config", "settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBrandSettings(docSnap.data() as BrandSettings);
        } else {
          const stored = localStorage.getItem("bd_robotec_brand_settings");
          if (stored) {
            setBrandSettings(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error("Error loading brand settings:", err);
        const stored = localStorage.getItem("bd_robotec_brand_settings");
        if (stored) {
          setBrandSettings(JSON.parse(stored));
        }
      }
    };
    fetchBrandSettings();
  }, [activeUser]);

  const handleUpdateBrandSettings = async (newSettings: BrandSettings) => {
    setBrandSettings(newSettings);
    localStorage.setItem("bd_robotec_brand_settings", JSON.stringify(newSettings));
    try {
      await setDoc(doc(db, "brand_config", "settings"), newSettings);
    } catch (err) {
      console.error("Error saving brand settings:", err);
    }
  };

  const handleUpdateCertificates = (updatedCerts: Certificate[]) => {
    setCertificates(updatedCerts);
    localStorage.setItem("bd_robotec_certificates", JSON.stringify(updatedCerts));
  };

  const handleUpdateBanners = async (updatedBanners: Banner[]) => {
    const prevBanners = [...banners];
    setBanners(updatedBanners);
    localStorage.setItem("bd_robotec_banners", JSON.stringify(updatedBanners));

    try {
      const deleted = prevBanners.filter((b) => !updatedBanners.some((ub) => ub.id === b.id));
      for (const banner of deleted) {
        await deleteDoc(doc(db, "banners", banner.id));
      }
      for (const banner of updatedBanners) {
        await setDoc(doc(db, "banners", banner.id), banner);
      }
    } catch (err) {
      console.error("Error syncing banner updates to Firestore:", err);
    }
  };

  const handleUpdatePromos = async (updatedPromos: PromoCode[]) => {
    const prevPromos = [...promoCodes];
    setPromoCodes(updatedPromos);
    localStorage.setItem("bd_robotec_promos", JSON.stringify(updatedPromos));

    // Sync to Firestore
    try {
      // Find deleted ones
      const deleted = prevPromos.filter((p) => !updatedPromos.some((up) => up.code === p.code));
      for (const pr of deleted) {
        await deleteDoc(doc(db, "promos", pr.code));
      }

      // Upsert new/modified
      for (const pr of updatedPromos) {
        await setDoc(doc(db, "promos", pr.code), pr);
      }
    } catch (err) {
      console.error("Error syncing promos to Firestore:", err);
      throw err;
    }
  };

  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    const prevProducts = [...products];
    setProducts(updatedProducts);
    localStorage.setItem("bd_robotec_products", JSON.stringify(updatedProducts));

    // Sync to Firestore database
    try {
      console.log("Syncing to Firestore...");
      // Find deleted products
      const deleted = prevProducts.filter((p) => !updatedProducts.some((up) => up.id === p.id));
      for (const prod of deleted) {
        await deleteDoc(doc(db, "products", prod.id));
      }

      // Upsert new or modified products
      for (const prod of updatedProducts) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      console.log("Firestore sync success!");
    } catch (err) {
      console.error("Firestore sync error:", err);
      throw err;
    }
  };


  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen text-[#d8e3fb] font-sans antialiased relative">
      {/* Schematic Radial Grid Pattern Backdrop */}
      <div className="circuit-pattern" />

      {/* Global Header Navigation */}
      <Navbar
        products={products}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onSelectProduct={handleSelectProduct}
        activeUser={activeUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
        onOpenContact={() => setFooterDocType("contact")}
        brandSettings={brandSettings}
      />

      {/* Main Content Layout */}
      <main className="pt-20 md:pt-24 pb-12 md:pb-20 px-3.5 md:px-6 max-w-[1440px] mx-auto space-y-8 md:space-y-16">
        {dbError && (
          <div className="bg-[#1f101b] border border-red-500/30 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-space font-bold tracking-wider text-red-400 uppercase">
                  Firebase Firestore Permission Alert
                </h4>
                <p className="text-[11px] text-red-200/85 mt-1 font-mono leading-relaxed">
                  {dbError}
                </p>
              </div>
            </div>
            <a 
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 rounded text-[10px] font-mono font-bold tracking-wider text-white uppercase text-center shrink-0 transition-colors"
            >
              Open Firebase Console
            </a>
          </div>
        )}
        
        {/* Futuristic Hero Section */}
        <Hero banners={banners} />

        {/* Dynamic Schematic Catalog Section */}
        <ProductGrid
          products={products}
          onQuickOrder={setChoiceProduct}
          onSelectProduct={handleSelectProduct}
          searchTerm={searchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          isLoading={isLoadingProducts}
        />

        {/* Technical Specs & Wholesale & Bulk Supply Asymmetric Bento Block */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          
          {/* Asymmetric Wholesale & Bulk Supply block */}
          <div className="lg:col-span-2 glass-card p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center border border-[#00dbe7]/15">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h3 className="font-sans text-xl lg:text-2xl font-extrabold text-white tracking-tight">
                Wholesale & Bulk Supply
              </h3>
              <p className="text-sm text-[#d8e3fb]/70 leading-relaxed">
                Optimized supply chain for industrial laboratories, universities, and hardware startups. 
                Request dynamic pricing for orders exceeding 500 units.
              </p>
              <button
                onClick={() => setIsQuoteOpen(true)}
                className="px-6 py-2.5 border-2 border-[#00dbe7]/40 text-[#00dbe7] hover:bg-[#00dbe7]/15 rounded font-space text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                id="generate-quote-btn"
              >
                GENERATE QUOTE
              </button>
            </div>

            {/* Procurement illustration frame with hotlinked visual */}
            <div className="w-full md:w-64 h-48 bg-[#152031] rounded-lg border border-white/5 relative overflow-hidden shrink-0 shadow-lg">
              <div
                className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-700"
                style={{
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDyDua4tWw2xEAbEAybMT5YrUYLHW7Nmrrfq5zy779yckbiav3AVtZnQQ6GJjhqTYztGlu-LBEfMh0hR0nQW5aNoFkcAlsxAaOQu5lv42QI57FknPSxHzo3foVUlM_vBxPUvKCvA8VB5t4nsSHfp-CCQZs4n-2wyWbmgxSvj0irgXsbWu7YcngLNFb6F_8DGOcvhWhbiKjWS71zjUUq82tn50LWmE069iEkZanBjf9r4h21FY6TXyhP')"
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Quality Assurance block */}
          <div 
            onClick={() => setIsQAModalOpen(true)}
            className="glass-card p-8 rounded-xl flex flex-col justify-center border-l-4 border-l-[#00dbe7] border border-[#00dbe7]/15 space-y-3 cursor-pointer hover:border-[#00dbe7]/45 transition-all hover:translate-y-[-2px] group"
          >
            <div className="flex items-center gap-2 text-[#00dbe7]">
              <ShieldCheck className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <Award className="w-5 h-5 text-[#c3f400] animate-pulse" />
            </div>
            <h4 className="font-sans text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              Quality Assurance
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#00dbe7]/10 text-[#00dbe7] rounded border border-[#00dbe7]/20 group-hover:bg-[#00dbe7]/25 transition-colors">
                View Certificates
              </span>
            </h4>
            <p className="text-xs text-[#d8e3fb]/75 leading-relaxed">
              Every component undergoes 100% physical and functional validation before dispatch. 
              Click here to view our certified test credentials, laboratory results, and compliance approvals.
            </p>
          </div>

        </section>

      </main>

      {/* Global App Footer */}
      <footer className="bg-[#040e1f] w-full py-10 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-[1440px] mx-auto gap-6 text-center md:text-left">
          <div className="flex flex-col">
            <span className="font-space text-xs font-bold text-white tracking-[0.2em] mb-1">
              BD ROBOTEC
            </span>
            <p className="font-space text-[10px] text-[#d8e3fb]/40 uppercase tracking-wider">
              © 2026 BD ROBOTEC. ALL RIGHTS RESERVED. SCHEMATIC REV: 2.0.4
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={(e) => { e.preventDefault(); setFooterDocType("contact"); }}
              className="font-space text-[10px] font-bold text-[#d8e3fb]/50 hover:text-[#00dbe7] uppercase tracking-wider underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none outline-none"
            >
              Contact Support
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setFooterDocType("privacy"); }}
              className="font-space text-[10px] font-bold text-[#d8e3fb]/50 hover:text-[#00dbe7] uppercase tracking-wider underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none outline-none"
            >
              Privacy Policy
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setFooterDocType("terms"); }}
              className="font-space text-[10px] font-bold text-[#d8e3fb]/50 hover:text-[#00dbe7] uppercase tracking-wider underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none outline-none"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Drawers and Modals Overlays */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        promoCodes={promoCodes}
        activeUser={activeUser}
        onOpenLogin={() => setIsUserModalOpen(true)}
        onOrderSuccess={(orderData) => setCelebratingOrder(orderData)}
      />

      <BulkQuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <QuickOrderModal
        isOpen={!!quickOrderProduct}
        product={quickOrderProduct}
        onClose={() => setQuickOrderProduct(null)}
        cart={cart}
        onClearCart={() => setCart([])}
        promoCodes={promoCodes}
        activeUser={activeUser}
        onOrderSuccess={(orderData) => setCelebratingOrder(orderData)}
      />

      <ProductChoiceModal
        isOpen={!!choiceProduct}
        product={choiceProduct}
        onClose={() => setChoiceProduct(null)}
        onAddToCart={handleAddToCart}
        onConfirmOrder={(prod) => setQuickOrderProduct(prod)}
        activeUser={activeUser}
        onOpenLogin={() => setIsUserModalOpen(true)}
      />

      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        activeUser={activeUser}
        onUserChange={setActiveUser}
        onNewRegister={(userName) => setRegisteredMemberName(userName)}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        products={products}
        onUpdateProducts={handleUpdateProducts}
        promoCodes={promoCodes}
        onUpdatePromos={handleUpdatePromos}
        certificates={certificates}
        onUpdateCertificates={handleUpdateCertificates}
        banners={banners}
        onUpdateBanners={handleUpdateBanners}
        brandSettings={brandSettings}
        onUpdateBrandSettings={handleUpdateBrandSettings}
      />

      {/* Immersive WhatsApp AI Chat Assistant floating trigger */}
      <WhatsAppSupportChat />

      <FooterDocumentModal
        isOpen={!!footerDocType}
        onClose={() => setFooterDocType(null)}
        type={footerDocType}
      />

      {/* Satisfying Celebratory Modals */}
      <WelcomeMemberModal
        isOpen={!!registeredMemberName}
        onClose={() => setRegisteredMemberName(null)}
        userName={registeredMemberName || ""}
      />

      <OrderSuccessModal
        isOpen={!!celebratingOrder}
        onClose={() => setCelebratingOrder(null)}
        orderData={celebratingOrder}
      />

      <QAComplianceModal
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        certificates={certificates}
        isLoading={isLoadingCerts}
      />

    </div>
  );
}
