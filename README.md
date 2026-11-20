# صفحة رسالة سارة + لوحة الأدمن — Vercel

دي نسخة Vercel الصحيحة بدل Netlify، وفيها الواجهة الأصلية للرسالة + صفحة الأدمن + API زيارات حقيقي يستخدم Upstash Redis لحفظ العدادات بعد كل Deploy.

## محتويات المشروع
- `public/index.html`: الرسالة (نفس النص والتصميم، مع ملاحظة صريحة عن إحصائيات الزيارات).
- `public/admin.html`: لوحة الإحصائيات وكلمة السر.
- `api/visit.js`: تسجيل فتح جلسة واحدة تقريبًا لكل تبويب متصفح.
- `api/stats.js`: إحصائيات محمية بـ ADMIN_KEY.
- `lib/redis.js`: اتصال قاعدة Upstash Redis REST من السيرفر فقط.
- `vercel.json`: إخراج موقع الـ static من public.

## طريقة التركيب
1. **فك ضغط الـ ZIP**. ارفع **محتويات المجلد** لجذر GitHub repo (مش ملف ZIP نفسه)، بنفس التقسيمة: `public`, `api`, `lib`, `package.json`, `vercel.json`. لو كنت رافع نسخة Netlify القديمة، استبدل الملفات القديمة أو استخدم repo جديد. لازم Vercel يكون مربوط بالمستودع اللي عدّلته.
2. في Vercel افتح المشروع → Settings → Build and Deployment أو Build and Development Settings: `Framework Preset = Other`. الملف `vercel.json` يحدد Output Directory بـ `public`. تأكد إن Root Directory هو جذر الريبو (فارغ)، وإن إعدادات Build القديمة مش بتطلب مجلد مختلف.
3. في Vercel → Marketplace/Storage → **Upstash Redis** → Connect to Project (أو أنشئ Redis من Upstash Console ثم أضف القيم يدويًا). المطلوب توفر في مشروع Vercel Environment Variables:
   - `UPSTASH_REDIS_REST_URL`: رابط REST من Upstash.
   - `UPSTASH_REDIS_REST_TOKEN`: التوكن السري من Upstash.
4. في Vercel → Project → Settings → Environment Variables: أضف `ADMIN_KEY` واختر قيمة قوية خاصة بك **16 حرف على الأقل**؛ لا تضعها داخل ملفات المشروع أو GitHub أو في رابط الصفحة.
5. حدد بيئة **Production** للمتغيرات (وأي بيئة أخرى تحتاجها). اعمل Redeploy **بعد** إضافة متغيرات البيئة.
6. افتح صفحة الرسالة `/` من نافذة خاصة، ثم افتح `/admin.html` وأدخل مفتاحك. جرّب مرة من نافذة خاصة أخرى لتتأكد أن العدد زاد.

## مهم
- **بمجرد إضافة ADMIN_KEY وحده، العدّ مش هيشتغل.** يجب أن تكون وظائف `/api/visit` و`/api/stats` منشورة وأن تتصل بقاعدة Redis.
- إحصائيات ما قبل تشغيل هذه النسخة **لن تظهر تلقائيًا**. تبدأ العدادات من أول زيارة ناجحة بعد توصيل قاعدة البيانات.
- **العدد تقريب وليس دليلًا أن شخصًا بعينه دخل أو قرأ الرسالة.** زيارة منك أو من أي شخص آخر تُحسب. قد يُحظر الطلب بواسطة إضافات الخصوصية/الشبكة. كل جلسة تبويب قد تُحسب مرة واحدة، ولا توجد بصمات أجهزة ولا يتم تخزين هوية أو IP أو User-Agent في Redis.
- يتطلب أن يكون الموقع متاحًا لزائريه (راجع Deployment Protection). صفحة الأدمن لا تعرض بيانات بدون المفتاح، حتى لو كان ملف HTML نفسه عامًا.
- لو ظهر `404` عند `/api/stats` تأكد إن `api/stats.js` موجود في جذر الريبو وليس داخل `public`.
- لو ظهر خطأ من Upstash تأكد من متغيرات البيئة ثم Redeploy.
- تأكد من شروط وأسعار المزود عند إنشاء قاعدة البيانات.
