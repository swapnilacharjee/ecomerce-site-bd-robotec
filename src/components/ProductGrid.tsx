import React from "react";
import { Filter, Grid } from "lucide-react";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onQuickOrder: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  searchTerm: string;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function ProductGrid({
  products,
  onQuickOrder,
  onSelectProduct,
  searchTerm,
  activeCategory,
  setActiveCategory,
}: ProductGridProps) {
  
  // Filtering logic combined (search & category)
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "ALL" ||
      product.category.toUpperCase() === activeCategory.toUpperCase();
    
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const defaultCategories = ["MICROCONTROLLER", "ACTUATOR", "WIRELESS MCU", "SENSORS"];
  const categories = [
    "ALL",
    ...Array.from(new Set([...defaultCategories, ...products.map((p) => p.category.toUpperCase())])),
  ];

  return (
    <section id="precision-inventory" className="mb-16 scroll-mt-24">
      
      {/* Grid Headers and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-8 gap-3 md:gap-4">
        <div>
          <h2 className="font-sans text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Product Catalog
          </h2>
          <p className="font-space text-[9px] md:text-[10px] font-bold text-[#00dbe7] tracking-widest mt-1 md:mt-2">
            STOCK STATUS: VERIFIED GENUINE • READY TO SHIP
          </p>
        </div>

        {/* Categories Bar & Quick Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex flex-row overflow-x-auto no-scrollbar gap-1 bg-[#111c2d]/90 p-1 border border-white/10 rounded-lg max-w-full shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-space font-bold tracking-wider rounded transition-all cursor-pointer shrink-0 ${
                  activeCategory === cat
                    ? "bg-[#0266ff] text-white"
                    : "text-[#d8e3fb]/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="hidden sm:flex gap-1">
            <button className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-[#d8e3fb]/60 hover:text-white transition-all cursor-pointer">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 border border-[#00dbe7]/30 bg-[#00dbe7]/10 rounded-lg text-[#00dbe7] transition-all cursor-pointer">
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Items Display */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in duration-500">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickOrder={onQuickOrder}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#111c2d]/40 rounded-xl border border-white/5">
          <p className="text-[#d8e3fb]/50 text-sm font-space">
            No robotic components found for the current configuration.
          </p>
          <button
            onClick={() => {
              setActiveCategory("ALL");
              // Clear search term inside parent trigger could also be set
            }}
            className="mt-4 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 font-space font-bold uppercase tracking-wider transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
}
