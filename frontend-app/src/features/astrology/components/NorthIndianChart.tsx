import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Polygon, Text as SvgText, TSpan, G } from 'react-native-svg';

interface NorthIndianChartProps {
  data: any;
  title: string;
}

const W = 300;
const H = 300;

export default function NorthIndianChart({ data, title }: NorthIndianChartProps) {
  if (!data) return null;

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
  const getPlanetColor = (planet: string) => {
    const colors: Record<string, string> = {
      Sun: '#ef4444', Moon: '#8b5cf6', Mars: '#dc2626',
      Mercury: '#10b981', Jupiter: '#f59e0b', Venus: '#ec4899',
      Saturn: '#cbd5e1', Rahu: '#f97316', Ketu: '#8b5cf6'
    };
    return colors[planet] || '#fff';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Outer Square */}
        <Rect x="0" y="0" width={W} height={H} fill="none" stroke="#f97316" strokeWidth="2" />
        {/* Diagonals */}
        <Line x1="0" y1="0" x2={W} y2={H} stroke="#f97316" strokeWidth="1" />
        <Line x1="0" y1={H} x2={W} y2="0" stroke="#f97316" strokeWidth="1" />
        {/* Inner Diamond */}
        <Polygon points="150,0 300,150 150,300 0,150" fill="none" stroke="#f97316" strokeWidth="1" />

        {Object.entries(data.houses).map(([houseNum, house]: any) => {
          const hNum = parseInt(houseNum);
          const center = houseCenters[hNum as keyof typeof houseCenters];
          
          return (
            <G key={houseNum}>
              <SvgText 
                x={center.x} 
                y={center.y + (house.planets.length > 0 ? 25 : 0)} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#94a3b8"
              >
                {house.sign_index + 1}
              </SvgText>

              {house.planets.map((p: any, idx: number) => {
                const isRetrograde = p.retrograde ? 'R' : '';
                const yOffset = (idx - (house.planets.length - 1) / 2) * 16;
                return (
                  <SvgText 
                    key={p.planet} 
                    x={center.x} 
                    y={center.y + yOffset} 
                    textAnchor="middle" 
                    fontSize="14" 
                    fontWeight="600"
                    fill={getPlanetColor(p.planet)}
                  >
                    {getPlanetAbbr(p.planet)}
                    <TSpan fontSize="8" dy="-6">{Math.floor(p.degree)}°{isRetrograde}</TSpan>
                  </SvgText>
                );
              })}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 24, // spacing between side-by-side charts
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  }
});
