import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initialProducts } from '../data/products';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    if (typeof window === 'undefined') {
      return initialProducts;
    }

    const saved = localStorage.getItem('skinora-products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [cart, setCart] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = localStorage.getItem('skinora-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skinora-products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skinora-cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [...currentCart, { ...product, quantity }];
    });
  };

  const updateCartQty = (productId, change) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId) {
          return [item];
        }

        const updatedQty = item.quantity + change;
        return updatedQty > 0 ? [{ ...item, quantity: updatedQty }] : [];
      }),
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const addProduct = (product) => {
    setProducts((currentProducts) => [product, ...currentProducts]);
  };

  const updateProduct = (productId, changes) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId ? { ...product, ...changes } : product,
      ),
    );
  };

  const deleteProduct = (productId) => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const cartItems = cart.length;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({
      products,
      setProducts,
      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      addProduct,
      updateProduct,
      deleteProduct,
      cartItems,
      cartSubtotal,
    }),
    [cart, cartSubtotal, products],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used inside a StoreProvider');
  }

  return context;
};
