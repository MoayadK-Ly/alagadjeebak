/**
 * « على قد جيبك 💸 » (Alagadjeebak) - Cloud Multiplayer Server
 * Real-time WebSocket + Express Game Server
 * Features: 2-8 players, 10-min code renewal, Anti-cheat curtain, Sabotage cards,
 * Blind auction, Random events, Live reactions, and AI Judge.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), rooms: rooms.size });
});

// ==========================================
// 1. DATA: THEMES, UPGRADES, AUCTION & EVENTS
// ==========================================

const THEMES = {
  car: {
    id: 'car',
    title: '🏎️ سيارة رياضية خارقة',
    desc: 'حوّل سيارة متهالكة لوحش كربوني فخم مع نيترو وأبواب لمبو',
    upgrades: [
      { id: 'c1', name: 'مراتب جلد أحمر تطريز ملكي', price: 3, score: 15, tag: 'interior', rarity: 'common', desc: 'راحة فائقة ومظهر فاره' },
      { id: 'c2', name: 'جنوط سبور أصلية مقاس 20', price: 4, score: 20, tag: 'wheels', rarity: 'rare', desc: 'ثبات خرافي على المنعطفات' },
      { id: 'c3', name: 'أبواب لمبو فراشة تنفتح للأعلى', price: 6, score: 30, tag: 'doors', rarity: 'legendary', desc: 'هيبة استعراضية تلفت الأنظار' },
      { id: 'c4', name: 'شاحن تيربو مزدوج + هيدرز', price: 5, score: 25, tag: 'engine', rarity: 'rare', desc: 'قوة حصانية ونغمة طرب' },
      { id: 'c5', name: 'جناح خلفي كربوني GT Dynamic', price: 3, score: 16, tag: 'spoiler', rarity: 'common', desc: 'داون فورس ديناميكي هوائي' },
      { id: 'c6', name: 'كفرات Monster ضخمة للطرق الوعرة', price: 4, score: 18, tag: 'tires', rarity: 'rare', desc: 'شكل هجومي يفرش الخط' },
      { id: 'c7', name: 'أسطوانة نيترو NOS زرقاء شحن سريع', price: 5, score: 28, tag: 'nitro', rarity: 'rare', desc: 'تسارع صاروخي في الثواني الأخيرة' },
      { id: 'c8', name: 'إضاءة نيون سفلية RGB متحركة', price: 2, score: 12, tag: 'neon', rarity: 'common', desc: 'أجواء ليلية سينمائية ساحرة' },
      { id: 'c9', name: 'طلاء ذهبي ميتاليك طبقات نانو سيراميك', price: 7, score: 35, tag: 'paint', rarity: 'legendary', desc: 'بريق عاكس ولمعان لا يبهت' },
      { id: 'c10', name: 'نظام صوتي 12 سماعة مع مضخم باص', price: 3, score: 14, tag: 'audio', rarity: 'common', desc: 'مسرح غنائي متنقل داخل المقصورة' },
      { id: 'c11', name: 'مكابح كاربون سيراميك حمراء بريمبو', price: 4, score: 22, tag: 'brakes', rarity: 'rare', desc: 'توقف فوري وأمان قصوى' },
      { id: 'c12', name: 'فتحة سقف بانورامية مظللة بالذكاء', price: 4, score: 20, tag: 'roof', rarity: 'rare', desc: 'رؤية سماوية وتحكم بالعزل' },
      { id: 'c13', name: 'نظام قيادة ذاتي بالذكاء الاصطناعي', price: 8, score: 40, tag: 'ai', rarity: 'legendary', desc: 'سيارة تفهم عليك وتصطف لحالها' },
      { id: 'c14', name: 'مفتاح كريستال رقمي وتطعيمات ألماس', price: 5, score: 26, tag: 'key', rarity: 'rare', desc: 'لمسة ترف تليق بالهوامير' },
      { id: 'c15', name: 'عادم تيتانيوم رياضي مع قواطع لهب', price: 5, score: 26, tag: 'exhaust', rarity: 'rare', desc: 'صوت طرب ونيران عند التبديل' },
      { id: 'c16', name: 'نظام هيدروليك هوائي يوطي السيارة بلمسة زر', price: 4, score: 22, tag: 'stance', rarity: 'rare', desc: 'نزلة أرضية وهيبة في التجمعات' },
      { id: 'c17', name: 'دركسون فورملا 1 كربوني مع شاشة غيارات LED', price: 4, score: 24, tag: 'steering', rarity: 'rare', desc: 'تحكم فائق وشعور حلبات حقيقي' },
      { id: 'c18', name: 'لوحة سيارة ملكية مميزة أحادية الرقم', price: 6, score: 32, tag: 'plate', rarity: 'legendary', desc: 'فخامة استثنائية تلفت كل الأنظار' },
      { id: 'c19', name: 'مشتت هواء كربوني أمريكي ديفيوزر سفلي', price: 3, score: 17, tag: 'diffuser', rarity: 'common', desc: 'انسيابية هوائية وثبات عالي السرعات' },
      { id: 'c20', name: 'كاميرات 360 محيطية مع رادار كشف الحفر', price: 3, score: 18, tag: 'cameras', rarity: 'common', desc: 'رؤية شاملة وحماية من الصدمات والمخالفات' },
      { id: 'c21', name: 'تبريد وتدفئة مراتب مع مساج حجري', price: 4, score: 21, tag: 'massage', rarity: 'rare', desc: 'استرخاء تام في المشاوير الطويلة والزحمة' },
      { id: 'c22', name: 'قاطع تيار أمني مع بصمة تشغيل بالوجه', price: 3, score: 16, tag: 'security', rarity: 'common', desc: 'حماية حديدية ضد أي محاولة سرقة' },
      { id: 'c23', name: 'عازل حراري نانو سيراميك عالي الكتم 03', price: 3, score: 15, tag: 'tint', rarity: 'common', desc: 'برودة ثلج داخل المقصورة في عز صيف الرياض' },
      { id: 'c24', name: 'حاقن ميثانول مضاعف لرفع بوست التيربو', price: 5, score: 27, tag: 'boost', rarity: 'rare', desc: 'عزم جبار وانفجار في القوة الحصانية' },
      { id: 'c25', name: 'إنارة ليزر أمامية زرقاء بمدى 600 متر', price: 4, score: 23, tag: 'laser_lights', rarity: 'rare', desc: 'كشف الطريق ليلاً بوضوح النهار' },
      { id: 'c26', name: 'ثلاجة مشروبات مدمجة بين المقاعد الخلفية', price: 3, score: 16, tag: 'fridge', rarity: 'common', desc: 'مشروبات باردة منعشة دائماً معك' },
      { id: 'c27', name: 'كت هوائي كربوني عريض وايد بودي Rocket Bunny', price: 6, score: 34, tag: 'widebody', rarity: 'legendary', desc: 'وقفة عريضة متوحشة تهز الشارع' },
      { id: 'c28', name: 'شاشة عرض بروجكتر HUD على الزجاج الأمامي', price: 4, score: 20, tag: 'hud', rarity: 'rare', desc: 'عرض السرعة والملاحة كطائرة مقاتلة' },
    ]
  },
  villa: {
    id: 'villa',
    title: '🏡 فيلا وقصر الأحلام',
    desc: 'ابنِ قصراً أسطورياً من الأرض إلى مهبط الهليكوبتر والمسبح',
    upgrades: [
      { id: 'v1', name: 'واجهة زجاجية سمارت بانورامية', price: 4, score: 20, tag: 'glass', rarity: 'rare', desc: 'إطلالة عصرية وإنارة طبيعية' },
      { id: 'v2', name: 'مسبح أولمبي إنفينيتي وشلال صخري', price: 6, score: 32, tag: 'pool', rarity: 'legendary', desc: 'استرخاء مائي فاخر يسر الناظرين' },
      { id: 'v3', name: 'حديقة نخيل وثيل أمريكي وشواية BBQ', price: 3, score: 15, tag: 'garden', rarity: 'common', desc: 'جلسة خارجية لأحلى جمعات' },
      { id: 'v4', name: 'روف لاونج وسينما خارجية تحت النجوم', price: 4, score: 22, tag: 'roof', rarity: 'rare', desc: 'شاشة عملاقة وسماعات محيطية' },
      { id: 'v5', name: 'مهبط هليكوبتر خاص على السطح', price: 7, score: 38, tag: 'helipad', rarity: 'legendary', desc: 'وصول ملكي وتسهيل للتنقل' },
      { id: 'v6', name: 'مصعد بانورامي زجاجي مطل', price: 3, score: 18, tag: 'elevator', rarity: 'common', desc: 'سهولة الصعود بين الأدوار' },
      { id: 'v7', name: 'صالة سينما منزلية مع كراسي مساج VIP', price: 5, score: 26, tag: 'cinema', rarity: 'rare', desc: 'أجواء صالات هوليوود بالبيت' },
      { id: 'v8', name: 'سور حجري أندلسي وبوابة ليزر ذكية', price: 3, score: 16, tag: 'gate', rarity: 'common', desc: 'خصوصية وأمان رقمي متطور' },
      { id: 'v9', name: 'طاقة شمسية وتكييف مركزي ذكي', price: 4, score: 20, tag: 'solar', rarity: 'rare', desc: 'توفير فواتير وتبريد استثنائي' },
      { id: 'v10', name: 'مطبخ إيطالي مفتوح وجزيرة رخام كلكتا', price: 5, score: 25, tag: 'kitchen', rarity: 'rare', desc: 'تصميم شيف راقٍ للضيافة' },
      { id: 'v11', name: 'نافورة راقصة بإضاءات خافتة بالمدخل', price: 3, score: 17, tag: 'fountain', rarity: 'common', desc: 'ترحيب ملكي يليق بالزوار' },
      { id: 'v12', name: 'نظام حماية أمني وكاميرات 360 بالذكاء', price: 3, score: 16, tag: 'security', rarity: 'common', desc: 'مراقبة وحماية بدون قلق' },
      { id: 'v13', name: 'جناح سبا متكامل وحمام بخار تركي', price: 5, score: 28, tag: 'spa', rarity: 'rare', desc: 'نقاء واستجمام بعد عناء العمل' },
      { id: 'v14', name: 'غرفة تحف ومقتنيات نادرة معزولة', price: 6, score: 30, tag: 'gallery', rarity: 'legendary', desc: 'لمسة أرستقراطية فريدة' },
      { id: 'v15', name: 'مجلس عربي ملكي فخم بديكور مشب تراثي', price: 5, score: 26, tag: 'majlis', rarity: 'rare', desc: 'أصالة وضيافة لأكبر العزايم والمناسبات' },
      { id: 'v16', name: 'صالة بولينج خاصة وبلياردو في القبو', price: 5, score: 27, tag: 'bowling', rarity: 'rare', desc: 'ترفيه منزلي فاخر بلا حدود للشباب' },
      { id: 'v17', name: 'غرفة ملابس ماستر بمساحة شقة كاملة', price: 4, score: 22, tag: 'wardrobe', rarity: 'rare', desc: 'خزائن ذكية بإضاءات وأرفف عطور ومجوهرات' },
      { id: 'v18', name: 'صالة ألعاب واقع افتراضي ومحاكي سباقات', price: 4, score: 23, tag: 'vr_room', rarity: 'rare', desc: 'تجربة غامرة لألعاب الجيل الجديد' },
      { id: 'v19', name: 'مزرعة منزلية ذكية ونخيل سكري مثمر', price: 3, score: 17, tag: 'palms', rarity: 'common', desc: 'رطب طازج وخضار عضوية من حديقتك' },
      { id: 'v20', name: 'جاكوزي خارجي ساخن تحت مظلة البيرغولا', price: 4, score: 21, tag: 'outdoor_jacuzzi', rarity: 'rare', desc: 'استرخاء مسائي شتوي تحت زخات المطر' },
      { id: 'v21', name: 'نظام صوتي حدائقي مخفي على شكل صخور طبيعية', price: 3, score: 16, tag: 'garden_sound', rarity: 'common', desc: 'نغمات هادئة موزعة بين الشجر والنوافير' },
      { id: 'v22', name: 'جناح ضيوف ملكي مستقل بمدخل خاص', price: 5, score: 28, tag: 'guest_suite', rarity: 'rare', desc: 'خصوصية تامة لكبار الزوار والضيوف' },
      { id: 'v23', name: 'أبواب خشب صاج أندلسية منحوتة باليد', price: 4, score: 20, tag: 'carved_doors', rarity: 'rare', desc: 'هيبة مدخل لا تتكرر تدوم أجيالاً' },
      { id: 'v24', name: 'ستائر كهربائية ذكية تتبع حركة الشمس', price: 3, score: 15, tag: 'smart_curtains', rarity: 'common', desc: 'تحكم بدرجة الإضاءة والحرارة أوتوماتيكياً' },
      { id: 'v25', name: 'نظام تحلية وتنقية مياه مركزي بالأوزون', price: 3, score: 16, tag: 'water_purifier', rarity: 'common', desc: 'مياه نقية صالحة للشرب من كل صنبور' },
      { id: 'v26', name: 'مهبط سكوترات كهربائية وشواحن تسلا جدارية', price: 4, score: 19, tag: 'ev_chargers', rarity: 'rare', desc: 'جاهزية تامة لجميع سيارات المستقبل' },
      { id: 'v27', name: 'نظام عزل صوتي كامل ثلاثي الطبقات للجدران', price: 4, score: 22, tag: 'soundproofing', rarity: 'rare', desc: 'هدوء وسكينة مطلقة تنعزل بها عن صخب المدينة' },
      { id: 'v28', name: 'رذاذ وتلطيف جو سويسري لكامل الفناء الخارجي', price: 4, score: 20, tag: 'cooling_mist', rarity: 'rare', desc: 'تخفيض 15 درجة مئوية في عز حر الصيف' },
    ]
  },
  cafe: {
    id: 'cafe',
    title: '☕ مقهى وكافيه عصري',
    desc: 'أسس أرقى كافيه بالمدينة مع ماكينة إيطالية وجلسات خارجية',
    upgrades: [
      { id: 'k1', name: 'ماكينة إسبريسو لامارزوكو مذهبة مع بخار', price: 6, score: 32, tag: 'machine', rarity: 'legendary', desc: 'استخلاص قهوة مثالي ورغوة مخملية' },
      { id: 'k2', name: 'لوحة نيون مضيئة بعبارة ترند', price: 2, score: 12, tag: 'neon', rarity: 'common', desc: 'منطقة تصوير سناب وتيك توك' },
      { id: 'k3', name: 'جلسات خارجية وترّاس مظلل برذاذ بارد', price: 4, score: 20, tag: 'terrace', rarity: 'rare', desc: 'إقبال مضاعف في الأجواء الحلوة' },
      { id: 'k4', name: 'محمصة بن احترافية داخل الكافيه', price: 5, score: 28, tag: 'roaster', rarity: 'rare', desc: 'رائحة التحميص تعبي الشارع' },
      { id: 'k5', name: 'بار باريستا رخام أسود وإضاءة موجهة', price: 3, score: 16, tag: 'bar', rarity: 'common', desc: 'فخامة هندسية ومساحة خدمة مريحة' },
      { id: 'k6', name: 'موسيقى جاز ولاونج هادئ وساوند سيستم', price: 2, score: 12, tag: 'music', rarity: 'common', desc: 'أجواء عمل ودراسة رايقة' },
      { id: 'k7', name: 'ثلاجة مخبوزات وكرواسون فرنسي فاخر', price: 4, score: 22, tag: 'bakery', rarity: 'rare', desc: 'مبيعات مضاعفة مع كل فنجان' },
      { id: 'k8', name: 'أكواب سيراميك كورية وتغليف حصري', price: 3, score: 15, tag: 'cups', rarity: 'common', desc: 'هوية بصرية أنيقة يتمناها الزبائن' },
      { id: 'k9', name: 'منطقة درايف ثرو سريعة للسيارات', price: 6, score: 30, tag: 'drivethru', rarity: 'legendary', desc: 'تدفق أرباح مستمر بدون انقطاع' },
      { id: 'k10', name: 'ركن بوكسات الهدايا وحبوب البن المختص', price: 3, score: 17, tag: 'beans', rarity: 'common', desc: 'منتجات إضافية ترفع السلة' },
      { id: 'k11', name: 'إنترنت فايبر فائق السرعة وأفياش مدمجة', price: 2, score: 14, tag: 'wifi', rarity: 'common', desc: 'مغناطيس لأصحاب العمل الحر' },
      { id: 'k12', name: 'محطة مشروبات مبتكرة وخلطات صيفية', price: 3, score: 18, tag: 'drinks', rarity: 'common', desc: 'ماتشا وكركديه موهيتو منعش' },
      { id: 'k13', name: 'تطبيق ولاء رقمي ونظام مكافآت بالـ AI', price: 4, score: 24, tag: 'loyalty', rarity: 'rare', desc: 'زبائن دائمين وتكرار زيارات' },
      { id: 'k14', name: 'فرع VIP وسجل امتياز تجاري قابل للتوسع', price: 7, score: 38, tag: 'franchise', rarity: 'legendary', desc: 'تحويل المقهى لعلامة تجارية كبرى' },
      { id: 'k15', name: 'ركن تقطير يدوي V60 بحبوب بن جيشا نادرة', price: 5, score: 26, tag: 'v60', rarity: 'rare', desc: 'لمحبي القهوة المختصة والتذوق العالي' },
      { id: 'k16', name: 'شاشات طلب ذاتي رقمية تمنع طوابير الانتظار', price: 3, score: 17, tag: 'kiosk', rarity: 'common', desc: 'تسريع الخدمة ومضاعفة حجم الطلبات' },
      { id: 'k17', name: 'فرن حلويات لايف وتشيز كيك سان سيباستيان', price: 4, score: 22, tag: 'oven', rarity: 'rare', desc: 'رائحة الحلويات الطازجة تجذب المارة' },
      { id: 'k18', name: 'أكواب حرارية تذكارية قابلة للتعبئة بشعار الكافيه', price: 3, score: 15, tag: 'tumbler', rarity: 'common', desc: 'أرباح مبيعات وهوية تتجول مع العملاء' },
      { id: 'k19', name: 'اشتراكات قهوة شهرية مسبقة الدفع عبر البطاقات', price: 4, score: 23, tag: 'subscription', rarity: 'rare', desc: 'دخل ثابت مضمون وتثبيت ولاء الزبائن' },
      { id: 'k20', name: 'إضاءة تصوير سينمائية تبرز جمال اللاتيه آرت', price: 3, score: 16, tag: 'photo_light', rarity: 'common', desc: 'صور ترند يومية في ستوريات وتيك توك' },
      { id: 'k21', name: 'كبائن دراسة فردية مع عزل صوتي وهدوء', price: 3, score: 18, tag: 'study_pods', rarity: 'common', desc: 'استقطاب طلاب الجامعات ومحبي التركيز' },
      { id: 'k22', name: 'طابعة ليزرية لطباعة صور الزبائن على رغوة القهوة', price: 4, score: 21, tag: 'foam_art', rarity: 'rare', desc: 'فكرة ترفيهية استثنائية يتسابق الزوار لتصويرها' },
      { id: 'k23', name: 'مشروبات بنكهات سعودية (خزامى، ورد طائفي، هيل)', price: 4, score: 20, tag: 'saudi_flavors', rarity: 'rare', desc: 'تميز بنكهات محلية ترند لا توجد عند المنافسين' },
      { id: 'k24', name: 'عقد تدريب مع بطل باريستا دولي لتدريب الطاقم', price: 5, score: 27, tag: 'master_barista', rarity: 'rare', desc: 'رفع جودة الاستخلاص والتقديم لأعلى مستوى عالمي' },
      { id: 'k25', name: 'محطة فلاتر مياه متطورة لضبط معادن القهوة بدقة', price: 3, score: 17, tag: 'water_minerals', rarity: 'common', desc: 'حموضة ونكهة مثالية متوازنة لكل كوب' },
      { id: 'k26', name: 'جلسات خارجية بدفايات لهب لأيام الشتاء', price: 3, score: 16, tag: 'patio_heaters', rarity: 'common', desc: 'بقاء الترّاس مزدحماً طوال أشهر البرد' },
      { id: 'k27', name: 'خدمة استلام سريع من شباك السيارة عبر التطبيق', price: 4, score: 22, tag: 'curbside', rarity: 'rare', desc: 'خدمة الزبون المستعجل بدون انتظار دقيقة واحدة' },
      { id: 'k28', name: 'مكتبة كتب مختارة وألعاب طاولة وبلوت خشبية راقية', price: 3, score: 15, tag: 'board_games', rarity: 'common', desc: 'زيادة وقت بقاء الزبون ورفع متوسط فاتورته' },
    ]
  },
  restaurant: {
    id: 'restaurant',
    title: '🍔 مطعم فاخر وسحابي',
    desc: 'مطبخ مفتوح، عازف بيانو كلاسيكي، وطاولات رخامية أرستقراطية',
    upgrades: [
      { id: 'r1', name: 'طاولات رخام إيطالي ومقاعد مخمل كرزي', price: 4, score: 20, tag: 'tables', rarity: 'rare', desc: 'جلسات ضيافة بالغة الرقي' },
      { id: 'r2', name: 'مطبخ مفتوح Open Kitchen وشواية حطب', price: 6, score: 32, tag: 'kitchen', rarity: 'legendary', desc: 'شوو حي ورائحة شواء تأسر القلوب' },
      { id: 'r3', name: 'عازف بيانو كلاسيكي على مسرح هادئ', price: 4, score: 22, tag: 'piano', rarity: 'rare', desc: 'نغمات كلاسيكية ترفع قيمة الوجبة' },
      { id: 'r4', name: 'ثريات كريستال بوهيمي وإضاءة دافئة', price: 3, score: 16, tag: 'chandeliers', rarity: 'common', desc: 'فخامة بصرية تخطف الأبصار' },
      { id: 'r5', name: 'شيف عالمي حاصل على نجمة ميشلان', price: 8, score: 45, tag: 'chef', rarity: 'legendary', desc: 'قائمة طعام استثنائية وأطباق فنية' },
      { id: 'r6', name: 'غرفة VIP سرية لاجتماعات كبار الشخصيات', price: 5, score: 26, tag: 'vip', rarity: 'rare', desc: 'خصوصية تامة وحجز مسبق بالأشهر' },
      { id: 'r7', name: 'منطقة كيدز إلكترونية آمنة للأطفال', price: 3, score: 15, tag: 'kids', rarity: 'common', desc: 'راحة تامة للعائلات أثناء العشاء' },
      { id: 'r8', name: 'خدمة صف سيارات فالي VIP أمام الباب', price: 3, score: 18, tag: 'valet', rarity: 'common', desc: 'انطباع أول يبهر كل زائر' },
      { id: 'r9', name: 'ثلاجة تعتيق لحوم واغيو دراي إيدجد', price: 6, score: 30, tag: 'wagyu', rarity: 'legendary', desc: 'أعلى جودة ستيكات في السوق' },
      { id: 'r10', name: 'شرفة أطلال بانورامية مطلة على النافورة', price: 4, score: 22, tag: 'terrace', rarity: 'rare', desc: 'أجمل صور الغروب مع العشاء' },
      { id: 'r11', name: 'بار حلويات استعراضي بالنيتروجين المثلج', price: 4, score: 21, tag: 'dessert', rarity: 'rare', desc: 'تجربة حلى ساحرة ومبهرة' },
      { id: 'r12', name: 'عقود تموين لحوم محلية طازجة يومياً', price: 4, score: 19, tag: 'supply', rarity: 'rare', desc: 'ثقة ومذاق بلدي مضمون' },
      { id: 'r13', name: 'روبوتات تقديم ذكية لنقل الطلبات', price: 5, score: 27, tag: 'robots', rarity: 'rare', desc: 'تقنية مبهرة وسرعة في الخدمة' },
      { id: 'r14', name: 'توثيق تقييمات المشاهير وتغطية إعلامية', price: 5, score: 25, tag: 'media', rarity: 'rare', desc: 'ترند طوابير وزحمة يومية' },
      { id: 'r15', name: 'فرن بيتزا نابولي حجري أصلي على الحطب', price: 5, score: 26, tag: 'pizza_oven', rarity: 'rare', desc: 'نكهة إيطالية أصلية مقرمشة في 90 ثانية' },
      { id: 'r16', name: 'قبو تعتيق مشروبات وعصائر طبيعية منعشة', price: 4, score: 22, tag: 'mocktail_cellar', rarity: 'rare', desc: 'تجارب تذوق حصرية ترافق الأطباق الرئيسية' },
      { id: 'r17', name: 'محطة تقطيع ستيك استعراضية أمام طاولة الزبون', price: 4, score: 24, tag: 'steak_show', rarity: 'rare', desc: 'عرض حي مذهل يشعل الهواتف بالتصوير' },
      { id: 'r18', name: 'أواني تقديم وصحون خزفية مصممة يدوياً للشيف', price: 3, score: 16, tag: 'custom_plates', rarity: 'common', desc: 'لمسة فنية فريدة تبرز روعة كل وجبة' },
      { id: 'r19', name: 'شرفة بإطلالة مائية مع نوافير تفاعلية خاصة', price: 5, score: 28, tag: 'fountain_terrace', rarity: 'rare', desc: 'أجواء تجعل حجوزات المطعم ممتلئة دائماً' },
      { id: 'r20', name: 'نظام حجوزات ذكي يمنع الانتظار ويدير الزوار بالـ AI', price: 3, score: 17, tag: 'smart_booking', rarity: 'common', desc: 'سلاسة تشغيلية وتجربة استثنائية بدون طوابير' },
      { id: 'r21', name: 'حوض لوبستر ومأكولات بحرية حية طازجة', price: 6, score: 31, tag: 'live_seafood', rarity: 'legendary', desc: 'طزاجة لا تقاوم تجذب عشاق البحريات الفاخرة' },
      { id: 'r22', name: 'قائمة تذوق سرية من 7 أطباق تتغير أسبوعياً', price: 5, score: 29, tag: 'secret_menu', rarity: 'rare', desc: 'تشويق دائم للزبائن المخمليين لتكرار الزيارة' },
      { id: 'r23', name: 'أزياء موحدة أنيقة لطاقم الخدمة من دار أزياء عالمية', price: 3, score: 15, tag: 'uniforms', rarity: 'common', desc: 'مظهر احترافي فخم يعكس مستوى المطعم الرفيع' },
      { id: 'r24', name: 'نظام عزل وتشتيت ضوضاء متطور بين الطاولات', price: 4, score: 20, tag: 'acoustic_tables', rarity: 'rare', desc: 'حديث خاص ومريح لكل طاولة بدون تداخل أصوات' },
      { id: 'r25', name: 'مطبخ تجارب وابتكار أطباق جديدة تسبق السوق', price: 5, score: 26, tag: 'culinary_lab', rarity: 'rare', desc: 'تجديد مستمر لقائمة الطعام وإبهار الذواقة' },
      { id: 'r26', name: 'تغليف حراري فاخر لطلبات التوصيل VIP للمنازل', price: 3, score: 16, tag: 'thermal_pack', rarity: 'common', desc: 'وصول الأكل حاراً وبمظهر المطعم الفاخر' },
      { id: 'r27', name: 'جدار زراعة هوائية للأعشاب العطرية الطازجة بالمطبخ', price: 3, score: 17, tag: 'herb_wall', rarity: 'common', desc: 'بهارات وأعشاب تُقطف مباشرة على الطبق' },
      { id: 'r28', name: 'خدمة كونسيرج خاصة لترتيب مناسبات أعياد الميلاد والذكرى', price: 4, score: 23, tag: 'events_desk', rarity: 'rare', desc: 'تنظيم احتفالات لا تُنسى تجلب أعلى عوائد' },
    ]
  },
  tower: {
    id: 'tower',
    title: '🏢 برج وناطحة سحاب',
    desc: 'شيّد ناطحة سحاب شامخة مع مطعم دوار ومهبط تاكسي طائر',
    upgrades: [
      { id: 't1', name: 'طوابق زجاجية شاهقة وعاكسة للشمس', price: 5, score: 25, tag: 'glass', rarity: 'rare', desc: 'ارتفاع شاهق وتصميم مستقبلي' },
      { id: 't2', name: 'مطعم دوار 360 درجة بأعلى قمة البرج', price: 7, score: 38, tag: 'restaurant', rarity: 'legendary', desc: 'إطلالة كاملة على أفق المدينة' },
      { id: 't3', name: 'مهبط طائرات تاكسي طائر EVTOL متطور', price: 6, score: 32, tag: 'evtol', rarity: 'legendary', desc: 'وسيلة نقل المستقبل لكبار التنفيذيين' },
      { id: 't4', name: 'عروض ليزر وإضاءات LED تفاعلية بالواجهة', price: 4, score: 22, tag: 'led', rarity: 'rare', desc: 'شاشة عملاقة للاحتفالات الوطنية' },
      { id: 't5', name: 'مصاعد صاروخية هوائية تصعد في ثوانٍ', price: 4, score: 20, tag: 'lift', rarity: 'rare', desc: 'سرعة فائقة بدون الشعور بالضغط' },
      { id: 't6', name: 'حديقة معلقة داخلية في الطابق الخمسين', price: 4, score: 21, tag: 'skyforest', rarity: 'rare', desc: 'واحة خضراء بين السحاب' },
      { id: 't7', name: 'منصة مراقبة سياحية بأرضية زجاجية شفافة', price: 5, score: 26, tag: 'deck', rarity: 'rare', desc: 'تذاكر سياحية وتجربة إثارة فريدة' },
      { id: 't8', name: 'نظام إخماد حرائق ذكي وأعلى معايير أمان', price: 3, score: 16, tag: 'safety', rarity: 'common', desc: 'حماية كاملة واستقرار دائم' },
      { id: 't9', name: 'مكاتب شركات عالمية بتقنيات الميتافيرس', price: 6, score: 30, tag: 'offices', rarity: 'legendary', desc: 'أرقى بيئة عمل لرواد الأعمال' },
      { id: 't10', name: 'قبة سماوية فلكية في القمة للرصد', price: 4, score: 23, tag: 'dome', rarity: 'rare', desc: 'رؤية النجوم والمجرات بدون تلوث' },
      { id: 't11', name: 'نظام إدارة طاقة ذاتي وتوليد بالرياح', price: 4, score: 20, tag: 'green', rarity: 'rare', desc: 'برج صديق للبيئة وشهادة بلاتينية' },
      { id: 't12', name: 'مواقف روبوتية ذكية تحت الأرض لـ 500 سيارة', price: 5, score: 25, tag: 'parking', rarity: 'rare', desc: 'اصطفاف تلقائي بدون تدخل بشري' },
      { id: 't13', name: 'صالة مؤتمرات دبلوماسية مع ترجمة فورية بالذكاء', price: 5, score: 27, tag: 'summit', rarity: 'rare', desc: 'استضافة كبرى القمم العالمية' },
      { id: 't14', name: 'برج اتصالات 6G وربط فضائي مباشر', price: 6, score: 33, tag: 'telecom', rarity: 'legendary', desc: 'أسرع اتصال رقمي في المنطقة' },
      { id: 't15', name: 'مسبح معلق زجاجي يبرز خارج البرج في الهواء الطلق', price: 7, score: 39, tag: 'glass_pool', rarity: 'legendary', desc: 'سباحة بين الغيوم على ارتفاع 300 متر تجذب العالم' },
      { id: 't16', name: 'مركز بيانات سحابي فائق وخوادم AI بالبرج', price: 6, score: 32, tag: 'data_center', rarity: 'legendary', desc: 'استقطاب كبرى شركات التقنية العالمية للمكاتب' },
      { id: 't17', name: 'صالة لياقة بدنية وسبا صحي بانورامي بالطابق الستين', price: 4, score: 23, tag: 'sky_gym', rarity: 'rare', desc: 'تدريب واستجمام مع إطلالة تحبس الأنفاس' },
      { id: 't18', name: 'شبكة روبوتات ودرونز لتنظيف زجاج الواجهات 24/7', price: 4, score: 21, tag: 'facade_drones', rarity: 'rare', desc: 'لمعان كريستالي مستمر بدون مخاطر بشرية' },
      { id: 't19', name: 'جسور هوائية مكيفة تربط البرج بالأبراج المجاورة', price: 5, score: 27, tag: 'skybridges', rarity: 'rare', desc: 'تنقل سلس للرواد في كل الفصول دون الخروج للشارع' },
      { id: 't20', name: 'نظام فلترة وتجديد هواء بتقنية الضغط الإيجابي', price: 4, score: 20, tag: 'air_filtration', rarity: 'rare', desc: 'هواء نقي 100% يمنع دخول أي غبار أو أتربة' },
      { id: 't21', name: 'بنتهاوس ملكي ثلاثي الأدوار مع مسبح خاص بالقمة', price: 8, score: 44, tag: 'penthouse', rarity: 'legendary', desc: 'أغلى وحدة سكنية بالمدينة ترفع قيمة المشروع' },
      { id: 't22', name: 'نظام توليد طاقة كهرومائية من تصريف مياه البرج', price: 4, score: 22, tag: 'clean_energy', rarity: 'rare', desc: 'استدامة بيئية وتوفير ملايين الريالات بالطاقة' },
      { id: 't23', name: 'أجهزة بصمة عين وأبواب ذكاء اصطناعي للمصاعد', price: 3, score: 18, tag: 'iris_transit', rarity: 'common', desc: 'أمان فائق وسرعة دخول لكبار الشخصيات' },
      { id: 't24', name: 'حدائق شتوية زجاجية مصغرة في ردهات كل خمسة أدوار', price: 3, score: 17, tag: 'atrium_gardens', rarity: 'common', desc: 'مساحات خضراء تبعث الراحة والبهجة للموظفين' },
      { id: 't25', name: 'قاعة احتفالات كبرى معلقة بدون أعمدة تتسع لـ 1000 شخص', price: 6, score: 33, tag: 'ballroom', rarity: 'legendary', desc: 'استضافة أضخم الأعراس والمؤتمرات الدولية' },
      { id: 't26', name: 'محطة شحن سريع لأسطول سيارات الليموزين التابعة للبرج', price: 4, score: 21, tag: 'ev_hub', rarity: 'rare', desc: 'خدمات تنقل فاخرة للضيوف والنزلاء على مدار الساعة' },
      { id: 't27', name: 'نظام مصدات زلازل ومثبط كتلي مذهب بالقمة', price: 5, score: 28, tag: 'mass_damper', rarity: 'rare', desc: 'استقرار وثبات أسطوري مع معلم هندسي يبهر السياح' },
      { id: 't28', name: 'شاشة هولوجرامية عملاقة ثلاثية الأبعاد على التاج', price: 6, score: 31, tag: 'hologram_crown', rarity: 'legendary', desc: 'عروض بصرية تبهر المدينة وتدر أرباحاً إعلانية هائلة' },
    ]
  },
  jet: {
    id: 'jet',
    title: '✈️ طائرة خاصة فاخرة',
    desc: 'جهّز طائرة نفاثة عابرة للقارات بجناح نوم وجاكوزي بالسماء',
    upgrades: [
      { id: 'j1', name: 'أجنحة ذهبية وتطعيمات خارجية ملكية', price: 5, score: 26, tag: 'gold', rarity: 'rare', desc: 'هيبة طيران تلفت كل المطارات' },
      { id: 'j2', name: 'محركات نفاثة مزدوجة بتوهج حراري وهدوء', price: 8, score: 42, tag: 'engines', rarity: 'legendary', desc: 'سرعة تفوق الصوت بدون إزعاج' },
      { id: 'j3', name: 'جناح نوم ماستر مع سرير ملكي كينغ', price: 6, score: 30, tag: 'bedroom', rarity: 'legendary', desc: 'نوم عميق وراحة متناهية بالغيوم' },
      { id: 'j4', name: 'سقف بانورامي زجاجي يعرض النجوم ليلاً', price: 4, score: 22, tag: 'skylight', rarity: 'rare', desc: 'رؤية السماء الصافية في الرحلات' },
      { id: 'j5', name: 'واي فاي فضائي ستارلينك مجاناً وبلا حدود', price: 2, score: 15, tag: 'starlink', rarity: 'common', desc: 'بث 4K وتداول أسهم بالجو' },
      { id: 'j6', name: 'جاكوزي مائي دافئ داخل حمام الطائرة', price: 5, score: 28, tag: 'jacuzzi', rarity: 'rare', desc: 'استرخاء مائي استثنائي فوق السحاب' },
      { id: 'j7', name: 'طاقم ضيافة خاص وشيف رحلات محترف', price: 4, score: 22, tag: 'crew', rarity: 'rare', desc: 'تقديم وجبات 5 نجوم على ارتفاع 40 ألف قدم' },
      { id: 'j8', name: 'مقصورة قيادة بالذكاء الاصطناعي مع رادار تضاريس', price: 4, score: 24, tag: 'cockpit', rarity: 'rare', desc: 'أقصى درجات الأمان وملاحة دقيقة' },
      { id: 'j9', name: 'صالون اجتماعات مصفح بعزل صوتي 100%', price: 4, score: 21, tag: 'lounge', rarity: 'rare', desc: 'صفقات المليارات تُبرم بسرية تامة' },
      { id: 'j10', name: 'مقاعد جلد تمساح فاخرة تتحول لأسرة مسطحة', price: 5, score: 25, tag: 'seats', rarity: 'rare', desc: 'راحة قصوى لجميع الضيوف' },
      { id: 'j11', name: 'نظام تنقية هواء بأيونات الفضة والأكسجين', price: 3, score: 17, tag: 'air', rarity: 'common', desc: 'تنشيط دائم والقضاء على إجهاد السفر' },
      { id: 'j12', name: 'خزان وقود إضافي مدى 12,000 كم متواصل', price: 5, score: 27, tag: 'fuel', rarity: 'rare', desc: 'من الرياض إلى نيويورك بدون توقف' },
      { id: 'j13', name: 'نظام دفاع جوي ذكي وتفادي مطبات بالليزر', price: 6, score: 31, tag: 'defense', rarity: 'legendary', desc: 'رحلة سلسة كالماء في أحلك الظروف' },
      { id: 'j14', name: 'طلاء نانو ضد الخدوش وشهادة طيران دولية VIP', price: 4, score: 20, tag: 'nano', rarity: 'rare', desc: 'حفاظ على قيمة الطائرة لسنوات' },
      { id: 'j15', name: 'صالون عناية شخصية VIP مجهز بالكامل على الطائرة', price: 4, score: 22, tag: 'grooming', rarity: 'rare', desc: 'وصول بكامل الأناقة مباشرة لأهم الاجتماعات' },
      { id: 'j16', name: 'نظام عزل وتخميد ذبذبات المحركات بالموجات المضادة', price: 4, score: 23, tag: 'active_silence', rarity: 'rare', desc: 'صمت مطبق كالبيت يتيح نوماً عميقاً كالريشة' },
      { id: 'j17', name: 'أدوات مائدة من الفضة وكؤوس كريستال باكارا', price: 4, score: 21, tag: 'crystal_dining', rarity: 'rare', desc: 'ضيافة أرستقراطية تليق بالملوك وكبار الوفود' },
      { id: 'j18', name: 'سينما خاصة 4K بشاشة OLED 85 بوصة ومقاعد فخمة', price: 5, score: 27, tag: 'sky_cinema', rarity: 'rare', desc: 'ترفيه سينمائي خيالي طوال ساعات السفر' },
      { id: 'j19', name: 'مستودع سيارة خارقة داخل بطن الطائرة للشحن السريع', price: 7, score: 38, tag: 'supercar_bay', rarity: 'legendary', desc: 'سافر مع سيارتك الرياضية المفضلة أينما هبطت' },
      { id: 'j20', name: 'نظام إضاءة سيركاديان يتكيف مع الوقت لمنع إجهاد السفر', price: 3, score: 18, tag: 'circadian_light', rarity: 'common', desc: 'استيقاظ بنشاط وانتعاش فوري عند الوصول لوجهتك' },
      { id: 'j21', name: 'طاهٍ خاص متخصص في المأكولات الصحية والأطباق الملكية', price: 5, score: 26, tag: 'sky_chef', rarity: 'rare', desc: 'وجبات طازجة تُطبخ لحظياً في فرن الحمل الحراري' },
      { id: 'j22', name: 'رادار دوبلر لكشف المطبات الجوية قبل 100 ميل', price: 4, score: 24, tag: 'turbulence_radar', rarity: 'rare', desc: 'تغيير المسار تلقائياً لتفادي أي اهتزاز أثناء الرحلة' },
      { id: 'j23', name: 'أرضيات خشب ماهوجني مدفأة وسجاد كشميري يدوي', price: 4, score: 22, tag: 'mahogany_floor', rarity: 'rare', desc: 'دفء وفخامة ملموسة تحت الأقدام في أعالي الجو' },
      { id: 'j24', name: 'نظام هبوط آلي معتمد للضباب الكثيف بدون رؤية CAT-III', price: 5, score: 28, tag: 'autoland', rarity: 'rare', desc: 'هبوط آمن وواثق في أي مطار حول العالم بلا تأخير' },
      { id: 'j25', name: 'كبسولة أكسجين واستشفاء طبي سريع بالجناح', price: 5, score: 26, tag: 'oxygen_pod', rarity: 'rare', desc: 'تجديد طاقة الجسم ونقاء الذهن أثناء الطيران' },
      { id: 'j26', name: 'كاميرات خارجية تبث مناظر الطيران بجودة 8K للشاشات', price: 3, score: 17, tag: '8k_cameras', rarity: 'common', desc: 'الاستمتاع بمشاهدة الجبال والمحيطات بزوايا مذهلة' },
      { id: 'j27', name: 'نظام اتصالات فضائي مشفر عسكري ضد أي تنصت', price: 4, score: 23, tag: 'secure_satcom', rarity: 'rare', desc: 'سرية مطلقة للمكالمات والبيانات والصفقات الهامة' },
      { id: 'j28', name: 'رخصة إقلاع وهبوط استثنائي في المطارات الدولية القصيرة', price: 4, score: 21, tag: 'short_runway', rarity: 'rare', desc: 'وصولك لأقرب نقطة لوجهتك بدون تضييع دقيقة' },
    ]
  }
};

// Sabotage Cards

const CONTRACTS = {
  "car": [
    {
      "id": "c_track",
      "title": "وحش الحلبات والسرعة 🏎️",
      "desc": "اقتنِ ترقية في (المحرك) و(الجنوط) و(الهيكل/الجناح)",
      "bonus": 35,
      "slots": [
        "engine",
        "wheels",
        "body"
      ]
    },
    {
      "id": "c_vip",
      "title": "كروز وفخامة ملكية 👑",
      "desc": "اقتنِ ترقية في (الداخلية) و(التقنية) و(الهيكل/البوية)",
      "bonus": 35,
      "slots": [
        "interior",
        "tech",
        "body"
      ]
    },
    {
      "id": "c_show",
      "title": "هيبة واستعراض شوارع 🔥",
      "desc": "اقتنِ ترقية في (الصوتيات/النيون) و(الداخلية) و(المحرك)",
      "bonus": 35,
      "slots": [
        "audio",
        "interior",
        "engine"
      ]
    }
  ],
  "villa": [
    {
      "id": "v_resort",
      "title": "منتجع استجمام مائي 🏊",
      "desc": "اقتنِ ترقية في (المسبح) و(الحديقة) و(الترفيه)",
      "bonus": 35,
      "slots": [
        "pool",
        "garden",
        "fun"
      ]
    },
    {
      "id": "v_palace",
      "title": "قصر ضيافة أسطوري 🏛️",
      "desc": "اقتنِ ترقية في (المعمار) و(المجلس) و(التقنية/الأمان)",
      "bonus": 35,
      "slots": [
        "facade",
        "living",
        "smart"
      ]
    },
    {
      "id": "v_future",
      "title": "قصر ذكي ومستقبلي ⚡",
      "desc": "اقتنِ ترقية في (التقنية/الأمان) و(المعمار) و(الترفيه/السينما)",
      "bonus": 35,
      "slots": [
        "smart",
        "facade",
        "fun"
      ]
    }
  ],
  "cafe": [
    {
      "id": "k_specialty",
      "title": "أيقونة القهوة المختصة ☕",
      "desc": "اقتنِ ترقية في (محطة القهوة) و(المخبوزات) و(الهوية/التوسع)",
      "bonus": 35,
      "slots": [
        "coffee",
        "bakery",
        "expansion"
      ]
    },
    {
      "id": "k_aesthetic",
      "title": "كافيه ترند وتصوير 📸",
      "desc": "اقتنِ ترقية في (الديكور والتصوير) و(الجلسات) و(المخبوزات)",
      "bonus": 35,
      "slots": [
        "vibe",
        "seating",
        "bakery"
      ]
    },
    {
      "id": "k_empire",
      "title": "إمبراطورية خدمة سريعة 📱",
      "desc": "اقتنِ ترقية في (الخدمة والتقنية) و(محطة القهوة) و(الجلسات)",
      "bonus": 35,
      "slots": [
        "tech",
        "coffee",
        "seating"
      ]
    }
  ],
  "restaurant": [
    {
      "id": "r_michelin",
      "title": "مطبخ ميشلان 3 نجوم 👨‍🍳",
      "desc": "اقتنِ ترقية في (المطبخ والشيف) و(اللحوم) و(الصالة)",
      "bonus": 35,
      "slots": [
        "kitchen",
        "food",
        "dining"
      ]
    },
    {
      "id": "r_vip",
      "title": "قاعة كبار الشخصيات 🚪",
      "desc": "اقتنِ ترقية في (الضيافة والـ VIP) و(الصالة) و(الأنظمة)",
      "bonus": 35,
      "slots": [
        "vip",
        "dining",
        "systems"
      ]
    },
    {
      "id": "r_show",
      "title": "تجربة استعراضية فاخرة 🎻",
      "desc": "اقتنِ ترقية في (الأجواء والترفيه) و(المطبخ) و(اللحوم)",
      "bonus": 35,
      "slots": [
        "show",
        "kitchen",
        "food"
      ]
    }
  ],
  "tower": [
    {
      "id": "t_landmark",
      "title": "أيقونة أفق المدينة 🏢",
      "desc": "اقتنِ ترقية في (البرج والواجهة) و(القمة والمطاعم) و(الحدائق)",
      "bonus": 35,
      "slots": [
        "structure",
        "pinnacle",
        "parks"
      ]
    },
    {
      "id": "t_future",
      "title": "برج المستقبل الذكي 🚁",
      "desc": "اقتنِ ترقية في (المواصلات) و(الأعمال والقمم) و(الأمان والاستدامة)",
      "bonus": 35,
      "slots": [
        "transit",
        "business",
        "eco"
      ]
    },
    {
      "id": "t_oasis",
      "title": "واحة السحاب الترفيهية 🌳",
      "desc": "اقتنِ ترقية في (الحدائق والمسبح) و(القمة) و(المواصلات)",
      "bonus": 35,
      "slots": [
        "parks",
        "pinnacle",
        "transit"
      ]
    }
  ],
  "jet": [
    {
      "id": "j_supersonic",
      "title": "نفاثة خارقة السرعة 🚀",
      "desc": "اقتنِ ترقية في (المحركات والسرعة) و(الملاحة) و(الصالون)",
      "bonus": 35,
      "slots": [
        "power",
        "avionics",
        "salon"
      ]
    },
    {
      "id": "j_presidential",
      "title": "طائرة رئاسية سرية 🛰️",
      "desc": "اقتنِ ترقية في (الملاحة والأقمار) و(الجناح) و(الصالون)",
      "bonus": 35,
      "slots": [
        "avionics",
        "master",
        "salon"
      ]
    },
    {
      "id": "j_royal",
      "title": "قصر طائر 7 نجوم 🛁",
      "desc": "اقتنِ ترقية في (السبا والاستجمام) و(المائدة والضيافة) و(الجناح)",
      "bonus": 35,
      "slots": [
        "wellness",
        "dining",
        "master"
      ]
    }
  ]
};

const SABOTAGE_CARDS = [
  { id: 'saher', name: 'ساهر 📸', icon: '📸', rarity: 'common', desc: 'خصم مخالفة فورية 4 ر.س من ميزانية المنافس', type: 'budget_cut', val: 4 },
  { id: 'satha', name: 'سطحة وتشليح 🧰', icon: '🧰', rarity: 'common', desc: 'إجبار الخصم على فك آخر ترقية اشتراها وبيعها بنصف السعر', type: 'sell_last' },
  { id: 'hasad', name: 'عين حسود 🧿', icon: '🧿', rarity: 'common', desc: 'تجميد خيار الشراء للخصم للجولة القادمة', type: 'freeze_turn' },
  { id: 'shareeti', name: 'شريطي المعارض 🤝', icon: '🤝', rarity: 'common', desc: 'تبديل إجباري لقطعة من عندك بأفضل قطعة عند خصمك', type: 'swap_piece' }
];

// Random Events
const RANDOM_EVENTS = [
  { id: 'ghubar', title: '🌪️ موجة غبار موسمية!', desc: 'كل اللاعبين يدفعون 2 ر.س صيانة وتنظيف عاجل لمشروعهم.', effect: (room) => {
    room.players.forEach(p => { p.budget = Math.max(0, p.budget - 2); });
  }},
  { id: 'baladiya', title: '📋 تفتيش بلدي مفاجئ!', desc: 'المشروع الأقل نقاطاً يحصل على مخالفة 3 ر.س، والأعلى يحصل على ترخيص ذهبي (+15 نقطة)!', effect: (room) => {
    if (room.players.length === 0) return;
    const sorted = [...room.players].sort((a,b) => b.score - a.score);
    sorted[0].score += 15;
    const lowest = sorted[sorted.length - 1];
    lowest.budget = Math.max(0, lowest.budget - 3);
  }},
  { id: 'cashback', title: '💳 يوم الكاش باك البنكي!', desc: 'مكافأة 4 ر.س كاش باك تُضاف فوراً لجميع اللاعبين لدعم ميزانياتهم!', effect: (room) => {
    room.players.forEach(p => { p.budget += 4; });
  }},
  { id: 'trend', title: '🔥 ترند تيك توك وسناب شات!', desc: 'جميع المشاريع تحصل على +10 نقاط شهرة إضافية بدون أي تكلفة!', effect: (room) => {
    room.players.forEach(p => { p.score += 10; });
  }}
];

// Blind Auction Items
const AUCTION_ITEMS = {
  car: { name: 'لوحة ملكية فردية « ق د ك 1 »', desc: 'أندر لوحة في المملكة تضاعف فخامة سيارتك!', scoreBonus: 45, startBid: 3 },
  villa: { name: 'صك ملكي استثماري وصك أرض ملاصقة', desc: 'مساحة إضافية ترفع هيبة قصرك للسحاب!', scoreBonus: 45, startBid: 3 },
  cafe: { name: 'وكالة بن مختص حصرية من جبال جازان', desc: 'أفضل محصول بن عربي أصيل يضمن طوابير الزبائن!', scoreBonus: 45, startBid: 3 },
  restaurant: { name: 'ترخيص تصنيف 5 نجوم بلاتيني عالمي', desc: 'شهادة جودة استثنائية تجذب كبار الشخصيات!', scoreBonus: 45, startBid: 3 },
  tower: { name: 'حقوق تسمية البرج وعقد إعلاني ملياري', desc: 'اسمك يعتلي قمة البرج ويضيء سماء العاصمة!', scoreBonus: 45, startBid: 3 },
  jet: { name: 'تصريح عبور أجوائي ملكي بدون انتظار', desc: 'أولوية هبوط وإقلاع في كبرى مطارات العالم!', scoreBonus: 45, startBid: 3 }
};

// ==========================================
// 2. ROOM & PLAYER MANAGEMENT
// ==========================================

const rooms = new Map();

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function isValidEmoji(str) {
  if (!str) return false;
  // Strictly reject latin, arabic, numbers, and basic punctuation
  if (/[a-zA-Z0-9\u0600-\u06FF\s.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(str)) return false;
  // Emoji regex match
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
  return emojiRegex.test(str);
}

// ==========================================
// OFFENSIVE & INAPPROPRIATE NAMES FILTER
// ==========================================
const OFFENSIVE_ROOTS = [
  // Arabic profanity, insults & vulgar roots
  'شرموط', 'قحب', 'منيوك', 'ديوث', 'عرص', 'خنيث', 'طيز', 'كس', 'زب', 'سكس', 'نيك', 'قواد', 
  'سافل', 'حقير', 'واطي', 'نجس', 'كلب', 'حمار', 'جحش', 'ابنحرام', 'ولدحرام', 'تفوه',
  'لوطي', 'شاذ', 'عاهر', 'بظر', 'مني', 'مؤخرة', 'صدرك', 'محنه', 'ممحون', 'شهوه', 'ارهاب', 'داعش',
  'حرامي', 'شحات', 'حقود', 'خسيس', 'نذل',
  // English profanity & vulgar roots
  'fuck', 'shit', 'bitch', 'whore', 'slut', 'dick', 'pussy', 'asshole', 'cunt', 'porn', 
  'sex', 'nigger', 'nigga', 'fag', 'cock', 'penis', 'vagina', 'boobs'
];

function isOffensiveName(rawName) {
  if (!rawName) return false;
  const raw = String(rawName).toLowerCase();
  const norm = raw
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[\s\.\-_,،\/\\+=*!#%^&()\[\]{}|:;\'\"<>?~`]/g, '');

  const collapsed = norm.replace(/(.)\1+/g, '$1');

  for (const root of OFFENSIVE_ROOTS) {
    if (norm.includes(root)) return true;
    const colRoot = root.replace(/(.)\1+/g, '$1');
    if (collapsed.includes(colRoot)) return true;
  }
  return false;
}

// ==========================================
// REALISTIC HUMAN-LIKE AI PERSONAS & STRATEGY
// ==========================================
const AI_PERSONAS = [
  {
    name: 'سلطان الـ AI 👑',
    avatar: '👑',
    persona: 'استراتيجي محنك',
    style: 'strategic', // Saves budget, values score-to-cost ratio, bids prudently
    maxBidPct: 0.38,
    patience: 3500
  },
  {
    name: 'نورة الذكية 💡',
    avatar: '💡',
    persona: 'قناصة الثواني الأخيرة',
    style: 'sniper', // waits until timer <= 4s and snipes!
    maxBidPct: 0.48,
    patience: 11000
  },
  {
    name: 'بدر المحنك 🕶️',
    avatar: '🕶️',
    persona: 'تكتيكي متوازن',
    style: 'balanced', // bids steady, counter-bids if someone overtakes him
    maxBidPct: 0.40,
    patience: 2500
  },
  {
    name: 'مشعل الحماسي 🔥',
    avatar: '🔥',
    persona: 'متهور وراعي فزعة',
    style: 'aggressive', // pushes bids high to intimidate players
    maxBidPct: 0.55,
    patience: 1800
  },
  {
    name: 'فيصل الشريطي 🤝',
    avatar: '🤝',
    persona: 'صائد الصفقات',
    style: 'bargain_hunter', // only bids if price is low compared to score
    maxBidPct: 0.30,
    patience: 3800
  },
  {
    name: 'سارة التقنية ⚡',
    avatar: '⚡',
    persona: 'خوارزمية ذكية',
    style: 'analytical', // calculates optimal ROI
    maxBidPct: 0.42,
    patience: 2800
  },
  {
    name: 'سعود التكتيكي 🧠',
    avatar: '🧠',
    persona: 'عقل مدبر ومقالب',
    style: 'saboteur', // balances bids and loves using sabotage cards
    maxBidPct: 0.45,
    patience: 2600
  }
];

function scheduleAiBotsBidding(room) {
  const bots = room.players.filter(p => p.isBot && p.isAlive && !p.frozen);
  if (bots.length === 0) return;

  const offer = room.currentOffer;
  if (!offer) return;

  bots.forEach(bot => {
    // 1. Valuation based on personality & style
    let multiplier = 1.1;
    if (bot.style === 'aggressive') multiplier = 1.35;
    else if (bot.style === 'strategic') multiplier = 1.05;
    else if (bot.style === 'bargain_hunter') multiplier = 0.85;
    else if (bot.style === 'sniper') multiplier = 1.25;

    const maxValuation = Math.min(
      bot.budget,
      Math.max(2, Math.round(offer.price * multiplier)),
      Math.floor(bot.budget * (bot.maxBidPct || 0.45))
    );

    // If bot cannot afford even minimum 1 SAR or doesn't value it:
    if (maxValuation < 1) {
      setTimeout(() => {
        if (room.state !== 'playing' || !room.liveAuction) return;
        bot.hasPassed = true;
        checkAuctionAllPassed(room);
      }, 2500 + Math.random() * 2000);
      return;
    }

    // 2. Schedule human-like bidding times
    if (bot.style === 'sniper') {
      // Sniper waits for the final 3-4 seconds!
      const sniperDelay = Math.max(1000, (15 - Math.floor(2 + Math.random() * 2.5)) * 1000);
      setTimeout(() => {
        if (room.state !== 'playing' || !room.liveAuction) return;
        if (bot.hasPassed || room.liveAuction.highestBidderId === bot.id) return;
        const nextBid = room.liveAuction.highestBid + 1;
        if (nextBid <= maxValuation && nextBid <= bot.budget) {
          executeAiBid(room, bot, nextBid, `🎯 قناص الثواني الأخيرة! ${bot.name} خطف السومة بـ ${nextBid} ر.س!`);
        } else {
          bot.hasPassed = true;
          checkAuctionAllPassed(room);
        }
      }, sniperDelay);
    } else {
      // Normal bot evaluates after human-like hesitation delay
      const hesitation = 2000 + Math.random() * 4500;
      setTimeout(() => {
        if (room.state !== 'playing' || !room.liveAuction) return;
        if (bot.hasPassed || room.liveAuction.highestBidderId === bot.id) return;
        const nextBid = room.liveAuction.highestBid + 1;
        if (nextBid <= maxValuation && nextBid <= bot.budget) {
          executeAiBid(room, bot, nextBid);
        } else {
          bot.hasPassed = true;
          checkAuctionAllPassed(room);
        }
      }, hesitation);
    }

    // 3. Sabotage Card trigger (Round >= 2, 30% probability)
    if (room.round >= 2 && bot.sabotageCards && bot.sabotageCards.length > 0 && Math.random() < 0.3) {
      setTimeout(() => {
        if (room.state !== 'playing') return;
        const humanOpponents = room.players.filter(p => !p.isBot && p.isAlive);
        if (humanOpponents.length > 0) {
          // Target opponent with highest budget
          humanOpponents.sort((a, b) => b.budget - a.budget);
          const target = humanOpponents[0];
          const card = bot.sabotageCards.shift();
          target.budget = Math.max(0, target.budget - 4);
          broadcastRoom(room, {
            type: 'SABOTAGE_TRIGGERED',
            actorName: bot.name,
            targetName: target.name,
            cardName: 'ساهر 📸',
            message: `📸 رصد ساهر مخالفة مفاجئة من ${bot.name} على ${target.name} وخصم 4 ر.س!`
          });
        }
      }, 4000 + Math.random() * 4000);
    }
  });
}

function executeAiBid(room, bot, amount, customMsg = null) {
  if (!room.liveAuction || room.state !== 'playing') return;
  if (amount <= room.liveAuction.highestBid || amount > bot.budget) return;

  room.liveAuction.highestBid = amount;
  room.liveAuction.highestBidderId = bot.id;
  room.liveAuction.highestBidderName = bot.name;
  room.liveAuction.highestBidderAvatar = bot.avatar;

  if (room.liveAuction.timerSec < 5) {
    room.liveAuction.timerSec = 5;
  }

  const aiPhrases = [
    `🔨 رفع ${bot.avatar} ${bot.name} السومة إلى ${amount} ر.س!`,
    `⚡ ${bot.name}: "القطعة هذي نازلة لمشروعي لا تعاندون!" (${amount} ر.س)`,
    `🔥 ${bot.name}: "زودت السومة إلى ${amount} ر.س ومستمر!"`,
    `💎 ${bot.name}: "تكتيك ذكي بـ ${amount} ر.س!"`
  ];
  const msg = customMsg || aiPhrases[Math.floor(Math.random() * aiPhrases.length)];

  broadcastRoom(room, {
    type: 'BID_PLACED',
    highestBid: amount,
    highestBidderId: bot.id,
    highestBidderName: bot.name,
    highestBidderAvatar: bot.avatar,
    timer: room.liveAuction.timerSec,
    message: msg
  });
}

function triggerAiCounterBids(room, excludePlayerId) {
  if (!room.liveAuction || room.state !== 'playing') return;
  const bots = room.players.filter(p => p.isBot && p.isAlive && !p.frozen && p.id !== excludePlayerId && !p.hasPassed);
  if (bots.length === 0) return;

  bots.forEach(bot => {
    let multiplier = (bot.style === 'aggressive') ? 1.4 : 1.1;
    const maxValuation = Math.min(
      bot.budget,
      Math.max(2, Math.round(room.currentOffer.price * multiplier)),
      Math.floor(bot.budget * (bot.maxBidPct || 0.45))
    );

    const nextBid = room.liveAuction.highestBid + 1;
    if (nextBid <= maxValuation && nextBid <= bot.budget) {
      const reactionDelay = 2200 + Math.random() * 3500;
      setTimeout(() => {
        if (room.state !== 'playing' || !room.liveAuction) return;
        if (bot.hasPassed || room.liveAuction.highestBidderId === bot.id) return;
        if (room.liveAuction.highestBid + 1 <= maxValuation && room.liveAuction.highestBid + 1 <= bot.budget) {
          executeAiBid(room, bot, room.liveAuction.highestBid + 1, `⚔️ رد سريع من ${bot.name} بسومة ${room.liveAuction.highestBid + 1} ر.س!`);
        } else {
          bot.hasPassed = true;
          checkAuctionAllPassed(room);
        }
      }, reactionDelay);
    } else {
      setTimeout(() => {
        if (room.state !== 'playing' || !room.liveAuction) return;
        if (!bot.hasPassed) {
          bot.hasPassed = true;
          checkAuctionAllPassed(room);
        }
      }, 1500 + Math.random() * 2000);
    }
  });
}

function createRoom(hostPlayer, options = {}) {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const room = {
    code: code,
    createdAt: Date.now(),
    codeExpiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    hostId: hostPlayer.id,
    players: [hostPlayer],
    theme: options.theme || 'car',
    budget: options.budget || 25,
    mode: options.mode || 'ffa', // ffa | coop | survival
    curtain: options.curtain !== false, // default true
    state: 'lobby', // lobby | playing | auction | results
    round: 0,
    totalRounds: 6,
    currentOffer: null,
    roundTimerSec: 30,
    roundTimerInterval: null,
    codeTimerInterval: null,
    auctionData: null,
    usedOfferIds: [],
    bannedNames: new Set(),
    bannedIds: new Set(),
    history: []
  };

  // Determine rounds based on budget
  room.totalRounds = calculateRounds(room.budget);

  // Setup 10-minute code refresh interval
  startRoomCodeTimer(room);

  rooms.set(code, room);
  return room;
}

function calculateRounds(budget) {
  if (budget >= 200) return 14;
  if (budget >= 100) return 10;
  if (budget >= 50) return 8;
  return 6;
}

function startRoomCodeTimer(room) {
  if (room.codeTimerInterval) clearInterval(room.codeTimerInterval);
  room.codeTimerInterval = setInterval(() => {
    // Never expire or change code while game is actively playing or in results!
    if (room.state === 'playing' || room.state === 'auction' || room.state === 'results') {
      room.codeExpiresAt = Date.now() + 10 * 60 * 1000;
      return;
    }
    const remaining = Math.max(0, Math.floor((room.codeExpiresAt - Date.now()) / 1000));
    if (remaining <= 0) {
      room.code = generateCode();
      room.codeExpiresAt = Date.now() + 10 * 60 * 1000;
      broadcastRoom(room, {
        type: 'CODE_RENEWED',
        code: room.code,
        expiresIn: 600,
        message: '🔄 تم تجديد كود الغرفة السري لمدة 10 دقائق جديدة تلقائياً!'
      });
    }
  }, 1000);
}

function getSafeRoomView(room, forPlayerId) {
  // Anti-cheat: hide opponent upgrades and SVG state when curtain is ON during gameplay
  const hideDetails = room.curtain && room.state === 'playing';

  const sanitizedPlayers = room.players.map(p => {
    const isSelf = p.id === forPlayerId;
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === room.hostId,
      isBot: p.isBot || false,
      isReady: (p.id === room.hostId || p.isBot) ? true : Boolean(p.isReady),
      style: p.style || null,
      persona: p.persona || null,
      budget: p.budget,
      score: p.score,
      isAlive: p.isAlive,
      hasChosen: p.hasChosen,
      hasPassed: p.hasPassed || false,
      upgradesCount: p.upgrades.length,
      frozen: p.frozen,
      // Only reveal full upgrades to self, or when curtain is off, or game finished
      upgrades: (!hideDetails || isSelf) ? p.upgrades : null,
      sabotageCards: isSelf ? p.sabotageCards : [],
      secretContract: (isSelf || room.state === 'results') ? p.secretContract : null
    };
  });

  const remainingCodeSeconds = Math.max(0, Math.floor((room.codeExpiresAt - Date.now()) / 1000));

  return {
    code: room.code,
    hostId: room.hostId,
    theme: room.theme,
    budget: room.budget,
    mode: room.mode,
    curtain: room.curtain,
    state: room.state,
    round: room.round,
    totalRounds: room.totalRounds,
    codeExpiresIn: remainingCodeSeconds,
    currentOffer: room.currentOffer,
    liveAuction: room.liveAuction ? {
      offer: room.liveAuction.currentOffer,
      highestBid: room.liveAuction.highestBid,
      highestBidderId: room.liveAuction.highestBidderId,
      highestBidderName: room.liveAuction.highestBidderName,
      highestBidderAvatar: room.liveAuction.highestBidderAvatar,
      timerSec: room.liveAuction.timerSec
    } : null,
    auctionData: room.auctionData ? {
      name: room.auctionData.name,
      desc: room.auctionData.desc,
      startBid: room.auctionData.startBid,
      bonus: room.auctionData.scoreBonus
    } : null,
    players: sanitizedPlayers
  };
}

function broadcastRoom(room, data = null) {
  room.players.forEach(p => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      const payload = data ? { ...data, room: getSafeRoomView(room, p.id) } : { type: 'ROOM_UPDATE', room: getSafeRoomView(room, p.id) };
      p.ws.send(JSON.stringify(payload));
    }
  });
}

// ==========================================
// 3. GAMEPLAY ENGINE & ROUND TIMER
// ==========================================

function startGame(room) {
  if (room.players.length < 1) return;
  room.state = 'playing';
  room.round = 0;
  room.usedOfferIds = [];
  room.totalRounds = calculateRounds(room.budget);

  // Distribute one random sabotage card & one secret contract to each player
  const themeContracts = CONTRACTS[room.theme] || CONTRACTS.car;
  room.players.forEach((p, idx) => {
    p.budget = room.budget;
    p.score = 10;
    p.upgrades = [];
    p.hasChosen = false;
    p.isAlive = true;
    p.frozen = false;
    const card = SABOTAGE_CARDS[Math.floor(Math.random() * SABOTAGE_CARDS.length)];
    p.sabotageCards = [{ ...card, id: card.id + '_' + Date.now() }];
    // Assign secret contract
    const contract = themeContracts[idx % themeContracts.length];
    p.secretContract = { ...contract };
  });

  startNextRound(room);
}

function startNextRound(room) {
  if (room.roundTimerInterval) clearInterval(room.roundTimerInterval);

  room.round++;

  // Check if game over
  if (room.round > room.totalRounds) {
    endGame(room);
    return;
  }

  // Check random emergency event (25% chance on rounds > 1)
  let triggeredEvent = null;
  if (room.round > 1 && Math.random() < 0.35) {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    event.effect(room);
    triggeredEvent = { title: event.title, desc: event.desc };
  }

  const themeData = THEMES[room.theme] || THEMES.car;
  if (!room.usedOfferIds) room.usedOfferIds = [];

  // Exclude previously presented items in this session to eliminate repetition
  let availableOffers = themeData.upgrades.filter(u => !room.usedOfferIds.includes(u.id));
  if (availableOffers.length === 0) {
    room.usedOfferIds = [];
    availableOffers = [...themeData.upgrades];
  }

  // Pick random item from available unused choices
  const pickedIndex = Math.floor(Math.random() * availableOffers.length);
  room.currentOffer = availableOffers[pickedIndex];
  room.usedOfferIds.push(room.currentOffer.id);

  // Setup Live Auction for this item (30 seconds per round)
  room.liveAuction = {
    currentOffer: room.currentOffer,
    highestBid: 0,
    highestBidderId: null,
    highestBidderName: null,
    highestBidderAvatar: null,
    timerSec: 30
  };

  // Reset player choices for this round
  room.players.forEach(p => {
    p.hasChosen = false;
    p.hasPassed = false;
    if (p.frozen) p.frozen = false;
  });

  broadcastRoom(room, {
    type: 'AUCTION_ROUND_STARTED',
    round: room.round,
    theme: room.theme,
    totalRounds: room.totalRounds,
    offer: room.currentOffer,
    event: triggeredEvent,
    highestBid: 0,
    highestBidderName: 'لا توجد سومة حتى الآن',
    timer: room.liveAuction.timerSec
  });

  // Schedule smart AI Bots decisions
  scheduleAiBotsBidding(room);

  // Active 15-second countdown with sniper-extension
  room.roundTimerInterval = setInterval(() => {
    room.liveAuction.timerSec--;

    // Broadcast timer tick
    room.players.forEach(p => {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({
          type: 'AUCTION_TIMER_TICK',
          timer: room.liveAuction.timerSec,
          highestBid: room.liveAuction.highestBid,
          highestBidderName: room.liveAuction.highestBidderName
        }));
      }
    });

    if (room.liveAuction.timerSec <= 0) {
      resolveLiveAuction(room);
    }
  }, 1000);
}

function resolveLiveAuction(room) {
  if (room.roundTimerInterval) clearInterval(room.roundTimerInterval);

  if (room.liveAuction && room.liveAuction.highestBidderId) {
    const winner = room.players.find(p => p.id === room.liveAuction.highestBidderId);
    if (winner) {
      winner.budget = Math.max(0, winner.budget - room.liveAuction.highestBid);
      winner.score += room.liveAuction.currentOffer.score;
      winner.upgrades.push({
        ...room.liveAuction.currentOffer,
        winningBid: room.liveAuction.highestBid,
        roundWon: room.round
      });

      broadcastRoom(room, {
        type: 'AUCTION_ITEM_WON',
        winnerId: winner.id,
        winnerName: winner.name,
        winnerAvatar: winner.avatar,
        amount: room.liveAuction.highestBid,
        offer: room.liveAuction.currentOffer,
        message: `🔨 رسا المزاد رسمياً على ${winner.avatar} ${winner.name} بمبلغ ${room.liveAuction.highestBid} ر.س!`
      });
    }
  } else {
    broadcastRoom(room, {
      type: 'AUCTION_ITEM_PASSED',
      offer: room.liveAuction ? room.liveAuction.currentOffer : null,
      message: '❌ انتهى الوقت ولم يزايد أحد على هذه القطعة، تم التخطي للمرحلة القادمة!'
    });
  }

  // Proceed to next round after 2.5 seconds
  setTimeout(() => startNextRound(room), 2500);
}

function checkAuctionAllPassed(room) {
  const activePlayers = room.players.filter(p => p.isAlive);
  const remainingBidders = activePlayers.filter(p => !p.hasPassed);

  // If everyone passed except the highest bidder (or all passed with no bids)
  if (remainingBidders.length === 0 || (remainingBidders.length === 1 && remainingBidders[0].id === room.liveAuction.highestBidderId)) {
    resolveLiveAuction(room);
  }
}

// Midway Auction
function triggerAuction(room) {
  room.hasHadAuction = true;
  room.state = 'auction';
  const item = AUCTION_ITEMS[room.theme] || AUCTION_ITEMS.car;
  room.auctionData = { ...item, bids: {} };

  broadcastRoom(room, {
    type: 'AUCTION_STARTED',
    item: item,
    message: '🔨 بدأت جولة المزاد السري « حراج »! اكتب سراً كم تدفع للفوز بهذه القطعة النادرة!'
  });

  // 25 seconds for auction
  let auctionSec = 25;
  room.roundTimerInterval = setInterval(() => {
    auctionSec--;
    room.players.forEach(p => {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({ type: 'TIMER_TICK', timer: auctionSec }));
      }
    });
    if (auctionSec <= 0) {
      resolveAuction(room);
    }
  }, 1000);
}

function resolveAuction(room) {
  clearInterval(room.roundTimerInterval);
  room.state = 'playing';

  const bids = room.auctionData.bids;
  let highestBid = -1;
  let winner = null;

  room.players.forEach(p => {
    const bid = parseInt(bids[p.id]) || 0;
    if (bid > highestBid && bid <= p.budget) {
      highestBid = bid;
      winner = p;
    }
  });

  let resultMsg = 'لم يفز أحد بالمزاد!';
  if (winner && highestBid >= (room.auctionData.startBid || 1)) {
    winner.budget -= highestBid;
    winner.score += room.auctionData.scoreBonus;
    winner.upgrades.push({
      id: 'auction_asset',
      name: room.auctionData.name,
      price: highestBid,
      score: room.auctionData.scoreBonus,
      desc: room.auctionData.desc,
      isAuctionAsset: true
    });
    resultMsg = `🔨 مبروك للاعب ${winner.avatar} ${winner.name}! فاز بالمزاد بمبلغ ${highestBid} ر.س وأضاف (+${room.auctionData.scoreBonus} نقطة)!`;
  }

  room.auctionData = null;
  broadcastRoom(room, {
    type: 'AUCTION_RESOLVED',
    message: resultMsg
  });

  setTimeout(() => startNextRound(room), 2500);
}

// End Game & AI Judge Evaluation
function endGame(room) {
  room.state = 'results';
  if (room.roundTimerInterval) clearInterval(room.roundTimerInterval);

  const themeData = THEMES[room.theme] || THEMES.car;

  // Calculate final score = quality score + (remaining budget * 1.5) + contract bonus
  room.players.forEach(p => {
    const savingsBonus = Math.round(p.budget * 1.5);
    let contractBonus = 0;
    if (p.secretContract && p.secretContract.slots) {
      const ownedTags = p.upgrades.map(u => (u.tag || '').toLowerCase() + ' ' + (u.name || '').toLowerCase());
      const fulfilled = p.secretContract.slots.every(slotKey => {
        return ownedTags.some(ot => ot.includes(slotKey));
      });
      if (fulfilled) {
        contractBonus = p.secretContract.bonus || 35;
        p.contractFulfilled = true;
      }
    }
    p.contractBonus = contractBonus;
    p.finalScore = p.score + savingsBonus + contractBonus;
  });

  // Sort descending with definitive 4-tier tie-breaker:
  // 1. finalScore -> 2. Remaining Budget -> 3. Contract Fulfilled -> 4. Upgrade count
  room.players.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.budget !== a.budget) return b.budget - a.budget;
    const aCon = a.contractFulfilled ? 1 : 0;
    const bCon = b.contractFulfilled ? 1 : 0;
    if (bCon !== aCon) return bCon - aCon;
    return (b.upgrades?.length || 0) - (a.upgrades?.length || 0);
  });

  // Percentage distribution (pool total = 100%)
  const pool = room.players.reduce((sum, p) => sum + p.finalScore, 0) || 1;
  room.players.forEach(p => {
    p.percentage = Math.max(1, Math.round((p.finalScore / pool) * 100));
  });

  // Ensure total adds up to exactly 100
  const currentTotal = room.players.reduce((sum, p) => sum + p.percentage, 0);
  if (currentTotal !== 100 && room.players.length > 0) {
    room.players[0].percentage += (100 - currentTotal);
  }

  const champion = room.players[0];
  const runnerUp = room.players[1] || null;
  const third = room.players[2] || null;

  // Generate concise, clean and punchy AI commentary object
  const verdictReason = champion.budget >= 5
    ? `أدار ميزانيته بذكاء استثماري، وركّب قطعاً نوعية لـ (${themeData.title})، واحتفظ بـ (${champion.budget} ر.س) منعته من الطفرة!`
    : `جازف بكل ما في جيبه حتى آخر قرش وصنع أفخم تحفة فنية تستحق الصدارة المطلقة!`;

  const runnerUpText = runnerUp
    ? `الوصيف ${runnerUp.name} حقق ${runnerUp.percentage}% وبنى مشروعاً رائعاً، لكن إدارة الرصيد حسمت اللقب.`
    : '';

  const aiCommentary = {
    championName: champion.name,
    championAvatar: champion.avatar,
    percentage: champion.percentage,
    headline: `يتوّج الذكاء الاصطناعي اللاعب «${champion.name}» بطلاً للجلسة بنسبة ${champion.percentage}%!`,
    verdict: verdictReason,
    runnerUpNote: runnerUpText
  };

  // Lift curtain and reveal all projects
  broadcastRoom(room, {
    type: 'GRAND_REVEAL',
    podium: {
      first: champion ? { id: champion.id, name: champion.name, avatar: champion.avatar, pct: champion.percentage, score: champion.finalScore, budget: champion.budget, upgrades: champion.upgrades } : null,
      second: runnerUp ? { id: runnerUp.id, name: runnerUp.name, avatar: runnerUp.avatar, pct: runnerUp.percentage, score: runnerUp.finalScore, budget: runnerUp.budget, upgrades: runnerUp.upgrades } : null,
      third: third ? { id: third.id, name: third.name, avatar: third.avatar, pct: third.percentage, score: third.finalScore, budget: third.budget, upgrades: third.upgrades } : null
    },
    rankings: room.players.map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      percentage: p.percentage,
      finalScore: p.finalScore,
      budget: p.budget,
      upgrades: p.upgrades
    })),
    commentary: aiCommentary
  });
}

// ==========================================
// 4. WEBSOCKET MESSAGE DISPATCHER
// ==========================================

wss.on('connection', (ws) => {
  let playerSession = { id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000), roomCode: null };

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {

        // 1. CREATE ROOM
                // PONG HEARTBEAT RESPONSE
        case 'PONG': {
          playerSession.lastActive = Date.now();
          break;
        }

        // 2b. RECONNECT EXISTING SESSION (GRACE PERIOD)
        case 'RECONNECT_SESSION': {
          const { code, playerId } = data;
          const cleanCode = String(code || '').replace('#', '').trim();
          const room = rooms.get(cleanCode);
          if (!room) return;
          const player = room.players.find(p => p.id === playerId);
          if (!player) return;

          player.isDisconnected = false;
          player.ws = ws;
          playerSession.id = player.id;
          playerSession.roomCode = room.code;

          ws.send(JSON.stringify({
            type: 'RECONNECTED_SUCCESS',
            playerId: player.id,
            isHost: (player.id === room.hostId),
            room: getSafeRoomView(room, player.id)
          }));

          broadcastRoom(room, {
            type: 'PLAYER_RECONNECTED',
            playerName: player.name,
            message: `⚡ عاد ${player.name} إلى الغرفة واستعاد مكانه بنجاح!`
          });
          break;
        }
        case 'CREATE_ROOM': {
          const { name, avatar, options } = data;
          if (!name || !name.trim()) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الاسم إلزامي لإنشاء الغرفة!' }));
          }
          if (isOffensiveName(name)) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: '⚠️ عذراً، هذا الاسم غير لائق أو خادش! يرجى اختيار اسم محترم يليق باللعبة.' }));
          }
          if (avatar && !isValidEmoji(avatar)) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الأيقونة يجب أن تكون إيموجي فقط من الكيبورد!' }));
          }

          const hostPlayer = {
            id: playerSession.id,
            ws: ws,
            name: name.trim().slice(0, 18),
            avatar: avatar || '🏎️',
            budget: options?.budget || 25,
            score: 10,
            upgrades: [],
            sabotageCards: [],
            hasChosen: false,
            isAlive: true,
            frozen: false,
            isReady: true
          };

          const room = createRoom(hostPlayer, options || {});
          playerSession.roomCode = room.code;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            playerId: hostPlayer.id,
            room: getSafeRoomView(room, hostPlayer.id)
          }));
          break;
        }

        // 2. JOIN ROOM
        case 'JOIN_ROOM': {
          const { code, name, avatar } = data;
          if (!name || !name.trim()) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الاسم إلزامي للانضمام!' }));
          }
          if (isOffensiveName(name)) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: '⚠️ عذراً، هذا الاسم غير لائق أو خادش! يرجى اختيار اسم محترم يليق باللعبة.' }));
          }
          if (avatar && !isValidEmoji(avatar)) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الأيقونة يجب أن تكون إيموجي فقط من الكيبورد!' }));
          }

          const cleanCode = String(code || '').replace('#', '').trim();
          const room = rooms.get(cleanCode);

          if (!room) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'كود الغرفة غير موجود أو انتهت صلاحيته!' }));
          }
          if (room.state !== 'lobby') {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'اللعبة بدأت بالفعل في هذه الغرفة!' }));
          }
          if (room.players.length >= 8) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الغرفة ممتلئة (الحد الأقصى 8 لاعبين)!' }));
          }
          if (room.bannedNames && (room.bannedNames.has(name.trim().toLowerCase()) || room.bannedIds.has(playerSession.id))) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: '🚫 لقد تم استبعادك من هذه الغرفة، ولا يمكنك الدخول إليها مجدداً!' }));
          }

          const player = {
            id: playerSession.id,
            ws: ws,
            name: name.trim().slice(0, 18),
            avatar: avatar || '🕶️',
            budget: room.budget,
            score: 10,
            upgrades: [],
            sabotageCards: [],
            hasChosen: false,
            isAlive: true,
            frozen: false,
            isReady: false
          };

          room.players.push(player);
          playerSession.roomCode = room.code;

          ws.send(JSON.stringify({
            type: 'JOINED_SUCCESS',
            playerId: player.id,
            room: getSafeRoomView(room, player.id)
          }));

          broadcastRoom(room);
          break;
        }

        // 3. REFRESH CODE MANUALLY
        case 'REFRESH_CODE': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.hostId !== playerSession.id) return;
          const oldCode = room.code;
          rooms.delete(oldCode);
          room.code = generateCode();
          room.codeExpiresAt = Date.now() + 10 * 60 * 1000;
          rooms.set(room.code, room);
          broadcastRoom(room, {
            type: 'CODE_RENEWED',
            code: room.code,
            expiresIn: 600,
            message: '🔄 تم تجديد كود الغرفة السري لمدة 10 دقائق بنجاح!'
          });
          break;
        }

        // 4. UPDATE ROOM SETTINGS (HOST ONLY)
        case 'UPDATE_SETTINGS': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.hostId !== playerSession.id || room.state !== 'lobby') return;
          if (data.theme && THEMES[data.theme]) room.theme = data.theme;
          if (data.budget && [25, 50, 100, 200].includes(Number(data.budget))) {
            room.budget = Number(data.budget);
            room.totalRounds = calculateRounds(room.budget);
          }
          if (data.mode) room.mode = data.mode;
          if (typeof data.curtain === 'boolean') room.curtain = data.curtain;
          broadcastRoom(room);
          break;
        }

        // 4b. ADD AI BOT (HOST ONLY)
        case 'ADD_AI_BOT': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.state !== 'lobby') {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'لم يتم العثور على الغرفة!' }));
          }
          if (room.players.length >= 8) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'الغرفة ممتلئة بالكامل (8 لاعبين)!' }));
          }

          const existingNames = new Set(room.players.map(p => p.name));
          const availablePersonas = AI_PERSONAS.filter(p => !existingNames.has(p.name));
          const persona = availablePersonas.length > 0
            ? availablePersonas[Math.floor(Math.random() * availablePersonas.length)]
            : { name: 'سلطان الـ AI 👑', avatar: '👑', persona: 'استراتيجي محنك', style: 'strategic', maxBidPct: 0.38, patience: 3500 };

          const botPlayer = {
            id: 'bot_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            ws: null,
            isBot: true,
            style: persona.style,
            persona: persona.persona,
            maxBidPct: persona.maxBidPct,
            patience: persona.patience,
            name: persona.name,
            avatar: persona.avatar,
            budget: room.budget,
            score: 10,
            upgrades: [],
            sabotageCards: [{ id: 'saher_' + Date.now(), name: 'ساهر 📸', rarity: 'common', desc: 'خصم مخالفة فورية 4 ر.س' }],
            hasChosen: false,
            hasPassed: false,
            isAlive: true,
            frozen: false,
            isReady: true
          };

          room.players.push(botPlayer);
          broadcastRoom(room, {
            type: 'AI_BOT_ADDED',
            botName: botPlayer.name,
            message: `🤖 انضم اللاعب الذكي (${botPlayer.name}) للغرفة!`
          });
          break;
        }

        // 4c. REMOVE AI BOT (HOST ONLY)
        case 'REMOVE_AI_BOT': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.state !== 'lobby') return;
          const botIdx = room.players.findIndex(p => p.id === data.botId && p.isBot);
          if (botIdx !== -1) {
            const removed = room.players.splice(botIdx, 1)[0];
            broadcastRoom(room, {
              type: 'AI_BOT_REMOVED',
              message: `🚪 تم استبعاد (${removed.name}) من الغرفة.`
            });
          }
          break;
        }

        // 4d. TOGGLE READY (JOINED PLAYERS)
        case 'TOGGLE_READY': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.state !== 'lobby') return;
          const player = room.players.find(p => p.id === playerSession.id);
          if (!player) return;
          // Host is always ready, cannot toggle unready
          if (player.id === room.hostId) {
            player.isReady = true;
            return;
          }
          player.isReady = !player.isReady;
          broadcastRoom(room, {
            type: 'PLAYER_READY_CHANGED',
            playerId: player.id,
            playerName: player.name,
            isReady: player.isReady
          });
          break;
        }

        // 4e. KICK PLAYER (HOST CAN KICK ANY PLAYER OR BOT)
        case 'KICK_PLAYER': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.hostId !== playerSession.id || room.state !== 'lobby') return;
          const targetId = data.playerId || data.botId;
          const targetPlayer = room.players.find(p => p.id === targetId);
          if (!targetPlayer) return;
          if (targetPlayer.id === room.hostId || targetPlayer.id === playerSession.id) return; // Cannot kick host or self

          // Add to permanent ban list for this room
          if (!room.bannedNames) room.bannedNames = new Set();
          if (!room.bannedIds) room.bannedIds = new Set();
          room.bannedNames.add(targetPlayer.name.trim().toLowerCase());
          room.bannedIds.add(targetPlayer.id);

          // Clear kicked player's room association and notify them immediately
          if (targetPlayer.ws && targetPlayer.ws.readyState === WebSocket.OPEN) {
            targetPlayer.ws.send(JSON.stringify({
              type: 'KICKED_FROM_ROOM',
              message: '🚪 تم استبعادك من الغرفة بواسطة صانع الغرفة.'
            }));
          }

          // Filter out the player from room
          room.players = room.players.filter(p => p.id !== targetId);

          broadcastRoom(room, {
            type: 'PLAYER_KICKED',
            kickedName: targetPlayer.name,
            message: `🚪 تم طرد اللاعب (${targetPlayer.name}) من الغرفة.`
          });
          break;
        }

        // 5. START GAME (HOST ONLY)
        case 'START_GAME': {
          const roomCode = playerSession.roomCode || (data.code ? String(data.code).replace('#', '').trim() : null);
          const room = rooms.get(roomCode);
          if (!room || room.hostId !== playerSession.id || room.state !== 'lobby') return;

          // Strictly enforce: ALL guest players must be ready! (Host & Bots are always ready)
          const unreadyGuests = room.players.filter(p => p.id !== room.hostId && !p.isBot && !p.isReady);
          if (unreadyGuests.length > 0) {
            const names = unreadyGuests.map(p => p.name).join('، ');
            return ws.send(JSON.stringify({
              type: 'ERROR',
              message: `⚠️ لا يمكن بدء التحدي! بانتظار ضغط زر "جاهز" من اللاعبين: ${names}`
            }));
          }

          if (data.theme && THEMES[data.theme]) {
            room.theme = data.theme;
          }
          if (data.budget && [25, 50, 100, 200].includes(Number(data.budget))) {
            room.budget = Number(data.budget);
            room.totalRounds = calculateRounds(room.budget);
          }
          if (data.mode) room.mode = data.mode;
          if (typeof data.curtain === 'boolean') room.curtain = data.curtain;
          startGame(room);
          break;
        }

        // 6. LIVE BIDDING: SUBMIT BID
        case 'PLACE_BID': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'playing' || !room.liveAuction) return;
          const player = room.players.find(p => p.id === playerSession.id);
          if (!player || !player.isAlive || player.frozen || player.hasPassed) return;

          // Anti-Self Bidding: Cannot bid against oneself
          if (room.liveAuction.highestBidderId === player.id) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: '⚠️ أنت صاحب أعلى سومة حالياً! لا يمكنك المزايدة على نفسك.' }));
          }

          const amount = parseInt(data.amount) || 0;
          if (amount <= room.liveAuction.highestBid) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: `السومة يجب أن تكون أعلى من ${room.liveAuction.highestBid} ر.س!` }));
          }
          if (amount > player.budget) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'ميزانيتك لا تكفي لهذه السومة!' }));
          }

          room.liveAuction.highestBid = amount;
          room.liveAuction.highestBidderId = player.id;
          room.liveAuction.highestBidderName = player.name;
          room.liveAuction.highestBidderAvatar = player.avatar;

          // Anti-Sniper Extension with Maximum 3 extensions cap per round
          room.liveAuction.extensionCount = room.liveAuction.extensionCount || 0;
          if (room.liveAuction.timerSec < 5 && room.liveAuction.extensionCount < 3) {
            room.liveAuction.timerSec = 5;
            room.liveAuction.extensionCount++;
          }

          broadcastRoom(room, {
            type: 'BID_PLACED',
            highestBid: amount,
            highestBidderId: player.id,
            highestBidderName: player.name,
            highestBidderAvatar: player.avatar,
            timer: room.liveAuction.timerSec,
            message: `🔨 رفع ${player.avatar} ${player.name} السومة إلى ${amount} ر.س!`
          });

          // Trigger AI counter-bids
          triggerAiCounterBids(room, player.id);
          break;
        }

        // 7. PASS / FOLD CURRENT ITEM
        case 'PASS_BID': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'playing' || !room.liveAuction) return;
          const player = room.players.find(p => p.id === playerSession.id);
          if (!player || !player.isAlive) return;

          player.hasPassed = true;

          broadcastRoom(room, {
            type: 'PLAYER_PASSED',
            playerId: player.id,
            playerName: player.name
          });

          checkAuctionAllPassed(room);
          break;
        }

        // 7. SNEAK PEEK (👁️ 1-second view of opponent project)
        case 'PEEK_OPPONENT': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'playing') return;
          const target = room.players.find(p => p.id === data.targetId);
          if (!target) return;

          // Send snapshot of target project ONLY to requesting player
          ws.send(JSON.stringify({
            type: 'PEEK_SNAPSHOT',
            targetId: target.id,
            name: target.name,
            avatar: target.avatar,
            budget: target.budget,
            score: target.score,
            upgrades: target.upgrades
          }));
          break;
        }

        // 8. USE SABOTAGE CARD 😈
        case 'USE_SABOTAGE': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'playing') return;
          const user = room.players.find(p => p.id === playerSession.id);
          const target = room.players.find(p => p.id === data.targetId);
          if (!user || !target || user.id === target.id) return;

          const cardIndex = user.sabotageCards.findIndex(c => c.id === data.cardId);
          if (cardIndex === -1) return;

          const card = user.sabotageCards.splice(cardIndex, 1)[0];
          let eventDescription = '';

          if (card.type === 'budget_cut') {
            const actualCut = Math.min(target.budget, card.val);
            target.budget = Math.max(0, target.budget - card.val);
            eventDescription = `📸 رصد ساهر مخالفة على اللاعب ${target.avatar} ${target.name} وخصم ${actualCut} ر.س من ميزانيته بتوجيه من ${user.name}!`;
          } else if (card.type === 'sell_last') {
            if (target.upgrades.length === 0) {
              user.sabotageCards.splice(cardIndex, 0, card); // Restore card so it's not wasted
              return ws.send(JSON.stringify({ type: 'ERROR', message: '⚠️ هذا الخصم لا يملك أي قطعة لتشليحها حتى الآن! احتفظت بكرتك.' }));
            }
            const removed = target.upgrades.pop();
            const refund = Math.max(1, Math.floor(removed.price / 2));
            target.budget += refund;
            target.score = Math.max(10, target.score - (removed.score || 10));
            eventDescription = `🧰 سطحة وتشليح! أجبر ${user.name} منافسه ${target.name} على فك (${removed.name}) وبيعها بنصف السعر (+${refund} ر.س)!`;
          } else if (card.type === 'freeze_turn') {
            target.frozen = true;
            eventDescription = `🧿 عين حسود! جمّد ${user.name} خيار الشراء للاعب ${target.name} لهذه الجولة!`;
          } else if (card.type === 'swap_piece') {
            if (user.upgrades.length === 0 || target.upgrades.length === 0) {
              user.sabotageCards.splice(cardIndex, 0, card); // Restore card
              return ws.send(JSON.stringify({ type: 'ERROR', message: '⚠️ لا يمكن التبديل! يجب أن تملك أنت وخصمك قطعة واحدة على الأقل. احتفظت بكرتك.' }));
            }
            const myPiece = user.upgrades.pop();
            const targetPiece = target.upgrades.pop();
            user.upgrades.push(targetPiece);
            target.upgrades.push(myPiece);
            user.score = user.score - myPiece.score + targetPiece.score;
            target.score = target.score - targetPiece.score + myPiece.score;
            eventDescription = `🤝 شريطي المعارض! قام ${user.name} بتبديل قطعه إجبارياً مع ${target.name}!`;
          }

          broadcastRoom(room, {
            type: 'SABOTAGE_TRIGGERED',
            message: eventDescription,
            sourceId: user.id,
            targetId: target.id
          });
          break;
        }

        // 9. BLIND AUCTION BID
        case 'SUBMIT_AUCTION_BID': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'auction' || !room.auctionData) return;
          const bidAmount = parseInt(data.bid) || 0;
          room.auctionData.bids[playerSession.id] = bidAmount;

          const player = room.players.find(p => p.id === playerSession.id);
          if (player) {
            broadcastRoom(room, {
              type: 'AUCTION_BID_RECEIVED',
              playerId: player.id
            });
          }

          // If all alive players submitted bids, resolve immediately
          const allBidded = room.players.every(p => room.auctionData.bids[p.id] !== undefined);
          if (allBidded) {
            resolveAuction(room);
          }
          break;
        }

        // 10. LIVE FLOATING REACTIONS 💬
        case 'SEND_REACTION': {
          const room = rooms.get(playerSession.roomCode);
          if (!room) return;
          const player = room.players.find(p => p.id === playerSession.id);
          if (!player) return;

          const emoji = String(data.emoji || '💸').slice(0, 10);
          const text = String(data.text || '').slice(0, 25);

          broadcastRoom(room, {
            type: 'FLOAT_REACTION',
            playerId: player.id,
            senderName: player.name,
            emoji: emoji,
            text: text
          });
          break;
        }

        // 11. PLAY AGAIN (RETURN TO LOBBY)
                // 12. RESELL / SCRAP ITEM TO BANK ( استرداد الكاش 💸 )
        case 'RESELL_ITEM': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.state !== 'playing') return;
          const player = room.players.find(p => p.id === playerSession.id);
          if (!player || !player.isAlive || player.frozen) return;

          const itemIndex = player.upgrades.findIndex(u => u.id === data.itemId);
          if (itemIndex === -1) return;

          const item = player.upgrades.splice(itemIndex, 1)[0];
          // Refund 60% of original price (at least 1 SAR)
          const refundAmount = Math.max(1, Math.round(item.price * 0.6));
          player.budget += refundAmount;
          player.score = Math.max(10, player.score - item.score);

          broadcastRoom(room, {
            type: 'ITEM_RESOLD',
            playerId: player.id,
            playerName: player.name,
            itemName: item.name,
            refund: refundAmount,
            message: `💸 باع ${player.name} قطعة (${item.name}) للبنك واسترد ${refundAmount} ر.س كاش!`
          });
          break;
        }
        case 'PLAY_AGAIN': {
          const room = rooms.get(playerSession.roomCode);
          if (!room || room.hostId !== playerSession.id) return;
          room.state = 'lobby';
          room.round = 0;
          room.currentOffer = null;
          room.hasHadAuction = false;
          room.auctionData = null;
          room.liveAuction = null;
          room.usedOfferIds = []; // Fresh question bank reset!

          const themeContracts = CONTRACTS[room.theme] || CONTRACTS.car;
          room.players.forEach((p, idx) => {
            p.budget = room.budget;
            p.score = 10;
            p.upgrades = [];
            p.hasChosen = false;
            p.hasPassed = false;
            p.isAlive = true;
            p.frozen = false;
            p.contractFulfilled = false;
            p.contractBonus = 0;
            p.finalScore = 0;
            // Guests must re-confirm ready, Host & Bots remain ready
            p.isReady = (p.id === room.hostId || p.isBot);

            const card = SABOTAGE_CARDS[Math.floor(Math.random() * SABOTAGE_CARDS.length)];
            p.sabotageCards = [{ ...card, id: card.id + '_' + Date.now() }];
            const contract = themeContracts[idx % themeContracts.length];
            p.secretContract = { ...contract };
          });
          broadcastRoom(room);
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  // DISCONNECT HANDLER
  ws.on('close', () => {
    if (playerSession.roomCode) {
      const room = rooms.get(playerSession.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== playerSession.id);

        if (room.players.length === 0) {
          clearInterval(room.roundTimerInterval);
          clearInterval(room.codeTimerInterval);
          rooms.delete(playerSession.roomCode);
        } else {
          // If host left, assign new host
          if (room.hostId === playerSession.id && room.players.length > 0) {
            room.hostId = room.players[0].id;
          }
          broadcastRoom(room);
        }
      }
    }
  });
});


// 25-Second WebSocket Keep-Alive Ping (Prevents Render 55s Idle Drop)
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({ type: 'PING' }));
      } catch (e) {}
    }
  });
}, 25000);

server.listen(PORT, () => {
  console.log(`🚀 « على قد جيبك 💸 » Server running at http://localhost:${PORT}`);
});
