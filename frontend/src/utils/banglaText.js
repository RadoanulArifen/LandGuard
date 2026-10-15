const WORDS = {
  // Administrative names used by the parcel dataset.
  narsingdi: 'নরসিংদী', jamalpur: 'জামালপুর', rajshahi: 'রাজশাহী', dinajpur: 'দিনাজপুর', chattogram: 'চট্টগ্রাম', cumilla: 'কুমিল্লা', faridpur: 'ফরিদপুর', rangpur: 'রংপুর', tangail: 'টাঙ্গাইল', gazipur: 'গাজীপুর', narayanganj: 'নারায়ণগঞ্জ', dhaka: 'ঢাকা', khulna: 'খুলনা', netrokona: 'নেত্রকোনা', sylhet: 'সিলেট', bazar: 'বাজার', bogura: 'বগুড়া', bagerhat: 'বাগেরহাট', mymensingh: 'ময়মনসিংহ', habiganj: 'হবিগঞ্জ', moulvibazar: 'মৌলভীবাজার', barishal: 'বরিশাল', patuakhali: 'পটুয়াখালী', jashore: 'যশোর', munshiganj: 'মুন্সিগঞ্জ', natore: 'নাটোর', kushtia: 'কুষ্টিয়া', noakhali: 'নোয়াখালী', feni: 'ফেনী', brahmanbaria: 'ব্রাহ্মণবাড়িয়া', bhola: 'ভোলা', pabna: 'পাবনা', sadar: 'সদর', mouza: 'মৌজা', patiya: 'পটিয়া', birganj: 'বীরগঞ্জ', bhuapur: 'ভূঞাপুর', chandina: 'চান্দিনা', ishwardi: 'ঈশ্বরদী', sitakunda: 'সীতাকুণ্ড', savar: 'সাভার', rupganj: 'রূপগঞ্জ', hathazari: 'হাটহাজারী', muradnagar: 'মুরাদনগর', belabo: 'বেলাবো', bandar: 'বন্দর', paba: 'পবা', ramu: 'রামু', dohar: 'দোহার', disputed: 'বিতর্কিত',
  // Common names and surnames in the synthetic owner records.
  kabir: 'কবির', rahim: 'রহিম', rahman: 'রহমান', sarker: 'সরকার', haque: 'হক', hoque: 'হক', majumder: 'মজুমদার', rashid: 'রশিদ', hossain: 'হোসেন', khan: 'খান', uddin: 'উদ্দিন', alam: 'আলম', mia: 'মিয়া', siddique: 'সিদ্দিক', biswas: 'বিশ্বাস', islam: 'ইসলাম', chowdhury: 'চৌধুরী', mondal: 'মণ্ডল', talukder: 'তালুকদার', zaman: 'জামান', ahmed: 'আহমেদ', sultana: 'সুলতানা', sharif: 'শরীফ', sultan: 'সুলতান', karim: 'করিম', hasan: 'হাসান', sheikh: 'শেখ', nahar: 'নাহার', begum: 'বেগম', khatun: 'খাতুন', jahan: 'জাহান', akter: 'আক্তার', parvin: 'পারভীন', mazumder: 'মজুমদার', fakir: 'ফকির', pramanik: 'প্রামাণিক', gazi: 'গাজী', tarafder: 'তরফদার', das: 'দাস', kazi: 'কাজী', matubbar: 'মাতুব্বর', shikdar: 'শিকদার', dewan: 'দেওয়ান', mallik: 'মল্লিক', malik: 'মালিক', howlader: 'হাওলাদার', akand: 'আকন্দ', ghani: 'ঘানি', ali: 'আলী', molla: 'মোল্লা', patwary: 'পাটোয়ারী', khandaker: 'খন্দকার', mridha: 'মৃধা', munshi: 'মুন্সি', bepari: 'ব্যাপারী', sardar: 'সরদার', sikder: 'সিকদার', miah: 'মিয়া', saiful: 'সাইফুল', mahmud: 'মাহমুদ', omar: 'ওমর', emon: 'ইমন', bhuiyan: 'ভূঁইয়া', reza: 'রেজা', salim: 'সালিম', roy: 'রায়', malek: 'মালেক', jamal: 'জামাল', mehedi: 'মেহেদী', atik: 'আতিক', akash: 'আকাশ', mizanur: 'মিজানুর', sohel: 'সোহেল', manik: 'মানিক', badal: 'বাদল', farhan: 'ফারহান', faisal: 'ফয়সাল', firoz: 'ফিরোজ', firos: 'ফিরোজ', noman: 'নোমান', shahed: 'শাহেদ', rezaul: 'রেজাউল', robin: 'রবিন', rafiq: 'রফিক', waliul: 'ওয়ালিউল', sajjad: 'সাজ্জাদ', ramzan: 'রমজান', jashim: 'জসিম', zakir: 'জাকির', alamgir: 'আলমগীর', amin: 'আমিন', babul: 'বাবুল', sabbir: 'সাব্বির', shapla: 'শাপলা', tareq: 'তারেক', gias: 'গিয়াস', jahid: 'জাহিদ', titu: 'টিটু', jewel: 'জুয়েল', helal: 'হেলাল', farid: 'ফরিদ', monir: 'মুনির', imran: 'ইমরান', ruhul: 'রুহুল', nurul: 'নুরুল', nasir: 'নাসির', shamsul: 'শামসুল', nayeem: 'নাঈম', yasin: 'ইয়াসিন', shamim: 'শামীম', kohinoor: 'কোহিনূর', belal: 'বেলাল', tamim: 'তামিম', mostafa: 'মোস্তফা', hridoy: 'হৃদয়', rashed: 'রাশেদ', zubayer: 'জুবায়ের', billal: 'বিল্লাল', tanvir: 'তানভীর', azad: 'আজাদ', rakib: 'রাকিব', shahin: 'শাহিন', jahangir: 'জাহাঙ্গীর', adnan: 'আদনান', masud: 'মাসুদ', sumon: 'সুমন', touhid: 'তৌহিদ', ikram: 'ইকরাম', arif: 'আরিফ', khadiza: 'খাদিজা', shakil: 'শাকিল', rubel: 'রুবেল', riad: 'রিয়াদ', mashiur: 'মশিউর', agro: 'এগ্রো', sakib: 'সাকিব', tajul: 'তাজুল', abir: 'আবির', mamun: 'মামুন', siam: 'সিয়াম', parvez: 'পারভেজ', ismail: 'ইসমাইল', kamal: 'কামাল', lutfor: 'লুৎফর', liton: 'লিটন', nazrul: 'নজরুল', rabbi: 'রাব্বি', zahid: 'জাহিদ', habib: 'হাবিব', zia: 'জিয়া', foysal: 'ফয়সাল', delwar: 'দেলোয়ার', sazzad: 'সাজ্জাদ', nilufar: 'নিলুফার', mahfuz: 'মাহফুজ', nazma: 'নাজমা', sabrina: 'সাবরিনা', shafiq: 'শফিক', khalid: 'খালিদ', jannat: 'জান্নাত', parveen: 'পারভীন', mousumi: 'মৌসুমী', sania: 'সানিয়া', mitu: 'মিতু', sonia: 'সোনিয়া', maksuda: 'মাকসুদা', munni: 'মুন্নি', nasrin: 'নাসরিন', nargis: 'নার্গিস', raihan: 'রায়হান', rahima: 'রহিমা', ashraf: 'আশরাফ', salma: 'সালমা', amena: 'আমেনা', anwar: 'আনোয়ার', bithi: 'বিথী', abdul: 'আব্দুল', jesmin: 'জেসমিন', tamanna: 'তামান্না', kulsum: 'কুলসুম', bilkis: 'বিলকিস', lima: 'লিমা', taslima: 'তাসলিমা', shimul: 'শিমুল', shahida: 'শাহিদা', champa: 'চম্পা', shorna: 'শর্ণা', shamima: 'শামীমা', shabnam: 'শবনম', farhana: 'ফারহানা', nusrat: 'নুসরাত', eity: 'ঐতি', halima: 'হালিমা', runa: 'রুনা', jasmin: 'জেসমিন', lucky: 'লাকি', sabina: 'সাবিনা', urmi: 'উর্মি', farzana: 'ফারজানা', samia: 'সামিয়া', morsheda: 'মুর্শিদা', momena: 'মোমেনা', anika: 'অনিকা', dolly: 'ডলি', mahmuda: 'মাহমুদা', joya: 'জয়া', rafia: 'রাফিয়া', rehana: 'রেহানা', sumaiya: 'সুমাইয়া', tithi: 'তিথি', ayesha: 'আয়েশা', shahana: 'শাহানা', sadia: 'সাদিয়া', priya: 'প্রিয়া', tasnim: 'তাসনিম', zakia: 'জাকিয়া', humaira: 'হুমায়রা', samir: 'সামির', fatema: 'ফাতেমা', shirin: 'শিরিন', rabeya: 'রাবেয়া', rubina: 'রুবিনা', moushumi: 'মৌসুমী', afroza: 'আফরোজা', tania: 'তানিয়া', sheuli: 'শিউলি', zinia: 'জিনিয়া', mariam: 'মারিয়াম', maliha: 'মালিহা', ruma: 'রুমা', arifa: 'আরিফা', laboni: 'লাবণী', zarin: 'জারিন', nipa: 'নিপা', happy: 'হ্যাপি', nabila: 'নাবিলা', zannat: 'জান্নাত', rokeya: 'রোকেয়া', popy: 'পপি', ferdousi: 'ফেরদৌসী', farms: 'ফার্মস', investments: 'ইনভেস্টমেন্টস', trust: 'ট্রাস্ট', horizon: 'হরাইজন', traders: 'ট্রেডার্স', cooperative: 'কোঅপারেটিভ', society: 'সোসাইটি', real: 'রিয়েল', estate: 'এস্টেট', enterprise: 'এন্টারপ্রাইজ', developers: 'ডেভেলপার্স', holdings: 'হোল্ডিংস', ventures: 'ভেঞ্চার্স', properties: 'প্রপার্টিজ', group: 'গ্রুপ', foundation: 'ফাউন্ডেশন', green: 'গ্রিন', valley: 'ভ্যালি', ananda: 'আনন্দ', bijoy: 'বিজয়', blue: 'ব্লু', evergreen: 'এভারগ্রিন', shonali: 'সোনালী', riverside: 'রিভারসাইড', karnaphuli: 'কর্ণফুলী', delta: 'ডেল্টা', sonar: 'সোনার', bangla: 'বাংলা', bengal: 'বেঙ্গল', crest: 'ক্রেস্ট', jamuna: 'যমুনা', unity: 'ইউনিটি', surma: 'সুরমা', golden: 'গোল্ডেন', harvest: 'হারভেস্ট', rupsha: 'রূপসা', padma: 'পদ্মা', skyline: 'স্কাইলাইন', sundarban: 'সুন্দরবন', meghna: 'মেঘনা', lotus: 'লোটাস', prime: 'প্রাইম', lands: 'ল্যান্ডস', pioneer: 'পাইওনিয়ার', teesta: 'তিস্তা', orchid: 'অর্কিড', crescent: 'ক্রিসেন্ট', nobo: 'নব', eastern: 'ইস্টার্ন', star: 'স্টার', pvt: 'প্রাইভেট', co: 'কোম্পানি', ltd: 'লিমিটেড', and: 'ও',
}

const DIGITS = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const TERMS = {
  'original ownership': 'প্রাথমিক মালিকানা', original: 'প্রাথমিক মালিকানা', 'original owner': 'প্রাথমিক মালিক',
  transaction: 'লেনদেন', transfer: 'হস্তান্তর', registration: 'রেজিস্ট্রেশন', mutation: 'নামজারি',
  sale: 'বিক্রয়', gift: 'দান', inheritance: 'উত্তরাধিকার', lease: 'ইজারা',
  active: 'সক্রিয়', inactive: 'নিষ্ক্রিয়', registered: 'নিবন্ধিত', completed: 'সম্পন্ন', pending: 'অপেক্ষমাণ', missing: 'অনুপস্থিত', verified: 'যাচাইকৃত', unverified: 'যাচাই হয়নি',
  individual: 'একক মালিক', joint: 'যৌথ মালিক', 'high concern': 'উচ্চ উদ্বেগ', 'review required': 'পর্যালোচনা প্রয়োজন',
  critical: 'গুরুতর', flagged: 'চিহ্নিত',
  consistent: 'সামঞ্জস্যপূর্ণ', 'conflict detected': 'বিতর্কিত', disputed: 'বিতর্কিত',
  'double-sale': 'একই জমি একাধিকবার বিক্রি', 'double-sale / overlapping transfer': 'একই অংশ একাধিকবার হস্তান্তর', 'potential double-sale / overlapping transfer': 'সম্ভাব্য একই অংশ একাধিকবার হস্তান্তর',
  'over-transfer': 'অতিরিক্ত হস্তান্তর', 'potential over-transfer': 'সম্ভাব্য অতিরিক্ত হস্তান্তর', 'rapid transfer': 'দ্রুত হস্তান্তর', 'rapid transfer pattern': 'দ্রুত হস্তান্তরের ধরণ',
  'ownership chain break': 'মালিকানার ধারাবাহিকতা ভঙ্গ', 'registration mismatch': 'রেজিস্ট্রেশনের অমিল',
  'registration mismatch': 'রেজিস্ট্রেশনের অমিল', 'registration–mutation mismatch': 'রেজিস্ট্রেশন ও নামজারির অমিল', 'temporal inconsistency': 'তারিখের অসংগতি',
  'ownership chain break': 'মালিকানার ধারাবাহিকতা ভঙ্গ',
  issues: 'অসংগতির ধরন', 'area mismatch': 'জমির পরিমাণে অমিল', 'missing mutation': 'নামজারির নথি অনুপস্থিত',
  'missing registration': 'রেজিস্ট্রেশনের নথি অনুপস্থিত', 'ownership mismatch': 'মালিকানার অমিল',
  'no signal': 'কোনো সংকেত নেই',
}

export function bnTerm(value) {
  if (value === null || value === undefined) return value
  return TERMS[String(value).toLowerCase()] || banglaDisplay(value)
}

export function displayDate(value, language = 'en') {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function evidenceTitle(type, fallback) {
  return ({
    double_sale: 'সম্ভাব্য একই অংশ একাধিকবার হস্তান্তর', over_transfer: 'সম্ভাব্য অতিরিক্ত হস্তান্তর',
    rapid_transfer: 'দ্রুত হস্তান্তরের ধরণ', ownership_chain_break: 'মালিকানার ধারাবাহিকতা ভঙ্গ',
    registration_mismatch: 'রেজিস্ট্রেশনের অমিল', mutation_mismatch: 'নামজারির অমিল',
    temporal_inconsistency: 'তারিখের অসংগতি',
  })[type] || banglaDisplay(fallback)
}

export function evidenceMessage(item) {
  const s = item.message || ''
  if (s.toLowerCase() === 'the registration record does not agree with the transaction record.') return 'রেজিস্ট্রেশনের নথি লেনদেনের নথির সঙ্গে মেলে না।'
  if (s.toLowerCase() === 'the mutation record does not agree with the registration record.') return 'নামজারির নথি রেজিস্ট্রেশনের নথির সঙ্গে মেলে না।'
  if (s.toLowerCase() === 'no registration record is linked to this transaction.') return 'এই লেনদেনের সঙ্গে কোনো রেজিস্ট্রেশন নথি সংযুক্ত নেই।'
  if (s.toLowerCase() === 'no mutation record is linked to this transaction.') return 'এই লেনদেনের সঙ্গে কোনো নামজারির নথি সংযুক্ত নেই।'
  const ownerDiff = s.match(/^The mutation previous owner (.+?) differs from registered seller (.+?)\.$/)
  if (ownerDiff) return `নামজারিতে উল্লেখিত আগের মালিক ${banglaDisplay(ownerDiff[1])} রেজিস্ট্রিতে উল্লেখিত বিক্রেতা ${banglaDisplay(ownerDiff[2])}-এর সঙ্গে মেলে না।`
  const buyerDiff = s.match(/^registered buyer (.+?) differs from transaction buyer (.+?)\.$/)
  if (buyerDiff) return `রেজিস্ট্রিতে উল্লেখিত ক্রেতা ${banglaDisplay(buyerDiff[1])} লেনদেনের ক্রেতা ${banglaDisplay(buyerDiff[2])}-এর সঙ্গে মেলে না।`
  const sellerDiff = s.match(/^registered seller (.+?) differs from transaction seller (.+?)\.$/)
  if (sellerDiff) return `রেজিস্ট্রিতে উল্লেখিত বিক্রেতা ${banglaDisplay(sellerDiff[1])} লেনদেনের বিক্রেতা ${banglaDisplay(sellerDiff[2])}-এর সঙ্গে মেলে না।`
  const double = s.match(/^(.+?) appears as seller again although transaction (.+?) had already transferred their entire recorded interest in this parcel\.$/)
  if (double) return `${banglaDisplay(double[1])} আবার বিক্রেতা হিসেবে দেখা যাচ্ছে, যদিও ${double[2]} লেনদেনে এই জমিতে তাঁর নথিভুক্ত সম্পূর্ণ মালিকানা আগেই হস্তান্তর করা হয়েছিল।`
  const share = s.match(/^Transferred share \((.+?)%\) exceeds the seller's recorded share before the transfer \((.+?)%\)\.$/)
  if (share) return `হস্তান্তরিত অংশ (${banglaDisplay(share[1])}%) হস্তান্তরের আগে বিক্রেতার নথিভুক্ত অংশ (${banglaDisplay(share[2])}%)-এর চেয়ে বেশি।`
  const overArea = s.match(/^Transferred area \((.+?) decimal\) exceeds the area the seller controlled \((.+?) decimal\)\.$/)
  if (overArea) return `হস্তান্তরিত জমির পরিমাণ (${banglaDisplay(overArea[1])} শতক) বিক্রেতার নিয়ন্ত্রণাধীন জমির পরিমাণ (${banglaDisplay(overArea[2])} শতক) ছাড়িয়ে গেছে।`
  const rapid = s.match(/^This parcel was transferred again (\d+) day\(s\) after the previous transfer \((strong|moderate) signal\)\. Rapid transfers are an anomaly signal only, not proof of wrongdoing\.$/)
  if (rapid) return `আগের হস্তান্তরের ${banglaDisplay(rapid[1])} দিন পর জমিটি আবার হস্তান্তর করা হয়েছে (${rapid[2] === 'strong' ? 'জোরালো' : 'মাঝারি'} সংকেত)। দ্রুত হস্তান্তর কেবল একটি অসংগতির সংকেত, অনিয়মের প্রমাণ নয়।`
  const chain = s.match(/^The recorded seller (.+?) does not match the recorded previous owner (.+?)\.$/)
  if (chain) return `নথিভুক্ত বিক্রেতা ${banglaDisplay(chain[1])} নথিভুক্ত আগের মালিক ${banglaDisplay(chain[2])}-এর সঙ্গে মেলে না।`
  return banglaDisplay(s)
}
const LETTERS = { b: 'ব', c: 'ক', d: 'ড', f: 'ফ', g: 'গ', h: 'হ', j: 'জ', k: 'ক', l: 'ল', m: 'ম', n: 'ন', p: 'প', q: 'ক', r: 'র', s: 'স', t: 'ট', v: 'ভ', w: 'ও', x: 'ক্স', y: 'য়', z: 'জ' }

function transliterateWord(raw) {
  const lower = raw.toLowerCase()
  if (WORDS[lower]) return WORDS[lower]
  const chunks = lower.match(/sh|ch|kh|gh|bh|th|dh|ph|ng|ck|zh|aa|ee|oo|[a-z]|[^a-z]/g) || []
  let out = ''
  for (const [i, chunk] of chunks.entries()) {
    const prev = chunks[i - 1]
    if (/^\d+$/.test(chunk) || !/[a-z]/.test(chunk)) { out += chunk.replace(/[0-9]/g, (d) => DIGITS[d]); continue }
    if (['sh', 'ch', 'kh', 'gh', 'bh', 'th', 'dh', 'ph', 'ng', 'ck', 'zh'].includes(chunk)) {
      out += { sh: 'শ', ch: 'চ', kh: 'খ', gh: 'ঘ', bh: 'ভ', th: 'থ', dh: 'ধ', ph: 'ফ', ng: 'ং', ck: 'ক', zh: 'ঝ' }[chunk]
    } else if (['aa', 'ee', 'oo'].includes(chunk)) out += { aa: 'া', ee: 'ী', oo: 'ু' }[chunk]
    else if ('aeiou'.includes(chunk)) out += chunk === 'a' ? (i === 0 ? 'আ' : 'া') : ({ e: 'ে', i: 'ি', o: 'ো', u: 'ু' }[chunk])
    else out += LETTERS[chunk] || chunk
    if (prev && /^[a-z]$/.test(chunk) && 'aeiou'.includes(prev) && !'aeiou'.includes(chunk) && i < chunks.length - 1 && /^[a-z]$/.test(chunks[i + 1]) && !'aeiou'.includes(chunks[i + 1])) out += '্'
  }
  return out
}

export function banglaDisplay(value) {
  if (value === null || value === undefined) return value
  const source = String(value)
  const phrase = { "cox's bazar": 'কক্সবাজার', 'cox’s bazar': 'কক্সবাজার' }[source.toLowerCase()]
  if (phrase) return phrase
  const identifiers = []
  const safe = source.replace(/\b(?:P|O|T|R|M|K|D|REG|MUT|DEED)-\d+\b/gi, (id) => {
    identifiers.push(id)
    return `\uE000${String.fromCharCode(0xE100 + identifiers.length - 1)}\uE001`
  })
  return safe.replace(/[A-Za-z]+(?:'[A-Za-z]+)?|\d+|[&]/g, (token) => {
    if (token === '&') return 'ও'
    if (/^\d+$/.test(token)) return token.replace(/[0-9]/g, (d) => DIGITS[d])
    return transliterateWord(token)
  }).replace(/\uE000([\uE100-\uF8FF])\uE001/g, (_, i) => identifiers[i.charCodeAt(0) - 0xE100])
}
