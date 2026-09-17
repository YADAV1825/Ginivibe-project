import React from 'react';
import { ChartJSON, CalculatedPlanet, HouseInfo } from '@/types';

interface NorthIndianChartProps {
  data: {
    houses: Record<number, HouseInfo>;
    planets: Record<string, CalculatedPlanet>;
  };
  title: string;
}

const W = 300;
const H = 300;

export const NorthIndianChart: React.FC<NorthIndianChartProps> = ({ data, title }) => {
  if (!data) return null;

  // The 12 houses coordinates for text placement
  const houseCenters = {
    1: { x: 150, y: 75 },
    2: { x: 75, y: 35 },
    3: { x: 35, y: 75 },
    4: { x: 75, y: 150 },
    5: { x: 35, y: 225 },
    6: { x: 75, y: 265 },
    7: { x: 150, y: 225 },
    8: { x: 225, y: 265 },
    9: { x: 265, y: 225 },
    10: { x: 225, y: 150 },
    11: { x: 265, y: 75 },
    12: { x: 225, y: 35 }
  };

  const getPlanetAbbr = (planet: string) => planet.substring(0, 2);
  /* Traditional ink: every planet in the theme text color, so the chart
     stays readable in light champagne and dark graphite alike. */
  const getPlanetColor = (planet: string) => {
    void planet;
    return 'var(--color-text-primary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>{title}</h3>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '300px' }}>
        {/* Outer Square */}
        <rect x="0" y="0" width={W} height={H} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
        {/* Diagonals */}
        <line x1="0" y1="0" x2={W} y2={H} stroke="var(--color-accent)" strokeWidth="1" />
        <line x1="0" y1={H} x2={W} y2="0" stroke="var(--color-accent)" strokeWidth="1" />
        {/* Inner Diamond */}
        <polygon points="150,0 300,150 150,300 0,150" fill="none" stroke="var(--color-accent)" strokeWidth="1" />

        {/* Houses Content */}
        {Object.entries(data.houses).map(([houseNum, house]) => {
          const hNum = parseInt(houseNum);
          const center = houseCenters[hNum as keyof typeof houseCenters];
          
          return (
            <g key={houseNum}>
              {/* Zodiac Sign Number */}
              <text 
                x={center.x} 
                y={center.y + (house.planets.length > 0 ? 25 : 0)} 
                textAnchor="middle" 
                fontSize="12" 
                fill="var(--color-text-muted)"
                opacity="0.6"
              >
                {house.sign_index + 1}
              </text>

              {/* Planets */}
              {house.planets.map((p, idx) => {
                const isRetrograde = p.retrograde ? 'R' : '';
                const yOffset = (idx - (house.planets.length - 1) / 2) * 16;
                return (
                  <text 
                    key={p.planet} 
                    x={center.x} 
                    y={center.y + yOffset} 
                    textAnchor="middle" 
                    fontSize="14" 
                    fontWeight="600"
                    fill={getPlanetColor(p.planet)}
                  >
                    {getPlanetAbbr(p.planet)}
                    <tspan fontSize="8" dy="-6">{Math.floor(p.degree)}&deg;{isRetrograde}</tspan>
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
