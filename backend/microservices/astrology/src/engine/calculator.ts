import sweph from 'sweph';
import { ZODIAC_SIGNS, NAKSHATRAS, PlanetName, ZodiacSign } from './constants';

export interface BirthDetails {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface CalculatedPlanet {
  planet: PlanetName;
  sign: ZodiacSign;
  sign_index: number;
  degree: number;
  house: number;
  absolute_longitude: number;
  retrograde: boolean;
  nakshatra?: string;
  pada?: number;
  navamsa_number?: number;
}

export interface HouseInfo {
  sign: ZodiacSign;
  sign_index: number;
  planets: CalculatedPlanet[];
}

export interface ChartJSON {
  birth: BirthDetails;
  settings: {
    zodiac: string;
    ayanamsha: string;
    house_system: string;
  };
  lagna: {
    sign: ZodiacSign;
    sign_index: number;
    degree: number;
    absolute_longitude: number;
  };
  d1: {
    houses: Record<number, HouseInfo>;
    planets: Record<string, CalculatedPlanet>;
  };
  d9: {
    houses: Record<number, HouseInfo>;
    planets: Record<string, CalculatedPlanet>;
  };
}

export class VedicCalculator {
  // Sweph planet mappings
  private static SWE_PLANETS: Record<PlanetName, number> = {
    Sun: sweph.constants.SE_SUN,
    Moon: sweph.constants.SE_MOON,
    Mars: sweph.constants.SE_MARS,
    Mercury: sweph.constants.SE_MERCURY,
    Jupiter: sweph.constants.SE_JUPITER,
    Venus: sweph.constants.SE_VENUS,
    Saturn: sweph.constants.SE_SATURN,
    Rahu: sweph.constants.SE_TRUE_NODE,
    Ketu: -1 // Ketu is exactly 180 degrees from Rahu
  };

  private static getSignIndex(longitude: number): number {
    return Math.floor(longitude / 30);
  }

  private static getSign(longitude: number): ZodiacSign {
    return ZODIAC_SIGNS[this.getSignIndex(longitude)];
  }

  private static getDegreeInSign(longitude: number): number {
    return longitude % 30;
  }

  private static getNakshatraInfo(longitude: number) {
    // 360 / 27 = 13.3333 degrees per nakshatra
    const nakshatraValue = longitude / (360 / 27);
    const nakshatraIndex = Math.floor(nakshatraValue);
    const pada = Math.floor((nakshatraValue - nakshatraIndex) * 4) + 1;
    return {
      nakshatra: NAKSHATRAS[nakshatraIndex],
      pada
    };
  }

  private static getNavamsaSignIndex(longitude: number): number {
    const signIndex = this.getSignIndex(longitude);
    const degreeInSign = this.getDegreeInSign(longitude);
    const navamsaDivision = Math.floor(degreeInSign / (30 / 9)); // 0 to 8
    
    // Elements: Fire=0, Earth=1, Air=2, Water=3
    const element = signIndex % 4;
    
    let startSignIndex = 0;
    if (element === 0) startSignIndex = 0; // Fire signs (Aries, Leo, Sagittarius) start from Aries (0)
    else if (element === 1) startSignIndex = 9; // Earth signs (Taurus, Virgo, Capricorn) start from Capricorn (9)
    else if (element === 2) startSignIndex = 6; // Air signs (Gemini, Libra, Aquarius) start from Libra (6)
    else if (element === 3) startSignIndex = 3; // Water signs (Cancer, Scorpio, Pisces) start from Cancer (3)
    
    return (startSignIndex + navamsaDivision) % 12;
  }

  public static generateChart(birthDetails: BirthDetails): ChartJSON {
    const { date, time, latitude, longitude, timezone } = birthDetails;
    
    // Parse Date and Time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    // Need to convert local time to UT. 
    // We assume the frontend passes standard local time.
    // For simplicity, let's treat the date/time as a JS Date to get UTC offset, 
    // though for strict accuracy we should use timezone libraries.
    // We will use standard JS Date to get UTC time for calculating Julian Day.
    
    // Construct ISO string with timezone
    // Timezone formats like "Asia/Kolkata" can't directly be passed to new Date without formatting.
    // We expect the frontend to handle UTC conversion and send UT, or we use a basic approach.
    // Let's assume input is local time, but we don't have the exact offset natively without a library.
    // To fix this accurately, we will use standard JS Date with 'en-US' and timezone.
    
    const dateStr = `${date}T${time}`;
    const dateObj = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: timezone }));
    const utcYear = dateObj.getUTCFullYear();
    const utcMonth = dateObj.getUTCMonth() + 1;
    const utcDay = dateObj.getUTCDate();
    const utcHour = dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60 + dateObj.getUTCSeconds() / 3600;

    sweph.set_sid_mode(sweph.constants.SE_SIDM_LAHIRI, 0, 0);

    // Calculate Julian Day (sweph.julday returns the number directly)
    const julianDayUT = sweph.julday(utcYear, utcMonth, utcDay, utcHour, sweph.constants.SE_GREG_CAL);
    
    // Ascendant (Lagna) - points[0] is Ascendant
    const housesResult = sweph.houses(julianDayUT, latitude, longitude, 'W'); // 'W' = Whole Sign
    const ascendant = housesResult.data.points[0];
    // However, sweph.houses allows sidereal flag if we want? Actually, it's safer to get the MC/Asc using tropical and then apply Ayanamsa, 
    // OR we can calculate sidereal ascendant using SEFLG_SIDEREAL but sweph.houses does not take flags directly.
    // A better way is to get the ayanamsa and subtract it.
    
    const ayanamsa = sweph.get_ayanamsa_ut(julianDayUT);
    let lagnaAbsLng = ascendant - ayanamsa;
    if (lagnaAbsLng < 0) lagnaAbsLng += 360;
    
    const lagnaSignIndex = this.getSignIndex(lagnaAbsLng);
    const lagnaSign = this.getSign(lagnaAbsLng);
    const lagnaDegree = this.getDegreeInSign(lagnaAbsLng);

    // Calculate planets
    const flags = sweph.constants.SEFLG_SPEED | sweph.constants.SEFLG_SIDEREAL;
    
    const planetsData: Record<string, CalculatedPlanet> = {};
    const d9PlanetsData: Record<string, CalculatedPlanet> = {};
    
    let rahuLng = 0;
    
    for (const [pName, pCode] of Object.entries(this.SWE_PLANETS)) {
      const planetName = pName as PlanetName;
      let absLng = 0;
      let speed = 0;
      
      if (planetName === 'Ketu') {
        absLng = (rahuLng + 180) % 360;
      } else {
        // calc_ut returns { data: [longitude, latitude, distance, speedInLong, ...] }
        const calcResult = sweph.calc_ut(julianDayUT, pCode, flags);
        const plng = calcResult.data[0];
        const longitudeSpeed = calcResult.data[3];
        
        absLng = plng;
        speed = longitudeSpeed;
        if (planetName === 'Rahu') {
          rahuLng = absLng;
        }
      }
      
      const pSignIndex = this.getSignIndex(absLng);
      // Whole sign house: House 1 is Lagna sign. 
      // House = (Planet Sign - Lagna Sign + 1)
      let house = pSignIndex - lagnaSignIndex + 1;
      if (house <= 0) house += 12;
      
      const nakInfo = this.getNakshatraInfo(absLng);
      
      planetsData[planetName] = {
        planet: planetName,
        sign: this.getSign(absLng),
        sign_index: pSignIndex,
        degree: this.getDegreeInSign(absLng),
        house,
        absolute_longitude: absLng,
        retrograde: speed < 0,
        nakshatra: nakInfo.nakshatra,
        pada: nakInfo.pada
      };
      
      const d9SignIdx = this.getNavamsaSignIndex(absLng);
      d9PlanetsData[planetName] = {
        ...planetsData[planetName],
        sign: ZODIAC_SIGNS[d9SignIdx],
        sign_index: d9SignIdx,
        navamsa_number: Math.floor(this.getDegreeInSign(absLng) / (30/9)) + 1
      };
    }
    
    // D9 Ascendant
    const d9LagnaSignIdx = this.getNavamsaSignIndex(lagnaAbsLng);
    
    // House assignments
    const d1Houses: Record<number, HouseInfo> = {};
    const d9Houses: Record<number, HouseInfo> = {};
    
    for (let h = 1; h <= 12; h++) {
      const signIdxD1 = (lagnaSignIndex + h - 1) % 12;
      d1Houses[h] = {
        sign: ZODIAC_SIGNS[signIdxD1],
        sign_index: signIdxD1,
        planets: Object.values(planetsData).filter(p => p.house === h)
      };
      
      const signIdxD9 = (d9LagnaSignIdx + h - 1) % 12;
      // D9 planets don't use absolute_longitude for house placement, they use their new sign
      let d9House = signIdxD9 - d9LagnaSignIdx + 1;
      if (d9House <= 0) d9House += 12;
      
      const d9PlanetsInHouse = Object.values(d9PlanetsData).filter(p => {
        let h_d9 = p.sign_index - d9LagnaSignIdx + 1;
        if (h_d9 <= 0) h_d9 += 12;
        return h_d9 === h;
      });
      
      // Update the D9 house property for the planets
      d9PlanetsInHouse.forEach(p => p.house = h);
      
      d9Houses[h] = {
        sign: ZODIAC_SIGNS[signIdxD9],
        sign_index: signIdxD9,
        planets: d9PlanetsInHouse
      };
    }

    return {
      birth: birthDetails,
      settings: {
        zodiac: "sidereal",
        ayanamsha: "lahiri",
        house_system: "whole_sign"
      },
      lagna: {
        sign: lagnaSign,
        sign_index: lagnaSignIndex,
        degree: lagnaDegree,
        absolute_longitude: lagnaAbsLng
      },
      d1: {
        houses: d1Houses,
        planets: planetsData
      },
      d9: {
        houses: d9Houses,
        planets: d9PlanetsData
      }
    };
  }
}
