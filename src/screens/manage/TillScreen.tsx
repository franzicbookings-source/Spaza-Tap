import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Customer } from '../../types';
import { ShoppingCart, Search, Plus, Minus, X, CreditCard, Banknote, User, Tag, ShoppingBag, Coins } from 'lucide-react';

interface TillScreenProps {
  shopId: string;
  ownerUserId: string;
  customers: Customer[];
}

export default function TillScreen({ shopId, ownerUserId, customers }: TillScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit" | string>("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState<{text: string, type: "success" | "error"} | null>(null);

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(
      collection(db, "products"),
      where("shopId", "==", shopId),
      where("ownerUserId", "==", ownerUserId),
      where("isActive", "==", true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const p: Product[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Product));
      setProducts(p);
    });
    return () => unsub();
  }, [shopId, ownerUserId]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          setMsg({ text: `Not enough stock available for ${product.name}`, type: "error" });
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stockQuantity <= 0) {
        setMsg({ text: `Out of stock: ${product.name}`, type: "error" });
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setMsg(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          if (newQ > item.product.stockQuantity) {
             setMsg({ text: `Not enough stock available for ${item.product.name}`, type: "error" });
             return item;
          }
          return { ...item, quantity: Math.max(0, newQ) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.product.buyingPrice * item.quantity), 0);
  const grossProfit = total - totalCost;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "credit" && !selectedCustomerId) {
      setMsg({ text: "Please select a customer for credit sale.", type: "error" });
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      const saleId = `sale_${Date.now()}`;
      const saleRef = doc(db, "sales", saleId);
      
      batch.set(saleRef, {
        id: saleId,
        shopId,
        ownerUserId,
        customerId: paymentMethod === "credit" ? selectedCustomerId : null,
        saleDate: new Date().toISOString(),
        paymentMethod,
        subtotal: total,
        totalAmount: total,
        totalCost,
        grossProfit,
        saleType: paymentMethod === "credit" ? "credit_sale" : "normal_sale",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      for (const item of cart) {
        const saleItemId = `sitem_${Date.now()}_${Math.random()}`;
        const saleItemRef = doc(db, "sale_items", saleItemId);
        batch.set(saleItemRef, {
          id: saleItemId,
          shopId,
          ownerUserId,
          saleId,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitSellingPrice: item.product.sellingPrice,
          unitBuyingPrice: item.product.buyingPrice,
          lineTotal: item.product.sellingPrice * item.quantity,
          lineCost: item.product.buyingPrice * item.quantity,
          lineProfit: (item.product.sellingPrice - item.product.buyingPrice) * item.quantity,
          createdAt: serverTimestamp()
        });

        const prodRef = doc(db, "products", item.product.id);
        batch.update(prodRef, {
          stockQuantity: item.product.stockQuantity - item.quantity,
          updatedAt: serverTimestamp()
        });
      }

      if (paymentMethod === "credit") {
        const creditEntryId = `credit_${Date.now()}_${Math.random()}`;
        const creditRef = doc(db, "credit_entries", creditEntryId);
        batch.set(creditRef, {
          id: creditEntryId,
          shopId,
          ownerUserId,
          customerId: selectedCustomerId,
          amount: total,
          amountPaid: 0,
          balance: total,
          creditDate: new Date().toISOString().split("T")[0],
          description: `Credit Sale (POS)`,
          status: "unpaid",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const txId = `tx_${Date.now()}_${Math.random()}`;
        const txRef = doc(db, "transactions", txId);
        
        const cust = customers.find(c => c.id === selectedCustomerId);
        const prevOwed = cust ? cust.owed : 0;
        
        batch.set(txRef, {
          id: txId,
          shopId,
          ownerUserId,
          customerId: selectedCustomerId,
          type: "credit",
          amount: total,
          description: "Credit Sale (POS)",
          transactionDate: new Date().toISOString(),
          balanceAfterTransaction: prevOwed + total,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();

      setCart([]);
      setShowCheckout(false);
      setMsg({ text: "Sale completed successfully! 🎉", type: "success" });
    } catch (e: any) {
      console.error(e);
      setMsg({ text: "Failed to complete sale: " + e.message, type: "error" });
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FBF5EC] font-sans pb-32">
      
      {/* Redesigned Top Header */}
      <header className="px-5 pt-5 pb-4 bg-white border-b border-[#2B1114]/8 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black font-display text-text-main uppercase tracking-tight leading-none">
              Till & POS
            </h1>
            <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mt-1 leading-none">
              Checkout & Cash Register Screen
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#FFF0E7] text-[#D94F12] flex items-center justify-center font-display font-black text-xs">
            {cart.length}
          </div>
        </div>
      </header>
      
      {/* Toast and Alert Notification Message bars */}
      {msg && (
        <div className={`mx-5 mt-4 p-3.5 rounded-xl text-xs font-bold flex justify-between items-center ${msg.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold text-sm ml-2 outline-none">✕</button>
        </div>
      )}

      {/* Main Multi-Column Split area */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 p-5 min-h-0">
        
        {/* Proximity inventory product selector */}
        <div className="md:flex-1 w-full flex flex-col md:min-h-0 bg-white rounded-[24px] border border-[#2B1114]/8 overflow-hidden shadow-2xs pos-product-section">
          
          {/* Header search bar - 56px high, 18px rounded */}
          <div className="p-3.5 border-b border-text-main/5 bg-white shrink-0 font-sans">
            <div className="relative h-14 bg-[#FBF5EC] border border-text-main/10 rounded-[18px] flex items-center px-4">
              <Search className="text-text-muted w-5 h-5 shrink-0 mr-2.5" />
              <input 
                type="text" 
                placeholder="Search inventory, category, or barcode..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-text-main text-sm font-semibold placeholder:text-text-muted"
              />
            </div>
          </div>
 
          {/* Grid listing product catalog */}
          <div className="w-full md:flex-1 md:overflow-y-auto overflow-visible p-4.5 bg-background select-none">
            {products.length === 0 ? (
              <div className="text-center text-text-muted font-bold py-16 text-xs bg-white rounded-2xl border border-text-main/5">
                No active items found. Please setup products inside inventory.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-3.5 w-full pos-product-grid">
                {filteredProducts.map(p => {
                  const qtyLeft = p.stockQuantity;
                  const isLow = qtyLeft <= p.lowStockLevel;
                  const isOut = qtyLeft <= 0;
                  
                  return (
                    <button 
                      key={p.id} 
                      onClick={() => addToCart(p)}
                      disabled={isOut}
                      className={`flex flex-col text-left p-4.5 rounded-[20px] border bg-white relative transition-all active:scale-[0.98] min-w-0 w-full box-border h-[132px] justify-between pos-product-card ${
                        isOut 
                          ? "border-text-main/5 opacity-40 cursor-not-allowed" 
                          : "border-text-main/10 hover:border-[#D94F12] hover:shadow-xs"
                      }`}
                    >
                      <span className="font-extrabold text-text-main text-sm truncate uppercase tracking-tight leading-snug w-full block pos-product-name">
                        {p.name}
                      </span>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className={`text-[10px] font-mono leading-none truncate ${isOut ? "text-danger" : isLow ? "text-warning" : "text-text-light font-extrabold"}`}>
                          {isOut ? "Out of Stock" : `${qtyLeft} available`}
                        </span>
                      </div>
 
                      <div className="mt-auto pt-2 border-t border-text-main/5 flex justify-between items-baseline w-full">
                        <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Price</span>
                        <span className="font-black text-[#D94F12] text-sm font-display tracking-tight leading-none shrink-0">R {p.sellingPrice.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
 
        {/* Floating Cart checkout widget sidebar */}
        <div className="w-full md:w-80 flex flex-col h-[320px] md:h-full mt-5 md:mt-0 bg-white rounded-[24px] border border-[#2B1114]/8 overflow-hidden shrink-0 shadow-2xs">
          
          <div className="p-4 bg-[#2B1114] text-white flex items-center justify-between shrink-0">
            <h2 className="font-display font-black tracking-widest uppercase text-[10px]">Current Cart Queue</h2>
            <div className="bg-[#D94F12] text-white px-2.5 h-6 rounded-full text-xs font-black flex items-center justify-center">
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-3.5 bg-background">
            {cart.length === 0 ? (
              <div className="text-center text-text-muted font-bold py-16 text-xs bg-white rounded-2xl border border-text-main/5">
                Current cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="bg-white p-3.5 rounded-[18px] border border-text-main/5 shadow-2xs">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-text-main text-xs leading-snug uppercase tracking-tight max-w-[170px] truncate">{item.product.name}</span>
                      <span className="font-mono font-black text-[#D94F12] text-xs leading-none">
                        R {(item.product.sellingPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5 bg-[#FBF5EC] rounded-xl border border-text-main/5 px-2.5 py-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 active:scale-75 text-text-muted hover:text-text-main"><Minus className="w-3 h-3 stroke-[2.5]" /></button>
                        <span className="font-black text-xs text-text-main min-w-[12px] text-center font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 active:scale-75 text-[#D94F12] hover:text-[#C9460B]"><Plus className="w-3 h-3 stroke-[2.5]" /></button>
                      </div>
                      <span className="text-[10px] text-text-light font-bold">@ R{item.product.sellingPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total aggregate section */}
          <div className="p-4.5 border-t border-[#2B1114]/8 bg-white shrink-0">
            <div className="flex justify-between items-end mb-4">
              <span className="font-extrabold text-text-muted uppercase text-[9px] tracking-widest block mb-0.5">Total Sale</span>
              <span className="font-display font-black text-2xl text-text-main leading-none">R {total.toFixed(2)}</span>
            </div>
            
            <button 
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentMethod("cash");
                setSelectedCustomerId("");
                setShowCheckout(true);
              }}
              className="w-full h-[54px] bg-[#D94F12] text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-xs active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>Checkout Queue</span>
            </button>
          </div>

        </div>

      </div>

      {/* REDESIGNED PAYMENTS CHECKOUT DIALOG */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] rounded-[28px] max-w-[420px] w-full p-6 border border-[#2B1114]/8 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setShowCheckout(false)} 
              className="absolute right-4 top-4 hover:bg-[#F1EBE4] p-1.5 rounded-full text-text-main outline-none active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            
            <h2 className="text-base font-black font-display text-text-main uppercase tracking-tight mb-5 leading-none">Complete Sale</h2>
            
            <div className="text-center mb-6 bg-white border border-[#2B1114]/8 p-5 rounded-[22px] shadow-2xs">
              <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Gross Total Amount</span>
              <div className="text-3xl font-black text-[#D94F12] font-display mt-1.5 leading-none">R {total.toFixed(2)}</div>
            </div>

            <p className="font-black text-[10px] uppercase tracking-wider text-text-muted mb-3 pl-0.5">Select Payment Method</p>
            
            {/* Custom styled large payment buttons with precise borders */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center h-22 rounded-2xl border-2 transition-all ${
                  paymentMethod === "cash" 
                    ? "border-[#D94F12] bg-[#FFF0E7] text-[#D94F12] scale-102 shadow-2xs" 
                    : "border-text-main/10 bg-white text-text-light hover:bg-[#FBF5EC]"
                }`}
              >
                <Banknote className="w-5.5 h-5.5 mb-1.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Cash</span>
              </button>

              <button 
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center h-22 rounded-2xl border-2 transition-all ${
                  paymentMethod === "card" 
                    ? "border-[#D94F12] bg-[#FFF0E7] text-[#D94F12] scale-102 shadow-2xs" 
                    : "border-text-main/10 bg-white text-text-light hover:bg-[#FBF5EC]"
                }`}
              >
                <CreditCard className="w-5.5 h-5.5 mb-1.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Card/EFT</span>
              </button>

              <button 
                onClick={() => setPaymentMethod("credit")}
                className={`flex flex-col items-center justify-center h-22 rounded-2xl border-2 transition-all ${
                  paymentMethod === "credit" 
                    ? "border-[#D94F12] bg-[#FFF0E7] text-[#D94F12] scale-102 shadow-2xs" 
                    : "border-text-main/10 bg-white text-text-light hover:bg-[#FBF5EC]"
                }`}
              >
                <User className="w-5.5 h-5.5 mb-1.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-center leading-3">Customer<br/>Credit Tab</span>
              </button>

            </div>

            {/* Selector list for linked customer credit accounts */}
            {paymentMethod === "credit" && (
              <div className="mb-5 flex-1 min-h-0 overflow-hidden flex flex-col pr-1">
                <p className="font-black text-[10px] uppercase tracking-wider text-text-muted mb-2.5 pl-0.5">Select Debtor Account</p>
                <div className="border border-text-main/10 bg-white rounded-2xl overflow-y-auto max-h-[140px] divide-y divide-text-main/5 shadow-2xs">
                  {customers.map(c => {
                    const isSelected = selectedCustomerId === c.id;
                    const limitVal = c.limit || 2000;
                    const canAfford = Math.max(0, limitVal - c.owed) >= total;
                    const statusPaused = c.creditStatus === "paused";
                    
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          if (statusPaused) {
                            alert("This account's credit facility is paused by owner.");
                            return;
                          }
                          if (!canAfford) {
                            alert("Sale exceeds customer's remaining available credit limit.");
                            return;
                          }
                          setSelectedCustomerId(c!.id || "");
                        }}
                        className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-[#FFE9E8] font-black text-text-main" 
                            : statusPaused || !canAfford 
                              ? "opacity-40 bg-zinc-50 cursor-not-allowed" 
                              : "hover:bg-[#FBF5EC]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold uppercase tracking-tight">{c.name}</span>
                          <span className="text-[9px] text-text-muted font-mono uppercase">Limit: R{limitVal}</span>
                        </div>
                        <span className="text-xs font-mono font-black text-danger">Owes: R{c.owed.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  
                  {customers.length === 0 && (
                    <div className="p-4 text-center text-xs text-text-muted italic">
                      No active customer accounts registered.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Primary checkout button height 60, rounded-2xl (rounded-2xl is equivalent to rounded-[16px]) */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-4 w-full h-[60px] bg-burgundy hover:bg-[#2B1114] text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 disabled:opacity-40"
            >
              {isProcessing ? "Processing Sale..." : "Confirm Checkout"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
