import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Product, Customer } from '../../types';
import { ShoppingCart, Search, Plus, Minus, X, CreditCard, Banknote, User } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
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
  }, [shopId]);

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
    // Auto-clear error on successful add
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

        // Reduce stock
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

        // Also create an explicit transaction for history
        const txId = `tx_${Date.now()}_${Math.random()}`;
        const txRef = doc(db, "transactions", txId);
        
        // Find existing owed amount from props or fetch. We only have customers prop.
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
      setMsg({ text: "Sale completed successfully!", type: "success" });
    } catch (e: any) {
      console.error(e);
      setMsg({ text: "Failed to complete sale: " + e.message, type: "error" });
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0">
        <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Till & POS</h1>
      </header>
      
      {msg && (
        <div className={`mx-6 mt-4 p-3 rounded-lg text-sm font-bold ${msg.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="float-right font-black">X</button>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4 md:p-6">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] shadow-sm border border-[#E8D0BB] overflow-hidden">
          <div className="p-4 border-b border-[#E8D0BB]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search products or barcode..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl border-none outline-none font-bold text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {products.length === 0 ? (
              <div className="text-center text-gray-500 font-bold py-10">No active products found. Add them in Stock.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className="flex flex-col text-left p-3 rounded-xl border border-[#E8D0BB] hover:border-[#C8521A] hover:bg-[#F5EDE0]/30 transition-colors active:scale-95"
                  >
                    <span className="font-bold text-[#3B1A1A] text-sm truncate">{p.name}</span>
                    <span className="font-mono text-xs text-gray-500 mb-1">{p.stockQuantity} in stock</span>
                    <span className="font-display font-black text-[#C8521A] mt-auto">R {p.sellingPrice.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full md:w-80 flex flex-col min-h-[300px] bg-white rounded-[2rem] shadow-sm border border-[#E8D0BB] overflow-hidden shrink-0">
          <div className="p-4 bg-[#3B1A1A] text-white flex items-center justify-between">
            <h2 className="font-display font-black tracking-widest uppercase text-xs">Current Cart</h2>
            <div className="bg-[#C8521A] px-2 py-0.5 rounded-full text-xs font-bold">{cart.length}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 font-bold py-10 text-sm">Cart is empty</div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex flex-col p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-[#3B1A1A] text-sm leading-tight">{item.product.name}</span>
                      <span className="font-mono font-bold text-[#C8521A] text-sm whitespace-nowrap ml-2">
                        R {(item.product.sellingPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 active:scale-75 text-gray-500"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 active:scale-75 text-[#C8521A]"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-[10px] text-gray-400">@ R{item.product.sellingPrice.toFixed(2)}/ea</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[#E8D0BB] bg-gray-50">
            <div className="flex justify-between items-end mb-4">
              <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Total</span>
              <span className="font-display font-black text-2xl text-[#3B1A1A]">R {total.toFixed(2)}</span>
            </div>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="w-full h-12 bg-[#C8521A] text-white rounded-xl font-display font-bold uppercase tracking-wider shadow active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-[400px] w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowCheckout(false)} className="absolute right-4 top-4 hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            <h2 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tight mb-6">Complete Sale</h2>
            
            <div className="text-center mb-6">
              <div className="font-mono text-gray-500 text-xs mb-1">Total Amount</div>
              <div className="text-4xl font-black font-display text-[#C8521A]">R {total.toFixed(2)}</div>
            </div>

            <p className="font-bold text-xs uppercase tracking-widest text-[#3B1A1A] mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center h-20 rounded-xl border-2 transition-all ${paymentMethod === "cash" ? "border-[#C8521A] bg-[#C8521A]/10 text-[#C8521A]" : "border-[#E8D0BB] text-gray-500 hover:bg-gray-50"}`}
              >
                <Banknote className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Cash</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center h-20 rounded-xl border-2 transition-all ${paymentMethod === "card" ? "border-[#C8521A] bg-[#C8521A]/10 text-[#C8521A]" : "border-[#E8D0BB] text-gray-500 hover:bg-gray-50"}`}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Card/EFT</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("credit")}
                className={`flex flex-col items-center justify-center h-20 rounded-xl border-2 transition-all ${paymentMethod === "credit" ? "border-[#C8521A] bg-[#C8521A]/10 text-[#C8521A]" : "border-[#E8D0BB] text-gray-500 hover:bg-gray-50"}`}
              >
                <User className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Customer Tab</span>
              </button>
            </div>

            {paymentMethod === "credit" && (
              <div className="mb-6 flex-1 overflow-auto">
                <p className="font-bold text-xs uppercase tracking-widest text-[#3B1A1A] mb-2">Select Customer</p>
                <div className="border border-[#E8D0BB] rounded-xl overflow-y-auto max-h-[150px]">
                  {customers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`p-3 border-b border-[#E8D0BB] last:border-0 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${selectedCustomerId === c.id ? "bg-[#F5EDE0] font-black" : "font-medium"}`}
                    >
                      <span className="text-sm">{c.name}</span>
                      <span className="text-xs font-mono text-[#C8521A]">Owes: R{c.owed}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-auto w-full h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black text-sm uppercase tracking-wider shadow active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
