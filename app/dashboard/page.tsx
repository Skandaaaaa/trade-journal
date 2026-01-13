'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);


import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';

export default function DashboardPage() {
const [user, setUser] = useState<any>(null);
const [trades, setTrades] = useState<any[]>([]);
const [trade, setTrade] = useState({
  date: '',
  symbol: '',
  direction: 'Buy',
  entry: 0,
  exit: 0,
  lot: 0,
  notes: '',
});
const [editingId, setEditingId] = useState<string | null>(null);
const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
const wins = trades.filter((t) => t.pnl > 0).length;
const winRate = trades.length
  ? ((wins / trades.length) * 100).toFixed(1)
  : '0';
const equityCurve = trades.reduce((acc: number[], t: any, i: number) => {
  acc.push((acc[i - 1] || 0) + (t.pnl || 0));
  return acc;
}, []);


  // 🔐 Check login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
      } else {
        setUser(u);
        loadTrades(u.uid);
      }
    });
    return () => unsub();
  }, []);

  // 📥 Load trades
  const loadTrades = async (uid: string) => {
    const q = query(collection(db, 'trades'), where('uid', '==', uid));
    const snap = await getDocs(q);
    setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

  };

  // 🧮 P&L calculation
  const pnl =
    ((trade.exit - trade.entry) * trade.lot) *
      (trade.direction === 'Buy' ? 1 : -1) || 0;

  // 💾 Save trade
  const saveTrade = async () => {
  if (!user) return;

  if (editingId) {
    await updateDoc(doc(db, 'trades', editingId), {
      ...trade,
      pnl,
    });
    setEditingId(null);
  } else {
    await addDoc(collection(db, 'trades'), {
      ...trade,
      pnl,
      uid: user.uid,
    });
  }

  setTrade({
    date: '',
    symbol: '',
    direction: 'Buy',
    entry: 0,
    exit: 0,
    lot: 0,
    notes: '',
  });

  loadTrades(user.uid);
};
  const deleteTrade = async (id: string) => {
  await deleteDoc(doc(db, 'trades', id));
  if (user) loadTrades(user.uid);
};


  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="border p-4 rounded mb-8">
  <h2 className="text-lg font-semibold mb-3">Equity Curve</h2>

  {trades.length === 0 ? (
    <p>No trades yet.</p>
  ) : (
    <Line
      data={{
        labels: trades.map((t) => t.date),
        datasets: [
          {
            label: 'Equity',
            data: equityCurve,
            borderWidth: 2,
          },
        ],
      }}
    />
  )}
</div>


      <div className="grid grid-cols-2 gap-3 mb-6">
        <input placeholder="Date" onChange={(e) => setTrade({ ...trade, date: e.target.value })} />
        <input placeholder="Symbol" onChange={(e) => setTrade({ ...trade, symbol: e.target.value })} />
        <select onChange={(e) => setTrade({ ...trade, direction: e.target.value })}>
          <option>Buy</option>
          <option>Sell</option>
        </select>
        <input type="number" placeholder="Entry Price" onChange={(e) => setTrade({ ...trade, entry: +e.target.value })} />
        <input type="number" placeholder="Exit Price" onChange={(e) => setTrade({ ...trade, exit: +e.target.value })} />
        <input type="number" placeholder="Lot Size" onChange={(e) => setTrade({ ...trade, lot: +e.target.value })} />
        <textarea
          className="col-span-2"
          placeholder="Notes"
          onChange={(e) => setTrade({ ...trade, notes: e.target.value })}
        />

        <div className="col-span-2 font-semibold">
          P&amp;L:{' '}
          <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
            {pnl.toFixed(2)}
          </span>
        </div>

        <button
          className="bg-black text-white py-2 col-span-2"
          onClick={saveTrade}
        >
          Save Trade
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-3">Your Trades</h2>
      <ul className="space-y-2">
        {trades.map((t, i) => (
          <li
      key={t.id}
      className="border p-3 rounded flex justify-between items-center"
    >
      <span>
        {t.date} | {t.symbol} | {t.direction} | P&L: {t.pnl}
      </span>

      <div className="space-x-3">
  <button
    onClick={() => {
      setTrade({
        date: t.date,
        symbol: t.symbol,
        direction: t.direction,
        entry: t.entry,
        exit: t.exit,
        lot: t.lot,
        notes: t.notes,
      });
      setEditingId(t.id);
    }}
    className="text-blue-600 text-sm"
  >
    Edit
  </button>

  <button
    onClick={() => deleteTrade(t.id)}
    className="text-red-600 text-sm"
  >
    Delete
  </button>
</div>

    </li>       
        ))}
      </ul>
    </main>
  );
}
