import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css"; // ensure this file exists (see file #3)

function PriceVistaApp() {
  const [activePage, setActivePage] = useState("search");
  const [searchText, setSearchText] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);

  const sampleProducts = [
    {
      id: "prod-aurora-tee",
      title: "Aurora Minimal Tee",
      offers: [
        { marketplace: "Amazon", price: 199, url: "#" },
        { marketplace: "Flipkart", price: 205, url: "#" },
        { marketplace: "Meesho", price: 215, url: "#" }
      ],
      rating: 4.2
    },
    {
      id: "prod-dreemasons-shirt",
      title: "Dreemasons Classic Shirt",
      offers: [
        { marketplace: "Amazon", price: 300, url: "#" },
        { marketplace: "Meesho", price: 295, url: "#" }
      ],
      rating: 4.6
    },
    {
      id: "prod-nebula-hoodie",
      title: "Nebula Hoodie",
      offers: [
        { marketplace: "Flipkart", price: 899, url: "#" },
        { marketplace: "Amazon", price: 850, url: "#" }
      ],
      rating: 4.8
    }
  ];

  const [trackedItems, setTrackedItems] = useState(() => [
    {
      id: "prod-dreemasons-shirt",
      title: "Dreemasons Classic Shirt",
      currentPrice: 295,
      initialPrice: 320,
      notificationsEnabled: true,
      priceHistory: [320, 310, 305, 300, 295]
    }
  ]);

  const [productList] = useState(sampleProducts);

  const visibleProducts = productList.filter((p) => {
    const q = searchText.trim().toLowerCase();
    if (q && !p.title.toLowerCase().includes(q)) return false;

    const lowestOffer = Math.min(...p.offers.map((o) => o.price));
    if (lowestOffer < priceMin || lowestOffer > priceMax) return false;

    if (platformFilter !== "all") {
      const hasPlatform = p.offers.some((o) => o.marketplace === platformFilter);
      if (!hasPlatform) return false;
    }

    return true;
  });

  function addToTracker(product) {
    if (trackedItems.some((ti) => ti.id === product.id)) return;

    const cheapestOffer = product.offers.reduce((a, b) => (a.price < b.price ? a : b));

    const newTrackedItem = {
      id: product.id,
      title: product.title,
      currentPrice: cheapestOffer.price,
      initialPrice: Math.round(cheapestOffer.price * 1.08),
      notificationsEnabled: false,
      priceHistory: generateInitialHistory(cheapestOffer.price)
    };

    setTrackedItems((prev) => [newTrackedItem, ...prev]);
    setActivePage("tracker");
  }

  function removeFromTracker(itemId) {
    setTrackedItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function toggleItemNotifications(itemId) {
    setTrackedItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, notificationsEnabled: !it.notificationsEnabled } : it)));
  }

  function generateInitialHistory(base) {
    return Array.from({ length: 8 }, (_, i) => Math.max(1, Math.round(base * (1.15 - i * 0.02))));
  }

  function simulatePriceUpdate() {
    setTrackedItems((prevList) =>
      prevList.map((item) => {
        const lastPrice = item.priceHistory[item.priceHistory.length - 1] || item.currentPrice;
        const variation = Math.round((Math.random() - 0.45) * 18);
        const nextPrice = Math.max(1, lastPrice + variation);
        const newHistory = [...item.priceHistory.slice(-11), nextPrice];
        return { ...item, priceHistory: newHistory, currentPrice: nextPrice };
      })
    );
  }

  useEffect(() => {
    const timer = setInterval(simulatePriceUpdate, 12_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto bg-white/85 backdrop-blur rounded-2xl shadow-xl overflow-hidden border">
        <AppHeader activePage={activePage} onNavigate={setActivePage} trackedCount={trackedItems.length} />

        <main className="p-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            {activePage === "search" ? (
              <SearchControls
                searchText={searchText}
                onSearchTextChange={setSearchText}
                platformFilter={platformFilter}
                onPlatformFilterChange={setPlatformFilter}
                priceMin={priceMin}
                onPriceMinChange={setPriceMin}
                priceMax={priceMax}
                onPriceMaxChange={setPriceMax}
                resultsCount={visibleProducts.length}
              />
            ) : (
              <TrackerIntro />
            )}
          </div>

          {activePage === "search" ? (
            <section className="md:col-span-2 grid gap-4">
              <div className="flex flex-wrap gap-4">
                {visibleProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} onTrack={() => addToTracker(prod)} />
                ))}

                {visibleProducts.length === 0 && (
                  <div className="p-6 rounded-lg border-dashed border-2 border-slate-200 text-slate-600">
                    No products match your filters. Try changing the search or price range.
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="md:col-span-2 grid gap-4">
              {trackedItems.map((tracked) => (
                <TrackedItemRow
                  key={tracked.id}
                  trackedItem={tracked}
                  onUntrack={() => removeFromTracker(tracked.id)}
                  onToggleNotify={() => toggleItemNotifications(tracked.id)}
                />
              ))}

              {trackedItems.length === 0 && (
                <div className="p-6 rounded-lg border-dashed border-2 border-slate-200 text-slate-600">
                  You're not tracking any products. Go to the Search tab and click "Track" on a product.
                </div>
              )}
            </section>
          )}

          <footer className="md:col-span-2 p-4 text-center text-sm text-slate-500 border-t">
            PriceVista • Demo UI — replace sample data with real APIs for production.
          </footer>
        </main>
      </div>
    </div>
  );
}

function AppHeader({ activePage, onNavigate, trackedCount }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-rose-500 text-white">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 6h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 18h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-lg">PriceVista</div>
          <div className="text-xs opacity-80">Smart Product Price Analyzer</div>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("search")}
          className={`px-3 py-2 rounded-md text-sm font-medium ${activePage === "search" ? "bg-white/20" : "hover:bg-white/10"}`}>
          Search
        </button>
        <button
          onClick={() => onNavigate("tracker")}
          className={`px-3 py-2 rounded-md text-sm font-medium ${activePage === "tracker" ? "bg-white/20" : "hover:bg-white/10"}`}>
          Tracker <span className="ml-2 inline-block bg-white/20 px-2 rounded-full text-xs">{trackedCount}</span>
        </button>
        <div className="w-px h-6 bg-white/30" />
        <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">Dashboard</button>
        <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">Logout</button>
      </nav>
    </header>
  );
}

function SearchControls({ searchText, onSearchTextChange, platformFilter, onPlatformFilterChange, priceMin, onPriceMinChange, priceMax, onPriceMaxChange, resultsCount }) {
  return (
    <div className="bg-gradient-to-r from-white to-slate-50 p-4 rounded-xl border shadow-sm">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            placeholder="Search products e.g. 't-shirt', 'hoodie'..."
            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <select value={platformFilter} onChange={(e) => onPlatformFilterChange(e.target.value)} className="p-2 rounded-md border">
            <option value="all">All Platforms</option>
            <option value="Amazon">Amazon</option>
            <option value="Flipkart">Flipkart</option>
            <option value="Meesho">Meesho</option>
          </select>

          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white">Search</button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label className="text-slate-600">Price</label>
          <input type="number" value={priceMin} onChange={(e) => onPriceMinChange(Number(e.target.value))} className="w-20 p-1 rounded border" />
          <span>-</span>
          <input type="number" value={priceMax} onChange={(e) => onPriceMaxChange(Number(e.target.value))} className="w-24 p-1 rounded border" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-600">Rating</label>
          <select className="p-1 rounded border">
            <option>Any</option>
            <option>4+</option>
            <option>4.5+</option>
          </select>
        </div>

        <div className="ml-auto text-slate-600">Results: <strong>{resultsCount}</strong></div>
      </div>
    </div>
  );
}

function ProductCard({ product, onTrack }) {
  const cheapestOffer = product.offers.reduce((a, b) => (a.price < b.price ? a : b));

  return (
    <div className="flex items-center justify-between w-full gap-4 p-4 rounded-xl border shadow-sm hover:scale-[1.01] transition-transform bg-white">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-pink-50 to-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600">{product.title.split(" ")[0].slice(0,2)}</div>
        <div>
          <div className="font-semibold">{product.title}</div>
          <div className="text-xs text-slate-500">Rating: {product.rating} • {product.offers.length} listings</div>
          <div className="mt-2 flex gap-3">
            {product.offers.map((offer) => (
              <div key={offer.marketplace} className={`px-2 py-1 rounded ${offer.price === cheapestOffer.price ? "bg-amber-100" : "bg-slate-50"} border`}>{offer.marketplace}: <strong>₹{offer.price}</strong></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="text-sm text-slate-600">Best: <span className="font-bold">₹{cheapestOffer.price}</span></div>
        <button onClick={onTrack} className="px-4 py-2 rounded-md bg-rose-500 text-white">Track</button>
        
      </div>
    </div>
  );
}

function TrackerIntro() {
  return (
    <div className="p-4 rounded-xl border bg-gradient-to-r from-rose-50 to-indigo-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Tracked Products</div>
          <div className="text-xs text-slate-600">Monitor price history and enable notifications for instant alerts.</div>
        </div>

        <div className="text-sm">
          <span className="text-slate-500">Global Notifications:</span>
          <SmallToggle defaultOn={true} />
        </div>
      </div>
    </div>
  );
}

function SmallToggle({ defaultOn = true }) {
  const [isOn, setIsOn] = useState(defaultOn);
  return (
    <button onClick={() => setIsOn((v) => !v)} className={`ml-3 inline-flex items-center p-1 rounded-full ${isOn ? "bg-indigo-600" : "bg-slate-300"}`}>
      <span className={`w-4 h-4 bg-white rounded-full shadow transform ${isOn ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function TrackedItemRow({ trackedItem, onUntrack, onToggleNotify }) {
  const percentChange = Math.round(((trackedItem.currentPrice - trackedItem.initialPrice) / trackedItem.initialPrice) * 100);
  const isIncrease = percentChange > 0;

  return (
    <div className="p-4 rounded-xl border bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-50 to-rose-50 flex items-center justify-center text-xl font-bold text-rose-600">{trackedItem.title.split(" ")[0].slice(0,2)}</div>
        <div>
          <div className="font-semibold">{trackedItem.title}</div>
          <div className="text-xs text-slate-500">Current: <strong>₹{trackedItem.currentPrice}</strong> • Initial: ₹{trackedItem.initialPrice}</div>
          <div className={`mt-1 text-sm ${isIncrease ? "text-rose-600" : "text-green-600"}`}>{isIncrease ? `+${percentChange}%` : `${percentChange}%`}</div>
        </div>
      </div>

      <div className="flex-1">
        <SmallPriceSparkline values={trackedItem.priceHistory} />
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onToggleNotify} className={`px-3 py-1 rounded-md text-sm ${trackedItem.notificationsEnabled ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
            {trackedItem.notificationsEnabled ? "Notifications ON" : "Turn ON"}
          </button>
          <button onClick={onUntrack} className="px-3 py-1 rounded-md text-sm bg-slate-100">Untrack</button>
        </div>
        <div className="text-xs text-slate-400">Last checked moments ago</div>
      </div>
    </div>
  );
}

function SmallPriceSparkline({ values = [] }) {
  const width = 240;
  const height = 60;
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, maxVal);

  const svgPoints = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * width;
    const y = height - ((v - minVal) / Math.max(1, maxVal - minVal)) * height;
    return `${x},${y}`;
  });

  const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={width} height={height} className="rounded-md bg-slate-50 p-1 border">
        <polyline fill="none" stroke="#6366F1" strokeWidth="2" points={svgPoints.join(" ")} />
        {values.map((v, i) => {
          const x = (i / Math.max(1, values.length - 1)) * width;
          const y = height - ((v - minVal) / Math.max(1, maxVal - minVal)) * height;
          return <circle key={i} cx={x} cy={y} r={2.5} fill="#6366F1" />;
        })}
      </svg>
      <div className="text-xs text-slate-600">Avg: <strong>₹{average}</strong></div>
    </div>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<PriceVistaApp />);
