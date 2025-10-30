import { useEffect, useMemo, useState } from 'react';
import { fetchDailyForecast, type DailyForecast, fetchHourlyForecast, type HourlyForecast } from './services/openMeteo';
import { WeatherCard } from './components/WeatherCard';
import { HourlyRow } from './components/HourlyRow';
import { localDateTimeFromISOMinute } from './utils/date';

function App() {
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'daily' | 'hourly'>('daily');

  // Vancouver, BC
  const latitude = 49.2827;
  const longitude = -123.1207;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchDailyForecast({ latitude, longitude, days: 14 }),
      fetchHourlyForecast({ latitude, longitude, hours: 48 })
    ])
      .then(([dailyData, hourlyData]) => {
        if (!isMounted) return;
        setForecast(dailyData);
        setHourly(hourlyData);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  const title = useMemo(() => 'Vancouver Daily Forecast', []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{title}</h1>
        <p className="subtitle">Weather in 
          <strong> Vancouver, BC, Canada</strong>
        </p>
        <div className="tabs">
          <button className={tab === 'daily' ? 'tab active' : 'tab'} onClick={() => setTab('daily')}>Daily</button>
          <button className={tab === 'hourly' ? 'tab active' : 'tab'} onClick={() => setTab('hourly')}>Hourly</button>
        </div>
      </header>
      <main>
        {loading && <div className="status">Loading…</div>}
        {error && <div className="status error">{error}</div>}
        {tab === 'daily' && forecast && (
          <div className="cards-grid">
            {forecast.days.map((day) => (
              <WeatherCard key={day.date} day={day} />
            ))}
          </div>
        )}
        {tab === 'hourly' && hourly && (
          <div className="hourly-list">
            {(() => {
              const now = new Date();
              const startIdx = hourly.hours.findIndex(h => localDateTimeFromISOMinute(h.time) >= now);
              const sliced = startIdx >= 0 ? hourly.hours.slice(startIdx) : hourly.hours;
              return sliced.map((h) => (
                <HourlyRow key={h.time} hour={h} />
              ));
            })()}
          </div>
        )}
      </main>
      <footer className="app-footer">
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Data by Open‑Meteo</a>
      </footer>
    </div>
  );
}

export default App;

