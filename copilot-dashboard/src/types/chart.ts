// Chart data types for Chart.js

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  borderRadius?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        color?: string;
        font?: {
          size?: number;
        };
      };
    };
    title?: {
      display?: boolean;
      text?: string;
      color?: string;
      font?: {
        size?: number;
        weight?: string;
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'nearest' | 'point' | 'dataset';
      intersect?: boolean;
      callbacks?: Record<string, unknown>;
    };
  };
  scales?: {
    x?: ScaleOptions;
    y?: ScaleOptions;
  };
  indexAxis?: 'x' | 'y';
}

export interface ScaleOptions {
  display?: boolean;
  stacked?: boolean;
  beginAtZero?: boolean;
  max?: number;
  grid?: {
    display?: boolean;
    color?: string;
  };
  ticks?: {
    color?: string;
    font?: {
      size?: number;
    };
    callback?: (value: number | string) => string;
  };
  title?: {
    display?: boolean;
    text?: string;
    color?: string;
  };
}

export interface PieChartData {
  labels: string[];
  datasets: [{
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }];
}

export interface BarChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface LineChartData {
  labels: string[];
  datasets: ChartDataset[];
}
