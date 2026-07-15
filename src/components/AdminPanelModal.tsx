import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit, Save, Cpu, AlertTriangle, Check, List, Sparkles, Cloud, Ticket, ShoppingBag, Phone, MapPin, Calendar, Clock, RefreshCw, Mail, TrendingUp, DollarSign, BarChart2, Activity } from "lucide-react";
import { Product, PromoCode, Certificate, Banner, BrandSettings } from "../types";
import { db, doc, setDoc, getDocs, collection, deleteDoc, updateDoc, isFirebaseMock, isFirebaseConfigValid } from "../lib/firebase";
import { Award } from "lucide-react";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (updatedProducts: Product[]) => any;
  promoCodes: PromoCode[];
  onUpdatePromos: (updatedPromos: PromoCode[]) => any;
  certificates: Certificate[];
  onUpdateCertificates: (updatedCerts: Certificate[]) => void;
  banners?: Banner[];
  onUpdateBanners: (updatedBanners: Banner[]) => void;
  brandSettings: BrandSettings;
  onUpdateBrandSettings: (newSettings: BrandSettings) => void;
}

export default function AdminPanelModal({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  promoCodes,
  onUpdatePromos,
  certificates = [],
  onUpdateCertificates,
  banners = [],
  onUpdateBanners,
  brandSettings,
  onUpdateBrandSettings,
}: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit" | "promos" | "orders" | "analytics" | "certificates" | "banners" | "brand">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Admin Orders Management States
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Interactive Analytics & Graph States
  const [chartMetric, setChartMetric] = useState<"count" | "revenue">("count");
  const [chartType, setChartType] = useState<"bar" | "line">("line");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Interactive Orders Filtering States
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "pending" | "processing" | "completed">("all");

  // Promo Code Form States
  const [newPromoName, setNewPromoName] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [newPromoIsPublic, setNewPromoIsPublic] = useState(false);
  const [promoFormError, setPromoFormError] = useState("");
  const [promoFormSuccess, setPromoFormSuccess] = useState("");

  // QA Certificates Form States
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertPic, setNewCertPic] = useState("");
  const [newCertAddress, setNewCertAddress] = useState("");
  const [certFormError, setCertFormError] = useState("");
  const [certFormSuccess, setCertFormSuccess] = useState("");
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

  // Home Page Banners Form States
  const [newBannerBadge, setNewBannerBadge] = useState("");
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerGradient, setNewBannerGradient] = useState("");
  const [newBannerDesc, setNewBannerDesc] = useState("");
  const [newBannerBtnText, setNewBannerBtnText] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerCaption, setNewBannerCaption] = useState("");
  const [bannerFormError, setBannerFormError] = useState("");
  const [bannerFormSuccess, setBannerFormSuccess] = useState("");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Brand Settings Form States
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandLogoType, setBrandLogoType] = useState<"icon" | "custom" | "none">("icon");
  const [brandShowName, setBrandShowName] = useState(true);
  const [brandFormError, setBrandFormError] = useState("");
  const [brandFormSuccess, setBrandFormSuccess] = useState("");

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    setBannerFormError("");
    setBannerFormSuccess("");

    if (!newBannerTitle || !newBannerDesc || !newBannerImage) {
      setBannerFormError("Please fill in all required fields (Title, Description, and Image URL).");
      return;
    }

    if (editingBanner) {
      const updatedBanner: Banner = {
        id: editingBanner.id,
        badge: newBannerBadge || undefined,
        title: newBannerTitle,
        gradientText: newBannerGradient || undefined,
        description: newBannerDesc,
        buttonText: newBannerBtnText || "Explore Components Catalog",
        image: newBannerImage,
        caption: newBannerCaption || undefined,
      };

      const updatedBanners = banners.map((b) => b.id === editingBanner.id ? updatedBanner : b);
      onUpdateBanners(updatedBanners);
      setBannerFormSuccess("Banner slide updated successfully!");
      setEditingBanner(null);
    } else {
      const newBanner: Banner = {
        id: "banner_" + Date.now(),
        badge: newBannerBadge || undefined,
        title: newBannerTitle,
        gradientText: newBannerGradient || undefined,
        description: newBannerDesc,
        buttonText: newBannerBtnText || "Explore Components Catalog",
        image: newBannerImage,
        caption: newBannerCaption || undefined,
      };

      const updatedBanners = [...banners, newBanner];
      onUpdateBanners(updatedBanners);
      setBannerFormSuccess("Banner slide added successfully!");
    }

    setNewBannerBadge("");
    setNewBannerTitle("");
    setNewBannerGradient("");
    setNewBannerDesc("");
    setNewBannerBtnText("");
    setNewBannerImage("");
    setNewBannerCaption("");
  };

  const handleStartEditBanner = (slide: Banner) => {
    setEditingBanner(slide);
    setNewBannerBadge(slide.badge || "");
    setNewBannerTitle(slide.title);
    setNewBannerGradient(slide.gradientText || "");
    setNewBannerDesc(slide.description);
    setNewBannerBtnText(slide.buttonText);
    setNewBannerImage(slide.image);
    setNewBannerCaption(slide.caption || "");
    setBannerFormError("");
    setBannerFormSuccess("");
  };

  const handleCancelEditBanner = () => {
    setEditingBanner(null);
    setNewBannerBadge("");
    setNewBannerTitle("");
    setNewBannerGradient("");
    setNewBannerDesc("");
    setNewBannerBtnText("");
    setNewBannerImage("");
    setNewBannerCaption("");
    setBannerFormError("");
    setBannerFormSuccess("");
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (editingBanner && editingBanner.id === bannerId) {
      handleCancelEditBanner();
    }
    const updatedBanners = banners.filter((b) => b.id !== bannerId);
    onUpdateBanners(updatedBanners);
    setBannerFormSuccess("Banner slide removed successfully!");
  };

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("MICROCONTROLLER");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [specsText, setSpecsText] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Support for custom category
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Categories list calculated dynamically from defaults and current products
  const defaultCategories = ["MICROCONTROLLER", "ACTUATOR", "WIRELESS MCU", "SENSORS"];
  const categories = Array.from(
    new Set([...defaultCategories, ...products.map((p) => p.category.toUpperCase())])
  );

  const handleSyncToFirestore = async () => {
    setIsSyncing(true);
    setError("");
    setSuccess("");
    try {
      for (const prod of products) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      setSuccess("Success! All current website products have been successfully synced and saved in Firestore.");
    } catch (err: any) {
      console.error("Firestore manual sync error: ", err);
      setError("Sync failed: " + (err?.message || "Verify your Firestore Security Rules and connection."));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (brandSettings) {
      setBrandName(brandSettings.name || "BD ROBOTEC");
      setBrandLogoUrl(brandSettings.logoUrl || "");
      setBrandLogoType(brandSettings.logoType || "icon");
      setBrandShowName(brandSettings.showName !== false);
    }
  }, [brandSettings]);

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandFormError("");
    setBrandFormSuccess("");

    if (!brandName.trim()) {
      setBrandFormError("Brand Name is required.");
      return;
    }

    if (brandLogoType === "custom" && !brandLogoUrl.trim()) {
      setBrandFormError("Please provide a valid Custom Logo Image URL.");
      return;
    }

    try {
      const updated = {
        name: brandName.trim(),
        logoUrl: brandLogoType === "custom" ? brandLogoUrl.trim() : "",
        logoType: brandLogoType,
        showName: brandShowName,
      };
      await onUpdateBrandSettings(updated);
      setBrandFormSuccess("Logo & Brand settings successfully updated!");
    } catch (err: any) {
      console.error("Error updating brand settings:", err);
      setBrandFormError("Could not save settings: " + (err?.message || "Unknown error"));
    }
  };

  // Reset states on activeTab change
  useEffect(() => {
    if (activeTab !== "edit") setEditingProduct(null);
    setEditingCertificate(null);
    setEditingBanner(null);
    setNewCertTitle("");
    setNewCertPic("");
    setNewCertAddress("");
    setNewBannerBadge("");
    setNewBannerTitle("");
    setNewBannerGradient("");
    setNewBannerDesc("");
    setNewBannerBtnText("");
    setNewBannerImage("");
    setNewBannerCaption("");
    setCertFormError("");
    setCertFormSuccess("");
    setBannerFormError("");
    setBannerFormSuccess("");
  }, [activeTab]);

  // Run hooks before any conditional returns
  useEffect(() => {
    if (activeTab === "add") {
      setName("");
      setSku("MCU-" + Math.floor(100 + Math.random() * 900));
      setCategory("MICROCONTROLLER");
      setDescription("");
      setPrice("");
      setImage("");
      setSpecsText("");
      setError("");
      setSuccess("");
      setIsCustomCategory(false);
      setCustomCategoryInput("");
    }
  }, [activeTab]);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
      setPrice(editingProduct.price.toString());
      setImage(editingProduct.image);
      setSpecsText(editingProduct.specs.join("\n"));
      setError("");
      setSuccess("");
      setIsCustomCategory(false);
      setCustomCategoryInput("");
    }
  }, [editingProduct]);

  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const all: any[] = [];
      querySnapshot.forEach((docSnap: any) => {
        all.push(docSnap.data());
      });
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdminOrders(all);
    } catch (err) {
      console.error("Error loading admin orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === "orders" || activeTab === "analytics")) {
      fetchAllOrders();
    }
  }, [isOpen, activeTab]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "pending" | "processing" | "completed") => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setAdminOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    askConfirmation(
      "Delete Order Permanently",
      "Are you sure you want to delete this order permanently? This action cannot be undone.",
      async () => {
        try {
          await deleteDoc(doc(db, "orders", orderId));
          setAdminOrders((prev) => prev.filter((o) => o.id !== orderId));
        } catch (err) {
          console.error("Error deleting order:", err);
        }
      }
    );
  };

  // --- HOLOGRAPHIC ANALYTICS ENGINE CALCULATIONS ---
  const totalOrders = adminOrders.length;
  const totalRevenue = adminOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const completedCount = adminOrders.filter((o) => o.status === "completed").length;
  const processingCount = adminOrders.filter((o) => o.status === "processing").length;
  const pendingCount = adminOrders.filter((o) => (o.status || "pending") === "pending").length;
  const completionRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;

  // Compile daily stats over the last 10 days
  const getChartData = () => {
    const dataMap: { [key: string]: { count: number; revenue: number; label: string } } = {};
    
    // Fill last 10 days to guarantee continuous timeline visualization
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dataMap[key] = { count: 0, revenue: 0, label };
    }

    // Populate data mapping
    adminOrders.forEach((o) => {
      if (!o.createdAt) return;
      const key = o.createdAt.split("T")[0];
      const orderTotal = parseFloat(o.total) || 0;
      if (dataMap[key]) {
        dataMap[key].count += 1;
        dataMap[key].revenue += orderTotal;
      }
    });

    return Object.entries(dataMap)
      .map(([key, val]) => ({
        key,
        label: val.label,
        count: val.count,
        revenue: val.revenue,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  };

  const chartData = getChartData();

  // Compile top 5 highest selling elements
  const getTopSoldProducts = () => {
    const counts: { [name: string]: { qty: number; revenue: number } } = {};
    adminOrders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((it: any) => {
          const componentName = it.name || "Unknown Element";
          const qty = parseInt(it.quantity) || 1;
          const price = parseFloat(it.price) || 0;
          if (!counts[componentName]) {
            counts[componentName] = { qty: 0, revenue: 0 };
          }
          counts[componentName].qty += qty;
          counts[componentName].revenue += price * qty;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, stats]) => ({
        name,
        qty: stats.qty,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  const topSoldProducts = getTopSoldProducts();

  if (!isOpen) return null;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Product name is required.");
    if (!sku.trim()) return setError("SKU is required.");
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return setError("Please enter a valid positive price.");
    }

    let finalCategory = category;
    if (isCustomCategory) {
      if (!customCategoryInput.trim()) {
        return setError("Please enter a category classification name.");
      }
      finalCategory = customCategoryInput.trim().toUpperCase();
    }

    // Check for SKU conflict
    if (products.some((p) => p.sku.toLowerCase() === sku.trim().toLowerCase())) {
      return setError(`A product with SKU "${sku}" already exists.`);
    }

    const generatedId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newProduct: Product = {
      id: products.some((p) => p.id === generatedId) ? `${generatedId}-${Date.now()}` : generatedId,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: finalCategory,
      description: description.trim(),
      price: Number(price),
      image: image.trim() || "https://lh3.googleusercontent.com/aida-public/AB6AXuCLfqeyM-Sg0ed-hmjx9PFU3d-6yopdv1pxMTgxMiVYOavzQkDfGT-mmYZa-bcVBeFnitgVOCic6ZZI1acwRH9itI9AODfsoYKz0qgTqekLkclUwi0CkXmocHQIE6Jy7pSli722_Ko12REpygRKihvgYeAUPStDMiBT1cgEN652YTd1GekkiH61CXanG2xLlbcCUr1nlzGQur8xf0khmzOgZ0vDl2FhtdjuIqH7iT4rSDz-OwIM5sCE",
      specs: specsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };

    const updated = [newProduct, ...products];
    onUpdateProducts(updated);
    setSuccess("Product added successfully!");
    
    setTimeout(() => {
      setActiveTab("list");
      setSuccess("");
    }, 1500);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleEditProduct called");
    setError("");
    setSuccess("");

    if (!editingProduct) return;
    if (!name.trim()) return setError("Product name is required.");
    if (!sku.trim()) return setError("SKU is required.");
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return setError("Please enter a valid positive price.");
    }
    let finalCategory = category;
    if (isCustomCategory) {
      if (!customCategoryInput.trim()) {
        return setError("Please enter a category classification name.");
      }
      finalCategory = customCategoryInput.trim().toUpperCase();
    }

    // Check SKU conflicts except for editing product
    if (
      products.some(
        (p) => p.id !== editingProduct.id && p.sku.toLowerCase() === sku.trim().toLowerCase()
      )
    ) {
      return setError(`A product with SKU "${sku}" already exists.`);
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: finalCategory,
      description: description.trim(),
      price: Number(price),
      image: image.trim() || "https://lh3.googleusercontent.com/aida-public/AB6AXuCLfqeyM-Sg0ed-hmjx9PFU3d-6yopdv1pxMTgxMiVYOavzQkDfGT-mmYZa-bcVBeFnitgVOCic6ZZI1acwRH9itI9AODfsoYKz0qgTqekLkclUwi0CkXmocHQIE6Jy7pSli722_Ko12REpygRKihvgYeAUPStDMiBT1cgEN652YTd1GekkiH61CXanG2xLlbcCUr1nlzGQur8xf0khmzOgZ0vDl2FhtdjuIqH7iT4rSDz-OwIM5sCE",
      specs: specsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };

    const updated = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
    console.log("calling onUpdateProducts with", updated.length, "products");
    onUpdateProducts(updated);
    setSuccess("Product details updated successfully!");

    setTimeout(() => {
      setActiveTab("list");
      setEditingProduct(null);
      setSuccess("");
    }, 1500);
  };

  const handleDeleteProduct = (productId: string) => {
    askConfirmation(
      "Remove Robotic Component",
      "Are you sure you want to remove this robotic component from the core inventory?",
      () => {
        const updated = products.filter((p) => p.id !== productId);
        onUpdateProducts(updated);
        setSuccess("Component successfully removed.");
        setTimeout(() => setSuccess(""), 3000);
      }
    );
  };

  const handleAddPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFormError("");
    setPromoFormSuccess("");

    const code = newPromoName.trim().toUpperCase();
    const discountVal = Number(newPromoDiscount);

    if (!code) {
      setPromoFormError("Promo code name is required.");
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      setPromoFormError("Promo code must contain only letters, numbers, dashes, or underscores.");
      return;
    }
    if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
      setPromoFormError("Discount value must be a percentage between 1 and 100.");
      return;
    }

    if (promoCodes.some((p) => p.code === code)) {
      setPromoFormError(`Promo code "${code}" already exists.`);
      return;
    }

    const newPromo: PromoCode = {
      code,
      discount: discountVal,
      isPublic: newPromoIsPublic,
    };

    try {
      await onUpdatePromos([newPromo, ...promoCodes]);
      setNewPromoName("");
      setNewPromoDiscount("");
      setNewPromoIsPublic(false);
      setPromoFormSuccess(`Promo code "${code}" registered successfully!`);
      setTimeout(() => setPromoFormSuccess(""), 3000);
    } catch (err: any) {
      setPromoFormError("Failed to register promo code: " + (err?.message || err));
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    askConfirmation(
      "Delete Promo Code",
      `Are you sure you want to delete promo code "${code}"?`,
      async () => {
        setPromoFormError("");
        try {
          const updated = promoCodes.filter((p) => p.code !== code);
          await onUpdatePromos(updated);
          setPromoFormSuccess(`Promo code "${code}" successfully removed.`);
          setTimeout(() => setPromoFormSuccess(""), 3000);
        } catch (err: any) {
          setPromoFormError("Failed to delete promo code: " + (err?.message || err));
        }
      }
    );
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertFormError("");
    setCertFormSuccess("");

    if (!newCertTitle.trim() || !newCertPic.trim() || !newCertAddress.trim()) {
      setCertFormError("All fields (Title, Pic URL, Address) are required.");
      return;
    }

    if (editingCertificate) {
      const updatedCert: Certificate = {
        id: editingCertificate.id,
        title: newCertTitle.trim(),
        pic: newCertPic.trim(),
        address: newCertAddress.trim(),
      };

      try {
        await setDoc(doc(db, "certificates", editingCertificate.id), updatedCert);
        onUpdateCertificates(certificates.map((c) => c.id === editingCertificate.id ? updatedCert : c));
        setNewCertTitle("");
        setNewCertPic("");
        setNewCertAddress("");
        setEditingCertificate(null);
        setCertFormSuccess("Certificate updated successfully in Firestore!");
        setTimeout(() => setCertFormSuccess(""), 3000);
      } catch (err: any) {
        console.error("Error updating certificate:", err);
        setCertFormError("Failed to update certificate in Firestore. " + err.message);
      }
    } else {
      const newId = `cert_${Date.now()}`;
      const newCert: Certificate = {
        id: newId,
        title: newCertTitle.trim(),
        pic: newCertPic.trim(),
        address: newCertAddress.trim(),
      };

      try {
        await setDoc(doc(db, "certificates", newId), newCert);
        onUpdateCertificates([newCert, ...certificates]);
        setNewCertTitle("");
        setNewCertPic("");
        setNewCertAddress("");
        setCertFormSuccess("Certificate added successfully to Firestore!");
        setTimeout(() => setCertFormSuccess(""), 3000);
      } catch (err: any) {
        console.error("Error adding certificate:", err);
        setCertFormError("Failed to save certificate to Firestore. " + err.message);
      }
    }
  };

  const handleStartEditCertificate = (cert: Certificate) => {
    setEditingCertificate(cert);
    setNewCertTitle(cert.title);
    setNewCertPic(cert.pic);
    setNewCertAddress(cert.address);
    setCertFormError("");
    setCertFormSuccess("");
  };

  const handleCancelEditCertificate = () => {
    setEditingCertificate(null);
    setNewCertTitle("");
    setNewCertPic("");
    setNewCertAddress("");
    setCertFormError("");
    setCertFormSuccess("");
  };

  const handleDeleteCertificate = async (id: string) => {
    askConfirmation(
      "Delete Certificate",
      "Are you sure you want to delete this quality certificate? This action is permanent.",
      async () => {
        if (editingCertificate && editingCertificate.id === id) {
          handleCancelEditCertificate();
        }
        setCertFormError("");
        try {
          await deleteDoc(doc(db, "certificates", id));
          onUpdateCertificates(certificates.filter((c) => c.id !== id));
        } catch (err: any) {
          console.error("Error deleting certificate:", err);
          setCertFormError("Failed to delete certificate: " + (err?.message || err));
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#040e1f]/85 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Admin Panel Box */}
      <div className="relative bg-[#111c2d] border border-[#00dbe7]/40 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1f2a3c] border-b border-[#00dbe7]/20 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#c3f400] animate-pulse" />
            <div>
              <h3 className="font-space text-sm font-bold text-white tracking-wide uppercase">
                Robotics Inventory Central Control
              </h3>
              <p className="text-[10px] text-[#00dbe7] font-mono tracking-widest uppercase">
                Authorized Admin Session: Swapnil Acharjee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#d8e3fb]/60 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#152236]/70 border-b border-white/5 px-4 py-2.5 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab("list");
              setEditingProduct(null);
              setError("");
              setSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "list"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Component Register</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("add");
              setEditingProduct(null);
              setError("");
              setSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "add"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Add New Component</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("promos");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "promos"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Promo Codes</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "orders"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Orders Register</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("analytics");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "analytics"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Analytics Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("certificates");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "certificates"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">QA Certificates</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("banners");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
              setBannerFormError("");
              setBannerFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "banners"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Home Banners</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("brand");
              setEditingProduct(null);
              setError("");
              setSuccess("");
              setPromoFormError("");
              setPromoFormSuccess("");
              setBannerFormError("");
              setBannerFormSuccess("");
            }}
            className={`px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "brand"
                ? "bg-[#0266ff] text-white"
                : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">Logo & Brand</span>
          </button>
          {activeTab === "edit" && editingProduct && (
            <span className="px-3 py-1.5 text-xs font-space font-bold uppercase tracking-wider rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/25 flex items-center gap-1.5 shrink-0">
              <Edit className="w-3.5 h-3.5 shrink-0" />
              <span className="shrink-0">Editing: {editingProduct.name}</span>
            </span>
          )}
        </div>

        {/* Content Body (Scrolling) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#93000a]/35 border border-[#ffb4ab]/30 rounded text-xs text-[#ffb4ab] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-[#113812]/70 border border-[#4caf50]/40 rounded text-xs text-[#81c784] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#81c784] shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: INVENTORY REGISTER LIST */}
          {activeTab === "list" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <span className="text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/40 uppercase">
                  ACTIVE SCHEMATICS LISTING ({products.length} ITEMS)
                </span>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncToFirestore}
                  className="px-3 py-1 bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 border border-[#00dbe7]/40 disabled:opacity-50 text-[#00dbe7] text-[10px] font-mono font-bold tracking-wider uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  {isSyncing ? "Syncing..." : "Sync All to Firestore"}
                </button>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a283c] border-b border-white/5 font-space text-[10px] font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                      <th className="p-3">Component Info</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover bg-slate-900 rounded border border-white/10"
                            />
                            <div>
                              <div className="text-xs font-bold text-white uppercase">{prod.name}</div>
                              <div className="text-[10px] text-[#d8e3fb]/50 max-w-sm truncate">
                                {prod.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs text-[#00dbe7] bg-[#00dbe7]/10 px-2 py-0.5 rounded border border-[#00dbe7]/20">
                            {prod.sku}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[#d8e3fb]/75 font-space uppercase">
                          {prod.category}
                        </td>
                        <td className="p-3 font-mono text-xs text-[#c3f400]">
                          ৳{prod.price.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setActiveTab("edit");
                              }}
                              className="p-1.5 bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/35 hover:bg-[#00dbe7]/25 rounded transition-all cursor-pointer"
                              title="Edit specifications"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 bg-[#93000a]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#93000a]/30 rounded transition-all cursor-pointer"
                              title="Delete component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-xs text-[#d8e3fb]/40 font-space uppercase">
                          The component catalog is completely empty. Please add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ADD PRODUCT & TAB 3: EDIT PRODUCT */}
          {(activeTab === "add" || activeTab === "edit") && (
            <form onSubmit={activeTab === "add" ? handleAddProduct : handleEditProduct} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ultrasonic Sensor HC-SR04"
                    className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SNR-HC04"
                    className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase">
                      Category Classification
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        setCustomCategoryInput("");
                      }}
                      className="text-[9px] text-[#00dbe7] hover:underline uppercase font-mono font-bold cursor-pointer"
                    >
                      {isCustomCategory ? "Select Existing" : "+ New Category"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                      }}
                      placeholder="ENTER NEW CATEGORY NAME"
                      className="w-full bg-[#081425] border border-[#00dbe7]/40 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all uppercase font-mono"
                      required
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all uppercase"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                    Sales Price (USD) *
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 4.95"
                    className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                  Product Image Link
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="e.g. https://domain.com/image.png"
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core application of the component..."
                  rows={2}
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase">
                    Technical Specifications (One entry per line)
                  </label>
                  <span className="text-[9px] text-[#00dbe7] font-mono">
                    FORMAT: [Spec Name]: [Value]
                  </span>
                </div>
                <textarea
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  placeholder="Operating Voltage: 5V DC&#10;Detection Range: 2cm-400cm&#10;Static Current: Less than 2mA"
                  rows={5}
                  className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("list");
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-xs font-space font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white rounded text-xs font-space font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  {activeTab === "add" ? "Register Component" : "Save Specifications"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: PROMO CODES MANAGEMENT */}
          {activeTab === "promos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Add Promo Code Form */}
              <div className="bg-[#152236]/50 border border-white/5 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-space font-bold tracking-wider text-[#00dbe7] uppercase flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[#c3f400]" />
                  Create New Promo Code
                </h4>

                <form onSubmit={handleAddPromoCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                      Promo Code Name *
                    </label>
                    <input
                      type="text"
                      value={newPromoName}
                      onChange={(e) => setNewPromoName(e.target.value)}
                      placeholder="e.g. SAVE25"
                      className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all uppercase font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/50 uppercase mb-1">
                      Discount Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 h-9 mb-1 bg-[#081425]/40 px-3 py-1.5 rounded border border-white/5">
                    <input
                      type="checkbox"
                      id="newPromoIsPublic"
                      checked={newPromoIsPublic}
                      onChange={(e) => setNewPromoIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#081425] border border-white/25 text-[#0266ff] focus:ring-[#00dbe7] cursor-pointer"
                    />
                    <label htmlFor="newPromoIsPublic" className="text-[10px] font-space font-bold tracking-wider text-[#d8e3fb]/80 uppercase cursor-pointer select-none">
                      Open for Everyone (Public)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white rounded text-xs font-space font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Register Promo
                  </button>
                </form>

                {promoFormError && (
                  <p className="text-xs text-[#ffb4ab] font-medium">{promoFormError}</p>
                )}

                {promoFormSuccess && (
                  <p className="text-xs text-[#81c784] font-medium">{promoFormSuccess}</p>
                )}
              </div>

              {/* Promo codes list */}
              <div className="space-y-3">
                <span className="block text-[11px] font-space font-bold tracking-wider text-[#d8e3fb]/40 uppercase">
                  Active Promo Codes Register ({promoCodes.length} codes)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {promoCodes.map((p) => (
                    <div
                      key={p.code}
                      className="bg-[#1a283c]/60 border border-white/5 hover:border-[#00dbe7]/30 rounded-lg p-3.5 flex justify-between items-center transition-all group"
                    >
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-white text-sm tracking-wider flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-[#00dbe7]" />
                          {p.code}
                        </div>
                        <div className="text-[11px] text-[#c3f400] font-sans font-medium flex items-center gap-1.5">
                          <span>{p.discount}% DISCOUNT</span>
                          <span className="text-white/20">•</span>
                          {p.isPublic ? (
                            <span className="text-[9px] bg-[#c3f400]/10 text-[#c3f400] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Public
                            </span>
                          ) : (
                            <span className="text-[9px] bg-white/5 text-[#d8e3fb]/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePromoCode(p.code)}
                        className="p-1.5 bg-[#93000a]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#93000a]/30 rounded transition-all opacity-80 hover:opacity-100 cursor-pointer"
                        title="Delete promo code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {promoCodes.length === 0 && (
                    <div className="col-span-full text-center py-8 text-xs text-[#d8e3fb]/40 font-space uppercase">
                      No promo codes are currently active. Create one above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS REGISTER TAB */}
          {activeTab === "orders" && (() => {
            // Calendar calculations
            const calYear = currentCalendarMonth.getFullYear();
            const calMonth = currentCalendarMonth.getMonth();
            const calMonthName = currentCalendarMonth.toLocaleString("default", { month: "long" });

            const firstDay = new Date(calYear, calMonth, 1).getDay();
            const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

            const handlePrevMonth = () => {
              setCurrentCalendarMonth(new Date(calYear, calMonth - 1, 1));
            };

            const handleNextMonth = () => {
              setCurrentCalendarMonth(new Date(calYear, calMonth + 1, 1));
            };

            // Format YYYY-MM-DD
            const formatCalendarDateStr = (dayNum: number) => {
              const yyyy = calYear;
              const mm = String(calMonth + 1).padStart(2, "0");
              const dd = String(dayNum).padStart(2, "0");
              return `${yyyy}-${mm}-${dd}`;
            };

            // Filter order list based on both active filters
            const filteredOrdersList = adminOrders.filter((ord) => {
              // 1. Filter by Status
              if (orderStatusFilter !== "all") {
                const status = ord.status || "pending";
                if (status !== orderStatusFilter) return false;
              }
              // 2. Filter by Calendar Date selection
              if (selectedDate) {
                if (!ord.createdAt) return false;
                const ordDate = ord.createdAt.split("T")[0];
                if (ordDate !== selectedDate) return false;
              }
              return true;
            });

            return (
              <div className="space-y-4 text-left">
                {/* Upper banner section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#081425]/40 border border-white/5 rounded-lg p-3 gap-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-white font-space uppercase">Global Orders Database</h4>
                    <p className="text-[10px] text-[#d8e3fb]/50 font-mono">Real-time purchase details with interactive calendar timeline & states</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAllOrders}
                    disabled={loadingOrders}
                    className="py-1.5 px-3 bg-[#0266ff] hover:bg-[#0266ff]/85 disabled:opacity-50 text-white rounded text-[10px] font-space font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                    Refresh Database
                  </button>
                </div>

                {/* Interactive Status Counts filter banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Status Box 1: All Orders */}
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter("all")}
                    className={`p-2.5 border rounded-xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      orderStatusFilter === "all"
                        ? "bg-[#0266ff]/15 border-[#0266ff] text-white shadow-md shadow-[#0266ff]/5"
                        : "bg-[#1a283c]/35 border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                    }`}
                  >
                    <span className="text-[9px] font-space font-bold uppercase tracking-wider block">All Orders</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-bold text-white font-space">{totalOrders}</span>
                      <ShoppingBag className="w-3.5 h-3.5 opacity-40 text-blue-400" />
                    </div>
                    {orderStatusFilter === "all" && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#0266ff] rounded-bl-md"></span>
                    )}
                  </button>

                  {/* Status Box 2: Pending Status */}
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter("pending")}
                    className={`p-2.5 border rounded-xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      orderStatusFilter === "pending"
                        ? "bg-[#00dbe7]/10 border-[#00dbe7] text-white shadow-md shadow-[#00dbe7]/5"
                        : "bg-[#1a283c]/35 border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                    }`}
                  >
                    <span className="text-[9px] font-space font-bold uppercase tracking-wider block">Pending</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-bold text-yellow-400 font-space">{pendingCount}</span>
                      <Clock className="w-3.5 h-3.5 opacity-40 text-[#00dbe7]" />
                    </div>
                    {orderStatusFilter === "pending" && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#00dbe7] rounded-bl-md"></span>
                    )}
                  </button>

                  {/* Status Box 3: Processing Status */}
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter("processing")}
                    className={`p-2.5 border rounded-xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      orderStatusFilter === "processing"
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/5"
                        : "bg-[#1a283c]/35 border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                    }`}
                  >
                    <span className="text-[9px] font-space font-bold uppercase tracking-wider block">Processing</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-bold text-amber-400 font-space">{processingCount}</span>
                      <Cpu className="w-3.5 h-3.5 opacity-40 text-amber-400" />
                    </div>
                    {orderStatusFilter === "processing" && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-bl-md"></span>
                    )}
                  </button>

                  {/* Status Box 4: Completed Status */}
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter("completed")}
                    className={`p-2.5 border rounded-xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      orderStatusFilter === "completed"
                        ? "bg-green-500/10 border-green-500 text-white shadow-md shadow-green-500/5"
                        : "bg-[#1a283c]/35 border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                    }`}
                  >
                    <span className="text-[9px] font-space font-bold uppercase tracking-wider block">Completed</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-bold text-green-400 font-space">{completedCount}</span>
                      <Check className="w-3.5 h-3.5 opacity-40 text-green-400" />
                    </div>
                    {orderStatusFilter === "completed" && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-bl-md"></span>
                    )}
                  </button>
                </div>

                {/* Main Split workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* LEFT COLUMN: INTERACTIVE MONTHLY CALENDAR (4 Cols) */}
                  <div className="lg:col-span-5 bg-[#111e30]/60 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-space font-bold uppercase tracking-wider text-white">Calendar Navigator</span>
                        {selectedDate && (
                          <button
                            type="button"
                            onClick={() => setSelectedDate(null)}
                            className="text-[9px] font-mono text-[#00dbe7] hover:underline cursor-pointer"
                          >
                            Show All Dates
                          </button>
                        )}
                      </div>

                      {/* Calendar Navigation header */}
                      <div className="flex justify-between items-center bg-[#081425] border border-white/5 rounded p-1.5">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="px-2 py-0.5 text-[10px] font-mono text-[#d8e3fb]/60 hover:text-white cursor-pointer bg-white/5 hover:bg-white/10 rounded transition-all"
                        >
                          &larr;
                        </button>
                        <span className="text-[10.5px] font-space font-bold uppercase tracking-wider text-white">
                          {calMonthName} {calYear}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="px-2 py-0.5 text-[10px] font-mono text-[#d8e3fb]/60 hover:text-white cursor-pointer bg-white/5 hover:bg-white/10 rounded transition-all"
                        >
                          &rarr;
                        </button>
                      </div>

                      {/* Day Header */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[8.5px] font-space font-bold text-[#d8e3fb]/30 uppercase mb-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                          <div key={dayName} className="py-1">{dayName}</div>
                        ))}
                      </div>

                      {/* Day Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Empty spacing before first day */}
                        {Array.from({ length: firstDay }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="aspect-square bg-transparent"></div>
                        ))}

                        {/* Days list */}
                        {Array.from({ length: totalDays }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const dateStr = formatCalendarDateStr(dayNum);
                          const isSelected = selectedDate === dateStr;
                          
                          // Look up order stats for this date
                          const dateOrders = adminOrders.filter((o) => o.createdAt && o.createdAt.split("T")[0] === dateStr);
                          const hasOrders = dateOrders.length > 0;
                          
                          // Status composition of orders on this date
                          const hasPending = dateOrders.some((o) => (o.status || "pending") === "pending");
                          const hasProcessing = dateOrders.some((o) => o.status === "processing");
                          const hasCompleted = dateOrders.some((o) => o.status === "completed");

                          return (
                            <button
                              key={`day-${dayNum}`}
                              type="button"
                              onClick={() => setSelectedDate(dateStr)}
                              className={`aspect-square rounded-lg flex flex-col justify-center items-center relative transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#0266ff] border border-white/20 text-white shadow-md shadow-[#0266ff]/25"
                                  : hasOrders
                                    ? "bg-[#1a283c]/80 border border-[#00dbe7]/30 text-white hover:bg-[#1a283c] hover:border-[#00dbe7]/60"
                                    : "bg-[#081425]/45 border border-transparent text-[#d8e3fb]/50 hover:bg-[#081425] hover:text-white"
                              }`}
                            >
                              <span className="text-xs font-mono font-bold leading-none">{dayNum}</span>
                              
                              {/* Glowing dots/indicators showing order volume */}
                              {hasOrders && (
                                <div className="absolute bottom-1.5 flex gap-0.5 justify-center">
                                  {hasPending && (
                                    <span className="w-1 h-1 rounded-full bg-yellow-400" />
                                  )}
                                  {hasProcessing && (
                                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                                  )}
                                  {hasCompleted && (
                                    <span className="w-1 h-1 rounded-full bg-green-500" />
                                  )}
                                </div>
                              )}
                              
                              {/* Mini orders counter badge */}
                              {hasOrders && (
                                <span className={`absolute top-0.5 right-0.5 text-[7px] px-0.5 min-w-[10px] text-center leading-none rounded-full font-mono font-bold ${
                                  isSelected ? "bg-white text-[#0266ff]" : "bg-[#00dbe7]/20 text-[#00dbe7]"
                                }`}>
                                  {dateOrders.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Helper description details */}
                    <div className="bg-[#081425]/50 border border-white/5 rounded-lg p-2.5 text-[9px] text-[#d8e3fb]/50 font-mono space-y-1.5">
                      <div className="text-white font-space font-bold uppercase text-[8px] tracking-wider">Color Legend Matrix:</div>
                      <div className="grid grid-cols-3 gap-1 text-[8px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Pending</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Process</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Complete</span>
                      </div>
                      <p className="leading-snug pt-1 border-t border-white/5">
                        {selectedDate 
                          ? `Currently viewing filtered orders for date: ${selectedDate}. Click "Show All Dates" above or click the selected day again to remove.` 
                          : "Select any highlighted date cell to filter purchases that occurred on that specific calendar day."}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ORDERS REGISTER LIST VIEW (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col space-y-3">
                    <div className="flex justify-between items-center bg-[#081425]/40 px-3 py-2 rounded-lg border border-white/5">
                      <div className="text-[10px] font-space font-bold text-white uppercase tracking-wider">
                        Log Record Panel: {filteredOrdersList.length} matches
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono text-[#d8e3fb]/40">
                        {selectedDate && <span className="text-[#00dbe7] bg-[#00dbe7]/5 px-1.5 py-0.5 rounded border border-[#00dbe7]/10">Date: {selectedDate}</span>}
                        {orderStatusFilter !== "all" && <span className="text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded border border-amber-400/10">Status: {orderStatusFilter}</span>}
                      </div>
                    </div>

                    <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                      {loadingOrders ? (
                        <div className="text-center py-16 text-xs text-[#d8e3fb]/40 font-mono animate-pulse">
                          Fetching secure pipeline datasets...
                        </div>
                      ) : filteredOrdersList.length === 0 ? (
                        <div className="text-center py-16 bg-[#081425]/30 border border-white/5 rounded-xl">
                          <ShoppingBag className="w-10 h-10 text-[#d8e3fb]/20 mx-auto mb-3" />
                          <p className="text-xs text-white font-space font-semibold uppercase tracking-wider">No matching transactions</p>
                          <p className="text-[10px] text-[#d8e3fb]/50 mt-1">
                            No orders fit the active calendar date and status query parameters.
                          </p>
                          {(selectedDate || orderStatusFilter !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(null);
                                setOrderStatusFilter("all");
                              }}
                              className="mt-3 py-1 px-3 bg-[#0266ff] hover:bg-[#0266ff]/80 text-white rounded text-[9px] font-space font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Reset Active Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredOrdersList.map((ord) => (
                          <div
                            key={ord.id}
                            className="bg-[#1a283c]/50 border border-white/5 hover:border-[#00dbe7]/20 rounded-xl p-4 space-y-3 transition-all"
                          >
                            {/* Title bar */}
                            <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono font-bold text-[#00dbe7] bg-[#00dbe7]/5 px-1.5 py-0.5 rounded border border-[#00dbe7]/10">
                                  {ord.id.substring(0, 14)}
                                </span>
                                <div className="text-[10px] text-white/80 font-space font-medium leading-normal">
                                  Client: <strong className="text-white font-bold">{ord.customerName}</strong>
                                </div>
                                <div className="text-[9px] text-[#d8e3fb]/50 font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#d8e3fb]/40" />
                                  <span>{ord.customerEmail}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-[#c3f400] font-sans">
                                  ৳{parseFloat(ord.total).toFixed(2)}
                                </div>
                                <span className={`inline-block mt-1 text-[8px] uppercase tracking-widest border px-1.5 py-0.5 rounded font-space font-bold ${
                                  (ord.status || "pending") === "completed"
                                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                                    : (ord.status || "pending") === "processing"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                                }`}>
                                  {ord.status || "pending"}
                                </span>
                              </div>
                            </div>

                            {/* Order components items */}
                            <div className="space-y-1.5 py-1">
                              <span className="block text-[8px] font-space font-bold tracking-widest text-[#d8e3fb]/30 uppercase">Ordered Components:</span>
                              {ord.items && ord.items.map((it: any, index: number) => (
                                <div key={index} className="flex justify-between text-[10px] text-[#d8e3fb]/80 font-sans">
                                  <span>
                                    {it.name} <strong className="text-[#00dbe7]">x{it.quantity}</strong>
                                  </span>
                                  <span className="font-mono text-white/95">৳{(it.price * it.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Address and Phone */}
                            <div className="bg-[#081425]/40 border border-white/5 p-2 rounded text-[9px] text-[#d8e3fb]/70 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#00dbe7]/70" />
                                <span>Contact Phone: <strong className="text-white">{ord.customerPhone}</strong></span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3 h-3 mt-0.5 text-[#00dbe7]/70 shrink-0" />
                                <span className="leading-snug">Address / Lab: <strong className="text-white">{ord.deliveryLocation}</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[8px] text-[#d8e3fb]/40 font-mono pt-0.5 border-t border-white/5 mt-1">
                                <Calendar className="w-2.5 h-2.5 text-[#d8e3fb]/30" />
                                <span>Created: {new Date(ord.createdAt).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Status controls and delete */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-space font-bold text-[#d8e3fb]/40 uppercase tracking-wider">Status:</span>
                                <select
                                  value={ord.status || "pending"}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                  className="bg-[#081425] border border-white/10 text-[9px] font-space font-bold uppercase text-white rounded px-1.5 py-1 focus:border-[#00dbe7] outline-none cursor-pointer transition-all"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="p-1.5 bg-[#93000a]/10 text-[#ffb4ab] hover:bg-[#93000a]/30 border border-[#ffb4ab]/15 rounded transition-all cursor-pointer flex items-center gap-1 text-[9px] font-space font-bold uppercase tracking-wider"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Void Order
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ANALYTICS DASHBOARD TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-6 text-left">
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#081425]/40 border border-white/5 rounded-lg p-3.5 gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white font-space uppercase tracking-wider">Holographic Analytics Console</h4>
                  <p className="text-[10px] text-[#d8e3fb]/50 font-mono">Live transactional intelligence and hardware pipeline graphs</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAllOrders}
                  disabled={loadingOrders}
                  className="py-1.5 px-3 bg-[#0266ff] hover:bg-[#0266ff]/85 disabled:opacity-50 text-white rounded text-[10px] font-space font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                  Sync Metrics
                </button>
              </div>

              {loadingOrders ? (
                <div className="text-center py-20 text-xs text-[#d8e3fb]/40 font-mono animate-pulse">
                  Aggregating system databases & drawing vector matrices...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview statistics grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* CARD 1: TOTAL ORDERS */}
                    <div className="bg-[#1a283c]/45 border border-white/5 rounded-xl p-3.5 space-y-1 hover:border-[#00dbe7]/15 transition-all">
                      <div className="flex justify-between items-center text-[#d8e3fb]/40">
                        <span className="text-[9px] font-space font-bold uppercase tracking-wider">Total Orders</span>
                        <ShoppingBag className="w-3.5 h-3.5 text-[#00dbe7]" />
                      </div>
                      <div className="text-xl font-bold text-white font-space">
                        {totalOrders}
                      </div>
                      <div className="text-[9px] text-[#d8e3fb]/50 font-mono">
                        Across customer accounts
                      </div>
                    </div>

                    {/* CARD 2: REVENUE */}
                    <div className="bg-[#1a283c]/45 border border-white/5 rounded-xl p-3.5 space-y-1 hover:border-[#00dbe7]/15 transition-all">
                      <div className="flex justify-between items-center text-[#d8e3fb]/40">
                        <span className="text-[9px] font-space font-bold uppercase tracking-wider">Gross Sales</span>
                        <DollarSign className="w-3.5 h-3.5 text-[#c3f400]" />
                      </div>
                      <div className="text-xl font-bold text-[#c3f400] font-sans">
                        ৳{totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-[#d8e3fb]/50 font-mono">
                        Aggregated lifetime total
                      </div>
                    </div>

                    {/* CARD 3: AVERAGE ORDER VALUE */}
                    <div className="bg-[#1a283c]/45 border border-white/5 rounded-xl p-3.5 space-y-1 hover:border-[#00dbe7]/15 transition-all">
                      <div className="flex justify-between items-center text-[#d8e3fb]/40">
                        <span className="text-[9px] font-space font-bold uppercase tracking-wider">Avg Order Value</span>
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-xl font-bold text-white font-sans">
                        ৳{avgOrderValue.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-[#d8e3fb]/50 font-mono">
                        Per transaction value (AOV)
                      </div>
                    </div>

                    {/* CARD 4: COMPLETION RATE */}
                    <div className="bg-[#1a283c]/45 border border-white/5 rounded-xl p-3.5 space-y-1 hover:border-[#00dbe7]/15 transition-all">
                      <div className="flex justify-between items-center text-[#d8e3fb]/40">
                        <span className="text-[9px] font-space font-bold uppercase tracking-wider">Completion Rate</span>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="text-xl font-bold text-white font-space">
                        {completionRate.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-[#d8e3fb]/50 font-mono">
                        {completedCount} of {totalOrders} completed
                      </div>
                    </div>
                  </div>

                  {/* GRAPH SECTION */}
                  <div className="bg-[#111e30]/60 border border-white/5 rounded-xl p-4.5 space-y-4">
                    {/* Graph Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                      <div>
                        <h5 className="text-[11px] font-space font-bold uppercase tracking-wider text-white">Daily Order Streams</h5>
                        <p className="text-[9px] text-[#d8e3fb]/40 font-mono">Interactive tracking timeline (Last 10 Days)</p>
                      </div>

                      {/* Controls Switchers */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Metric Selector */}
                        <div className="bg-[#081425] border border-white/10 rounded p-0.5 flex">
                          <button
                            type="button"
                            onClick={() => setChartMetric("count")}
                            className={`px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                              chartMetric === "count"
                                ? "bg-[#0266ff] text-white"
                                : "text-[#d8e3fb]/40 hover:text-white"
                            }`}
                          >
                            Orders Count
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartMetric("revenue")}
                            className={`px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                              chartMetric === "revenue"
                                ? "bg-[#0266ff] text-white"
                                : "text-[#d8e3fb]/40 hover:text-white"
                            }`}
                          >
                            Revenue Stream
                          </button>
                        </div>

                        {/* Chart Type Selector */}
                        <div className="bg-[#081425] border border-white/10 rounded p-0.5 flex">
                          <button
                            type="button"
                            onClick={() => setChartType("line")}
                            className={`px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                              chartType === "line"
                                ? "bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20"
                                : "text-[#d8e3fb]/40 hover:text-white"
                            }`}
                          >
                            Line Chart
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartType("bar")}
                            className={`px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                              chartType === "bar"
                                ? "bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20"
                                : "text-[#d8e3fb]/40 hover:text-white"
                            }`}
                          >
                            Bar Chart
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="relative bg-[#081425]/40 border border-white/5 rounded-lg p-3">
                      {/* Floating Tooltip Card */}
                      {hoveredIndex !== null && (
                        <div className="absolute top-3 left-3 bg-[#0a182c] border border-[#00dbe7]/35 rounded px-3 py-1.8 text-[10px] font-mono shadow-2xl z-20 text-left animate-fade-in pointer-events-none">
                          <div className="text-[#00dbe7] font-bold font-space uppercase text-[8.5px] tracking-wider mb-1">
                            {chartData[hoveredIndex].label}
                          </div>
                          <div className="text-white/95">
                            Orders Count: <strong className="text-[#c3f400] font-sans font-extrabold">{chartData[hoveredIndex].count}</strong>
                          </div>
                          <div className="text-white/95">
                            Daily Sales: <strong className="text-[#00dbe7] font-sans font-extrabold">৳{chartData[hoveredIndex].revenue.toFixed(2)}</strong>
                          </div>
                        </div>
                      )}

                      {/* SVG Render viewport */}
                      <svg viewBox="0 0 600 220" className="w-full h-auto select-none overflow-visible">
                        {/* Glow filters and Gradients definition */}
                        <defs>
                          <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#00dbe7" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#0266ff" stopOpacity="0.25" />
                          </linearGradient>
                          <linearGradient id="lineRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c3f400" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#c3f400" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c3f400" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#8bc34a" stopOpacity="0.2" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[20, 55, 90, 125, 160].map((yVal, gIdx) => {
                          // Calculate label corresponding to this grid index
                          const ratio = (160 - yVal) / 140;
                          const maxVal = Math.max(...chartData.map(d => chartMetric === "count" ? d.count : d.revenue));
                          const chartMax = maxVal === 0 ? (chartMetric === "count" ? 5 : 100) : maxVal * 1.15;
                          const valueLabel = ratio * chartMax;

                          return (
                            <g key={gIdx} className="opacity-40">
                              <line
                                x1="45"
                                y1={yVal}
                                x2="585"
                                y2={yVal}
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeDasharray="3 3"
                              />
                              <text
                                x="35"
                                y={yVal + 3}
                                textAnchor="end"
                                fill="#d8e3fb"
                                className="text-[8px] font-mono fill-[#d8e3fb]/40"
                              >
                                {chartMetric === "count" 
                                  ? Math.round(valueLabel) 
                                  : `৳${Math.round(valueLabel)}`}
                              </text>
                            </g>
                          );
                        })}

                        {/* Hover vertical timeline crosshair line */}
                        {hoveredIndex !== null && (
                          <line
                            x1={45 + hoveredIndex * 60}
                            y1="15"
                            x2={45 + hoveredIndex * 60}
                            y2="160"
                            stroke={chartMetric === "count" ? "#00dbe7" : "#c3f400"}
                            strokeOpacity="0.25"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Render Line & Area if line graph is selected */}
                        {chartType === "line" && (
                          <>
                            {/* Area Fill */}
                            <path
                              d={(() => {
                                const maxVal = Math.max(...chartData.map(d => chartMetric === "count" ? d.count : d.revenue));
                                const chartMax = maxVal === 0 ? (chartMetric === "count" ? 5 : 100) : maxVal * 1.15;
                                const pts = chartData.map((d, idx) => {
                                  const x = 45 + idx * 60;
                                  const val = chartMetric === "count" ? d.count : d.revenue;
                                  const y = 160 - (val / chartMax) * 140;
                                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                                }).join(" ");
                                return pts ? `${pts} L ${45 + (chartData.length - 1) * 60} 160 L 45 160 Z` : "";
                              })()}
                              fill={chartMetric === "count" ? "url(#chartLineGrad)" : "url(#lineRevGrad)"}
                            />

                            {/* Neon Glowing Line */}
                            <path
                              d={(() => {
                                const maxVal = Math.max(...chartData.map(d => chartMetric === "count" ? d.count : d.revenue));
                                const chartMax = maxVal === 0 ? (chartMetric === "count" ? 5 : 100) : maxVal * 1.15;
                                return chartData.map((d, idx) => {
                                  const x = 45 + idx * 60;
                                  const val = chartMetric === "count" ? d.count : d.revenue;
                                  const y = 160 - (val / chartMax) * 140;
                                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                                }).join(" ");
                              })()}
                              fill="none"
                              stroke={chartMetric === "count" ? "#00dbe7" : "#c3f400"}
                              strokeWidth="2.5"
                              filter="url(#glow)"
                            />

                            {/* Data points */}
                            {chartData.map((d, idx) => {
                              const maxVal = Math.max(...chartData.map(d => chartMetric === "count" ? d.count : d.revenue));
                              const chartMax = maxVal === 0 ? (chartMetric === "count" ? 5 : 100) : maxVal * 1.15;
                              const val = chartMetric === "count" ? d.count : d.revenue;
                              const x = 45 + idx * 60;
                              const y = 160 - (val / chartMax) * 140;

                              return (
                                <circle
                                  key={idx}
                                  cx={x}
                                  cy={y}
                                  r={hoveredIndex === idx ? "5" : "3.5"}
                                  fill="#081425"
                                  stroke={chartMetric === "count" ? "#00dbe7" : "#c3f400"}
                                  strokeWidth="2.5"
                                  className="transition-all"
                                />
                              );
                            })}
                          </>
                        )}

                        {/* Render Bars if bar graph is selected */}
                        {chartType === "bar" && (
                          <g>
                            {chartData.map((d, idx) => {
                              const maxVal = Math.max(...chartData.map(d => chartMetric === "count" ? d.count : d.revenue));
                              const chartMax = maxVal === 0 ? (chartMetric === "count" ? 5 : 100) : maxVal * 1.15;
                              const val = chartMetric === "count" ? d.count : d.revenue;
                              const x = 45 + idx * 60 - 15; // Centered
                              const y = 160 - (val / chartMax) * 140;
                              const barHeight = Math.max(160 - y, 2);

                              return (
                                <rect
                                  key={idx}
                                  x={x}
                                  y={y}
                                  width="30"
                                  height={barHeight}
                                  fill={chartMetric === "count" ? "url(#barGrad)" : "url(#barRevGrad)"}
                                  rx="3"
                                  className="transition-all duration-300"
                                  style={{
                                    stroke: hoveredIndex === idx 
                                      ? (chartMetric === "count" ? "#00dbe7" : "#c3f400") 
                                      : "none",
                                    strokeWidth: "1"
                                  }}
                                />
                              );
                            })}
                          </g>
                        )}

                        {/* Bottom X-Axis line */}
                        <line
                          x1="45"
                          y1="160"
                          x2="585"
                          y2="160"
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="1"
                        />

                        {/* X Axis Date labels */}
                        {chartData.map((d, idx) => (
                          <text
                            key={idx}
                            x={45 + idx * 60}
                            y="178"
                            textAnchor="middle"
                            fill="#d8e3fb"
                            className={`text-[8.5px] font-mono transition-all ${
                              hoveredIndex === idx 
                                ? "fill-[#00dbe7] font-bold" 
                                : "fill-[#d8e3fb]/40"
                            }`}
                          >
                            {d.label}
                          </text>
                        ))}

                        {/* Broad interactive hovering columns overlay */}
                        {chartData.map((_, idx) => (
                          <rect
                            key={idx}
                            x={45 + idx * 60 - 28}
                            y="15"
                            width="56"
                            height="155"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        ))}
                      </svg>

                      {/* Fallback info when no orders available to plot */}
                      {totalOrders === 0 && (
                        <div className="absolute inset-0 bg-[#081425]/90 flex items-center justify-center text-[10px] text-[#d8e3fb]/50 font-space uppercase">
                          No order datasets available to map
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM SUBSECTION: TOP PRODUCTS & STATUS DISTRIBUTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Products Register */}
                    <div className="bg-[#111e30]/50 border border-white/5 rounded-xl p-4 space-y-3.5">
                      <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <BarChart2 className="w-4 h-4 text-[#00dbe7]" />
                        <h5 className="text-[10px] font-space font-bold uppercase tracking-wider text-white">
                          Best Selling Components
                        </h5>
                      </div>

                      <div className="space-y-2.5">
                        {topSoldProducts.length === 0 ? (
                          <p className="text-[10px] text-[#d8e3fb]/40 font-mono text-center py-6">
                            No product sales recorded yet.
                          </p>
                        ) : (
                          topSoldProducts.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex justify-between items-center bg-[#081425]/30 border border-white/5 p-2 rounded-lg"
                            >
                              <div className="space-y-0.5 max-w-[70%]">
                                <div className="text-[10.5px] text-white/90 font-sans font-medium truncate">
                                  {p.name}
                                </div>
                                <div className="text-[8.5px] text-[#00dbe7] font-mono">
                                  Rank #{pIdx + 1} • {p.qty} Units Placed
                                </div>
                              </div>
                              <div className="text-[11px] font-bold text-[#c3f400] font-sans">
                                ৳{p.revenue.toFixed(2)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Order Status Distribution */}
                    <div className="bg-[#111e30]/50 border border-white/5 rounded-xl p-4 space-y-3.5">
                      <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Activity className="w-4 h-4 text-[#c3f400]" />
                        <h5 className="text-[10px] font-space font-bold uppercase tracking-wider text-white">
                          Order Status Breakdown
                        </h5>
                      </div>

                      <div className="space-y-4 pt-1">
                        {/* Completed progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-green-400 font-space font-semibold uppercase">Completed ({completedCount})</span>
                            <span className="text-white/60">
                              {totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#081425] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Processing progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-yellow-400 font-space font-semibold uppercase">Processing ({processingCount})</span>
                            <span className="text-white/60">
                              {totalOrders > 0 ? ((processingCount / totalOrders) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#081425] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${totalOrders > 0 ? (processingCount / totalOrders) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Pending progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-[#00dbe7] font-space font-semibold uppercase">Pending ({pendingCount})</span>
                            <span className="text-white/60">
                              {totalOrders > 0 ? ((pendingCount / totalOrders) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#081425] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00dbe7] rounded-full transition-all duration-500"
                              style={{
                                width: `${totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "certificates" && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h4 className="text-sm font-space font-bold uppercase tracking-wider text-[#00dbe7] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#c3f400]" /> QA Certificates & Compliance Registrar
                </h4>
                <p className="text-[10px] text-[#d8e3fb]/40 font-mono">
                  MANAGE VERIFIABLE QA LABORATORY TESTING AND QUALITY CERTIFICATES
                </p>
              </div>

              {/* Form and list grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Add Certificate Form */}
                <div className="md:col-span-5 bg-[#152236]/30 border border-white/5 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-space font-bold text-white uppercase tracking-wider">
                    {editingCertificate ? "Edit Quality Certificate" : "Add Quality Certificate"}
                  </h5>

                  {certFormError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-sans">
                      {certFormError}
                    </div>
                  )}

                  {certFormSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-sans">
                      {certFormSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAddCertificate} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Certificate Title / Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newCertTitle}
                        onChange={(e) => setNewCertTitle(e.target.value)}
                        placeholder="e.g. ISO 9001:2015 Quality Standard"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Certificate Picture URL
                      </label>
                      <input
                        type="url"
                        required
                        value={newCertPic}
                        onChange={(e) => setNewCertPic(e.target.value)}
                        placeholder="https://example.com/certificate.png"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                      <span className="block text-[9px] text-[#d8e3fb]/30 font-mono">
                        Provide a direct public image URL.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Address / Verifier / Issuer Details
                      </label>
                      <input
                        type="text"
                        required
                        value={newCertAddress}
                        onChange={(e) => setNewCertAddress(e.target.value)}
                        placeholder="e.g. SGS Lab Dhaka, Verification Code: CE-EMC-9821"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-[#0266ff] to-[#00dbe7] text-white font-space font-bold uppercase tracking-wider text-[11px] rounded-xl hover:opacity-90 shadow-lg shadow-[#0266ff]/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        {editingCertificate ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {editingCertificate ? "Save Changes" : "Register Certificate"}
                      </button>
                      {editingCertificate && (
                        <button
                          type="button"
                          onClick={handleCancelEditCertificate}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider text-[11px] rounded-xl border border-white/10 cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Certificates List */}
                <div className="md:col-span-7 bg-[#152236]/30 border border-white/5 p-5 rounded-2xl flex flex-col min-h-[300px]">
                  <h5 className="text-xs font-space font-bold text-white uppercase tracking-wider mb-3">
                    Active Certificates ({certificates.length})
                  </h5>

                  {certificates.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl space-y-2">
                      <Award className="w-10 h-10 text-[#d8e3fb]/25" />
                      <p className="text-xs font-space text-[#d8e3fb]/40">No Quality Certificates Registered</p>
                      <p className="text-[10px] text-[#d8e3fb]/20">Use the form to register custom verifiable test passes.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="bg-[#08121f]/50 border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center gap-3 justify-between"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={cert.pic}
                                alt={cert.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate">
                              <h6 className="text-xs font-bold text-white font-sans truncate leading-tight">
                                {cert.title}
                              </h6>
                              <p className="text-[10px] text-[#d8e3fb]/50 font-mono truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#00dbe7] shrink-0" /> {cert.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleStartEditCertificate(cert)}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 hover:text-blue-300 transition-all cursor-pointer"
                              title="Edit Certificate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCertificate(cert.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Certificate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === "banners" && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h4 className="text-sm font-space font-bold uppercase tracking-wider text-[#00dbe7] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00dbe7]" /> Home Page Banners Manager
                </h4>
                <p className="text-[10px] text-[#d8e3fb]/40 font-mono">
                  ADD OR REMOVE CUSTOM HOME PAGE ROTATING HERO SLIDERS (CYCLES AUTOMATICALLY EVERY 10 SECONDS)
                </p>
              </div>

              {/* Form and list grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Add Banner Form */}
                <div className="md:col-span-5 bg-[#152236]/30 border border-white/5 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-space font-bold text-white uppercase tracking-wider">
                    {editingBanner ? "Edit Banner Slide" : "Add New Banner Slide"}
                  </h5>

                  {bannerFormError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-sans">
                      {bannerFormError}
                    </div>
                  )}

                  {bannerFormSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-sans">
                      {bannerFormSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAddBanner} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Slide Badge (Optional)
                      </label>
                      <input
                        type="text"
                        value={newBannerBadge}
                        onChange={(e) => setNewBannerBadge(e.target.value)}
                        placeholder="e.g. AUTHORIZED HARDWARE DISTRIBUTOR"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Main Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newBannerTitle}
                        onChange={(e) => setNewBannerTitle(e.target.value)}
                        placeholder="e.g. Professional Components for"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Gradient Sub-title / Accent Text
                      </label>
                      <input
                        type="text"
                        required
                        value={newBannerGradient}
                        onChange={(e) => setNewBannerGradient(e.target.value)}
                        placeholder="e.g. Next-Gen Engineering"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Description / Body Text
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newBannerDesc}
                        onChange={(e) => setNewBannerDesc(e.target.value)}
                        placeholder="Write a professional background description for this slide..."
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Action Button Text
                      </label>
                      <input
                        type="text"
                        required
                        value={newBannerBtnText}
                        onChange={(e) => setNewBannerBtnText(e.target.value)}
                        placeholder="e.g. Explore Components Catalog"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Background Image URL
                      </label>
                      <input
                        type="text"
                        required
                        value={newBannerImage}
                        onChange={(e) => setNewBannerImage(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/..."
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Bottom Status/Caption Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={newBannerCaption}
                        onChange={(e) => setNewBannerCaption(e.target.value)}
                        placeholder="e.g. Precision Testing Lab"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-[#0266ff] to-[#00dbe7] text-white font-space font-bold uppercase tracking-wider text-[11px] rounded-xl hover:opacity-90 shadow-lg shadow-[#0266ff]/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        {editingBanner ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {editingBanner ? "Save Changes" : "Publish Banner Slide"}
                      </button>
                      {editingBanner && (
                        <button
                          type="button"
                          onClick={handleCancelEditBanner}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider text-[11px] rounded-xl border border-white/10 cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Banner list */}
                <div className="md:col-span-7 bg-[#152236]/30 border border-white/5 p-5 rounded-2xl flex flex-col min-h-[300px]">
                  <h5 className="text-xs font-space font-bold text-white uppercase tracking-wider mb-3">
                    Published Banner Slides ({banners.length})
                  </h5>

                  {banners.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl space-y-2">
                      <Sparkles className="w-10 h-10 text-[#d8e3fb]/25" />
                      <p className="text-xs font-space text-[#d8e3fb]/40 font-mono">NO ACTIVE BANNER SLIDES</p>
                      <p className="text-[10px] text-[#d8e3fb]/20">Default static hero fallback is active.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {banners.map((slide) => (
                        <div
                          key={slide.id}
                          className="bg-[#08121f]/50 border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center gap-3 justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-950">
                              <img
                                src={slide.image}
                                alt={slide.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate">
                              {slide.badge && (
                                <span className="text-[8px] bg-[#00db7e]/10 text-[#00db7e] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                                  {slide.badge}
                                </span>
                              )}
                              <h6 className="text-xs font-bold text-white font-sans truncate leading-tight mt-1">
                                {slide.title} <span className="text-[#00db7e]">{slide.gradientText}</span>
                              </h6>
                              <p className="text-[9px] text-[#d8e3fb]/50 font-sans truncate max-w-[280px]">
                                {slide.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleStartEditBanner(slide)}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 hover:text-blue-300 transition-all cursor-pointer shrink-0"
                              title="Edit Banner"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(slide.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 hover:text-red-300 transition-all cursor-pointer shrink-0"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === "brand" && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h4 className="text-sm font-space font-bold uppercase tracking-wider text-[#00dbe7] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#00dbe7]" /> Brand Identity & Logo Customizer
                </h4>
                <p className="text-[10px] text-[#d8e3fb]/40 font-mono">
                  CUSTOMIZE THE HEADER BRAND NAME, DEPLOY A CUSTOM GRAPHIC LOGO, OR TOGGLE LOGO OPTIONS INSTANTLY
                </p>
              </div>

              <div className="max-w-2xl bg-[#152236]/30 border border-white/5 p-6 rounded-2xl space-y-6">
                <div>
                  <h5 className="text-xs font-space font-bold text-white uppercase tracking-wider mb-2">
                    Dynamic Identity Configurations
                  </h5>
                  <p className="text-xs text-[#d8e3fb]/60 leading-relaxed">
                    Configure how your store banner, header links, and invoice routing identify your brand. You can use text only, a dynamic visual logo, or display both side-by-side.
                  </p>
                </div>

                {brandFormError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-sans">
                    {brandFormError}
                  </div>
                )}

                {brandFormSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-sans">
                    {brandFormSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveBrandSettings} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                      Brand Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. BD ROBOTEC"
                      className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                      Logo Illustration Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setBrandLogoType("icon")}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                          brandLogoType === "icon"
                            ? "bg-[#0266ff]/20 border-[#0266ff] text-white"
                            : "bg-[#08121f] border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                        }`}
                      >
                        <Cpu className="w-4 h-4 text-[#00dbe7]" />
                        <span>High-Tech Chip Icon</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandLogoType("custom")}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                          brandLogoType === "custom"
                            ? "bg-[#0266ff]/20 border-[#0266ff] text-white"
                            : "bg-[#08121f] border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-[#c3f400]" />
                        <span>Custom Logo Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandLogoType("none")}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                          brandLogoType === "none"
                            ? "bg-[#0266ff]/20 border-[#0266ff] text-white"
                            : "bg-[#08121f] border-white/5 text-[#d8e3fb]/60 hover:border-white/10"
                        }`}
                      >
                        <X className="w-4 h-4 text-red-400" />
                        <span>No Graphic Logo</span>
                      </button>
                    </div>
                  </div>

                  {brandLogoType === "custom" && (
                    <div className="space-y-1.5 bg-[#08121f]/50 border border-white/5 p-4 rounded-xl animate-fadeIn">
                      <label className="block text-[10px] font-space font-bold text-[#d8e3fb]/50 uppercase tracking-wider">
                        Custom Logo URL
                      </label>
                      <input
                        type="text"
                        required={brandLogoType === "custom"}
                        value={brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="e.g. https://domain.com/logo.png"
                        className="w-full bg-[#08121f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dbe7]/60"
                      />
                      <span className="text-[9px] text-[#d8e3fb]/40 font-mono mt-1 block">
                        We recommend a transparent PNG logo of max height 32px.
                      </span>

                      {brandLogoUrl && (
                        <div className="mt-3.5 pt-3 border-t border-white/5">
                          <span className="text-[9px] text-[#d8e3fb]/40 font-mono block mb-1.5">Live Logo Preview:</span>
                          <div className="h-12 bg-slate-950/80 rounded-lg flex items-center justify-center border border-white/5 p-2">
                            <img
                              src={brandLogoUrl}
                              alt="Brand Logo Preview"
                              className="h-8 max-w-[200px] object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as any).src = "https://placehold.co/120x30/0f172a/00dbe7?text=Invalid+Image";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 py-1.5">
                    <input
                      type="checkbox"
                      id="brandShowName"
                      checked={brandShowName}
                      onChange={(e) => setBrandShowName(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#08121f] border-white/10 text-[#0266ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="brandShowName" className="text-xs text-[#d8e3fb]/80 select-none cursor-pointer">
                      Display brand text name (e.g. "{brandName || "BD ROBOTEC"}") alongside logo graphic
                    </label>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-[#0266ff] to-[#00dbe7] text-white font-space font-bold uppercase tracking-wider text-[11px] rounded-xl hover:opacity-90 shadow-lg shadow-[#0266ff]/20 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Brand Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1f2a3c]/30 border-t border-white/5 p-3 flex justify-between items-center text-[9px] text-[#d8e3fb]/40 font-mono shrink-0">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00dbe7]" />
            <span>Fidelity level checking active // Integrity safe</span>
          </div>
          <span>Rev: 1.0.9 // Core Database synced</span>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative bg-[#0d1624] border border-red-500/40 w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/25 rounded-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-space text-base font-bold text-white uppercase tracking-wider">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-[#d8e3fb]/80 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#d8e3fb] text-xs font-space font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-space font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
