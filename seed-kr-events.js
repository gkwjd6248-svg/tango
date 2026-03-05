const http = require('http');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZDI0MmRiNS04MTczLTRlMTUtYjk0YS02Y2QwZTczMjhkNGMiLCJpYXQiOjE3NzIyNzM1OTcsImV4cCI6MTc3Mjg3ODM5N30.behf8tJbY4eVlld16MBynwsfbxdhndl-k3tC5lkhhxI";

const events = [
  {
    title: "2026 Seoul Tango Festival",
    eventType: "festival",
    description: "2019년 이후 7년 만에 돌아오는 서울 탱고 페스티벌! 세계적인 탱고 마에스트로들과 함께하는 5일간의 축제. Esteban & Claudia Codega, Leandro Bojko & Micaela Garcia (2025 Mundial Escenario Champions), Ignacio Varchausky 등 출연. 갈라쇼, 워크숍, 밀롱가 포함.",
    venueName: "영등포아트홀 (Yeongdeungpo Art Hall)",
    address: "서울특별시 영등포구 신길로 275",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-04-30T19:30:00+09:00",
    endDatetime: "2026-05-04T23:59:00+09:00",
    latitude: 37.5048,
    longitude: 126.9133,
    organizerName: "Leo y Flor Tango (엘 불린)",
    organizerContact: "leoyflortango@gmail.com",
    priceInfo: "Registration opens Feb 19, 2026",
    currency: "KRW",
    websiteUrl: "https://seoultangofestival.com",
  },
  {
    title: "RUSA Milonga - Sunday at Hongdae",
    eventType: "milonga",
    description: "매주 일요일 열리는 정기 밀롱가. 홍익대학교역 2번 출구에서 도보 3분. LUZ 2층에서 진행되며 따뜻한 분위기에서 탱고를 즐길 수 있습니다. Every Sunday milonga near Hongik Univ. Station.",
    venueName: "LUZ 2F",
    address: "서울특별시 마포구 동교로 190, 2층",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-01T18:30:00+09:00",
    endDatetime: "2026-03-01T22:30:00+09:00",
    latitude: 37.5573,
    longitude: 126.9249,
    organizerName: "Scarlett & Brian",
    organizerContact: "su4550@naver.com",
    priceInfo: "13,000 KRW",
    currency: "KRW",
  },
  {
    title: "Tango Seduction - Saturday Night Milonga",
    eventType: "milonga",
    description: "매주 토요일 밤 강남 신사동에서 열리는 인기 밀롱가. 전통적인 탱고 음악과 함께하는 소셜 댄싱. Saturday night milonga at Tangueria Del Buen Ayre in Sinsa-dong, Gangnam.",
    venueName: "Tangueria Del Buen Ayre",
    address: "서울특별시 강남구 신사동 567-21",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-07T20:30:00+09:00",
    endDatetime: "2026-03-08T02:00:00+09:00",
    latitude: 37.5235,
    longitude: 127.0228,
    organizerName: "Tango Seduction",
    organizerContact: "Instagram: @tangoseduction",
    priceInfo: "9,000 KRW",
    currency: "KRW",
  },
  {
    title: "PhilATango - Practica & Milonga (Saturday)",
    eventType: "practica",
    description: "매주 토요일 프랙티카(16:00~20:00)와 밀롱가(21:00~03:00). 마포구 동교동 Tango O Nada. Practica from 4PM, milonga from 9PM until 3AM.",
    venueName: "Tango O Nada",
    address: "서울특별시 마포구 동교동 200-29, B1",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-07T16:00:00+09:00",
    endDatetime: "2026-03-08T03:00:00+09:00",
    latitude: 37.5598,
    longitude: 126.9231,
    organizerName: "Sung-gong",
    organizerContact: "Instagram: @philatango",
    priceInfo: "8,000 KRW",
    currency: "KRW",
  },
  {
    title: "Milonga del CORAZON (Norte) - River View",
    eventType: "milonga",
    description: "한강이 내려다보이는 8층 River Tango에서 매주 금요일 열리는 밀롱가. 환상적인 야경과 함께 탱고를 즐기세요. 'The world's most beautiful milonga' overlooking the Han River.",
    venueName: "River Tango (8F)",
    address: "서울특별시 마포구 상수동 354, 8층",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-06T21:00:00+09:00",
    endDatetime: "2026-03-07T02:00:00+09:00",
    latitude: 37.5479,
    longitude: 126.9228,
    organizerName: "Odysseus Dada",
    organizerContact: "Instagram: @corazon_milonga",
    priceInfo: "8,000 KRW",
    currency: "KRW",
  },
  {
    title: "Senor Tango - Wednesday Milonga (All Ages)",
    eventType: "milonga",
    description: "매주 수요일 강남 신사동 밀롱가. 시니어 댄서를 위해 기획되었지만 모든 연령대 환영! Wednesday milonga geared towards senior dancers but ALL ARE WELCOME.",
    venueName: "Tangueria Del Buen Ayre",
    address: "서울특별시 강남구 신사동 567-21",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-04T20:00:00+09:00",
    endDatetime: "2026-03-05T00:30:00+09:00",
    latitude: 37.5235,
    longitude: 127.0228,
    organizerName: "Tango Seduction",
    organizerContact: "Instagram: @tangoseduction",
    priceInfo: "9,000 KRW",
    currency: "KRW",
  },
  {
    title: "VIDA MIA - Gangnam Friday Milonga",
    eventType: "milonga",
    description: "강남 지역에서 가장 유명한 밀롱가. EN PAZ Studio에서 매주 금요일. The most famous milonga in the Gangnam area. Nova Tango Academy.",
    venueName: "EN PAZ Studio",
    address: "서울특별시 서초구 반포대로30길 82",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-06T19:00:00+09:00",
    endDatetime: "2026-03-06T23:00:00+09:00",
    latitude: 37.5003,
    longitude: 126.9917,
    organizerName: "Aran (Nova Tango Academy)",
    organizerContact: "Instagram: @novatango",
    priceInfo: "10,000 KRW",
    currency: "KRW",
  },
  {
    title: "GangNam Milonga - Saturday Premium",
    eventType: "milonga",
    description: "매주 토요일 강남 역삼동 SK Hubzen에서 열리는 프리미엄 밀롱가. 넓고 쾌적한 공간에서 우아한 탱고. Premium Saturday milonga at SK Hubzen, Gangnam.",
    venueName: "SK Hubzen",
    address: "서울특별시 강남구 역삼로 109",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-07T19:00:00+09:00",
    endDatetime: "2026-03-07T23:00:00+09:00",
    latitude: 37.5012,
    longitude: 127.0396,
    organizerName: "GangNam Milonga",
    organizerContact: "tangolife@naver.com",
    priceInfo: "13,000 KRW",
    currency: "KRW",
  },
  {
    title: "Todo Tango - Saturday Apgujeong Milonga",
    eventType: "milonga",
    description: "매주 토요일 압구정에서 열리는 밀롱가. 3호선/수인분당선 압구정역 인근. Saturday milonga near Apgujeong Station.",
    venueName: "대명빌딩 B1 (Daemyeong Bldg)",
    address: "서울특별시 강남구 언주로172길 7, B1",
    city: "Seoul",
    countryCode: "KR",
    startDatetime: "2026-03-07T18:00:00+09:00",
    endDatetime: "2026-03-07T22:00:00+09:00",
    latitude: 37.5245,
    longitude: 127.0367,
    organizerName: "Misun Kang",
    organizerContact: "Instagram: @todotango_seoul",
    priceInfo: "11,000 KRW",
    currency: "KRW",
  },
];

async function createEvent(eventData) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(eventData);
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch(e) {
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const evt of events) {
    try {
      const result = await createEvent(evt);
      console.log(`OK: ${result.title}`);
    } catch(err) {
      console.log(`FAIL: ${evt.title} - ${err.message}`);
    }
  }
  console.log(`\nDone! ${events.length} events processed.`);
}

main();
