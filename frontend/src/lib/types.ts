// === Types partagés frontend ===

export type UserRole = 'client' | 'restaurant' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RestaurantAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineType?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  address: RestaurantAddress;
  phone?: string;
  offersPickup: boolean;
  offersDelivery: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
  prepTimeMin: number;
  isPublished: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  category?: string;
  priceCents: number;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  displayOrder: number;
}

export type OrderStatus =
  | 'pending' | 'paid' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'completed' | 'cancelled' | 'refunded';

export type OrderType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  status: OrderStatus;
  type: OrderType;
  scheduledFor: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  customerNotes?: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  promoDiscountCents: number;
  totalCents: number;
  promoCodeApplied?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}
