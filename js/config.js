/* Firebase ayarı. Online (oda kurup birlikte oynama) için gerekir; boşsa yalnızca "tek başıma" modları çalışır.
 * Adımlar README.md içinde. Buraya Firebase konsolundaki "Web uygulaması" ayarları yapıştırılır.
 * Bu değerler gizli değildir (web uygulamasının doğası gereği herkese açıktır); güvenliği database.rules.json sağlar. */
export const FIREBASE={
  apiKey:'AIzaSyC1rwQND0XD8IF6fl3Up0x1JjDePmzoDy8',
  authDomain:'helik-a1fc1.firebaseapp.com',
  /* Realtime Database "Belgium (europe-west1)" konumunda oluşturulmalı; konsolda Data sekmesinin üstündeki adres bununla aynı olmalı */
  databaseURL:'https://helik-a1fc1-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'helik-a1fc1',
  appId:'1:493920338089:web:d0de5257a5807c2e9a69b8'
};
