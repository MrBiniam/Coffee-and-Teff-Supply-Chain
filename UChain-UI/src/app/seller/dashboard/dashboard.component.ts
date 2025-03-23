import { Component, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexFill,
} from 'ng-apexcharts';
import { OrderService } from 'src/app/buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Data } from 'src/app/buyer/dashboard/dashboard2/data';

export type areaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
};

export type linechartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  colors: string[];
};

export type radialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  public areaChartOptions: Partial<areaChartOptions>;
  public radialChartOptions: Partial<radialChartOptions>;
  public linechartOptions: Partial<linechartOptions>;
  newOrders: number = 0;
  acceptedOrders: number = 0;
  shippedOrders: number = 0;
  deliveredOrders: number = 0;
  data: Data = new Data();
  chartsInitialized: boolean = false;

  constructor(private orderService: OrderService, private tokenStorage: TokenStorageService) {
    // Initialize charts with default values right away to prevent rendering errors
    this.initializeDefaultCharts();
  }

  ngOnInit() {
    // First fetch any data we need
    this.getOrder();

    // Initialize Data first
    if (!this.data) {
      this.data = new Data();
    }

    // Add a longer delay to ensure data is available before trying to render charts
    setTimeout(() => {
      this.initializeCharts();
    }, 1000);
  }

  // Safely initialize charts after data is loaded
  private initializeCharts() {
    try {
      if (!this.chartsInitialized) {
        console.log('Initializing charts with data');
        this.chart1();
        this.chart2();
        this.chartsInitialized = true;
      }
    } catch (error) {
      console.error('Error during chart initialization:', error);
      // Keep the default charts if there's an error
    }
  }

  // Initialize charts with default values to prevent undefined errors in template
  private initializeDefaultCharts() {
    console.log('Setting up default charts');
    // Default area chart - simple data that will always render
    this.areaChartOptions = {
      series: [{
        name: 'Sample Data',
        data: [10, 20, 15, 25, 30, 35, 40]
      }],
      chart: {
        height: 350,
        type: 'area',
        toolbar: { show: false },
        foreColor: '#9aa0ac'
      },
      xaxis: {
        type: 'category',
        categories: [
          "Day 1",
          "Day 2",
          "Day 3",
          "Day 4",
          "Day 5",
          "Day 6",
          "Day 7",
        ]
      },
      yaxis: {
        labels: {
          formatter: function(val) {
            return Math.round(val).toString();
          }
        }
      },
      colors: ['#7D4988'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
      tooltip: {
        y: {
          formatter: function(val) {
            return Math.round(val).toString();
          }
        }
      },
      legend: { show: true }
    };

    // Default radial chart - values that will always render
    this.radialChartOptions = {
      series: [30, 40, 30],  // Simple percentages that add up to 100
      chart: {
        height: 265,
        type: 'radialBar'
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: { fontSize: '22px' },
            value: { 
              fontSize: '16px',
              formatter: function(val) { return Math.round(val) + '%'; } 
            }
          }
        }
      },
      labels: ['AA COFFEE', 'AB COFFEE', 'C COFFEE']
    };

    // Default line chart - simple data that will always render
    this.linechartOptions = {
      series: [{
        name: 'Sample Data',
        data: [10, 20, 30, 40, 50, 40, 30]
      }],
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false }
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
      },
      yaxis: {
        labels: {
          formatter: function(val) {
            return Math.round(val).toString();
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
      colors: ['#7D4988'],
      tooltip: {
        y: {
          formatter: function(val) {
            return Math.round(val).toString();
          }
        }
      }
    };
  }

  // Helper method to ensure valid numbers
  ensureValidNumber(value) {
    // If value is undefined, null, NaN, or not a number, return 0
    if (value === undefined || value === null || isNaN(Number(value))) {
      return 0;
    }
    // Otherwise, convert to number and return
    return Number(value);
  }

  private chart1() {
    try {
      console.log('Generating area chart data');
      // Create fallback data in case we don't have real data
      const fallbackData = [10, 20, 15, 25, 30, 35, 40];
      
      // Check if data objects exist
      if (!this.data || !this.data.dataAACoffee || !this.data.dataCoffeeAB || !this.data.dataCoffeeC) {
        console.warn('Chart data sources are not properly initialized');
        return; // Keep using default chart values
      }

      // Create safe data arrays with fallbacks - avoid using real data if it's all zeros
      const aaCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataAACoffee?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price || 0);
      });

      const abCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataCoffeeAB?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price || 0);
      });

      const cCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataCoffeeC?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price || 0);
      });

      // Check if any series has actual values
      const hasAACoffeeData = aaCoffeeData.some(val => val > 0);
      const hasABCoffeeData = abCoffeeData.some(val => val > 0);
      const hasCCoffeeData = cCoffeeData.some(val => val > 0);
      
      // If we have no valid data at all, use fallback
      if (!hasAACoffeeData && !hasABCoffeeData && !hasCCoffeeData) {
        console.warn('Using fallback data for area chart');
        this.areaChartOptions = {
          ...this.areaChartOptions,
          series: [{
            name: 'Sample Data',
            data: fallbackData
          }]
        };
        return;
      }

      // We have at least some valid data, build the series array
      const series = [];
      
      if (hasAACoffeeData) {
        series.push({
          name: 'AA COFFEE',
          data: aaCoffeeData
        });
      }
      
      if (hasABCoffeeData) {
        series.push({
          name: 'AB COFFEE',
          data: abCoffeeData
        });
      }
      
      if (hasCCoffeeData) {
        series.push({
          name: 'C COFFEE',
          data: cCoffeeData
        });
      }

      // Now we can update the chart with real data
      this.areaChartOptions = {
        series: series,
        chart: {
          height: 350,
          type: 'area',
          toolbar: {
            show: false
          },
          foreColor: '#9aa0ac'
        },
        xaxis: {
          type: 'category',
          categories: [
            'Day 1',
            'Day 2',
            'Day 3',
            'Day 4',
            'Day 5',
            'Day 6',
            'Day 7',
          ],
          labels: {
            style: {
              colors: '#9aa0ac'
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#9aa0ac'
            },
            formatter: function(val) {
              return Math.round(val).toString();
            }
          }
        },
        tooltip: {
          theme: 'dark',
          marker: {
            show: true
          },
          x: {
            show: true
          },
          y: {
            formatter: function(val) {
              return Math.round(val).toString();
            }
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          offsetY: 0,
          offsetX: -5,
          labels: {
            colors: '#9aa0ac'
          }
        },
        colors: ['#00E396', '#775DD0', '#FF9800'],
        stroke: {
          width: 3,
          curve: 'smooth'
        },
        dataLabels: {
          enabled: false
        },
      };
      console.log('Area chart updated with real data');
    } catch (error) {
      console.error('Error initializing area chart:', error);
      // Keep using default chart initialized earlier
    }
  }

  private chart2() {
    try {
      console.log('Generating radial chart data');
      // Get safe values for the radial chart with default of 0
      let aaCoffeePrice = this.ensureValidNumber(this.data?.dataAACoffee?.[18]?.price || 0);
      let abCoffeePrice = this.ensureValidNumber(this.data?.dataCoffeeAB?.[18]?.price || 0);
      let cCoffeePrice = this.ensureValidNumber(this.data?.dataCoffeeC?.[18]?.price || 0);
      
      // Check if we have any valid data
      if (aaCoffeePrice <= 0 && abCoffeePrice <= 0 && cCoffeePrice <= 0) {
        console.warn('No valid prices found for radial chart, using defaults');
        // Keep using default chart values initialized earlier
        return;
      }
      
      // If any values are extremely small, set a minimum to avoid rendering issues
      aaCoffeePrice = Math.max(1, aaCoffeePrice);
      abCoffeePrice = Math.max(1, abCoffeePrice);
      cCoffeePrice = Math.max(1, cCoffeePrice);
      
      // Calculate total for percentage calculation
      const total = aaCoffeePrice + abCoffeePrice + cCoffeePrice;
      
      // Convert to percentages (0-100)
      // Also ensure we don't have any zero values which can cause render issues
      const aaPercentage = Math.max(1, Math.round((aaCoffeePrice / total) * 100));
      const abPercentage = Math.max(1, Math.round((abCoffeePrice / total) * 100));
      const cPercentage = Math.max(1, Math.round((cCoffeePrice / total) * 100));
      
      // Check that our percentages are valid numbers
      if (isNaN(aaPercentage) || isNaN(abPercentage) || isNaN(cPercentage)) {
        console.error('Invalid percentages calculated:', aaPercentage, abPercentage, cPercentage);
        return; // Keep using default chart
      }
      
      console.log('Radial chart percentages:', aaPercentage, abPercentage, cPercentage);
      
      this.radialChartOptions = {
        series: [aaPercentage, abPercentage, cPercentage],
        chart: {
          height: 265,
          type: 'radialBar',
        },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: {
                fontSize: '22px',
              },
              value: {
                fontSize: '16px',
                formatter: function(val) { return Math.round(val) + '%'; }
              }
            }
          }
        },
        labels: ['AA COFFEE', 'AB COFFEE', 'C COFFEE'],
      };
      console.log('Radial chart updated with real data');
    } catch (error) {
      console.error('Error initializing radial chart:', error);
      // Keep using default chart initialized earlier
    }
  }
  
  getOrder() {
    try {
      const seller_id = this.tokenStorage.getId(); 
      this.orderService.getMyOrder().subscribe(orders => { 
        console.log('Orders received:', orders);
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
          console.log('No orders found');
          this.newOrders = 0;
          this.acceptedOrders = 0;
          this.shippedOrders = 0;
          this.deliveredOrders = 0;
          return;
        }
        
        // Safely filter orders to only include those for this seller
        const myOrders = orders.filter(order => {
          try {
            return order.product && order.product.seller === parseInt(seller_id);
          } catch (e) {
            return false;
          }
        });
        
        if (myOrders.length === 0) {
          console.log('No orders found for this seller');
          return;
        }
        
        // Count orders by status
        this.newOrders = myOrders.filter(order => order.status === 'unapproved').length;
        this.acceptedOrders = myOrders.filter(order => order.status === 'approved').length;
        this.shippedOrders = myOrders.filter(order => order.status === 'shipped').length;
        this.deliveredOrders = myOrders.filter(order => order.status === 'delivered').length;
      }, error => {
        console.error('Error fetching orders:', error);
      });
    } catch (error) {
      console.error('Error in getOrder method:', error);
    }
  }
}