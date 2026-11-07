# Aile Oyunları

Aile içinde, telefonlardan birlikte (online) ya da tek başına oynanan oyunlar. Reklam, ödeme ve takip yoktur; veriler yalnızca oda boyunca tutulur.

**Oyunlar:** İsim Şehir · Kelime Türetme · Çengel Bulmaca · Bilgi Yarışması (aile soruları dahil) · Adam Asmaca · Hafıza · Yapboz · Boyama

Çocuk modunda oyunlar daha kolay ayarlarla açılır; yetişkinler için zorluk seçenekleri vardır.

## Telefona kurulum (bir kez)

Uygulama bir web sitesidir; ücretsiz yayınlanır, Android'de Chrome'dan **Uygulamayı yükle** ile uygulama gibi kurulur.

> **Önemli — kendi adresi olsun:** Aynı GitHub hesabında başka bir uygulama (ör. `kullanici.github.io` altında kurulu bir PWA) varsa, Android `kullanici.github.io/…` bağlantılarını o uygulamanın içinde açar; oyun o uygulamanın adı ve simgesiyle görünür. Bunu önlemek için oyunu **ayrı bir adreste** (aşağıdaki Netlify) yayınlayın.

**Netlify ile (önerilen, ücretsiz):**
1. [netlify.com](https://www.netlify.com) → GitHub ile giriş → *Add new project* → *Import an existing project* → GitHub → bu depoyu seç.
2. *Build command* ve *Publish directory* boş kalsın (ya da `.`) → **Deploy**.
3. *Project configuration* → *Project name* → anlaşılır bir ad ver (ör. `aile-oyunlari`) → adres `https://aile-oyunlari.netlify.app` olur.
4. Telefonda Chrome ile bu adresi aç → ⋮ menüsü → **Uygulamayı yükle**.

Depoya her gönderimde (commit) Netlify siteyi kendiliğinden günceller.

**GitHub Pages ile (başka PWA'nın aynı adreste kurulu olmadığı durumda):** depo → *Settings* → *Pages* → *Deploy from a branch* → *main* / */ (root)*. Adres `https://KULLANICI.github.io/DEPO/` olur (ücretsiz hesapta depo herkese açık olmalıdır).

Tek başına oynanan modlar bu kadarıyla çalışır. **Birlikte (online) oynamak için** Firebase'i de kur:

## Firebase kurulumu (online için, ücretsiz)

1. [console.firebase.google.com](https://console.firebase.google.com) → proje oluştur (Spark / ücretsiz plan yeter; Analytics gerekmez).
2. **Proje ayarları** (⚙️) → *Genel* → *Uygulamalarınız* → **Web (`</>`)** → bir ad ver → *Uygulamayı kaydet*. Çıkan `firebaseConfig` değerlerini `js/config.js` dosyasındaki `FIREBASE` alanlarına yapıştır (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`).
3. **Derleme → Authentication → Başlayın → Oturum açma yöntemi → Anonim → Etkinleştir.**
4. **Derleme → Realtime Database → Veritabanı oluştur** (konum: `europe-west1` ya da size yakın olan; *kilitli modda başlat*).
   Oluşan adres `databaseURL` ile aynı olmalıdır (`https://…firebasedatabase.app`); farklıysa `js/config.js` içine bunu yaz.
5. Realtime Database → **Kurallar** sekmesi → bu depodaki `database.rules.json` dosyasının içeriğini yapıştır → **Yayınla**.
6. `js/config.js` değişikliğini GitHub'a gönder (commit). Bir dakika sonra uygulamada **Oda kur (online)** düğmesi açılır.

### Nasıl oynanır

- Biri oyunu seçip **Oda kur (online)** der, ekranda 5 harfli bir **oda kodu** çıkar; **WhatsApp'ta davet et** düğmesiyle kod ve bağlantı aileye gönderilir. Diğerleri ana ekrandaki **Odaya katıl** kutusuna kodu yazar (ya da bağlantıya dokunur).
- Oda sahibi **Oyunu başlat**'a basar. Oda sahibi çıkarsa sıradaki oyuncu otomatik devralır.
- Oyun başladıktan sonra gelenler izleyici olarak katılır.

### Gizlilik ve güvenlik

- Giriş anonimdir (e-posta/şifre yok). Oda kodunu bilmeyen biri odaya giremez; odaların içeriği yalnızca odadaki oyuncular tarafından okunabilir (`database.rules.json`).
- Oda boş kalınca silinir. Ad ve simge yalnızca odadaki oyunculara görünür.
- **Asla** GitHub erişim anahtarı (token), parola ya da Firebase *hizmet hesabı* anahtarını depoya veya sohbete koymayın. `js/config.js` içindeki Firebase web ayarları gizli değildir; koruma kurallar dosyasındadır.
- Ücretsiz plan sınırları (aynı anda 100 bağlantı, 1 GB veri, aylık 10 GB indirme) aile kullanımı için fazlasıyla yeterlidir.

## Geliştirme

```bash
npm install          # yalnızca derleme/önizleme aracı (esbuild) için
npm test             # tüm testler (node:test)
npm run serve        # http://localhost:8080 — yerelde dene
npm run build:preview  # tek dosyalık önizleme: dist/aile-oyunlari-onizleme.html
npm run sw           # dosya ekledikten/sildikten sonra çevrimdışı önbellek listesini güncelle
```

İsteğe bağlı: iki-üç "telefon"un aynı odada gerçek ekranlarla oynadığı uçtan uca deneme (`tests/e2e/`):

```bash
npm i --no-save puppeteer-core      # ve bilgisayarda Chrome kurulu olmalı
npm run serve                       # ayrı terminalde
URL=http://localhost:8080/tests/e2e/harness.html node tests/e2e/calistir.mjs [oyun]
```

Derleme adımı yoktur: dosyalar olduğu gibi yayınlanır (düz ES modülleri).

### Yeni oyun eklemek

`js/games/` içine bir modül yazıp `js/games/index.js` listesine ekleyin. Oyun sözleşmesi:

```js
export default {
  id, name, ikon, renk, ozet, nasil, cocuk, solo, online, players:{min,max},
  secenekler:[{anahtar, ad, tur:'sec'|'coklu'|'ac'|'liste', …}],
  init(ctx) → state,                  // saf; JSON uyumlu olmalı
  reduce(state, action, ctx) → state, // saf; geçersiz eylemde aynı state'i döndür
  tick?(state, ctx) → state | null,   // zamana bağlı ilerleme (yalnız host çağırır)
  yukle?() → Promise,                 // büyük veriyi tembel yükler
  view: { mount(root, api) → { update(snap), destroy() } }
}
```

Oda mantığı **host yetkili** çalışır: oyuncular eylem gönderir, host `reduce` ile işleyip yeni durumu yayınlar. Oyun mantığı ağdan bağımsız ve test edilebilirdir (`tests/`).

### Veri dosyaları

- **Çengel bulmaca:** söz bankası `scripts/cengel-sozcukler.mjs` (cevap|ipucu|düzey). Bulmacaları yeniden üretmek için `npm run cengel` (birkaç dakika sürer), ardından `npm run sw`.
- **Kelime Türetme sözlüğü:** `scripts/sozluk-uret.mjs` (yalnızca geliştiricide `npm i --no-save an-array-of-turkish-words nspell dictionary-tr` gerekir).
- **Aile soruları:** ana ekrandaki *Aile soruları* kartından eklenir; her telefonda ayrı saklanır ve Bilgi Yarışması'na katılır (online oyunda **oda sahibinin** telefonundaki sorular kullanılır).
