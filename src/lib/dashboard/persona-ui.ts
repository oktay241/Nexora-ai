import type { UserPersona } from "@/lib/onboarding/persona";

export type DashboardPersonaUi = {
  introSubtitle: string;
  chartTitle: string;
  metricHintGrowth: string;
  metricHintViral: string;
  metricHintEngagement: string;
  aiScoresTitle: string;
  impressionsCardLabel: string;
  impressionsCardSub: string;
  activityFeedTitle: string;
  activitySubtitle: string;
  activityGenTitle: string;
  insightsPanelTitle: string;
  insightsSubtitle: string;
  contentPerfTitle: string;
  contentPerfSubtitle: string;
};

export function getDashboardPersonaUi(persona: UserPersona): DashboardPersonaUi {
  switch (persona) {
    case "ecommerce":
      return {
        introSubtitle:
          "Ürün creative, UGC ve dönüşüm odaklı özet. Discovery, strateji ve otomatik yayın kuyruğu.",
        chartTitle: "Dönüşüm & erişim trendi (7 gün)",
        metricHintGrowth: "Satış + creative performansı",
        metricHintViral: "Reklam / hook taşıma gücü",
        metricHintEngagement: "Sepet / DM / kaydetme sinyali",
        aiScoresTitle: "Creative & büyüme",
        impressionsCardLabel: "Gösterim (özet)",
        impressionsCardSub: "Kampanya ve içerik görünürlüğü",
        activityFeedTitle: "Creative & yayın akışı",
        activitySubtitle: "Ürün creative ve planlı yayınlar",
        activityGenTitle: "AI Creative Engine — ürün paketi",
        insightsPanelTitle: "AI Creative Engine",
        insightsSubtitle: "Reklam ve satış odaklı öneriler",
        contentPerfTitle: "Öne çıkan creative fikirleri",
        contentPerfSubtitle: "UGC, reklam görseli ve satış hook’ları",
      };
    case "personal_brand":
      return {
        introSubtitle:
          "Otorite, güven ve topluluk sinyalleri. AI Creative Engine içgörüleri ve planlı yayınlar.",
        chartTitle: "Görünürlük trendi (7 gün)",
        metricHintGrowth: "Kişisel marka ivmesi",
        metricHintViral: "Düşünce liderliği taşıması",
        metricHintEngagement: "DM ve kaydetme odaklı",
        aiScoresTitle: "Marka & etki",
        impressionsCardLabel: "Gösterim (özet)",
        impressionsCardSub: "Profesyonel görünürlük",
        activityFeedTitle: "İçerik & yayın akışı",
        activitySubtitle: "İçerik ve yayın akışı",
        activityGenTitle: "AI Creative Engine — kişisel marka",
        insightsPanelTitle: "AI Creative Engine",
        insightsSubtitle: "Ton ve kitleye göre özet",
        contentPerfTitle: "İçerik hatları",
        contentPerfSubtitle: "Konsept ve seri fikirleri",
      };
    case "business":
      return {
        introSubtitle:
          "Yerel ve kampanya odaklı özet. Marka içerikleri ve AI Creative Engine önerileri.",
        chartTitle: "Yerel görünürlük (7 gün)",
        metricHintGrowth: "Kampanya + teklif sinyali",
        metricHintViral: "Yerel keşif uyumu",
        metricHintEngagement: "Arama / yorum / yönlendirme",
        aiScoresTitle: "İşletme skorları",
        impressionsCardLabel: "Gösterim (özet)",
        impressionsCardSub: "Bölgesel erişim",
        activityFeedTitle: "Kampanya aktivitesi",
        activitySubtitle: "Kampanya ve yayın planı",
        activityGenTitle: "AI Creative Engine — işletme",
        insightsPanelTitle: "AI Creative Engine",
        insightsSubtitle: "Kampanya ve yerel büyüme",
        contentPerfTitle: "Kampanya içerikleri",
        contentPerfSubtitle: "Marka ve yerel teklif fikirleri",
      };
    case "creator":
    default:
      return {
        introSubtitle:
          "Viral fikirler, hook’lar ve Reels odaklı özet. AI Discovery + Growth Strategy ve planlı operasyon kuyruğu.",
        chartTitle: "Erişim trendi (7 gün)",
        metricHintGrowth: "Viralite + içerik ritmi",
        metricHintViral: "Hook + trend uyumu",
        metricHintEngagement: "Yorum / paylaşım sinyali",
        aiScoresTitle: "AI skorları",
        impressionsCardLabel: "Gösterim (özet)",
        impressionsCardSub: "Keşfet ve profil görünürlüğü",
        activityFeedTitle: "Üretim & trend akışı",
        activitySubtitle: "Üretim, yayın ve optimizasyon",
        activityGenTitle: "AI Creative Engine — creator paketi",
        insightsPanelTitle: "AI Creative Engine",
        insightsSubtitle: "Son üretimden strateji özeti",
        contentPerfTitle: "Viral & Reels fikirleri",
        contentPerfSubtitle: "Hook ve seri içerik hatları",
      };
  }
}

export type InsightStub = {
  id: string;
  title: string;
  impact: "Yüksek" | "Orta" | "Düşük";
  summary: string;
};

export function getEmptyInsightSkeleton(persona: UserPersona): InsightStub[] {
  if (persona === "ecommerce") {
    return [
      {
        id: "s1",
        title: "Product creatives",
        impact: "Yüksek",
        summary:
          "İlk AI Creative Engine paketinizi üretin; UGC ve reklam görseli fikirleri burada görünecek.",
      },
      {
        id: "s2",
        title: "Dönüşüm analizi",
        impact: "Orta",
        summary: "Sosyal API bağlandığında sepet ve tıklama hunisi bu panele düşecek.",
      },
      {
        id: "s3",
        title: "Satış odaklı içerik",
        impact: "Orta",
        summary: "Hook ve kısa reklam senaryoları üretimden sonra önceliklendirilecek.",
      },
    ];
  }
  if (persona === "business") {
    return [
      {
        id: "s1",
        title: "Kampanya fikirleri",
        impact: "Yüksek",
        summary: "Yerel büyüme ve kampanya hatları AI çıktılarıyla dolar.",
      },
      {
        id: "s2",
        title: "Marka içerikleri",
        impact: "Orta",
        summary: "Kurumsal ton ve teklif içerikleri burada özetlenecek.",
      },
      {
        id: "s3",
        title: "Yerel görünürlük",
        impact: "Orta",
        summary: "Bölge ve sezon bazlı öneriler bağlandığında aktifleşir.",
      },
    ];
  }
  if (persona === "personal_brand") {
    return [
      {
        id: "s1",
        title: "Otorite içeriği",
        impact: "Yüksek",
        summary: "Uzmanlık alanınıza göre içerik hatları üretim sonrası burada listelenir.",
      },
      {
        id: "s2",
        title: "Topluluk sinyali",
        impact: "Orta",
        summary: "DM ve kaydetme odaklı özetler yakında.",
      },
      {
        id: "s3",
        title: "İçerik tonu",
        impact: "Orta",
        summary: "Seçtiğiniz tonla uyumlu öneriler AI motorundan gelir.",
      },
    ];
  }
  return [
    {
      id: "s1",
      title: "Viral fikirler",
      impact: "Yüksek",
      summary: "Trend ve hook önerileri ilk Creative Engine turunda burada belirir.",
    },
    {
      id: "s2",
      title: "Reels fikirleri",
      impact: "Yüksek",
      summary: "Kısa video konseptleri üretim kaydından beslenir.",
    },
    {
      id: "s3",
      title: "Trend analizi",
      impact: "Orta",
      summary: "Canlı trend API’si eklendiğinde bu kart otomatik güncellenir.",
    },
  ];
}
