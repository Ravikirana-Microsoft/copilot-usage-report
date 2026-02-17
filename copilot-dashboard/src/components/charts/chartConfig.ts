import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        color: '#ffffff',
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          family: "'Segoe UI', system-ui, sans-serif",
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        family: "'Segoe UI', system-ui, sans-serif",
        size: 14,
        weight: 'bold' as const,
      },
      bodyFont: {
        family: "'Segoe UI', system-ui, sans-serif",
        size: 13,
      },
    },
  },
};

// Color palette for charts
export const chartColorPalette = {
  ai: {
    primary: '#00bcf2',
    background: 'rgba(0, 188, 242, 0.7)',
    border: '#00bcf2',
  },
  human: {
    primary: '#6b7280',
    background: 'rgba(107, 114, 128, 0.7)',
    border: '#6b7280',
  },
  tiers: {
    tier1: { background: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },
    tier2: { background: 'rgba(249, 115, 22, 0.7)', border: '#f97316' },
    tier3: { background: 'rgba(234, 179, 8, 0.7)', border: '#eab308' },
    tier4: { background: 'rgba(34, 197, 94, 0.7)', border: '#22c55e' },
    tier5: { background: 'rgba(59, 130, 246, 0.7)', border: '#3b82f6' },
  },
  palette: [
    { background: 'rgba(0, 188, 242, 0.7)', border: '#00bcf2' },
    { background: 'rgba(139, 92, 246, 0.7)', border: '#8b5cf6' },
    { background: 'rgba(236, 72, 153, 0.7)', border: '#ec4899' },
    { background: 'rgba(249, 115, 22, 0.7)', border: '#f97316' },
    { background: 'rgba(34, 197, 94, 0.7)', border: '#22c55e' },
    { background: 'rgba(59, 130, 246, 0.7)', border: '#3b82f6' },
    { background: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },
    { background: 'rgba(234, 179, 8, 0.7)', border: '#eab308' },
    { background: 'rgba(20, 184, 166, 0.7)', border: '#14b8a6' },
    { background: 'rgba(99, 102, 241, 0.7)', border: '#6366f1' },
  ],
};

export { ChartJS };
