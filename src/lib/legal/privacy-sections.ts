export type PrivacySection = {
  id: string;
  /** Sidebar / mini TOC */
  tocLabel: string;
  title: string;
  lead?: string;
  paragraphs: string[];
  bullets?: string[];
};

/** Production-oriented policy structure; copy reviewed for SaaS / GDPR-style clarity (TR). */
export const PRIVACY_LAST_UPDATED_ISO = "2026-05-11";

export const privacySections: PrivacySection[] = [
  {
    id: "overview",
    tocLabel: "Genel",
    title: "Nexora AI nedir ve bu politika neyi kapsar?",
    lead:
      "Nexora AI (“Nexora”, “biz”), içerik üretimi, planlama ve yayın otomasyonu için tasarlanmış bir yapay zekâ destekli sosyal operasyon platformudur.",
    paragraphs: [
      "Bu Gizlilik Politikası; web uygulamamız, pano (dashboard) deneyimi, kimlik doğrulama, üçüncü taraf OAuth ile hesap bağlantıları ve ilgili API’ler aracılığıyla işlediğimiz kişisel verileri açıklar.",
      "Hizmeti kullanarak, verilerin bu politikada tarif edilen amaçlar ve hukuki dayanaklar çerçevesinde işlenmesine onay vermiş olursunuz. Politika değişirse, önemli güncellemeleri uygulama içi bildirim veya e-posta ile duyurmaya çalışırız; sayfanın altındaki “Son güncelleme” tarihini kontrol edin.",
    ],
  },
  {
    id: "data-we-collect",
    tocLabel: "Toplanan veriler",
    title: "Hangi verileri topluyoruz?",
    paragraphs: [
      "Topladığımız veri kategorileri, kullandığınız özelliklere göre değişir. Temel olarak şunları işleyebiliriz:",
    ],
    bullets: [
      "Hesap ve kimlik: e-posta, oturum bilgileri, profil/tercih alanları (ör. persona, hedef niş, ürün tanımı metinleri).",
      "Operasyonel içerik: sizin girdiğiniz metinler, yüklediğiniz veya oluşturduğunuz görseller, planlı yayın başlıkları ve özetleri.",
      "AI üretim kayıtları: model çıktıları (caption, hashtag, hook, senaryo vb.), üretim parametreleri ve zaman damgaları.",
      "Yayın ve entegrasyon meta verisi: bağlı kanalların platform türü, kanal adı/kimliği, kuyruk durumu, yayın zamanı ve hata durumları (kimlik doğrulama sırları hariç, bkz. güvenlik).",
      "Teknik ve güvenlik günlükleri: IP adresi, tarayıcı/istemci türü, hata ve performans günlükleri (kötüye kullanımı önlemek ve hizmeti stabilize etmek için).",
    ],
  },
  {
    id: "social-connections",
    tocLabel: "Sosyal bağlantı",
    title: "Sosyal medya hesap bağlantıları",
    paragraphs: [
      "Nexora, Instagram ve TikTok gibi platformlarda içerik yayınlamanızı kolaylaştırmak için hesaplarınızı güvenli bağlantı akışlarıyla ilişkilendirebilir.",
      "Bağlantı sırasında, ilgili platformun veya yetkili iş ortağının (ör. OAuth sağlayıcısı) size gösterdiği izin kapsamı geçerlidir. Nexora, yalnızca hizmeti sunmak için gerekli olan bağlantı ve kanal meta verisini işler; platform şifrelerinizi sistemimizde saklamayı hedeflemeyiz.",
    ],
  },
  {
    id: "oauth",
    tocLabel: "OAuth",
    title: "OAuth ve yetkilendirme",
    paragraphs: [
      "Hesap bağlama için endüstri standardı OAuth 2.0 benzeri akışlar kullanılabilir. Yetkilendirme URL’si üzerinden verilen kodlar, sunucu tarafında güvenli şekilde işlenir ve erişim belirteçleri (access token) uygulama gizlilik modeline uygun olarak korunur.",
      "OAuth “state” parametresi ve çerez tabanlı doğrulama ile CSRF riskleri azaltılır. Yetkilendirme ekranı üçüncü taraf sağlayıcıda açılabilir; Nexora arayüzü markanızla tutarlı kalırken, hukuki bilgilendirme için sağlayıcının kendi koşulları da geçerli olabilir.",
    ],
  },
  {
    id: "ai-generation",
    tocLabel: "AI üretim",
    title: "Yapay zekâ ile içerik üretimi",
    paragraphs: [
      "Creative Engine ve benzeri özellikler, girdiğiniz bağlamı (hedef, ürün, ton, kanal) kullanarak metin ve yaratıcı paketler üretir. Bu işlem, sözleşmesel veri işleyen (processor) rolündeki model sağlayıcılarına teknik olarak iletilen istemler (prompt) ve çıktılar içerebilir.",
      "Otomatik çıktılar her zaman hata veya uygunsuz içerik riski taşır. İnsan onayı, marka uyumu ve yasal uyumluluk sorumluluğu nihai olarak sizdedir; Nexora çıktıları “nihai yayın kararı” olarak sunulmamalıdır.",
    ],
  },
  {
    id: "analytics",
    tocLabel: "Analitik",
    title: "Analitik ve etkileşim verileri",
    paragraphs: [
      "Ürün içi panolarda gösterilen metrikler (ör. büyüme skorları, etkileşim oranı etiketleri, takipçi serileri), bağladığınız veri kaynaklarından ve/veya manuel/örnek veri katmanlarından türetilebilir.",
      "Geliştirme ve güvenilirlik için anonimleştirilmiş veya toplulaştırılmış kullanım istatistikleri işlenebilir. Pazarlama çerezleri kullanıyorsak, ayrı bir çerez bildirimi ve tercih yönetimi sunulacaktır (şu anki sürümde yalnızca zorunlu oturum çerezleri önceliklidir).",
    ],
  },
  {
    id: "user-content",
    tocLabel: "İçerikleriniz",
    title: "Kullanıcı içerikleri",
    paragraphs: [
      "Yüklediğiniz veya oluşturduğunuz içerikler size aittir; Nexora’ya, içeriği barındırmak, işlemek, yedeklemek ve size hizmeti sunmak için sınırlı bir lisans vermiş olursunuz.",
      "İçeriğinizi model eğitimi için kullanmayız — bunu ayrıca açık bir programa dahil eder ve açık rıza veya sözleşme ile genişletiriz.",
    ],
  },
  {
    id: "ai-assets",
    tocLabel: "AI varlıkları",
    title: "AI ile üretilen varlıklar (görseller ve medya)",
    paragraphs: [
      "Görsel veya kısa video üretimi yapıldığında, çıktılar depolama alanında (ör. nesne depolama) tutulabilir ve panoda önizleme URL’leri ile sunulur. Bu URL’ler genellikle süreli imzalı (signed) bağlantılardır.",
      "Üçüncü taraf model sağlayıcılarının kullanım politikaları, üretilen varlıkların ticari kullanımına ilişkin ek kısıtlar getirebilir; yayın öncesi ilgili şartları kontrol etmenizi öneririz.",
    ],
  },
  {
    id: "security",
    tocLabel: "Güvenlik",
    title: "Güvenlik yaklaşımı",
    paragraphs: [
      "Veri aktarımında TLS, depoda şifreleme ve erişimde rol tabanlı kontroller hedeflenir. API anahtarları ve OAuth sırları yalnızca sunucu tarafında tutulur; istemci bundle’ına gömülmez.",
      "Hiçbir sistem %100 risk içermez. Olası ihlal durumunda yürürlükteki yasal sürelere uygun bildirim prosedürleri işletilir.",
    ],
  },
  {
    id: "subprocessors",
    tocLabel: "Üçüncü taraflar",
    title: "Üçüncü taraf hizmetler (alt işleyenler)",
    paragraphs: [
      "Hizmeti sunmak için güvenilir bulut ve SaaS sağlayıcılarından yararlanırız. Örnek kategoriler:",
    ],
    bullets: [
      "Kimlik ve veritabanı: Supabase (kimlik doğrulama, Postgres, depolama).",
      "Yapay zekâ: OpenAI veya yapılandırdığınız diğer model sağlayıcıları (istem/çıktı işleme).",
      "Yayın köprüsü: sosyal kanal bağlantısı ve kuyruk için yetkili iş ortağı altyapısı (ör. Buffer benzeri bir yayıncı API’si) — kullanıcı arayüzünde marka gizlenmiş olsa da hukuki açıdan veri işleyen sıfatıyla açıklanır.",
      "Barındırma ve CDN: dağıtım mimarinize göre Vercel veya eşdeğeri.",
    ],
  },
  {
    id: "retention",
    tocLabel: "Saklama",
    title: "Veri saklama",
    paragraphs: [
      "Hesabınız aktif olduğu sürece, hizmeti sunmak için gerekli verileri saklarız. Yasal yükümlülükler (muhasebe, uyuşmazlık) için daha uzun süreler sınırlı veri alt kümeleri tutulabilir.",
      "Silme talebiniz işlendiğinde, yedekler üzerindeki teknik gecikmeler hariç makul sürede silme veya anonimleştirme hedeflenir. Günlüklerde kısa süreli kalıntılar oluşabilir.",
    ],
  },
  {
    id: "rights",
    tocLabel: "Haklarınız",
    title: "Haklarınız (KVKK / GDPR uyumlu çerçeve)",
    paragraphs: [
      "Yürürlükteki veri koruma kanunlarına tabi olarak; erişim, düzeltme, silme, işlemenin kısıtlanması, itiraz ve — GDPR kapsamındaysanız — taşınabilirlik gibi taleplerde bulunabilirsiniz.",
      "Taleplerinizi kimliğinizi doğruladıktan sonra makul sürede yanıtlarız. Bazı talepler teknik olarak veya yasal istisnalar nedeniyle kısmen reddedilebilir; gerekçe bildirilir.",
    ],
  },
  {
    id: "account-deletion",
    tocLabel: "Hesap silme",
    title: "Hesabı kapatma ve veri silme",
    paragraphs: [
      "Hesabınızı uygulama içi ayarlar veya destek kanalı üzerinden kapatma talebinde bulunabilirsiniz. Kimlik doğrulama sonrası, kişisel verilerinizin silinmesi veya anonimleştirilmesi için bir süreç başlatılır.",
      "Yayınlanmış üçüncü taraf platform içerikleri üzerinde Nexora’nın doğrudan silme yetkisi olmayabilir; bu içerikleri ilgili platformdan yönetmeniz gerekebilir.",
    ],
  },
  {
    id: "contact",
    tocLabel: "İletişim",
    title: "İletişim",
    paragraphs: [
      "Gizlilik ile ilgili sorularınız, talepleriniz veya veri koruma başvurularınız için Veri Sorumlusuna aşağıdaki kanaldan ulaşabilirsiniz. Lütfen talebinize konu satırında “Gizlilik / Privacy” ibaresini ekleyin.",
    ],
    bullets: ["E-posta: privacy@nexora.ai"],
  },
];
