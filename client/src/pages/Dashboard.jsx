import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import SalesChart from '../components/SalesChart';
import StockTable from '../components/StockTable';
import * as inventoryService from '../services/inventoryService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [metricsData, lowStockData, trendData] = await Promise.all([
          inventoryService.getDashboardMetrics(),
          inventoryService.getLowStock(),
          inventoryService.getTrend(14),
        ]);
        setMetrics(metricsData);
        setLowStock(lowStockData.products);
        setTrend(trendData.trend);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load dashboard data. Is the API running?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Layout title="Dashboard">
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Unable to Load Dashboard</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-5 h-32 skeleton" />
            ))}
          </div>
          {/* Chart Skeleton */}
          <div className="card p-6 h-64 skeleton" />
          {/* Table Skeleton */}
          <div className="card p-6 h-80 skeleton" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div>
            <div className="mb-4">
              <h2 className="section-title">Key Metrics</h2>
              <p className="section-subtitle">Current inventory overview and key performance indicators</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                label="Total Products"
                value={metrics.totalProducts}
                rail="neutral"
                trend={5}
              />
              <MetricCard
                label="Total Units"
                value={metrics.totalInventoryUnits}
                rail="neutral"
                trend={-3}
              />
              <MetricCard
                label="Low Stock"
                value={metrics.lowStockProducts}
                rail="amber"
              />
              <MetricCard
                label="Out of Stock"
                value={metrics.outOfStockProducts}
                rail="brick"
              />
              <MetricCard
                label="Inventory Value"
                value={`₦${Number(metrics.inventoryValue).toLocaleString()}`}
                rail="moss"
              />
            </div>
          </div>

          {/* Stock Movement Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-ink mb-4">Stock Movement</h2>
            <p className="text-sm text-ink/60 mb-6">Daily inventory movement for the last 14 days</p>
            <SalesChart data={trend} title="" />
          </div>

          {/* Products Requiring Attention */}
          <div className="card p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚠️</span>
                <h2 className="text-lg font-bold text-ink">Products Requiring Attention</h2>
              </div>
              <p className="text-sm text-ink/60">
                {lowStock.length} product{lowStock.length !== 1 ? 's' : ''} below safety stock levels
              </p>
            </div>
            {lowStock.length > 0 ? (
              <StockTable products={lowStock} />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-ink/50 mb-2">✓ All products well-stocked</p>
                <p className="text-sm text-ink/40">No items currently below safety stock levels</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
