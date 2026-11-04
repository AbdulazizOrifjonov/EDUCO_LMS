const rawCsv = `Matematika,,Ingliz tili,,Arab tili,,Rus Tili,,IT,,Mental,,Shaxmat,
Arslonov Ismoil,93 009 83 39,Botirova Mubina ,99 724 99 67,Xurshidova Parizoda,99 488 61 10,Raimanberdiyev Firdavs,97 344 53 13,Negmatov Qudratilla,94 385 22 53,Yo'ldoshev Rustambek,90 990 10 59,Raxmatjonov Azizjon,90 947 41 23
Mamadjonov Zafir,90 123 64 63,Ermatova Samira,93 610 55 18,Oybekova Soliha ,99 809 34 56,Abubakirxo'jayeva Saminaxon,93 392 15 52,Arslonov Ismoil,93 009 83 39,Ro'ziqulova Baxora,99 222 30 52,Axatov Ibrohim,94 601 95 00
Abdurahmonova Muslima,99 858 01 21,Muxammedova Zarinabonu,99 855 92 45,Ermatova Samira,93 610 55 18,Abubakirxo'jayeva E'zoza,93 392 15 52,Inayatov Amirbek,94 788 29 06,Abduraxmonova Osiyo,93 528 67 18,,
Abdurahmonov Abdulaziz,99 858 01 21,Qoraboyeva Nodira,93 575 51 04,Shaxobiddinov Abdulloh,99 434 00 77,Tillayev Abubakir,99 835 21 22,,,,,,
Shuxratov Shoxbek,99 882 23 09,Yusupova Soliha,94 428 88 94,Fazliddinova Muslima,95 810 69 69 ,Xaydarova Farangiz,94 050 87 80,,,,,,
Baxavaddinov Amirxon ,97 760 85 89 ,Muhammedov Shoxrux,99 855 92 45,Ikromova Farzona ,99 001 93 82,Murodullayev Saidaxmad,94 738 75 35,,,,,,
Boltayeva Madina,90 349 49 29,Muhammedov Abdulloh,99 855 92 45,Ikromova Muslima,99 001 93 82,Abduvaxobova Samina,99 816 17 74,,,,,,
To'laganov Umar,90 818 99 59,Baxodirova Nigina,99  548 84 90,Shohakimova Munisa,94 600 71 81,Alimardonova Sumaya,93 005 47 73,,,,,,
Kamolov Faxriddin,93 543 66 17,Arslonova Ruxsora,,Jumanazarova Mumina,77 777 12 01,Mun Kiril Vladimirovich,95 222 85 34,,,,,,
Nuraliyev Iskandar,90 333 35 54,Sobirjonov Anvar,99 825 07 11,Islomova Soliha ,,Alovuddinova Xadicha,90 970 99 95,,,,,,
Tog'aynazarova Shodiyona,93 906 95 88,Sobirjonov Akbar,99 825 07 11,Shuxratov Diyorbek,99 882 23 09,Baratov Jaxongir,97 519 00 11,,,,,,
Tog'aynazarov Shoxrux,93 906 95 88,Kamolov Faxriddin,93 543 66 17,Abdukarimova Xadicha ,93 393 83 38,Obidjonov Erxan,95 046 26 92,,,,,,
Raxmatjonov Azizjon,90 947 41 23,Shokirov Javlon,77 022 58 79,Murodov Abduqodir ,99 864 63 96 ,Shamsiddinov Mironshoh,90 252 14 14,,,,,,
Ramizjonov Azamjon,90 947 41 23,Tog'aynazarova Shodiyona ,93 901 95 88,Baxtiyorova Sabrina ,94 689 13 31,Shavkatov Shoxruz,94 921 42 80,,,,,,
Nuriddinov Saidibrohim,97 722 12 52,Karimjonova Sevara,94 430 70 35,Madina yanga Uyg'un aka,,Adhamjonov Imronbek,93 506 19 91,,,,,,
Nuriddinov Salohiddin,97 722 12 52,Alijonova Dilnura ,99 088 78 45,Shohakimov Shomansur,94 600 71 81,Jahongirov Muhammad,93 290 17 50,,,,,,
Baratov Jaxongir,97 519 00 11,Baratov Jahongir,97 519 00 11,Olimjonova Mexrinso,88 366 93 92,Abdumutalibov Aslbek,,,,,,,
Tolipova Kamola,94 843 49 05,Nuriddinov Saidibrohim,97 722 12 52,Xalimova Nigora,90 356 53 45,Ilhomjonova Diyora,90 009 57 55,,,,,,
Ruziqulova Malika,99 222 30 52,Nuriddinov Salohiddin,97 722 12 52,Xalimova Baxora,95 021 12 52,Saidova Fotima ,93 009 64 41,,,,,,
Rustamova Komila,99 916 36 60,Adhamov Muhammadali,91 560 00 77,Mirvarisov Muhammadsolih,95 021 12 52,Saidova Soliha,93 009 64 41,,,,,,
Abdumurodova Nuriya,95 773 73 92,Rustamov Firdavs ,99 916 36 60,Fazliddinov Abror,95 021 12 52,Xursanova Kumushbibi,93 067 88 90,,,,,,
Rustamov Firdavs ,99 916 36 60,Rustamova Komila,99 916 36 60,Baxodirov Temur,94 546 38 36,Hayitov Muhammad ,97 547 96 06,,,,,,
Anvarjonov Otabek,99 277 88 55,Baxodirova Zarina,99  548 84 90,Fazliddinov Humoyun,90 958 88 59,Hayitov Mustafo,97 547 96 06,,,,,,
Jaxongirova Solixa,93 290 17 50,To'raxonov Ozodbek,88 774 94 85 ,Qo'chqorova Lola,93 078 93 84,Uchqunov Jafar,95 616 15 08,,,,,,
Hamidova Lazizaxon,94 614 22 13,Abdumurodova Nuriya,95 773 73 92,Baxodirov Muhammadsodiq,94 627 50 90,Tanirberganov Muhammadamin,99 538 72 15,,,,,,
Shuxratov Shoxbek,99 882 23 09,Baxtiyorov Otabek,93 527 88 22,Eldorova Nozima,93 302 09 97,Axatov Ibrohim,94 601 95 00,,,,,,
Mo'ldasheva Marjan,99 109 15 74,Mamarasulov Oybek,93 527 88 22,Erkinova Zilola,99 900 56 15,Nematov Muhammadnur,90 159 44 95,,,,,,
Mo'ldasheva Mirey,99 109 15 74,Mamarasulov Odil,93 527 88 22,Botirov Muhammadamir,99 819 81 87,Ulug'bekov Usmonxon,77 343 18 99,,,,,,
Baxodirov Akbarbek,90 933 20 88,Abdujalilov Abduraxmon,95 190 80 80,Yoldashev Muhabbat,99-638-96-87,Xayrullayeva Shukrona,94 350 14 07,,,,,,
G'ofurov Jasurbek,93 506 68 22,Raximbekova Omina,93 539 93 93,Abdujalilov Abdurahmon ,95 190 80 80,Nurmuxammadova Nilufar,94 537 37 16,,,,,,
Abduqayumov Xojakbar,99 852 80 47,Raximbekov Muhammadamin,93 539 93 93,Shaxbozbekova Shukrona,99 764 00 94,Jumanazarov Ali,97 108 95 95,,,,,,
,,Samadov Sardorbek,99 849 29 12,Eshniyozova Mahfirat,99 764 00 94,Muhammadamin,,,,,,,
,,Jumanova Farangiz,99 827 2687,Tillaxojayeva Sardora,98 407 49 50,Shuxratov Yusuf,77 156 45 45,,,,,,
,,Ibragimova Kumushxon ,95 616 15 08,Shaxobiddinova Solixa,99 434 00 77,Jumanazarova Mumina,77 777 12 01,,,,,,
,,Arslonov Ismoil,93 009 83 39,,,Qaxramonov Abuzar,99 020 26 76,,,,,,
,,Jahongirova Soliha,93 290 17 50,,,Abdihakimov Islombek,99 900 99 96,,,,,,
,,Tillayev Firdavs,99 835 21 22,,,Xojamqulova Dilnora,99 922 66 16,,,,,,
,,Qo'chqorova Lola,93 078 93 84,,,Komiljonova Soliha,   99 922 00 76,,,,,,
,,Hamidova Lazizaxon,94 614 22 13,,,Shavqiddinova Mubina,97 784 88 07,,,,,,
,,Nematova Madina ,99 039 48 68 ,,,Sobirov Anvar,,,,,,,
,,To\`lqinov Azizbek,99 794 84 21,,,Erkinova Gözal,99 900 56 15,,,,,,
,,To'lqinova Dildora,99 794 84 21,,,,,,,,,,
,,Inayatov Amirbek,94 788 29 06,,,,,,,,,,
,,Kamariddinova Nozafari,94 691 40 31,,,,,,,,,,
,,Abduxakimov Behruz,50 195 98 06,,,,,,,,,,
,,Shuxratov Shoxbek,99 882 23 09,,,,,,,,,,
,,Zafarov Yusufbek ,99 057 73 66,,,,,,,,,,
,,Yo'ldoshev Rustambek,90 990 10 59,,,,,,,,,,
,,Jumanazarova Mumina,77 007 47 32,,,,,,,,,,`;

const lines = rawCsv.split('\n').filter(l => l.trim().length > 0);
const headers = ['Matematika', 'Ingliz tili', 'Arab tili', 'Rus Tili', 'IT', 'Mental', 'Shaxmat'];

const entries = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  for (let sIdx = 0; sIdx < headers.length; sIdx++) {
    const rawName = (parts[sIdx * 2] || '').trim();
    const rawPhone = (parts[sIdx * 2 + 1] || '').trim();
    if (rawName) {
      entries.push({
        subject: headers[sIdx],
        name: rawName,
        phone: rawPhone
      });
    }
  }
}

console.log('Total subject enrollments in table:', entries.length);

// Let us analyze students by unique phone or name
const studentMap = new Map();

for (const entry of entries) {
  const cleanPhoneDigits = entry.phone.replace(/\D/g, '');
  const normName = entry.name.toLowerCase().replace(/[`’'ʻ]/g, "'").replace(/\s+/g, ' ');
  // Key: if phone digits >= 7 use phone, else use normName
  const key = cleanPhoneDigits.length >= 7 ? `phone_${cleanPhoneDigits.slice(-9)}` : `name_${normName}`;

  if (!studentMap.has(key)) {
    studentMap.set(key, {
      name: entry.name,
      phones: new Set(entry.phone ? [entry.phone] : []),
      subjects: new Set([entry.subject]),
    });
  } else {
    const existing = studentMap.get(key);
    if (entry.phone) existing.phones.add(entry.phone);
    existing.subjects.add(entry.subject);
  }
}

console.log('Unique students count:', studentMap.size);

let multiCount = 0;
for (const [key, st] of studentMap.entries()) {
  if (st.subjects.size > 1) {
    multiCount++;
    console.log(`Multi-subject (${st.subjects.size}): ${st.name} -> ${Array.from(st.subjects).join(', ')} (Tel: ${Array.from(st.phones).join(' / ')})`);
  }
}
console.log('Students taking multiple subjects:', multiCount);
