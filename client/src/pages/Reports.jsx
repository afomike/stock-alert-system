import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatusStamp from '../components/StatusStamp';
import * as inventoryService from '../services/inventoryService';

export default function Reports() {
  const [predictions, setPredictions] = useState([]);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reorders, setReorders] = useState([]);
  const [tab, setTab] = useState('predictions');
  const [predictionMode, setPredictionMode] = useState('quick'); // 'quick' | 'detailed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [predData, reorderData] = await Promise.all([
          inventoryService.getPredictions(),
          inventoryService.getReorderReports(),
        ]);
        setPredictions(predData.predictions);
        setReorders(reorderData.reports);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load reports. Is the API running?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadDetailedPredictions() {
    if (aiPredictions) return; // already fetched
    setAiLoading(true);
    setAiError('');
    try {
      const data = await inventoryService.getAiPredictions();
      setAiPredictions(data.predictions);
    } catch (err) {
      setAiError(
        err.response?.data?.error ||
          'The AI forecasting service is unavailable right now. Showing the quick estimate instead.'
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleModeChange(mode) {
    setPredictionMode(mode);
    if (mode === 'detailed') loadDetailedPredictions();
  }

  const activePredictions = predictionMode === 'detailed' && aiPredictions ? aiPredictions : predictions;
  const isDetailed = predictionMode === 'detailed' && aiPredictions;

  return (
    <Layout title="Reports">
      {error && (
        <div className="mb-6 border border-brick/30 bg-brick/10 text-brick px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex border border-line font-mono text-xs uppercase tracking-widest mb-5 w-fit">
        <button
          onClick={() => setTab('predictions')}
          className={`px-4 py-2 ${tab === 'predictions' ? 'bg-ink text-paper' : 'text-ink/60'}`}
        >
          Shortage Predictions
        </button>
        <button
          onClick={() => setTab('reorder')}
          className={`px-4 py-2 ${tab === 'reorder' ? 'bg-ink text-paper' : 'text-ink/60'}`}
        >
          Reorder Reports
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-widest text-ink/40">Compiling report…</p>
      ) : tab === 'predictions' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex border border-line font-mono text-[0.68rem] uppercase tracking-widest w-fit">
              <button
                onClick={() => handleModeChange('quick')}
                className={`px-3 py-1.5 ${predictionMode === 'quick' ? 'bg-slate text-paper' : 'text-ink/60'}`}
              >
                Quick estimate
              </button>
              <button
                onClick={() => handleModeChange('detailed')}
                className={`px-3 py-1.5 ${predictionMode === 'detailed' ? 'bg-slate text-paper' : 'text-ink/60'}`}
              >
                Detailed forecast
              </button>
            </div>
            <p className="text-xs text-ink/40">
              {predictionMode === 'quick'
                ? 'Trailing 30-day average — always available, computed by the API.'
                : isDetailed
                ? 'Linear-regression forecast — trend-aware, computed by the AI service.'
                : aiLoading
                ? 'Loading detailed forecast…'
                : ''}
            </p>
          </div>

          {aiError && predictionMode === 'detailed' && (
            <div className="border border-amber/40 bg-amber/10 text-amber px-4 py-2.5 text-sm">
              {aiError}
            </div>
          )}

          <div className="border border-line bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[0.68rem] uppercase tracking-widest text-ink/50">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-right py-3 px-4">
                    {isDetailed ? 'Forecasted Daily Demand' : 'Avg Daily Sales'}
                  </th>
                  <th className="text-right py-3 px-4">Est. Days to Stockout</th>
                  <th className="text-left py-3 px-4">Stockout Date</th>
                  {isDetailed && <th className="text-left py-3 px-4">Confidence</th>}
                  <th className="text-left py-3 px-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {activePredictions.map((p) => {
                  const isAi = isDetailed;
                  const productId = isAi ? p.product_id : p.productId;
                  const productName = isAi ? p.product_name : p.productName;
                  const dailyDemand = isAi ? p.forecasted_daily_demand : p.averageDailyDemand;
                  const daysToStockout = isAi ? p.estimated_days_until_stockout : p.estimatedDaysUntilStockout;
                  const stockoutDate = isAi ? p.predicted_stockout_date : p.predictedStockoutDate;
                  const riskLevel = isAi ? p.risk_level : p.riskLevel;

                  return (
                    <tr key={productId} className="border-b border-line last:border-b-0">
                      <td className="py-3 px-4 font-medium text-ink">{productName}</td>
                      <td className="py-3 px-4 text-right font-mono">{dailyDemand}</td>
                      <td className="py-3 px-4 text-right font-mono">{daysToStockout ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-ink/60">{stockoutDate ?? '—'}</td>
                      {isDetailed && (
                        <td className="py-3 px-4 font-mono text-xs text-ink/50 uppercase">
                          {p.confidence}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <StatusStamp status={riskLevel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reorders.length === 0 && (
            <p className="text-sm text-ink/50">No products currently need reordering.</p>
          )}
          {reorders.map((r) => (
            <div
              key={r.productId}
              className="status-rail bg-white p-4"
              style={{
                borderLeftColor:
                  r.priority === 'HIGH' || r.priority === 'CRITICAL' ? '#C4432B' : '#E8A33D',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg text-ink">{r.productName}</p>
                  <p className="font-mono text-xs text-ink/50">{r.sku}</p>
                </div>
                <StatusStamp status={r.priority === 'HIGH' ? 'CRITICAL' : 'LOW_STOCK'} label={r.priority} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 font-mono text-xs">
                <div>
                  <p className="text-ink/40 uppercase tracking-widest">Current</p>
                  <p className="text-ink text-sm">{r.currentStock}</p>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-widest">Minimum</p>
                  <p className="text-ink text-sm">{r.minimumStock}</p>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-widest">Recommended</p>
                  <p className="text-ink text-sm">{r.recommendedOrderQuantity}</p>
                </div>
                <div>
                  <p className="text-ink/40 uppercase tracking-widest">Supplier</p>
                  <p className="text-ink text-sm">{r.supplier || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
