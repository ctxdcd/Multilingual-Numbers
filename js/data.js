// Multilingual number data. Each language has one line per number:
//   value | written form | pronunciation (optional) | extra note (optional)
// Large values use e-notation: 1e6 = 1,000,000. To fix a word, edit its line.
(function () {
  const languages = [
    { code: 'ja', name: 'Japanese', dir: 'ltr',
      note: 'Japanese groups large numbers by 10,000 (万 man) and 100,000,000 (億 oku), so there is no separate word for "million". Written forms here are in hiragana; kanji are shown as extra info.',
      raw: `
0|れい / ゼロ|rei / zero|零 / 〇
1|いち|ichi|一
2|に|ni|二
3|さん|san|三
4|よん / し|yon / shi|四 (よん is most common)
5|ご|go|五
6|ろく|roku|六
7|なな / しち|nana / shichi|七
8|はち|hachi|八
9|きゅう / く|kyū / ku|九
10|じゅう|jū|十
20|にじゅう|nijū|二十
30|さんじゅう|sanjū|三十
40|よんじゅう|yonjū|四十
50|ごじゅう|gojū|五十
60|ろくじゅう|rokujū|六十
70|ななじゅう|nanajū|七十 (also しちじゅう)
80|はちじゅう|hachijū|八十
90|きゅうじゅう|kyūjū|九十
100|ひゃく|hyaku|百
200|にひゃく|nihyaku|二百
300|さんびゃく|sanbyaku|三百
400|よんひゃく|yonhyaku|四百
500|ごひゃく|gohyaku|五百
600|ろっぴゃく|roppyaku|六百
700|ななひゃく|nanahyaku|七百
800|はっぴゃく|happyaku|八百
900|きゅうひゃく|kyūhyaku|九百
1000|せん|sen|千
2000|にせん|nisen|二千
3000|さんぜん|sanzen|三千
4000|よんせん|yonsen|四千
5000|ごせん|gosen|五千
6000|ろくせん|rokusen|六千
7000|ななせん|nanasen|七千
8000|はっせん|hassen|八千
9000|きゅうせん|kyūsen|九千
10000|いちまん|ichiman|一万
20000|にまん|niman|二万
30000|さんまん|sanman|三万
40000|よんまん|yonman|四万
50000|ごまん|goman|五万
60000|ろくまん|rokuman|六万
70000|ななまん|nanaman|七万
80000|はちまん|hachiman|八万
90000|きゅうまん|kyūman|九万
100000|じゅうまん|jūman|十万
1e6|ひゃくまん|hyakuman|百万
2e6|にひゃくまん|nihyakuman|二百万
5e6|ごひゃくまん|gohyakuman|五百万
1e7|せんまん|senman|千万 (also いっせんまん)
1e8|いちおく|ichioku|一億
1e9|じゅうおく|jūoku|十億` },
    { code: 'ru', name: 'Russian', dir: 'ltr',
      note: 'Russian number words change form with the number that comes before them (e.g. 1 тысяча, 2–4 тысячи, 5+ тысяч).',
      raw: `
0|ноль|nol'
1|один|odin
2|два|dva
3|три|tri
4|четыре|chetyre
5|пять|pyat'
6|шесть|shest'
7|семь|sem'
8|восемь|vosem'
9|девять|devyat'
10|десять|desyat'
20|двадцать|dvadtsat'
30|тридцать|tridtsat'
40|сорок|sorok
50|пятьдесят|pyat'desyat
60|шестьдесят|shest'desyat
70|семьдесят|sem'desyat
80|восемьдесят|vosem'desyat
90|девяносто|devyanosto
100|сто|sto
200|двести|dvesti
300|триста|trista
400|четыреста|chetyresta
500|пятьсот|pyatsot
600|шестьсот|shestsot
700|семьсот|semsot
800|восемьсот|vosemsot
900|девятьсот|devyatsot
1000|тысяча|tysyacha
2000|две тысячи|dve tysyachi
3000|три тысячи|tri tysyachi
4000|четыре тысячи|chetyre tysyachi
5000|пять тысяч|pyat' tysyach
6000|шесть тысяч|shest' tysyach
7000|семь тысяч|sem' tysyach
8000|восемь тысяч|vosem' tysyach
9000|девять тысяч|devyat' tysyach
10000|десять тысяч|desyat' tysyach
20000|двадцать тысяч|dvadtsat' tysyach
30000|тридцать тысяч|tridtsat' tysyach
40000|сорок тысяч|sorok tysyach
50000|пятьдесят тысяч|pyat'desyat tysyach
60000|шестьдесят тысяч|shest'desyat tysyach
70000|семьдесят тысяч|sem'desyat tysyach
80000|восемьдесят тысяч|vosem'desyat tysyach
90000|девяносто тысяч|devyanosto tysyach
100000|сто тысяч|sto tysyach
1e6|миллион|million
2e6|два миллиона|dva milliona
5e6|пять миллионов|pyat' millionov
1e7|десять миллионов|desyat' millionov
1e8|сто миллионов|sto millionov
1e9|миллиард|milliard` },
    { code: 'de', name: 'German', dir: 'ltr',
      note: 'German Milliarde = 10⁹ (a billion). German Billion = 10¹² (a trillion), so it is NOT the English "billion".',
      raw: `
0|null
1|eins
2|zwei
3|drei
4|vier
5|fünf
6|sechs
7|sieben
8|acht
9|neun
10|zehn
20|zwanzig
30|dreißig
40|vierzig
50|fünfzig
60|sechzig
70|siebzig
80|achtzig
90|neunzig
100|hundert||also einhundert
200|zweihundert
300|dreihundert
400|vierhundert
500|fünfhundert
600|sechshundert
700|siebenhundert
800|achthundert
900|neunhundert
1000|tausend||also eintausend
2000|zweitausend
3000|dreitausend
4000|viertausend
5000|fünftausend
6000|sechstausend
7000|siebentausend
8000|achttausend
9000|neuntausend
10000|zehntausend
20000|zwanzigtausend
30000|dreißigtausend
40000|vierzigtausend
50000|fünfzigtausend
60000|sechzigtausend
70000|siebzigtausend
80000|achtzigtausend
90000|neunzigtausend
100000|hunderttausend
1e6|eine Million||Million is a noun; plural: Millionen
2e6|zwei Millionen
5e6|fünf Millionen
1e7|zehn Millionen
1e8|hundert Millionen
1e9|eine Milliarde||Milliarde is a noun; plural: Milliarden` },
    { code: 'fr', name: 'French', dir: 'ltr',
      note: 'Belgium and Switzerland use septante (70) and nonante (90); Switzerland also uses huitante or octante (80) in some regions.',
      raw: `
0|zéro
1|un
2|deux
3|trois
4|quatre
5|cinq
6|six
7|sept
8|huit
9|neuf
10|dix
20|vingt
30|trente
40|quarante
50|cinquante
60|soixante
70|soixante-dix||Belgium/Switzerland: septante
80|quatre-vingts||loses the -s before another number: quatre-vingt-un
90|quatre-vingt-dix||Belgium/Switzerland: nonante
100|cent
200|deux cents||loses the -s before another number: deux cent un
300|trois cents
400|quatre cents
500|cinq cents
600|six cents
700|sept cents
800|huit cents
900|neuf cents
1000|mille
2000|deux mille
3000|trois mille
4000|quatre mille
5000|cinq mille
6000|six mille
7000|sept mille
8000|huit mille
9000|neuf mille
10000|dix mille
20000|vingt mille
30000|trente mille
40000|quarante mille
50000|cinquante mille
60000|soixante mille
70000|soixante-dix mille
80000|quatre-vingt mille
90000|quatre-vingt-dix mille
100000|cent mille
1e6|un million||Million is a noun; plural: millions
2e6|deux millions
5e6|cinq millions
1e7|dix millions
1e8|cent millions
1e9|un milliard||Milliard is a noun; plural: milliards` },
    { code: 'tr', name: 'Turkish', dir: 'ltr',
      note: 'Turkish writes number words separately (iki yüz, üç bin). 1,000 is just "bin", not "bir bin".',
      raw: `
0|sıfır
1|bir
2|iki
3|üç
4|dört
5|beş
6|altı
7|yedi
8|sekiz
9|dokuz
10|on
20|yirmi
30|otuz
40|kırk
50|elli
60|altmış
70|yetmiş
80|seksen
90|doksan
100|yüz
200|iki yüz
300|üç yüz
400|dört yüz
500|beş yüz
600|altı yüz
700|yedi yüz
800|sekiz yüz
900|dokuz yüz
1000|bin
2000|iki bin
3000|üç bin
4000|dört bin
5000|beş bin
6000|altı bin
7000|yedi bin
8000|sekiz bin
9000|dokuz bin
10000|on bin
20000|yirmi bin
30000|otuz bin
40000|kırk bin
50000|elli bin
60000|altmış bin
70000|yetmiş bin
80000|seksen bin
90000|doksan bin
100000|yüz bin
1e6|bir milyon
2e6|iki milyon
5e6|beş milyon
1e7|on milyon
1e8|yüz milyon
1e9|bir milyar` },
    { code: 'ku', name: 'Kurdish (Kurmanji)', dir: 'ltr',
      note: 'Kurmanji is written in the Latin (Hawar) alphabet. Numbers above ten are built by placing the multiplier before sed (100), hezar (1,000) and milyon (million).',
      raw: `
0|sifir
1|yek
2|du
3|sê
4|çar
5|pênc
6|şeş
7|heft
8|heşt
9|neh
10|deh
20|bîst
30|sî
40|çil
50|pêncî
60|şêst
70|heftê
80|heştê
90|nod
100|sed
200|du sed
300|sê sed
400|çar sed
500|pênc sed
600|şeş sed
700|heft sed
800|heşt sed
900|neh sed
1000|hezar||also yek hezar
2000|du hezar
3000|sê hezar
4000|çar hezar
5000|pênc hezar
6000|şeş hezar
7000|heft hezar
8000|heşt hezar
9000|neh hezar
10000|deh hezar
20000|bîst hezar
30000|sî hezar
40000|çil hezar
50000|pêncî hezar
60000|şêst hezar
70000|heftê hezar
80000|heştê hezar
90000|nod hezar
100000|sed hezar
1e6|milyon||also yek milyon
2e6|du milyon
5e6|pênc milyon
1e7|deh milyon
1e8|sed milyon
1e9|milyar||also yek milyar` },
    { code: 'ar', name: 'Arabic', dir: 'rtl',
      note: 'Modern Standard Arabic counting forms. Real usage changes with the gender and grammatical case of the counted noun. The Arabic word for 1,000,000,000 is مليار (some regions say بليون).',
      raw: `
0|صفر|ṣifr
1|واحد|wāḥid
2|اثنان|ithnān
3|ثلاثة|thalātha
4|أربعة|arbaʿa
5|خمسة|khamsa
6|ستة|sitta
7|سبعة|sabʿa
8|ثمانية|thamāniya
9|تسعة|tisʿa
10|عشرة|ʿashara
20|عشرون|ʿishrūn
30|ثلاثون|thalāthūn
40|أربعون|arbaʿūn
50|خمسون|khamsūn
60|ستون|sittūn
70|سبعون|sabʿūn
80|ثمانون|thamānūn
90|تسعون|tisʿūn
100|مئة|miʾa|also written مائة
200|مئتان|miʾatān
300|ثلاثمئة|thalāthumiʾa
400|أربعمئة|arbaʿumiʾa
500|خمسمئة|khamsumiʾa
600|ستمئة|sittumiʾa
700|سبعمئة|sabʿumiʾa
800|ثمانمئة|thamānimiʾa
900|تسعمئة|tisʿumiʾa
1000|ألف|alf
2000|ألفان|alfān
3000|ثلاثة آلاف|thalātha ālāf
4000|أربعة آلاف|arbaʿa ālāf
5000|خمسة آلاف|khamsa ālāf
6000|ستة آلاف|sitta ālāf
7000|سبعة آلاف|sabʿa ālāf
8000|ثمانية آلاف|thamāniya ālāf
9000|تسعة آلاف|tisʿa ālāf
10000|عشرة آلاف|ʿashara ālāf
20000|عشرون ألفًا|ʿishrūn alfan
30000|ثلاثون ألفًا|thalāthūn alfan
40000|أربعون ألفًا|arbaʿūn alfan
50000|خمسون ألفًا|khamsūn alfan
60000|ستون ألفًا|sittūn alfan
70000|سبعون ألفًا|sabʿūn alfan
80000|ثمانون ألفًا|thamānūn alfan
90000|تسعون ألفًا|tisʿūn alfan
100000|مئة ألف|miʾat alf
1e6|مليون|milyūn
2e6|مليونان|milyūnān
5e6|خمسة ملايين|khamsat malāyīn
1e7|عشرة ملايين|ʿasharat malāyīn
1e8|مئة مليون|miʾat milyūn
1e9|مليار|milyār` }
  ];

  // Turn each language's text block into a lookup: words[value] = {w, r, a}
  languages.forEach(function (l) {
    l.words = {};
    l.raw.trim().split('\n').forEach(function (line) {
      const p = line.split('|');
      l.words[Number(p[0])] = { w: p[1], r: p[2] || '', a: p[3] || '' };
    });
    delete l.raw;
  });

  function range(from, to, step) {
    const out = [];
    for (let v = from; v <= to; v += step) out.push(v);
    return out;
  }

  // The six scales: only milestone values, never every integer.
  const scales = [
    { id: 's1', title: '0–10', values: range(0, 10, 1) },
    { id: 's2', title: '10–100', values: range(10, 100, 10) },
    { id: 's3', title: '100–1K', values: range(100, 1000, 100) },
    { id: 's4', title: '1K–10K', values: range(1000, 10000, 1000) },
    { id: 's5', title: '10K–100K', values: range(10000, 100000, 10000) },
    { id: 's6', title: 'Millions+', values: [1e6, 2e6, 5e6, 1e7, 1e8, 1e9] }
  ];

  const bigLabels = { 1e6: '1 million', 2e6: '2 million', 5e6: '5 million', 1e7: '10 million', 1e8: '100 million', 1e9: '1 billion' };
  function label(v) { return bigLabels[v] || v.toLocaleString('en-US'); }

  const allValues = [];
  scales.forEach(function (s) { s.values.forEach(function (v) { if (allValues.indexOf(v) < 0) allValues.push(v); }); });

  window.NUMBERS_DATA = { languages: languages, scales: scales, allValues: allValues, label: label };
})();