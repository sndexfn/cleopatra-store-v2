import { create } from 'zustand';

type UIState = {
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openMenu: () => void;
  closeMenu: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isCheckoutOpen: false,
  isMenuOpen: false,
  openCart: () => set({ isCartOpen: true, isCheckoutOpen: false, isMenuOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  openCheckout: () => set({ isCheckoutOpen: true, isCartOpen: false, isMenuOpen: false }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
  openMenu: () => set({ isMenuOpen: true, isCartOpen: false, isCheckoutOpen: false }),
  closeMenu: () => set({ isMenuOpen: false }),
}));
