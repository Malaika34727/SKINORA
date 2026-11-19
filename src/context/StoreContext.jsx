import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createProduct,
  getProductPrice,
  listenToProducts,
  removeProduct,
  updateProduct as saveProductChanges,
} from '../services/products';
import { listenToCategories } from '../services/adminData';
import { listenToCustomerCart, saveCustomerCart } from '../services/authService';
import { useAuth } from './AuthContextValue';
import { StoreContext } from './StoreContextValue';

export const StoreProvider = ({ children }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [carts, setCarts] = useState({});
  const [cartVersions, setCartVersions] = useState({});
  const [syncedCartVersions, setSyncedCartVersions] = useState({});
  const [cartSyncUid, setCartSyncUid] = useState('');
  const [cartSyncErrors, setCartSyncErrors] = useState({});
  const cartWriteQueue = useRef(Promise.resolve());
  const ownerKey = user && !isAdmin ? user.uid : 'guest';
  const cart = useMemo(() => carts[ownerKey] || [], [carts, ownerKey]);
  const cartSyncError = cartSyncErrors[ownerKey] || '';
  const cartVersion = cartVersions[ownerKey] || 0;
  const syncedCartVersion = syncedCartVersions[ownerKey] || 0;

  useEffect(() => listenToProducts(
    (nextProducts) => {
      setProducts(nextProducts);
      setProductsError('');
      setProductsLoading(false);
    },
    (error) => {
      setProductsError(`Could not load products: ${error.message}`);
      setProductsLoading(false);
    },
  ), []);

  useEffect(() => {
    return listenToCategories(
      setCategories,
      (error) => setCategoriesError(`Could not load categories: ${error.message}`),
    );
  }, []);

  useEffect(() => {
    if (authLoading || !user || isAdmin) return undefined;
    return listenToCustomerCart(
      user.uid,
      (savedCart) => {
        if (savedCart === null) {
          setCartSyncUid('');
          setCartSyncErrors((current) => ({
            ...current,
            [user.uid]: 'Your customer profile is unavailable, so cart sync is disabled.',
          }));
          return;
        }
        if (savedCart) {
          const validCart = savedCart.filter((item) => (
            typeof item?.id === 'string'
            && Number.isInteger(item.quantity)
            && item.quantity > 0
          ));
          const currentVersion = cartVersions[user.uid] || 0;
          const savedVersion = syncedCartVersions[user.uid] || 0;
          if (currentVersion <= savedVersion) {
            setCarts((current) => ({ ...current, [user.uid]: validCart }));
          }
        }
        setCartSyncUid(user.uid);
        setCartSyncErrors((current) => ({ ...current, [user.uid]: '' }));
      },
      (error) => {
        setCartSyncUid('');
        setCartSyncErrors((current) => ({
          ...current,
          [user.uid]: `Could not sync your cart: ${error.message}`,
        }));
      },
    );
  }, [authLoading, cartVersions, isAdmin, syncedCartVersions, user]);

  useEffect(() => {
    if (
      authLoading
      || !user
      || isAdmin
      || cartSyncUid !== user.uid
      || cartVersion <= syncedCartVersion
    ) return;

    const versionToSave = cartVersion;
    const cartToSave = cart.map(({ id, quantity }) => ({ id, quantity }));
    const save = cartWriteQueue.current
      .catch(() => undefined)
      .then(() => saveCustomerCart(user.uid, cartToSave));
    cartWriteQueue.current = save;
    save.then(
      () => {
        setSyncedCartVersions((current) => ({
          ...current,
          [user.uid]: Math.max(current[user.uid] || 0, versionToSave),
        }));
        setCartSyncErrors((current) => ({ ...current, [user.uid]: '' }));
      },
      (error) => setCartSyncErrors((current) => ({
        ...current,
        [user.uid]: `Could not save your cart: ${error.message}`,
      })),
    );
  }, [authLoading, cart, cartSyncUid, cartVersion, isAdmin, syncedCartVersion, user]);

  const changeCart = useCallback((update) => {
    setCarts((current) => ({
      ...current,
      [ownerKey]: update(current[ownerKey] || []),
    }));
    setCartVersions((current) => ({
      ...current,
      [ownerKey]: (current[ownerKey] || 0) + 1,
    }));
  }, [ownerKey]);

  const addToCart = useCallback((product, quantity = 1) => {
    if (product.status === 'inactive' || product.stock <= 0) return;
    changeCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      return existingItem
        ? currentCart.map((item) => (
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock, 99) }
            : item
        ))
        : [{ ...product, quantity: Math.min(quantity, product.stock, 99) }];
    });
  }, [changeCart]);

  const updateCartQty = useCallback((productId, change) => {
    changeCart((currentCart) => currentCart.flatMap((item) => {
      if (item.id !== productId) return [item];

      const updatedQty = item.quantity + change;
      const currentProduct = products.find((product) => product.id === productId);
      const maxQuantity = Math.min(currentProduct?.stock ?? 99, 99);
      return updatedQty > 0 && maxQuantity > 0
        ? [{ ...item, quantity: Math.min(updatedQty, maxQuantity) }]
        : [];
    }));
  }, [changeCart, products]);

  const removeFromCart = useCallback((productId) => {
    changeCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }, [changeCart]);

  const clearCart = useCallback(() => {
    changeCart(() => []);
  }, [changeCart]);

  const addProduct = useCallback((product, imageFile) => createProduct(product, imageFile), []);
  const updateProduct = useCallback(
    (productId, changes, imageFile) => saveProductChanges(productId, changes, imageFile),
    [],
  );
  const deleteProduct = useCallback(async (productId) => {
    const cleanupWarning = await removeProduct(productId);
    changeCart((currentCart) => currentCart.filter((item) => item.id !== productId));
    return cleanupWarning;
  }, [changeCart]);

  const resolvedCart = useMemo(() => cart.map((item) => {
    const currentProduct = products.find((product) => product.id === item.id);
    return currentProduct
      ? {
        ...currentProduct,
        price: getProductPrice(currentProduct),
        quantity: item.quantity,
        unavailable: currentProduct.status === 'inactive'
          || currentProduct.stock < item.quantity
          || currentProduct.stock <= 0,
      }
      : {
        ...item,
        name: item.name || 'Unavailable product',
        category: item.category || '',
        price: 0,
        imageUrl: item.imageUrl || '',
        unavailable: true,
      };
  }), [cart, products]);
  const cartItems = resolvedCart.length;
  const cartSubtotal = resolvedCart.reduce(
    (sum, item) => sum + (item.unavailable ? 0 : item.price * item.quantity),
    0,
  );

  const value = useMemo(
    () => ({
      products,
      productsLoading,
      productsError,
      categories,
      categoriesError,
      cart: resolvedCart,
      cartSyncError,
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
    [
      addProduct,
      addToCart,
      cartItems,
      cartSubtotal,
      categories,
      categoriesError,
      cartSyncError,
      clearCart,
      deleteProduct,
      products,
      productsError,
      productsLoading,
      removeFromCart,
      resolvedCart,
      updateCartQty,
      updateProduct,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
