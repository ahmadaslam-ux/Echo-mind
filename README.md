# Saathi — Apna AI Assistant App

Ye ek complete, ready-to-launch AI chat app hai. Isme photo bhejna, voice se baat karna, aur AI ka jawab suna sakte hain.

## Step 1: Apni API key lo

1. [console.anthropic.com](https://console.anthropic.com) pe jaake account banao
2. "API Keys" section mein jaake ek nayi key banao (`sk-ant-...` se shuru hogi)
3. Kuch dollars credit add karne honge (usage ke hisaab se charge hota hai — halka use free credits mein chal jaata hai)

## Step 2: Apne computer pe test karo

Terminal mein ye commands chalao (Node.js install hona chahiye — nodejs.org se le lo agar nahi hai):

```bash
cd saathi-app
npm install
cp .env.local.example .env.local
```

Ab `.env.local` file kholo aur apni real API key paste karo:
```
ANTHROPIC_API_KEY=sk-ant-yahan-apni-asli-key-daalo
```

Fir app chalao:
```bash
npm run dev
```

Browser mein `http://localhost:3000` kholo — app chal jayega.

## Step 3: Website ke roop mein launch karo (free)

1. Is poore folder ko GitHub pe upload karo (ek naya repository banao)
2. [vercel.com](https://vercel.com) pe jaake GitHub se sign in karo
3. "New Project" → apni repository select karo
4. **Zaroori:** Environment Variables section mein `ANTHROPIC_API_KEY` add karo (wahi key jo `.env.local` mein daali thi)
5. "Deploy" dabao — 2 minute mein aapki website live ho jayegi (jaise `saathi-app.vercel.app`)

## Step 4: Mobile app (Android/iOS) banao

Isi code ko Capacitor se wrap karke real mobile app banaya ja sakta hai:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Saathi com.yourname.saathi
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Fir:
- **Android:** `npx cap open android` — Android Studio khulega, wahan se APK ya Play Store ke liye build kar sakte ho
- **iOS:** `npx cap open ios` — Xcode khulega (isके liye Mac chahiye), App Store ke liye submit kar sakte ho

Camera aur microphone permissions ke liye Capacitor plugins install karne honge:
```bash
npm install @capacitor/camera
```
Aur `AndroidManifest.xml` / `Info.plist` mein permissions add karni hongi — Capacitor docs isme guide karte hain: https://capacitorjs.com/docs

## Play Store / App Store pe daalne ke liye

- **Android:** Google Play Console pe developer account banao ($25 one-time fee), APK/AAB upload karo
- **iOS:** Apple Developer Program join karo ($99/year), Xcode se App Store Connect pe submit karo

## Features included

- **Text chat** — any topic, any language
- **Photo understanding** — camera/gallery se photo bhejo, AI usko analyze karega
- **Voice input & output** — bolke poocho, jawab suno
- **Web search** — current events, news, prices jaisi cheezein bhi bata sakta hai (isme thoda extra cost lagta hai per search — console.anthropic.com pe pricing dekh lena)
- **New Chat** — purani baat clear karke fresh shuru karo
- **Copy** — kisi bhi jawab ko copy kar sakte ho

## Important note

- API key **kabhi bhi** frontend code mein direct mat likhna — hamesha `.env.local` / hosting provider ke environment variables mein rakho. Is project mein already sahi tarike se set hai (`app/api/chat/route.js` server pe chalta hai).
- Camera aur microphone sirf **HTTPS** pe kaam karenge (Vercel automatically HTTPS deta hai, koi extra kaam nahi).
