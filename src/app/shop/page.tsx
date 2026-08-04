  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { lang } = useLangStore();
  const d = lang === "ar" ? arabicDict : englishDict;
  const isRtl = lang === "ar";

  useEffect(() => {
    async function fetchData() {
      const [fetchedProducts, fetchedPrices] = await Promise.all([
        getProducts(),
        getLiveGoldPrices()
      ]);
      setProducts(fetchedProducts);
      setPrices(fetchedPrices);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === "all") return matchesSearch;

    // Category mappings
    if (selectedCategory === "gold") return matchesSearch && product.karat >= 18 && (product.metalType === undefined || product.metalType === 'gold');
    if (selectedCategory === "silver") return matchesSearch && product.metalType === 'silver';
    if (selectedCategory === "rings") return matchesSearch && product.name.includes("خاتم");
    if (selectedCategory === "necklaces") return matchesSearch && product.name.includes("قلادة");
    if (selectedCategory === "bracelets") return matchesSearch && product.name.includes("سوار");

    return matchesSearch;
  });

  return (
    <>
      <Navbar />
      <main className={styles.main} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.header}>
          <h1 className={styles.title}>{d.shop}</h1>
          <p className={styles.subtitle}>{d.heroSubtitle.slice(0, 110)}...</p>
        </div>

        {/* Filter Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={d.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.categories}>
            <button
              className={`${styles.catBtn} ${selectedCategory === "all" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              {d.allCategories}
            </button>
            <button
              className={`${styles.catBtn} ${selectedCategory === "gold" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("gold")}
            >
              {d.goldJewelry}
            </button>
            <button
              className={`${styles.catBtn} ${selectedCategory === "silver" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("silver")}
            >
              {d.silverJewelry}
            </button>
            <button
              className={`${styles.catBtn} ${selectedCategory === "rings" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("rings")}
            >
              {d.rings}
            </button>
            <button
              className={`${styles.catBtn} ${selectedCategory === "necklaces" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("necklaces")}
            >
              {d.necklaces}
            </button>
            <button
              className={`${styles.catBtn} ${selectedCategory === "bracelets" ? styles.activeCat : ""}`}
              onClick={() => setSelectedCategory("bracelets")}
            >
              {d.bracelets}
            </button>
          </div>
        </div>

