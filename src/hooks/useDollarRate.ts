import { useState, useEffect } from 'react';

export interface DollarRate {
  buy: number;
  sell: number;
  loading: boolean;
  error: boolean;
}

const CACHE_KEY = 'dollar-rate-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export function useDollarRate(): DollarRate {
  const [rate, setRate] = useState<DollarRate>({ buy: 0, sell: 0, loading: true, error: false });

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setRate({ ...data, loading: false, error: false });
          return;
        }
      }
    } catch { /* ignore */ }

    fetch('https://dolarapi.com/v1/dolares/blue')
      .then(r => r.json())
      .then((data: { compra: number; venta: number }) => {
        const result = { buy: data.compra, sell: data.venta };
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
        setRate({ ...result, loading: false, error: false });
      })
      .catch(() => setRate(s => ({ ...s, loading: false, error: true })));
  }, []);

  return rate;
}
