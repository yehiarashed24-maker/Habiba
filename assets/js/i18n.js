/**
 * Habiba Motif - Multi-Language (i18n) Engine
 * Supports Arabic (Cairo font, RTL) and English (Plus Jakarta Sans / Outfit, LTR)
 */

const translations = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_gallery: "Gallery",
    nav_contact: "Contact",
    brand_title_1: "HABIBA MOTIF",
    brand_title_2: "ART GALLERY",
    home_headline: "Where passion<br>meets canvas",
    home_cta: "EXPLORE GALLERY",
    feat_title: "Featured Masterpieces",
    frame_title: "<em>A frame for every house</em>",
    frame_desc: "<p><em>A wall can hold many things, but the right piece, in the right frame, doesn't just hang, it speaks. Every frame here should fit your space as well as the art.</em></p><p><em>Which is why the last step of purchase is personalizing the frame...Truly the last brushstroke.</em></p>",
    care_title: "Made with Care",
    care_desc: "My art is born from the land I love and the world we share, crafted to move you, connect with you, and live with you.",
    art_1: "Quiet Companionship",
    art_2: "Whispers of Copper",
    art_3: "Coastal dreams",
    video_section_title: "In the Studio",
    snippet_bio: "18-year-old artist and engineering student, bringing traditional canvas art to the modern era with international recognition.",
    snippet_link: "Read full story <i class=\"fa-solid fa-arrow-right\"></i>",
    footer_brand: "HABIBA MOTIF",
    about_num: "01",
    about_title: "About Me",
    about_p1: "18-year-old artist and engineering student, trained in Cairo, Rome, and Spain (Gravura Taller de Grabado) under Dr. Mourad Darwish, Dr. Ahmed Badawy, Galal Gomaa, Massimiliano Locco, Merima Fetahovic, and Dr. Nasser Elgilani.",
    about_p2: "Featured in Talents on Set, Vintage, Movement, Art of Transparency, and Global Egyptian Youth; and recognized by the Egyptian Embassy in Spain and the Indian Embassy in Egypt.",
    about_studio_title: "Artist Studio Space",
    about_studio_sub: "Habiba Motif Art Studio & Gallery",
    contact_headline: "Create with Us",
    contact_addr_title: "MAILING ADDRESS",
    contact_addr_val: "123 Anywhere St., Any City, Country 123456",
    contact_email_title: "EMAIL ADDRESS",
    contact_phone_title: "PHONE NUMBER",
    artist_verified: "Verified artist",
    lang_btn_text: "عربي"
  },
  ar: {
    nav_home: "الرئيسية",
    nav_about: "من أنا",
    nav_gallery: "المعرض",
    nav_contact: "تواصل معنا",
    brand_title_1: "حبيبة موتيف",
    brand_title_2: "معرض فني",
    home_headline: "حيث يلتقي الشغف<br>بروعة الكانفاس",
    home_cta: "تصفح المعرض",
    feat_title: "لوحات مختارة",
    frame_title: "<em>إطار لكل منزل</em>",
    frame_desc: "<p><em>يمكن للجدار أن يحمل الكثير من الأشياء، لكن القطعة المناسبة، في الإطار المناسب، لا تكتفي بالتعليق، بل تتحدث وتعبّر. كل إطار هنا صُمم ليلائم مساحتك بقدر ما يلائم الفن ذاته.</em></p><p><em>ولهذا السبب فإن الخطوة الأخيرة في الاقتناء هي تخصيص الإطار... لمسة الفرشاة الأخيرة بحق.</em></p>",
    care_title: "صُنع بكل حب وعناية",
    care_desc: "ينبع فني من الأرض التي أحبها والعالم الذي نتشاركه، صُمم ليلامس وجدانك، يتواصل معك، ويحيى في تفاصيل منزلك.",
    art_1: "رفقة هادئة",
    art_2: "همسات النحاس",
    art_3: "أحلام ساحلية",
    video_section_title: "في الاستوديو",
    snippet_bio: "فنانة وطالبة هندسة تبلغ من العمر ١٨ عاماً، تنقل الفن التشكيلي الكلاسيكي إلى العصر الحديث برؤية عالمية.",
    snippet_link: "اقرأ القصة كاملة <i class=\"fa-solid fa-arrow-left\"></i>",
    footer_brand: "حبيبة موتيف",
    about_num: "٠١",
    about_title: "من أنا",
    about_p1: "فنانة تبلغ من العمر ١٨ عاماً وطالبة هندسة، تدربت في القاهرة وروما وإسبانيا (Gravura Taller de Grabado) تحت إشراف د. مراد درويش، د. أحمد بدوي، جلال جمعة، ماسيميليانو لوكو، ميريما فيتاهوفيتش، ود. ناصر الجيلاني.",
    about_p2: "شاركت في معارض Talents on Set, Vintage, Movement, Art of Transparency, و Global Egyptian Youth؛ وتم تكريمها من قبل السفارة المصرية في إسبانيا والسفارة الهندية في مصر.",
    about_studio_title: "استوديو ومساحة الفنانة",
    about_studio_sub: "استوديو ومعرض حبيبة موتيف",
    contact_headline: "اصنع إبداعك معنا",
    contact_addr_title: "العنوان البريدي",
    contact_addr_val: "123 شارع في أي مكان، المدينة، الدولة 123456",
    contact_email_title: "البريد الإلكتروني",
    contact_phone_title: "رقم الهاتف",
    artist_verified: "فنان موثق",
    lang_btn_text: "English"
  }
};

// Check URL params or localStorage
const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang');
let currentLang = (langParam === 'ar' || langParam === 'en') ? langParam : (localStorage.getItem('habiba_lang') || 'en');

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('habiba_lang', lang);

  const html = document.documentElement;
  const body = document.body;

  if (lang === 'ar') {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    body.setAttribute('dir', 'rtl');
    body.classList.add('rtl-mode');
  } else {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    body.setAttribute('dir', 'ltr');
    body.classList.remove('rtl-mode');
  }

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      elem.innerHTML = translations[lang][key];
    }
  });

  // Update language toggle button text
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.innerHTML = '<i class="fa-solid fa-globe"></i> ' + (translations[lang]['lang_btn_text'] || 'عربي');
  }

  // Preserve lang param in internal navigation links if needed
  document.querySelectorAll('.page-nav a, .header-nav-left a, .header-brand, .home-cta, .contact-brand a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      const url = new URL(href, window.location.href);
      if (lang === 'ar') {
        url.searchParams.set('lang', 'ar');
      } else {
        url.searchParams.delete('lang');
      }
      link.setAttribute('href', url.pathname + (url.search ? url.search : ''));
    }
  });
}

function toggleLanguage() {
  const nextLang = currentLang === 'en' ? 'ar' : 'en';
  setLanguage(nextLang);
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLanguage();
    });
  }
});
