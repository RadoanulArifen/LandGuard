import { createContext, useContext, useEffect, useRef, useState } from 'react'

const LanguageContext = createContext(null)

// Interface copy used across the application. Proper names, IDs, and record values remain unchanged.
const COPY = {
  'Home': 'হোম', 'Dashboard': 'ড্যাশবোর্ড', 'Investigate': 'তদন্ত', 'Alerts': 'সতর্কতা', 'Analytics': 'বিশ্লেষণ', 'Reports': 'রিপোর্ট',
  'Ownership History': 'মালিকানার ইতিহাস', 'Transaction Graph': 'লেনদেনের গ্রাফ', 'Timeline': 'সময়রেখা', 'Overview': 'সংক্ষিপ্ত বিবরণ',
  'Parcel Overview': 'জমির সংক্ষিপ্ত বিবরণ', 'Parcel ID:': 'জমির আইডি:', 'Parcels': 'জমি', 'Parcel': 'জমি', 'Location': 'অবস্থান', 'Khatian / Dag': 'খতিয়ান / দাগ', 'Area': 'জমির পরিমাণ', 'Current owner': 'বর্তমান মালিক', 'Current Owner': 'বর্তমান মালিক', 'Status': 'অবস্থা', 'District': 'জেলা', 'Upazila': 'উপজেলা', 'Mouza': 'মৌজা', 'Khatian No.': 'খতিয়ান নম্বর', 'Dag No.': 'দাগ নম্বর', 'Total Area': 'মোট জমির পরিমাণ', 'Recorded Share': 'নথিভুক্ত অংশ', 'Ownership Status': 'মালিকানার অবস্থা', 'Registration Status': 'রেজিস্ট্রেশনের অবস্থা', 'Mutation Status': 'নামজারির অবস্থা', 'Decimal': 'শতক', 'decimal': 'শতক',
  'Investigate a Parcel': 'জমি যাচাই করুন', 'Search by location or parcel information to analyze transaction integrity.': 'লেনদেনের স্বচ্ছতা যাচাই করতে অবস্থান বা জমির তথ্য দিয়ে খুঁজুন।', 'Select ': 'নির্বাচন করুন: ', 'Select District': 'জেলা নির্বাচন করুন', 'Select Upazila': 'উপজেলা নির্বাচন করুন', 'Select Mouza': 'মৌজা নির্বাচন করুন', 'Parcel ID (e.g. P-000123)': 'জমির আইডি (যেমন P-000123)', 'Start with a search': 'খোঁজ শুরু করুন', 'Pick a district, or type a parcel ID. Parcels with the most serious findings are listed first.': 'একটি জেলা বেছে নিন অথবা জমির আইডি লিখুন। গুরুতর অসংগতি থাকা জমিগুলো আগে দেখানো হবে।', 'No parcels matched': 'কোনো জমি মেলেনি', 'Try fewer filters or check the Khatian/Dag number.': 'কম ফিল্টার ব্যবহার করুন অথবা খতিয়ান/দাগ নম্বর যাচাই করুন।',
  'The problem': 'সমস্যা', 'One correct record does not make a correct history.': 'একটি নথি সঠিক হলেই পুরো ইতিহাস সঠিক হয় না।', 'The solution': 'সমাধান', 'Check whether linked records make sense together.': 'সংযুক্ত নথিগুলো পরস্পরের সাথে মেলে কি না যাচাই করুন।', 'How it works': 'যেভাবে কাজ করে', 'Core capabilities': 'মূল সুবিধাসমূহ', 'Explainable AI': 'ব্যাখ্যাযোগ্য এআই', 'Double-Selling Detection': 'একই জমি একাধিকবার বিক্রির শনাক্তকরণ', 'Ownership Graph': 'মালিকানার গ্রাফ', 'AI-Powered Anomaly Detection': 'এআই দিয়ে অসংগতি শনাক্তকরণ', 'Explainable Evidence': 'ব্যাখ্যাসহ প্রমাণ', 'Link records': 'নথি সংযুক্ত করুন', 'Build the ownership graph': 'মালিকানার গ্রাফ তৈরি করুন', 'Run integrity rules': 'তথ্য যাচাইয়ের নিয়ম চালান', 'Prioritise with ML': 'মেশিন লার্নিং দিয়ে অগ্রাধিকার নির্ধারণ', 'Explain': 'ব্যাখ্যা', 'Human review': 'মানবীয় পর্যালোচনা',
   'View Demo': 'ডেমো দেখুন',   
  'Integrity Status': 'তথ্যের সামঞ্জস্য', 'High Concern': 'উচ্চ উদ্বেগ', 'Review Required': 'পর্যালোচনা প্রয়োজন', 'Consistent': 'সামঞ্জস্যপূর্ণ', 'No transactions': 'কোনো লেনদেন নেই', 'Human Review Required': 'মানবীয় পর্যালোচনা প্রয়োজন', 'Investigation Priority': 'তদন্তের অগ্রাধিকার', 'Investigation Priority Score': 'তদন্তের অগ্রাধিকার স্কোর',
  'Parcels Analyzed': 'বিশ্লেষণ করা জমি', 'Transactions Analyzed': 'বিশ্লেষণ করা লেনদেন',
  'Integrity Alerts': 'তথ্যগত অসংগতি', 'Potential inconsistencies ranked by Investigation Priority. Every alert requires human review.': 'তদন্তের অগ্রাধিকার অনুযায়ী সম্ভাব্য অসংগতিগুলো সাজানো হয়েছে। প্রতিটি সতর্কতা মানুষের পর্যালোচনা প্রয়োজন।', 'All types': 'সব ধরন', 'All districts': 'সব জেলা', 'All': 'সব', 'High': 'উচ্চ', 'Medium': 'মাঝারি', 'Low': 'নিম্ন', 'Critical': 'গুরুতর', 'Parcel / transaction ID': 'জমি / লেনদেনের আইডি', 'No alerts match these filters': 'এই ফিল্টারে কোনো সতর্কতা নেই', 'Clear a filter to see more.': 'আরও ফলাফল দেখতে একটি ফিল্টার সরান।', 'View Details →': 'বিস্তারিত দেখুন →',
  'Loading…': 'লোড হচ্ছে…', 'Loading parcel…': 'জমির তথ্য লোড হচ্ছে…', 'Loading investigation…': 'তদন্তের তথ্য লোড হচ্ছে…', 'Loading alerts…': 'সতর্কতা লোড হচ্ছে…', 'Loading dashboard…': 'ড্যাশবোর্ড লোড হচ্ছে…', 'Loading analytics…': 'বিশ্লেষণ লোড হচ্ছে…', 'Searching…': 'খোঁজা হচ্ছে…', 'Building ownership graph…': 'মালিকানার গ্রাফ তৈরি হচ্ছে…', 'Preparing report preview…': 'রিপোর্টের পূর্বরূপ তৈরি হচ্ছে…', 'Preparing the demo parcel…': 'ডেমোর জমির তথ্য তৈরি হচ্ছে…', 'Could not load this page': 'এই পেজের তথ্য লোড করা যায়নি', 'Try again': 'আবার চেষ্টা করুন', 'Nothing to show': 'দেখানোর মতো কিছু নেই', 'Previous': 'আগেরটি', 'Next': 'পরেরটি', 'of': 'এর মধ্যে',
  'No ownership history': 'মালিকানার ইতিহাস নেই', 'No transactions on this parcel': 'এই জমিতে কোনো লেনদেন নেই', 'No integrity signals on this parcel': 'এই জমিতে কোনো অসংগতি পাওয়া যায়নি', 'All linked records on this parcel look consistent.': 'এই জমির সংযুক্ত নথিগুলো সামঞ্জস্যপূর্ণ মনে হচ্ছে।', 'No integrity signals were raised for this transaction.': 'এই লেনদেনে কোনো অসংগতি শনাক্ত হয়নি।', 'No registration record linked.': 'কোনো রেজিস্ট্রেশন নথি সংযুক্ত নেই।', 'No mutation record linked.': 'কোনো নামজারির নথি সংযুক্ত নেই।', 'Registration and mutation records agree with the transaction.': 'রেজিস্ট্রেশন ও নামজারির নথি লেনদেনের সাথে মেলে।',
  'View Larger': 'বড় করে দেখুন', 'Illustrative overview image · not a survey map': 'উদাহরণস্বরূপ ছবি · জরিপের মানচিত্র নয়', 'Ownership history': 'মালিকানার ইতিহাস', 'Transaction graph': 'লেনদেনের গ্রাফ', 'Open top alert': 'গুরুত্বপূর্ণ সতর্কতা খুলুন', 'Report PDF': 'PDF রিপোর্ট', 'Download PDF': 'PDF ডাউনলোড', 'Download': 'ডাউনলোড',
   'Live statistics computed from the imported datasets and the ভূমি প্রহরী engine.': 'আমদানি করা ডেটা ও ভূমি প্রহরী বিশ্লেষণ ইঞ্জিন থেকে তৈরি হালনাগাদ পরিসংখ্যান।', 'Alert Distribution': 'সতর্কতার ধরন', 'Risk Level Distribution': 'ঝুঁকির মাত্রা', 'Monthly Suspicious Transactions': 'মাসভিত্তিক সন্দেহজনক লেনদেন', 'High / Critical priority transactions, latest 12 months in the data.': 'ডেটায় থাকা গত ১২ মাসের উচ্চ ও গুরুতর অগ্রাধিকারের লেনদেন।', 'Recent Suspicious Transactions': 'সাম্প্রতিক সন্দেহজনক লেনদেন', 'All alerts →': 'সব সতর্কতা →', 'Type': 'ধরন', 'Risk Level': 'ঝুঁকির মাত্রা', 'Date': 'তারিখ', 'Review': 'পর্যালোচনা', 'Open →': 'খুলুন →',
   'Owner (Normal)': 'মালিক (স্বাভাবিক)',  'Transfer': 'হস্তান্তর', 'Multiple Transfer': 'একাধিক হস্তান্তর', 'Conflict': 'বিতর্ক', 'Disputed': 'বিতর্কিত', 'Graph status': 'গ্রাফের অবস্থা', 'Details': 'বিস্তারিত', 'Click an owner or a transfer label on the graph.': 'বিস্তারিত দেখতে গ্রাফে কোনো মালিক বা হস্তান্তরের ওপর ক্লিক করুন।', 'Seller': 'বিক্রেতা', 'Buyer': 'ক্রেতা', 'Share': 'অংশ', 'Signals:': 'সংকেত:', 'Open investigation →': 'তদন্ত খুলুন →', 'Occupation': 'পেশা', 'Parcels owned': 'মালিকানাধীন জমি', 'Total area:': 'মোট জমির পরিমাণ:', 'Appears as seller in more than one transfer of this parcel.': 'এই জমির একাধিক হস্তান্তরে বিক্রেতা হিসেবে দেখা যাচ্ছে।',
  'Registration Record': 'রেজিস্ট্রেশন নথি', 'Mutation Record': 'নামজারির নথি', 'Registration vs mutation': 'রেজিস্ট্রেশন বনাম নামজারি', 'Full field-by-field comparison (transaction · registration · mutation)': 'প্রতিটি তথ্যের তুলনা (লেনদেন · রেজিস্ট্রেশন · নামজারি)', 'Field': 'তথ্য', 'Transaction': 'লেনদেন', 'Registration': 'রেজিস্ট্রেশন', 'Mutation': 'নামজারি', 'Registration should match the transaction; mutation should match the registration. Area tolerance 0.01 decimal.': 'রেজিস্ট্রেশনের তথ্য লেনদেনের সাথে এবং নামজারির তথ্য রেজিস্ট্রেশনের সাথে মিলতে হবে। জমির পরিমাণে ০.০১ শতক পর্যন্ত পার্থক্য গ্রহণযোগ্য।',
   'Normal vs suspicious': 'স্বাভাবিক বনাম সন্দেহজনক', 'Cases by signal': 'সংকেত অনুযায়ী ঘটনা', 'Top districts by high-priority transactions': 'উচ্চ অগ্রাধিকারের লেনদেন অনুযায়ী শীর্ষ জেলা', 'Signals per transaction': 'প্রতি লেনদেনে সংকেত', 'By transaction type': 'লেনদেনের ধরন অনুযায়ী', 'Precision': 'নির্ভুলতা', 'Recall': 'রিকল', 'False-positive rate': 'ভুল ইতিবাচক ফলের হার', 'Approach': 'পদ্ধতি', 'High / Critical': 'উচ্চ / গুরুতর', 'With signals': 'সংকেতসহ',
  'Investigation Reports': 'তদন্ত প্রতিবেদন', 'Pick a transaction to preview and download its investigation report (PDF).': 'তদন্ত প্রতিবেদন (PDF) দেখতে ও ডাউনলোড করতে একটি লেনদেন বেছে নিন।', 'Highest-priority transactions': 'সর্বোচ্চ অগ্রাধিকারের লেনদেন', 'Search parcel / transaction ID': 'জমি / লেনদেনের আইডি খুঁজুন', 'No matching transactions.': 'মিলে যাওয়া কোনো লেনদেন নেই।', 'No transaction selected': 'কোনো লেনদেন বাছাই করা হয়নি', 'Choose one from the list to preview its report.': 'রিপোর্টের পূর্বরূপ দেখতে তালিকা থেকে একটি বেছে নিন।', 'ভূমি প্রহরী Investigation Report': 'ভূমি প্রহরী তদন্ত প্রতিবেদন', 'Detected issues': 'শনাক্ত অসংগতি', 'AI investigation priority': 'এআই তদন্ত অগ্রাধিকার', 'Recommendation': 'সুপারিশ', 'Evidence summary': 'প্রমাণের সারাংশ', 'None': 'কোনোটিই নয়',
  'Evidence Details': 'প্রমাণের বিস্তারিত', 'Related records': 'সংশ্লিষ্ট নথি', 'Description': 'বিবরণ', 'Final status: Human Review Required': 'চূড়ান্ত অবস্থা: মানবীয় পর্যালোচনা প্রয়োজন', '— ভূমি প্রহরী has not made any legal determination.': '— ভূমি প্রহরী কোনো আইনি সিদ্ধান্ত দেয়নি।',  'AI analysis': 'এআই বিশ্লেষণ',
  'Why this transaction is flagged?': 'এই লেনদেনটি কেন চিহ্নিত হয়েছে?', 'Explanation (Plain Language)': 'সহজ ভাষায় ব্যাখ্যা', 'Recommended action:': 'প্রস্তাবিত পদক্ষেপ:', 'Page not found': 'পেজটি পাওয়া যায়নি', 'The page you asked for does not exist.': 'আপনার চাওয়া পেজটি নেই।', 'Go to Dashboard': 'ড্যাশবোর্ডে যান', 'Judge demo': 'বিচারক ডেমো', 'Previous step': 'আগের ধাপ', 'Next step': 'পরের ধাপ', 'Close demo': 'ডেমো বন্ধ করুন',
  'Investigation re-run on the stored records just now. The rule engine ran again; the ML score is the stored out-of-fold score.': 'সংরক্ষিত নথি দিয়ে এইমাত্র তদন্তটি আবার চালানো হয়েছে। নিয়মভিত্তিক বিশ্লেষণ আবার হয়েছে; ML স্কোরটি সংরক্ষিত আউট-অব-ফোল্ড স্কোর।',
  'Transaction ID:': 'লেনদেনের আইডি:', 'Area:': 'জমির পরিমাণ:', 'Date:': 'তারিখ:', 'Type:': 'ধরন:', 'Status:': 'অবস্থা:',  'Share transferred:': 'হস্তান্তরিত অংশ:', 'Registration:': 'রেজিস্ট্রেশন:', 'Mutation:': 'নামজারি:', 'First recorded owner on this parcel (': 'এই জমির প্রথম নথিভুক্ত মালিক (', 
  'Explainable Land Transaction Integrity and Fraud Detection': 'জমির লেনদেনের স্বচ্ছতা ও জালিয়াতির ঝুঁকি শনাক্তকরণ',
  'Detect suspicious land transactions before they become ownership disputes.': 'মালিকানা নিয়ে বিরোধ তৈরি হওয়ার আগেই সন্দেহজনক জমির লেনদেন শনাক্ত করুন।',
  'A parcel passes through the sub-registry office (registration) and the AC Land office (mutation). When these records disagree — or the same interest appears to be sold twice — disputes follow years later.': 'একটি জমির নথি সাব-রেজিস্ট্রি অফিসে রেজিস্ট্রেশন এবং এসি ল্যান্ড অফিসে নামজারির মধ্য দিয়ে যায়। এই নথিগুলোতে অমিল থাকলে—অথবা একই জমির অংশ একাধিকবার বিক্রি হলে—বছর পরে বিরোধ তৈরি হতে পারে।',
  'Government systems maintain records. ভূমি প্রহরী adds an integrity-analysis layer on top of them: it connects the records, tests them against clear rules, and ranks what a human should look at first.': 'সরকারি ব্যবস্থায় জমির নথি সংরক্ষিত থাকে। ভূমি প্রহরী নথিগুলোকে সংযুক্ত করে, নির্দিষ্ট নিয়মে যাচাই করে এবং কোন বিষয়টি আগে মানুষের দেখা উচিত তা অগ্রাধিকার অনুযায়ী সাজায়।',
  'Parcel, owner, transaction, registration and mutation records are joined into one view.': 'জমি, মালিক, লেনদেন, রেজিস্ট্রেশন ও নামজারির নথি এক জায়গায় সংযুক্ত করা হয়।',
  'A time-aware graph shows who transferred what to whom, and when.': 'সময়ভিত্তিক গ্রাফে কে, কাকে, কী এবং কখন হস্তান্তর করেছেন তা দেখা যায়।',
  'Seven deterministic checks look for overlaps, excess transfers, chain breaks and mismatches.': 'সাতটি নির্দিষ্ট যাচাইয়ে জমির অংশের ওভারল্যাপ, অতিরিক্ত হস্তান্তর, মালিকানার ধারাবাহিকতা ভাঙা এবং নথির অমিল খোঁজা হয়।',
  'A local machine-learning model ranks transactions so reviewers start with the most unusual ones.': 'স্থানীয় মেশিন-লার্নিং মডেল লেনদেনগুলোকে অগ্রাধিকার অনুযায়ী সাজায়, যাতে পর্যালোচকেরা সবচেয়ে অস্বাভাবিক ঘটনাগুলো আগে দেখতে পারেন।',
  'Every alert shows the records and the factors behind it, in plain language.': 'প্রতিটি সতর্কতায় সংশ্লিষ্ট নথি ও সতর্কতার কারণ সহজ ভাষায় দেখানো হয়।',
  'Officials make the decision. ভূমি প্রহরী never confirms fraud or ownership.': 'সিদ্ধান্ত নেন সংশ্লিষ্ট কর্মকর্তা। ভূমি প্রহরী কখনো জালিয়াতি বা মালিকানা নিশ্চিত করে না।',
  'Double-sale / overlapping transfer': 'একই জমি একাধিকবার বিক্রি / হস্তান্তরের ওভারল্যাপ', 'Over-transfer vs recorded share': 'নথিভুক্ত অংশের চেয়ে বেশি হস্তান্তর', 'Rapid transfer patterns': 'দ্রুত ধারাবাহিক হস্তান্তর', 'Ownership chain validation': 'মালিকানার ধারাবাহিকতা যাচাই', 'Registration ↔ mutation mismatch': 'রেজিস্ট্রেশন ও নামজারির অমিল', 'Temporal consistency (transaction ≤ registration ≤ mutation)': 'সময়ের ধারাবাহিকতা (লেনদেন ≤ রেজিস্ট্রেশন ≤ নামজারি)', 'Investigation Priority Score (0–100)': 'তদন্তের অগ্রাধিকার স্কোর (০–১০০)', 'PDF investigation report': 'PDF তদন্ত প্রতিবেদন',
  'Each alert says ': 'প্রতিটি সতর্কতায় বলা হয় ', 'what': 'কী', 'why': 'কেন', 'which records': 'কোন নথিগুলো', 'was found, ': 'পাওয়া গেছে, ', 'it was flagged and ': 'এটি চিহ্নিত হয়েছে এবং ', ' are responsible. SHAP shows how much each factor pushed the model\'s priority up — in plain language.': ' দায়ী। SHAP সহজ ভাষায় দেখায়, প্রতিটি বিষয় মডেলের অগ্রাধিকার কতটা বাড়িয়েছে।', 'ভূমি প্রহরী produces an ': 'ভূমি প্রহরী একটি ', ', not a fraud probability. AI never makes a legal decision; every alert ends in ': ' তৈরি করে, জালিয়াতির সম্ভাবনা নয়। এআই কখনো আইনি সিদ্ধান্ত দেয় না; প্রতিটি সতর্কতার শেষে থাকে ',
  'Decision-support only. Human review is required for every alert.': 'এটি শুধু সিদ্ধান্ত গ্রহণে সহায়তা করে। প্রতিটি সতর্কতা মানুষের পর্যালোচনা করা প্রয়োজন।',
  'ভূমি প্রহরী is decision-support only. Results show potential inconsistencies for human review; they are not a legal finding or a fraud probability. Synthetic hackathon data.': 'ভূমি প্রহরী শুধু সিদ্ধান্ত গ্রহণে সহায়তা করে। ফলাফলে মানুষের পর্যালোচনার জন্য সম্ভাব্য অসংগতি দেখানো হয়; এগুলো আইনি সিদ্ধান্ত বা জালিয়াতির সম্ভাবনা নয়। হ্যাকাথনের জন্য তৈরি কৃত্রিম ডেটা।',
  'Cannot reach the ভূমি প্রহরী server. Make sure the backend is running on port 8000.': 'ভূমি প্রহরী সার্ভারে সংযোগ করা যাচ্ছে না। ব্যাকএন্ড চালু আছে কি না যাচাই করুন।',
  'ভূমি প্রহরী hybrid (rules + ': 'ভূমি প্রহরী সমন্বিত (নিয়ম + ',
  'for this transaction (requires human review). This is an Investigation Priority Score, not a fraud probability.': 'এই লেনদেনের জন্য (মানবীয় পর্যালোচনা প্রয়োজন)। এটি তদন্তের অগ্রাধিকার স্কোর, জালিয়াতির সম্ভাবনা নয়।',
  'This is an Investigation Priority Score, not a fraud probability.': 'এটি তদন্তের অগ্রাধিকার স্কোর, জালিয়াতির সম্ভাবনা নয়।',
  'AI never makes a legal decision; every alert ends in ': 'এআই কখনো আইনি সিদ্ধান্ত দেয় না; প্রতিটি সতর্কতার শেষে থাকে ',
  'Overall picture across ': 'মোট ', ' transactions.': 'টি লেনদেনের সার্বিক চিত্র।',
  'Model evaluation (real results from the held-out 20% test split)': 'মডেল মূল্যায়ন (আলাদা রাখা ২০% পরীক্ষামূলক ডেটার ফলাফল)', 'Model / feature set': 'মডেল / ফিচার সেট', 'ROC-AUC': 'ROC-AUC', '5-fold CV F1': '৫-ভাঁজ CV F1', 'TN / FP / FN / TP': 'TN / FP / FN / TP',
  'Scroll sideways for the full history. Blue = transaction, indigo = registration, black = mutation, red = flagged.': 'পুরো ইতিহাস দেখতে পাশে স্ক্রল করুন। নীল = লেনদেন, ইন্ডিগো = রেজিস্ট্রেশন, কালো = নামজারি, লাল = চিহ্নিত।', 'Inconsistency flagged': 'অসংগতি চিহ্নিত হয়েছে', 'Conflict Detected': 'বিতর্কিত',
  'AI Investigation Priority': 'এআই তদন্ত অগ্রাধিকার', 'Rule evidence (': 'নিয়মভিত্তিক প্রমাণ (', 'ML anomaly score (': 'ML অসংগতি স্কোর (',  'The model found no strong factor pushing this transaction towards review.': 'এই লেনদেনটি পর্যালোচনার জন্য বেছে নেওয়ার মতো জোরালো কোনো কারণ মডেল পায়নি।', 'Reducing priority:': 'অগ্রাধিকার কমাচ্ছে:',  'No integrity signals were raised; the ML model sees nothing unusual.': 'কোনো অসংগতি পাওয়া যায়নি; ML মডেলও অস্বাভাবিক কিছু দেখেনি।',  'An authorised officer should check the source deed and mutation file before any decision. This analysis does not confirm fraud or decide ownership.': 'কোনো সিদ্ধান্তের আগে অনুমোদিত কর্মকর্তার মূল দলিল ও নামজারির নথি যাচাই করা উচিত। এই বিশ্লেষণ জালিয়াতি নিশ্চিত করে না বা মালিকানা নির্ধারণ করে না।', 'out of 100': '১০০-এর মধ্যে',
  'Transaction timeline': 'লেনদেনের সময়রেখা',   'Area tolerance 0.01 decimal.': 'জমির পরিমাণে ০.০১ শতক পর্যন্ত পার্থক্য গ্রহণযোগ্য।',  
  'Search a parcel': 'জমি খুঁজুন', 'Detect suspicious transaction': 'সন্দেহজনক লেনদেন শনাক্ত করুন', 'Integrity alert': 'তথ্যের অসংগতি সতর্কতা', 'Generate report': 'প্রতিবেদন তৈরি করুন', 'Evidence': 'প্রমাণ',
  'Multiple inconsistencies detected in linked records. Human review recommended.': 'সংযুক্ত নথিতে একাধিক অসংগতি পাওয়া গেছে। মানুষের পর্যালোচনা প্রয়োজন।', 'Some records need review.': 'কিছু নথি পর্যালোচনা করা প্রয়োজন।', 'No significant inconsistencies detected in the linked records.': 'সংযুক্ত নথিতে উল্লেখযোগ্য কোনো অসংগতি পাওয়া যায়নি।',
  'Priority': 'অগ্রাধিকার', 'Investigation': 'তদন্ত', 'Ownership': 'মালিকানা', 'transaction': 'লেনদেন', 'registration': 'রেজিস্ট্রেশন', 'mutation': 'নামজারি', 'Signals': 'সংকেত', 'Share transferred': 'হস্তান্তরিত অংশ', 'Owner': 'মালিক', 'Current': 'বর্তমান', 'Normal': 'স্বাভাবিক', 'Suspicious': 'সন্দেহজনক', 'High priority': 'উচ্চ অগ্রাধিকার', 'Total area': 'মোট জমির পরিমাণ', 'Decision support only': 'শুধু সিদ্ধান্ত গ্রহণে সহায়তা',
   'Close': 'বন্ধ করুন',   'There is nothing to draw.': 'দেখানোর মতো কোনো তথ্য নেই।',        'Transaction ID': 'লেনদেনের আইডি',       'Occupation:': 'পেশা:', 'District:': 'জেলা:', 'Parcels owned:': 'মালিকানাধীন জমি:',  'Transaction ': 'লেনদেন ', ' · Parcel ': ' · জমি ', ' · Priority ': ' · অগ্রাধিকার ',
         'Search': 'খুঁজুন',
       
   
  'The PDF also contains ownership history, transaction timeline, registration vs mutation comparison and the AI explanation.': 'PDF-এ মালিকানার ইতিহাস, লেনদেনের সময়রেখা, রেজিস্ট্রেশন ও নামজারির তুলনা এবং এআই-এর ব্যাখ্যাও রয়েছে।',
  'Double-Sale / Overlapping Transfer': 'একই জমি একাধিকবার বিক্রি / হস্তান্তরের ওভারল্যাপ', 'Double-Sale': 'একই জমি একাধিকবার বিক্রি', 'Over-Transfer': 'অতিরিক্ত হস্তান্তর', 'Rapid Transfer': 'দ্রুত হস্তান্তর', 'Ownership Chain Break': 'মালিকানার ধারাবাহিকতা ভেঙেছে', 'Registration Mismatch': 'রেজিস্ট্রেশনের অমিল', 'Registration–Mutation Mismatch': 'রেজিস্ট্রেশন ও নামজারির অমিল', 'Temporal Inconsistency': 'তারিখের অসংগতি', 'Potential Double-Sale / Overlapping Transfer': 'সম্ভাব্য একাধিক বিক্রি / হস্তান্তরের ওভারল্যাপ', 'Potential Over-Transfer': 'সম্ভাব্য অতিরিক্ত হস্তান্তর', 'Rapid Transfer Pattern': 'দ্রুত হস্তান্তরের ধরন', 'Critical Review Priority': 'জরুরি পর্যালোচনা অগ্রাধিকার', 'High Review Priority': 'উচ্চ পর্যালোচনা অগ্রাধিকার', 'Medium Review Priority': 'মাঝারি পর্যালোচনা অগ্রাধিকার', 'Low Review Priority': 'নিম্ন পর্যালোচনা অগ্রাধিকার',
  'The same interest appears to have been transferred to more than one buyer.': 'একই জমির অংশ একাধিক ক্রেতার কাছে হস্তান্তর করা হয়েছে বলে মনে হচ্ছে।', 'Recorded ownership is lower than cumulative transferred area.': 'নথিভুক্ত মালিকানার পরিমাণ মোট হস্তান্তরিত জমির চেয়ে কম।', 'The recorded seller does not match the recorded previous owner.': 'নথিভুক্ত বিক্রেতা আগের নথিভুক্ত মালিকের সাথে মেলে না।', 'The registration record does not agree with the transaction record.': 'রেজিস্ট্রেশন নথি লেনদেনের নথির সাথে মেলে না।', 'The mutation record does not agree with the registration record.': 'নামজারির নথি রেজিস্ট্রেশন নথির সাথে মেলে না।', 'Record dates are not in the expected order.': 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই।', 'The parcel was transferred again after a very short interval.': 'খুব অল্প সময়ের ব্যবধানে জমিটি আবার হস্তান্তর করা হয়েছে।', 'Registered': 'নিবন্ধিত', 'Completed': 'সম্পন্ন', 'Inactive': 'নিষ্ক্রিয়', 'Active': 'সক্রিয়', 'Pending': 'অপেক্ষমাণ', 'Verified': 'যাচাইকৃত', 'Unverified': 'যাচাই হয়নি',
  'Parcel ID (Optional)': 'জমির আইডি (ঐচ্ছিক)', 'e.g. K-46760': 'যেমন K-46760', 'e.g. D-36650': 'যেমন D-36650', 'e.g. P-014133': 'যেমন P-014133', 'dec': 'শতক', 'Location:': 'অবস্থান:', '(Mouza ': '(মৌজা ', ', Khatian ': ', খতিয়ান ', ', Dag ': ', দাগ ', 'Current owner:': 'বর্তমান মালিক:', 'Integrity status:': 'তথ্যের সামঞ্জস্য:', 'transaction(s) have integrity signals.': 'টি লেনদেনে অসংগতির সংকেত রয়েছে।', 'matching parcels — highest priority first': 'টি মিলে যাওয়া জমি — সর্বোচ্চ অগ্রাধিকার আগে', 'Area (': 'জমির পরিমাণ (', '% with signals': '%-এ অসংগতির সংকেত', 'F1': 'F1', 'Parcel ID': 'জমির আইডি', 'Original Owner': 'প্রাথমিক মালিক', 'Transfer from ': 'হস্তান্তরকারী: ', ' · Type: ': ' · ধরন: ', ' · Status: ': ' · অবস্থা: ', ' · Registration: ': ' · রেজিস্ট্রেশন: ', ' · Mutation: ': ' · নামজারি: ', '), holding ': '), যার মালিকানার অংশ ', 'Human Review Required. An authorised officer should check the source deed and mutation file before any decision. This analysis does not confirm fraud or decide ownership.': 'মানবীয় পর্যালোচনা প্রয়োজন। কোনো সিদ্ধান্তের আগে অনুমোদিত কর্মকর্তার মূল দলিল ও নামজারির নথি যাচাই করা উচিত। এই বিশ্লেষণ জালিয়াতি নিশ্চিত করে না বা মালিকানা নির্ধারণ করে না।', 'Bars show each factor\'s share of the positive SHAP contribution (hover for the raw SHAP value). Model:': 'বারগুলো SHAP-এ প্রতিটি বিষয়ের অবদান দেখায় (মূল SHAP মান দেখতে পয়েন্টার রাখুন)। মডেল:', 'features).': 'টি বৈশিষ্ট্য)।', 'Synthetic data only · LandTech 2026 · P3 Fraud & Double-Selling Detection': 'শুধু কৃত্রিম তথ্য · LandTech ২০২৬ · সমস্যা ৩: ভূমি জালিয়াতি ও একাধিকবার বিক্রি শনাক্তকরণ', 'Schematic aerial view': 'জমির পরিকল্পিত আকাশদৃশ্য', 'Aerial view of vibrant agricultural fields': 'বৈচিত্র্যময় কৃষিজমির আকাশদৃশ্য', 'Parcel overview': 'জমির সংক্ষিপ্ত বিবরণ', '· decision-support only': '· শুধু সিদ্ধান্ত গ্রহণে সহায়ক', ': transaction “': ': লেনদেন “', '”, registration “': '”, রেজিস্ট্রেশন “', '”, mutation “': '”, নামজারি “',
  'No mutation record exists, so the new owner cannot be confirmed.': 'নামজারির নথি নেই, তাই নতুন মালিককে নিশ্চিত করা যাচ্ছে না.', 'Mutation owner differs from the registered buyer.': 'নামজারির মালিক রেজিস্ট্রিতে থাকা ক্রেতার সাথে মেলে না.', 'Mutation owner matches the registered buyer.': 'নামজারির মালিক রেজিস্ট্রিতে থাকা ক্রেতার সাথে মেলে।', 'Mutation previous owner differs from the registered seller.': 'নামজারিতে থাকা আগের মালিক রেজিস্ট্রিতে থাকা বিক্রেতার সাথে মেলে না.', 'Mutation previous owner matches the registered seller.': 'নামজারিতে থাকা আগের মালিক রেজিস্ট্রিতে থাকা বিক্রেতার সাথে মেলে।', 'Mutated area matches the registered area.': 'নামজারির জমির পরিমাণ রেজিস্ট্রির জমির পরিমাণের সাথে মেলে।', 'Mutation share matches.': 'নামজারির অংশের সাথে হস্তান্তরিত অংশের মিল রয়েছে।', 'Mutation type differs from the registration type.': 'নামজারির ধরন রেজিস্ট্রেশনের ধরনের সাথে মেলে না.', 'Mutation type matches the registration.': 'নামজারির ধরন রেজিস্ট্রেশনের সাথে মেলে।', 'A mutation record exists.': 'নামজারির নথি রয়েছে।', 'No registration record exists for this transaction.': 'এই লেনদেনের কোনো রেজিস্ট্রেশন নথি নেই।', 'Registered buyer differs from the transaction buyer.': 'রেজিস্ট্রিতে থাকা ক্রেতা লেনদেনের ক্রেতার সাথে মেলে না।', 'Registered buyer matches.': 'রেজিস্ট্রিতে থাকা ক্রেতা লেনদেনের ক্রেতার সাথে মেলে।', 'Registered seller differs from the transaction seller.': 'রেজিস্ট্রিতে থাকা বিক্রেতা লেনদেনের বিক্রেতার সাথে মেলে না।', 'Registered seller matches.': 'রেজিস্ট্রিতে থাকা বিক্রেতা লেনদেনের বিক্রেতার সাথে মেলে।', 'Registered area matches.': 'রেজিস্ট্রির জমির পরিমাণ লেনদেনের জমির পরিমাণের সাথে মেলে।', 'Registration type differs from the transaction type.': 'রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সাথে মেলে না।', 'Registration type matches.': 'রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সাথে মেলে।', 'A registration record exists.': 'রেজিস্ট্রেশনের নথি রয়েছে।', 'Seller matches the recorded previous owner.': 'বিক্রেতা নথিভুক্ত আগের মালিকের সাথে মেলে।', 'This seller had earlier sales on the same parcel.': 'এই বিক্রেতা আগে একই জমিতে বিক্রি করেছেন।', 'No earlier sales by this seller on this parcel.': 'এই বিক্রেতার একই জমিতে আগের কোনো বিক্রির নথি নেই।', 'Transfer interval looks typical.': 'হস্তান্তরের সময়ের ব্যবধান স্বাভাবিক মনে হচ্ছে।', 'No earlier transfer to compare with.': 'তুলনা করার মতো আগের কোনো হস্তান্তর নেই।', 'Record dates are out of the expected order.': 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই।', 'Record dates are in the expected order.': 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় রয়েছে।', 'more': 'আরও', 'This transaction': 'এই লেনদেন', 'Earlier full transfer': 'আগের সম্পূর্ণ হস্তান্তর', 'Buyer (this transaction)': 'ক্রেতা (এই লেনদেন)', 'Total Transferred': 'মোট হস্তান্তরিত', 'Potential Excess': 'সম্ভাব্য অতিরিক্ত অংশ', 'Potential Overlap (sold after full transfer)': 'সম্ভাব্য ওভারল্যাপ (সম্পূর্ণ হস্তান্তরের পর বিক্রি)', 'Earlier full transfer to ': 'আগের সম্পূর্ণ হস্তান্তর, গ্রহীতা: ', 'This transfer to ': 'এই হস্তান্তর, গ্রহীতা: ',
  
}

const entries = Object.entries(COPY).sort(([a], [b]) => b.length - a.length)
function translate(text) {
  // JSX text nodes often contain intentional spaces around inline elements;
  // check those exact fragments before normalizing whitespace.
  const rawExact = entries.find(([en]) => en.toLowerCase() === text.toLowerCase())
  if (rawExact) return rawExact[1]
  const leading = text.match(/^\s*/)?.[0] ?? ''
  const trailing = text.match(/\s*$/)?.[0] ?? ''
  const body = text.slice(leading.length, text.length - trailing.length || undefined)
  const exact = entries.find(([en]) => en.toLowerCase() === body.toLowerCase())
  if (exact) return `${leading}${exact[1]}${trailing}`
  const matchers = [
    [/^(\d+) matching parcels — highest priority first$/, (m) => `${m[1]}টি জমি মিলেছে — সর্বোচ্চ অগ্রাধিকারেরটি আগে`],
    [/^(\d+) of (\d+) transaction\(s\) have integrity signals\.$/, (m) => `${m[2]}টির মধ্যে ${m[1]}টি লেনদেনে অসংগতির সংকেত রয়েছে।`],
    [/^Integrity Alerts \((.+)\)$/, (m) => `তথ্যগত অসংগতি (${m[1]})`],
    [/^(\d+) inconsistenc(?:y|ies) detected$/, (m) => `${m[1]}টি অসংগতি শনাক্ত হয়েছে`],
    [/^Rule evidence \((\d+) signal(?:s)?\)$/, (m) => `নিয়মভিত্তিক প্রমাণ (${m[1]}টি সংকেত)`],
    [/^ML anomaly score \((.+)%\)$/, (m) => `যন্ত্রশিক্ষা অসংগতি স্কোর (${m[1]}%)`],
    [/^(\d+) owners · (\d+) transactions$/, (m) => `${m[1]} জন মালিক · ${m[2]}টি লেনদেন`],
    [/^(\d+)% with signals$/, (m) => `${m[1]}%-এ অসংগতির সংকেত`],
    [/^Investigation priority (.+) out of 100$/, (m) => `তদন্তের অগ্রাধিকার: ১০০-এর মধ্যে ${m[1]}`],
    [/^Transfer from (.+)$/, (m) => `${m[1]} থেকে হস্তান্তর`],
    [/^Earlier full transfer to (.+?) \((T-\d+)\)$/, (m) => `${m[1]}-এর কাছে আগের সম্পূর্ণ হস্তান্তর (${m[2]})`],
    [/^This transfer to (.+?) \((T-\d+)\)$/, (m) => `${m[1]}-এর কাছে এই হস্তান্তর (${m[2]})`],
    [/^Area \((.+)\)$/, (m) => `জমির পরিমাণ (${m[1]})`],
    [/^\+(\d+) more$/, (m) => `আরও ${m[1]}টি`],
    [/^Transaction (.+?) was not found\.$/, (m) => `লেনদেন ${m[1]} পাওয়া যায়নি।`],
    [/^Parcel (.+?) was not found\.$/, (m) => `জমি ${m[1]} পাওয়া যায়নি।`],
    [/^Owner (.+?) was not found\.$/, (m) => `মালিক ${m[1]} পাওয়া যায়নি।`],
    [/^Registration (.+?) was not found\.$/, (m) => `রেজিস্ট্রেশন নথি ${m[1]} পাওয়া যায়নি।`],
    [/^Mutation (.+?) was not found\.$/, (m) => `নামজারির নথি ${m[1]} পাওয়া যায়নি।`],
    [/^(.+?) appears as seller in more than one transfer of this parcel\.$/, (m) => `${m[1]} এই জমির একাধিক হস্তান্তরে বিক্রেতা হিসেবে দেখা যাচ্ছে।`],
    [/^The parcel has (\d+) recorded transfers? \(repeated transfer history\)\.$/, (m) => `জমিটির নথিতে ${m[1]}টি হস্তান্তর রয়েছে (একাধিকবার হস্তান্তরের ইতিহাস)।`],
    [/^Transferred share \((.+?)\) exceeds the seller's recorded share \((.+?)\)\.$/, (m) => `হস্তান্তরিত অংশ (${m[1]}) বিক্রেতার নথিভুক্ত অংশ (${m[2]})-এর চেয়ে বেশি।`],
    [/^Transferred share \((.+?)\) exceeds the parcel's total area \((.+?)\)\.$/, (m) => `হস্তান্তরিত অংশ (${m[1]}) জমির মোট পরিমাণ (${m[2]})-এর চেয়ে বেশি।`],
    [/^Mutated area differs from registered area by (.+?) decimal\.$/, (m) => `নামজারির জমির পরিমাণ রেজিস্ট্রির জমির পরিমাণ থেকে ${m[1]} শতক ভিন্ন।`],
    [/^Registered area differs from transaction area by (.+?) decimal\.$/, (m) => `রেজিস্ট্রির জমির পরিমাণ লেনদেনের জমির পরিমাণ থেকে ${m[1]} শতক ভিন্ন।`],
    [/^Mutation share differs from transferred share by (.+?) percentage points?\.$/, (m) => `নামজারির অংশ হস্তান্তরিত অংশ থেকে ${m[1]} শতাংশ বিন্দু ভিন্ন।`],
    [/^Transferred share \((.+?)\) is compared with the seller's recorded share \((.+?)\)\.$/, (m) => `হস্তান্তরিত অংশ (${m[1]}) বিক্রেতার নথিভুক্ত অংশের (${m[2]}) সাথে তুলনা করা হয়েছে।`],
    [/^The transaction was transferred again after (\d+) day\(s\)\.$/, (m) => `${m[1]} দিন পর জমিটি আবার হস্তান্তর করা হয়েছে।`],
    [/^This seller had already sold (.+?)% earlier on this parcel\.$/, (m) => `এই বিক্রেতা আগে একই জমির ${m[1]}% বিক্রি করেছিলেন।`],
    [/^The same interest appears to have been transferred to more than one buyer\.$/, () => 'একই জমির অংশ একাধিক ক্রেতার কাছে হস্তান্তর করা হয়েছে বলে মনে হচ্ছে।'],
    [/^Recorded ownership is lower than cumulative transferred area\.$/, () => 'নথিভুক্ত মালিকানার পরিমাণ মোট হস্তান্তরিত জমির চেয়ে কম।'],
    [/^Total transferred \((.+?) (.+?)\) exceeds the recorded share \((.+?) (.+?)\) by (.+?)\.$/, (m) => `মোট হস্তান্তরিত পরিমাণ (${m[1]} ${m[2]}) নথিভুক্ত অংশ (${m[3]} ${m[4]})-এর চেয়ে ${m[5]} বেশি।`],
    [/^(.+?) had already transferred their entire interest in (T-\d+); this later transfer overlaps it\.$/, (m) => `${m[1]} ${m[2]} লেনদেনে তার সম্পূর্ণ অংশ আগেই হস্তান্তর করেছিলেন; পরবর্তী এই হস্তান্তরটির সাথে তার ওভারল্যাপ রয়েছে।`],
    [/^(.+?) appears as seller again although transaction (T-\d+) had already transferred their entire recorded interest in this parcel\.$/, (m) => `${m[1]} একই জমির বিক্রেতা হিসেবে আবার দেখা যাচ্ছে, যদিও ${m[2]} লেনদেনে তার সম্পূর্ণ নথিভুক্ত অংশ আগেই হস্তান্তর করা হয়েছিল।`],
    [/^This parcel was transferred again (\d+) day\(s\) after the previous transfer \((strong|moderate) signal\)\. Rapid transfers are an anomaly signal only, not proof of wrongdoing\.$/, (m) => `আগের হস্তান্তরের ${m[1]} দিন পর জমিটি আবার হস্তান্তর করা হয়েছে (${m[2] === 'strong' ? 'জোরালো' : 'মাঝারি'} সংকেত)। দ্রুত হস্তান্তর শুধু অসংগতির সংকেত, অনিয়মের প্রমাণ নয়।`],
    [/^The recorded seller (.+?) does not match the recorded previous owner (.+?)\.$/, (m) => `নথিভুক্ত বিক্রেতা ${m[1]} নথিভুক্ত আগের মালিক ${m[2]}-এর সাথে মেলে না।`],
  ]
  for (const [pattern, render] of matchers) {
    const m = body.match(pattern)
    if (m) return `${leading}${render(m)}${trailing}`
  }
  if (/^(no registration record|no mutation record|registered buyer |registered seller |registered area |registration type |registration date |mutation owner |mutation previous owner |mutated area |mutation share |mutation type |mutation date )/i.test(body)) {
    const parts = body.replace(/\.$/, '').split('; ').map((part) => {
      const rules = [
        [/^no registration record is linked to this transaction$/i, 'এই লেনদেনের সাথে রেজিস্ট্রেশনের নথি সংযুক্ত নেই'],
        [/^no mutation record is linked to this transaction$/i, 'এই লেনদেনের সাথে নামজারির নথি সংযুক্ত নেই'],
        [/^registered buyer (.+?) differs from transaction buyer (.+)$/i, 'রেজিস্ট্রিতে থাকা ক্রেতা $1 লেনদেনের ক্রেতা $2-এর সাথে মেলে না'],
        [/^registered seller (.+?) differs from transaction seller (.+)$/i, 'রেজিস্ট্রিতে থাকা বিক্রেতা $1 লেনদেনের বিক্রেতা $2-এর সাথে মেলে না'],
        [/^registered area (.+?) differs from transaction area (.+?) decimal$/i, 'রেজিস্ট্রির জমির পরিমাণ $1 শতক লেনদেনের জমির পরিমাণ $2 শতকের সাথে মেলে না'],
        [/^registration type '(.+?)' differs from transaction type '(.+?)'$/i, 'রেজিস্ট্রেশনের ধরন $1 লেনদেনের ধরন $2-এর সাথে মেলে না'],
        [/^registration date (.+?) is before the transaction date (.+)$/i, 'রেজিস্ট্রেশনের তারিখ $1 লেনদেনের তারিখ $2-এর আগে'],
        [/^mutation owner (.+?) differs from registered buyer (.+)$/i, 'নামজারির মালিক $1 রেজিস্ট্রিতে থাকা ক্রেতা $2-এর সাথে মেলে না'],
        [/^mutation previous owner (.+?) differs from registered seller (.+)$/i, 'নামজারিতে থাকা আগের মালিক $1 রেজিস্ট্রিতে থাকা বিক্রেতা $2-এর সাথে মেলে না'],
        [/^mutated area (.+?) differs from registered area (.+?) decimal$/i, 'নামজারির জমির পরিমাণ $1 শতক রেজিস্ট্রির $2 শতকের সাথে মেলে না'],
        [/^mutation share (.+?)% differs from transferred share (.+?)%$/i, 'নামজারিতে থাকা অংশ $1% হস্তান্তরিত অংশ $2%-এর সাথে মেলে না'],
        [/^mutation type '(.+?)' differs from registration type '(.+?)'$/i, 'নামজারির ধরন $1 রেজিস্ট্রেশনের ধরন $2-এর সাথে মেলে না'],
        [/^mutation date (.+?) is earlier than the registration\/transaction date$/i, 'নামজারির তারিখ $1 রেজিস্ট্রেশন/লেনদেনের তারিখের আগে'],
      ]
      for (const [pattern, replacement] of rules) if (pattern.test(part)) return part.replace(pattern, replacement)
      return 'নথির তথ্যের মধ্যে অমিল পাওয়া গেছে'
    })
    return `${leading}${parts.join('; ')}।${trailing}`
  }
  const errorCopy = {
    'Cannot reach the ভূমি প্রহরী server. Make sure the backend is running on port 8000.': 'ভূমি প্রহরী সার্ভারে সংযোগ করা যাচ্ছে না। ব্যাকএন্ড ৮০০০ নম্বর পোর্টে চালু আছে কি না দেখুন।',
    'Something went wrong. Please try again.': 'কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    'Alert not found.': 'সতর্কতাটি পাওয়া যায়নি।',
    'No demo parcel is available.': 'ডেমোর জন্য কোনো জমি পাওয়া যায়নি।',
    'Give exactly one of parcel_id or owner_id.': 'জমির আইডি অথবা মালিকের আইডি—যেকোনো একটি দিন।',
    'No model metrics are available.': 'মডেলের কোনো পরিমাপক তথ্য পাওয়া যায়নি।',
    'Model metrics are not available yet. Run the ML training step.': 'মডেলের পরিমাপক তথ্য এখনো পাওয়া যায়নি। আগে মেশিন লার্নিং প্রশিক্ষণ চালান।',
    'Transaction not found.': 'লেনদেনটি পাওয়া যায়নি.',
  }
  if (errorCopy[body]) return `${leading}${errorCopy[body]}${trailing}`
  return text
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('landguard-language') || 'bn' } catch { return 'bn' }
  })
  const records = useRef(new WeakMap())
  useEffect(() => {
    const root = document.getElementById('root')
    const apply = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const old = records.current.get(node)
        const current = node.nodeValue
        const source = old && current === old.shown ? old.original : current
        const shown = language === 'bn' ? translate(source) : source
        records.current.set(node, { original: source, shown })
        if (shown !== current) node.nodeValue = shown
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.hasAttribute('data-language-switch')) return
        for (const attr of ['placeholder', 'title', 'aria-label']) {
          if (!node.hasAttribute(attr)) continue
          const old = records.current.get(node)?.[attr]
          const current = node.getAttribute(attr)
          const source = old && current === old.shown ? old.original : current
          const shown = language === 'bn' ? translate(source) : source
          const record = records.current.get(node) || {}
          records.current.set(node, { ...record, [attr]: { original: source, shown } })
          if (shown !== current) node.setAttribute(attr, shown)
        }
        for (const child of node.childNodes) apply(child)
      }
    }
    if (root) apply(root)
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === 'characterData') apply(change.target)
        else if (change.type === 'attributes') apply(change.target)
        else change.addedNodes.forEach(apply)
      }
    })
    if (root) observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] })
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en'
    return () => observer.disconnect()
  }, [language])

  const toggleLanguage = () => {
    const next = language === 'bn' ? 'en' : 'bn'
    try { localStorage.setItem('landguard-language', next) } catch { /* storage may be disabled */ }
    setLanguage(next)
  }
  return <LanguageContext.Provider value={{ language, toggleLanguage }}>
    {children}
    <button data-language-switch onClick={toggleLanguage} className="fixed bottom-3 right-3 z-[100] rounded-full border border-white/30 bg-brand-950 px-3 py-2 text-xs font-bold text-white shadow-xl transition hover:bg-brand-800 sm:bottom-5 sm:right-5 sm:px-4 sm:py-2.5 sm:text-sm" aria-label={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}>
      {language === 'bn' ? 'English' : 'বাংলা'}
    </button>
  </LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used within LanguageProvider')
  return value
}
