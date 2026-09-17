'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/core/components/Card';
import { Input } from '@/app/core/components/Input';
import { Button } from '@/app/core/components/Button';
import { NorthIndianChart } from '../components/NorthIndianChart';
import { ChartJSON, InterpretationResult } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Trash2 } from 'lucide-react';
import styles from '../astrology.module.css';

export function AstrologyDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Kolkata'
  });

  const [dateDay, setDateDay] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateYear, setDateYear] = useState('');

  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('');
  const [timeAmPm, setTimeAmPm] = useState('AM');

  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [interpretation, setInterpretation] = useState<{ markdown: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);

  // Load cached history on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('astrologyHistory');
      if (cached) {
        const parsedHistory = JSON.parse(cached);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          loadHistoryItem(parsedHistory[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  const loadHistoryItem = (item: any) => {
    setFormData(item.formData);
    setDateDay(item.dateDay);
    setDateMonth(item.dateMonth);
    setDateYear(item.dateYear);
    setTimeHour(item.timeHour);
    setTimeMinute(item.timeMinute);
    setTimeAmPm(item.timeAmPm);
    setLocationQuery(item.locationQuery || item.formData.city);
    setChartData(item.chartData);
    setInterpretation(item.interpretation);
  };

  // Save current state to history
  const saveState = (cData: any, interp: any, payload: any) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      formData: payload,
      dateDay, dateMonth, dateYear, timeHour, timeMinute, timeAmPm,
      locationQuery,
      chartData: cData,
      interpretation: interp
    };
    
    setHistory(prev => {
      // Remove older entry if same payload/chart, else prepend.
      const filtered = prev.filter(item => 
        !(item.formData.name === payload.name && item.formData.date === payload.date && item.formData.time === payload.time && item.formData.city === payload.city)
      );
      const newHistory = [newItem, ...filtered].slice(0, 20); // Keep last 20
      localStorage.setItem('astrologyHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem('astrologyHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);

    const match = suggestions.find(s => `${s.name}, ${s.state}, ${s.country}` === val);
    if (match) {
      setFormData({
        ...formData,
        city: match.name,
        latitude: parseFloat(match.lat),
        longitude: parseFloat(match.lng)
      });
      return;
    }

    setFormData({ ...formData, city: val });

    if (val.length >= 3) {
      try {
        const res = await fetch(`http://localhost:3006/api/astrology/locations/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSuggestions([]);
    }
  };

  const generateChart = async () => {
    setLoading(true);
    setInterpreting(false);
    try {
      const year = dateYear.padStart(4, '0');
      const month = dateMonth.padStart(2, '0').slice(-2);
      const day = dateDay.padStart(2, '0').slice(-2);
      const dateStr = `${year}-${month}-${day}`;

      let hr = parseInt(timeHour || '0');
      if (timeAmPm === 'PM' && hr < 12) hr += 12;
      if (timeAmPm === 'AM' && hr === 12) hr = 0;
      const hrStr = hr.toString().padStart(2, '0');
      const minStr = (timeMinute || '0').padStart(2, '0').slice(-2);
      const timeStr = `${hrStr}:${minStr}:00`;

      const payload = {
        ...formData,
        date: dateStr,
        time: timeStr
      };

      const res = await fetch('http://localhost:3006/api/astrology/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setChartData(data);
      setInterpretation(null);

      saveState(data, null, payload);

      // Automatically get interpretation
      await getInterpretation(payload, data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInterpretation = async (payload: any, cData: any) => {
    setInterpreting(true);
    setInterpretation({ markdown: '' });
    try {
      const res = await fetch('http://localhost:3006/api/astrology/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.body) throw new Error('No response body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; 
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                setInterpretation({ markdown: fullText.replace(/^```markdown/i, '').replace(/```$/i, '').trimStart() });
              }
            } catch (e) {
              // Ignore invalid JSON from partial streams
            }
          }
        }
      }
      
      saveState(cData, { markdown: fullText }, payload);
    } catch (err) {
      console.error(err);
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vedic Astrology Engine</h1>
        <p className={styles.subtitle}>Generate precision D1 and D9 charts using Swiss Ephemeris</p>
      </header>

      <Card className="glass" style={{ marginBottom: '2rem' }}>
        <CardContent>
          {history.length > 0 && (
            <div className="mb-8 border-b border-white/10 pb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent Charts</h3>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }} 
                      onClick={() => loadHistoryItem(item)}
                    >
                      {item.formData?.name || 'Unknown'} - {item.formData?.city || 'Unknown'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => deleteHistoryItem(item.id)} 
                      style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderLeft: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0', padding: '0.5rem', minWidth: '40px' }}
                    >
                      <Trash2 size={16} color="var(--color-text-muted)" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGrid}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Full Name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="text-sm text-gray-500 font-medium mb-1 block">Date of Birth</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="DD"
                  min="1" max="31"
                  className={styles.numInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={dateDay}
                  onChange={e => setDateDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
                <input
                  type="number"
                  placeholder="MM"
                  min="1" max="12"
                  className={styles.numInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={dateMonth}
                  onChange={e => setDateMonth(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
                <input
                  type="number"
                  placeholder="YYYY"
                  className={styles.numInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={dateYear}
                  onChange={e => setDateYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="text-sm text-gray-500 font-medium mb-1 block">Time of Birth</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="HH"
                  min="1" max="12"
                  className={styles.numInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={timeHour}
                  onChange={e => setTimeHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
                <input
                  type="number"
                  placeholder="MM"
                  min="0" max="59"
                  className={styles.numInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={timeMinute}
                  onChange={e => setTimeMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
                <select
                  className={styles.selectInput}
                  style={{ minWidth: 0, width: '100%', flex: 1 }}
                  value={timeAmPm}
                  onChange={e => setTimeAmPm(e.target.value)}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm text-gray-500 font-medium mb-1 block">Place of Birth (Min. 3 characters)</label>
              <input
                list="location-suggestions"
                className={styles.selectInput}
                value={locationQuery}
                placeholder="e.g. Pataudi"
                onChange={handleLocationChange}
              />
              <datalist id="location-suggestions">
                {suggestions.map((s, i) => (
                  <option key={i} value={`${s.name}, ${s.state}, ${s.country}`} />
                ))}
              </datalist>
            </div>
          </div>

          <Button
            onClick={generateChart}
            disabled={loading || !dateDay || !dateMonth || !dateYear || !timeHour || !timeMinute || !formData.city}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Generate Chart'}
          </Button>
        </CardContent>
      </Card>

      {chartData && (
        <div className={`${styles.chartsContainer} glass`}>
          <NorthIndianChart data={chartData.d1} title="Lagna Chart (D1)" />
          <NorthIndianChart data={chartData.d9} title="Navamsa Chart (D9)" />
        </div>
      )}

      {interpreting && (!interpretation || !interpretation.markdown) && (
        <div className={styles.loader}>
          <Loader2 className="animate-spin" size={32} />
          <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Analyzing your charts...</p>
        </div>
      )}

      {interpretation && (
        <div className={styles.analysisSection}>
          <Card className="glass mt-6">
            <CardContent>

              <div className={`prose prose-invert max-w-none p-4 ${styles.markdownContainer}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {interpretation.markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
