export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  image: string;
  specs: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UserAccount {
  uid?: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export interface PromoCode {
  code: string;
  discount: number; // percentage discount (e.g., 10 for 10%)
  isPublic?: boolean; // true if visible/tap-to-apply for everyone, false if hidden (must be typed)
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string; // ISO String
  status: "pending" | "processing" | "completed";
}

export interface Certificate {
  id: string;
  title: string;
  pic: string;
  address: string;
}

export interface Banner {
  id: string;
  badge?: string;
  title: string;
  gradientText?: string;
  description: string;
  buttonText?: string;
  image: string;
  caption?: string;
}

export interface BrandSettings {
  name: string;
  logoUrl?: string;
  logoType?: "icon" | "custom" | "none";
  showName?: boolean;
}



