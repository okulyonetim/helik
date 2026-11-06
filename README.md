# Aile Oyunları

Aile içinde, telefonlardan birlikte (online) ya da tek başına oynanan oyunlar. Reklam, ödeme ve takip yoktur; veriler yalnızca oda boyunca tutulur.

**Oyunlar:** İsim Şehir · Kelime Türetme · Çengel Bulmaca · Bilgi Yarışması (aile soruları dahil) · Adam Asmaca · Hafıza · Yapboz · Boyama

Çocuk modunda oyunlar daha kolay ayarlarla açılır; yetişkinler için zorluk seçenekleri vardır.

## Telefona kurulum (bir kez)

Uygulama bir web sitesidir; GitHub Pages ile ücretsiz yayınlanır, Android'de "Ana ekrana ekle" ile uygulama gibi yüklenir.

1. **Depoyu herkese açık yap:** GitHub'da depo → *Settings* → en altta *Danger Zone* → *Change visibility* → *Public*.
   (Ücretsiz hesapta GitHub Pages için gereklidir. Kodda gizli bir şey yoktur; aşağıdaki Firebase anahtarları zaten herkese açık olacak türdendir.)
2. **Pages'i aç:** *Settings* → *Pages* → *Source: Deploy from a branch* → *Branch: main*, klasör */ (root)* → *Save*.
3. Bir dakika sonra adres hazırdır: `https://KULLANICI.github.io/DEPO/` (ör. `https://okulyonetim.github.io/helik/`).
4. Telefonda Chrome ile adresi aç → ⋮ menüsü → **Ana ekrana ekle** (ya da *Uygulamayı yükle*).

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
