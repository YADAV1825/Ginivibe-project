Yes — **100% you can generate both charts yourself**, with **zero astrology API calls**:

1. **Lagna / D1 / Rāśi chart**
2. **Navāṁśa / D9 chart**

And your instinct about JSON is correct: **the JSON should be the primary output of your backend.** The UI should merely visualize that JSON.

### The architecture should be

```text
DOB + Birth Time + Location
             │
             ▼
     Your Astrology Engine
             │
             ├── Planetary positions
             ├── Ascendant / Lagna
             ├── Houses
             ├── Rashi
             ├── Nakshatra
             ├── Rahu / Ketu
             └── Navamsa / D9
             │
             ▼
       CANONICAL JSON
          /        \
         /          \
        ▼            ▼
   Your LLM       Your UI
                  ↓
             D1 Chart
             D9 Chart
```

## Your backend should return something like this

```json
{
  "birth": {
    "date": "2004-08-15",
    "time": "14:37:21",
    "timezone": "Asia/Kolkata",
    "latitude": 31.3260,
    "longitude": 75.5762
  },

  "settings": {
    "zodiac": "sidereal",
    "ayanamsha": "lahiri",
    "house_system": "whole_sign"
  },

  "lagna": {
    "sign": "Scorpio",
    "sign_index": 7,
    "degree": 12.481,
    "absolute_longitude": 222.481
  },

  "d1": {
    "houses": {
      "1": {
        "sign": "Scorpio",
        "sign_index": 7,
        "planets": []
      },
      "2": {
        "sign": "Sagittarius",
        "sign_index": 8,
        "planets": [
          {
            "planet": "Sun",
            "degree": 4.32,
            "absolute_longitude": 244.32
          }
        ]
      }
    },

    "planets": {
      "Sun": {
        "sign": "Sagittarius",
        "degree": 4.32,
        "house": 2,
        "absolute_longitude": 244.32,
        "retrograde": false
      },

      "Moon": {
        "sign": "Leo",
        "degree": 21.14,
        "house": 10,
        "absolute_longitude": 141.14,
        "retrograde": false
      }
    }
  },

  "d9": {
    "planets": {
      "Sun": {
        "sign": "Aries",
        "degree": 8.88,
        "navamsa_number": 2
      },

      "Moon": {
        "sign": "Capricorn",
        "degree": 10.26,
        "navamsa_number": 4
      }
    },

    "houses": {
      "1": {
        "sign": "Aries",
        "planets": []
      }
    }
  }
}
```

**That JSON is your actual product data.**

Your LLM can consume it directly:

```text
User
 ↓
Chart JSON
 ↓
LLM
 ↓
Interpretation
```

while your frontend does:

```text
Chart JSON
 ↓
North Indian SVG renderer
 ↓
D1 + D9 visual charts
```

So **you don't need to send an image to the LLM at all.**

---

## And yes, D9 can be generated from the same calculation

You don't need another API.

The pipeline is:

```text
Planetary longitude
        ↓
Sidereal longitude
        ↓
Rashi
        ↓
Degree within Rashi
        ↓
Navamsa division
        ↓
D9 sign
```

So one astronomical calculation produces the raw positions, and your own Jyotish mathematics generates both:

```text
             RAW POSITIONS
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
       D1                    D9
    Rashi chart           Navamsa
```

You can also generate **D2, D3, D4, D7, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60** later from the same underlying positions if you want the backend to become a full Jyotish engine.

---

# One thing I'd change from my previous answer

I would **not** make your JSON merely a visualization format.

Make it your **canonical astrology data model**.

For example:

```text
                    CHART ENGINE
                         │
                         ▼
                ┌─────────────────┐
                │ Canonical JSON  │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Interpretation             UI
            LLM                  Renderer
              │                     │
              ▼                     ▼
        Predictions /          D1 / D9
        explanations            charts
```

That means if you later replace:

```text
Gemma → GPT → Claude → your own model
```

**the astrology engine doesn't change.**

And if you redesign your UI:

```text
North Indian
South Indian
Western
Mobile
PDF
```

**the astrology engine doesn't change.**

That's exactly the separation you want for a production system.

### So the answer to your two questions is:

**Can you generate both Lagna and Navamsa without an API?**

> **Yes. Absolutely.**

**Can the backend return JSON and have the UI generate the charts from it?**

> **Yes — and I strongly recommend this architecture.**

The next thing we should nail down is the **exact JSON schema + calculation engine**. Once we define that correctly, your LLM can receive a very rich structured object containing **D1 + D9 + planets + houses + degrees + nakshatras + padas + retrograde/combustion/etc.**, while the UI simply renders whatever is in that JSON.
