import { supabase, isAdmin } from "@/lib/supabase";
import { useUIStore } from "@/lib/uiStore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { items } = useCartStore();
  const { openCart, openMenu } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
    getLiveGoldPrices().then(setPrices);
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsAdminUser(isAdmin(session?.user?.email));
      });
      const { data: l } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
        setIsAdminUser(isAdmin(session?.user?.email));
      });
      return () => l.subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <div className={styles.navbarContainer}>
      {/* Gold Price Ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerContent}>
          <div className={styles.tickerItem}>
            <TrendingUp size={12} color="var(--gold-primary)" />
            <span>سعر الذهب اليوم</span>
          </div>
          {prices ? (
            <>
              <div className={styles.tickerItem}><span>عيار 24:</span><span className={styles.tickerPrice}>{formatCurrency(prices.usdPerGram24k, 'USD')}/غ</span></div>
              <div className={styles.tickerItem}><span>عيار 21:</span><span className={styles.tickerPrice}>{formatCurrency(prices.usdPerGram21k, 'USD')}/غ</span></div>
            </>
          ) : <span className={styles.tickerPrice}>جاري التحميل...</span>}
        </div>
      </div>

      {/* Main Nav */}
