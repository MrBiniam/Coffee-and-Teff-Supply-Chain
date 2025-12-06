import { Component, OnInit } from "@angular/core";
import { TokenStorageService } from "src/app/shared/security/token-storage.service";
import { Order } from "../../orders/order.model";
import { OrderService } from "../../orders/order.service";
import { Data } from "../dashboard2/data";
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
  ApexStroke,
  ApexLegend,
} from "ng-apexcharts";

export type BuyerAreaChartOptions = {
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

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
  standalone: false
})
export class MainComponent implements OnInit {
  newOrders: number = 0
  acceptedOrders: number = 0
  shippedOrders: number = 0
  deliveredOrders: number = 0
  data: Data = new Data()
  apexAreaChartOptions: Partial<BuyerAreaChartOptions>;

  constructor(private tokenStorage: TokenStorageService, private orderService: OrderService) { }
  // area chart start
  public areaChartOptions = {
    responsive: true,
    tooltips: {
      mode: "index",
      titleFontSize: 12,
      titleFontColor: "#000",
      bodyFontColor: "#000",
      backgroundColor: "#fff",
      cornerRadius: 3,
      intersect: false,
    },
    legend: {
      display: false,
      labels: {
        usePointStyle: true,
      },
    },
    scales: {
      xAxes: [
        {
          display: true,
          gridLines: {
            display: false,
            drawBorder: false,
          },
          scaleLabel: {
            display: false,
            labelString: "Month",
          },
          ticks: {
            fontColor: "#9aa0ac", // Font Color
          },
        },
      ],
      yAxes: [
        {
          display: true,
          gridLines: {
            display: false,
            drawBorder: false,
          },
          scaleLabel: {
            display: true,
            labelString: "Value",
          },
          ticks: {
            fontColor: "#9aa0ac", // Font Color
          },
        },
      ],
    },
    title: {
      display: false,
      text: "Normal Legend",
    },
  };
  areaChartData = [
    {
      label: "AA Coffee",
      data: [
        this.data.dataAACoffee[16].price,
        this.data.dataAACoffee[17].price,
        this.data.dataAACoffee[18].price,
        this.data.dataAACoffee[19].price,
        this.data.dataAACoffee[20].price,
        this.data.dataAACoffee[21].price,
        this.data.dataAACoffee[22].price,
      ],
      borderWidth: 4,
      pointStyle: "circle",
      pointRadius: 4,
      borderColor: "rgba(37,188,232,.7)",
      pointBackgroundColor: "rgba(37,188,232,.2)",
      backgroundColor: "rgba(37,188,232,.2)",
      pointBorderColor: "transparent",
    },
    {
      label: "AB Coffee",
      data: [
        this.data.dataCoffeeAB[16].price,
        this.data.dataCoffeeAB[17].price,
        this.data.dataCoffeeAB[18].price,
        this.data.dataCoffeeAB[19].price,
        this.data.dataCoffeeAB[20].price,
        this.data.dataCoffeeAB[21].price,
        this.data.dataCoffeeAB[22].price,
      ],
      borderWidth: 4,
      pointStyle: "circle",
      pointRadius: 4,
      borderColor: "rgba(72,239,72,.7)",
      pointBackgroundColor: "rgba(72,239,72,.2)",
      backgroundColor: "rgba(72,239,72,.2)",
      pointBorderColor: "transparent",
    },
    {
      label: "C Coffee",
      data: [
        this.data.dataCoffeeC[16].price,
        this.data.dataCoffeeC[17].price,
        this.data.dataCoffeeC[18].price,
        this.data.dataCoffeeC[19].price,
        this.data.dataCoffeeC[20].price,
        this.data.dataCoffeeC[21].price,
        this.data.dataCoffeeC[22].price,
      ],
      borderWidth: 4,
      pointStyle: "circle",
      pointRadius: 4,
      borderColor: "rgba(72,100,72,.7)",
      pointBackgroundColor: "rgba(72,100,72,.2)",
      backgroundColor: "rgba(72,100,72,.2)",
      pointBorderColor: "transparent",
    },
    
  ];
  areaChartLabels = ["Day One",
    "Day Two",
    "Day Three",
    "Day Four",
    "Day Five",
    "Day Six",
    "Day Seven",
];
  // area chart end
  // barChart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true,
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Poppins",
            fontColor: "#9aa0ac", // Font Color
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            fontFamily: "Poppins",
            fontColor: "#9aa0ac", // Font Color
          },
        },
      ],
    },
  };
  public barChartLabels: string[] = [
    "Day One",
    "Day Two",
    "Day Three",
    "Day Four",
    "Day Five",
    "Day Six",
    "Day Seven",

  ];
  public barChartType = "bar";
  public barChartLegend = false;
  public barChartData: any[] = [
    { data: [58, 60, 74, 78, 55, 64, 42], label: "AA Coffee" },
    { data: [30, 45, 51, 22, 79, 35, 82], label: "AB Coffee" },
    { data: [30, 45, 51, 22, 79, 35, 82], label: "C Coffee" },
  ];
  public barChartColors: Array<any> = [
    {
      backgroundColor: "rgba(211,211,211,1)",
      borderColor: "rgba(211,211,211,1)",
      pointBackgroundColor: "rgba(211,211,211,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(211,211,211,0.8)",
    },
    {
      backgroundColor: "rgba(110, 104, 193, 1)",
      borderColor: "rgba(110, 104, 193,1)",
      pointBackgroundColor: "rgba(110, 104, 193,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(110, 104, 193,0.8)",
    },
  ];
  // end bar chart
  ngOnInit() {
    this.initializeChartsData();
    this.getOrder();
  }

  // Keep this method separate for reuse
  ensureValidNumber(value) {
    return (value !== undefined && value !== null && typeof value === 'number' && !isNaN(value)) ? value : 0;
  }

  initializeChartsData() {
    try {
      // Use defensive programming to ensure data objects exist
      if (!this.data || !this.data.dataAACoffee || !this.data.dataCoffeeAB || !this.data.dataCoffeeC) {
        console.warn('Chart data sources are not properly initialized');
        this.data = new Data(); // Re-initialize if needed
      }

      // Define default values for chart data
      const defaultData = [0, 0, 0, 0, 0, 0, 0];
      
      // Create safe data arrays with fallbacks
      const aaCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataAACoffee?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price);
      });
      
      const abCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataCoffeeAB?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price);
      });
      
      const cCoffeeData = Array(7).fill(0).map((_, index) => {
        const dataPoint = this.data?.dataCoffeeC?.[index + 16];
        return this.ensureValidNumber(dataPoint?.price);
      });

      // Update chart data with safe values
      this.areaChartData = [
        {
          label: "AA Coffee",
          data: aaCoffeeData,
          borderWidth: 4,
          pointStyle: "circle",
          pointRadius: 4,
          borderColor: "rgba(37,188,232,.7)",
          pointBackgroundColor: "rgba(37,188,232,.2)",
          backgroundColor: "rgba(37,188,232,.2)",
          pointBorderColor: "transparent",
        },
        {
          label: "AB Coffee",
          data: abCoffeeData,
          borderWidth: 4,
          pointStyle: "circle",
          pointRadius: 4,
          borderColor: "rgba(72,239,72,.7)",
          pointBackgroundColor: "rgba(72,239,72,.2)",
          backgroundColor: "rgba(72,239,72,.2)",
          pointBorderColor: "transparent",
        },
        {
          label: "C Coffee",
          data: cCoffeeData,
          borderWidth: 4,
          pointStyle: "circle",
          pointRadius: 4,
          borderColor: "rgba(72,100,72,.7)",
          pointBackgroundColor: "rgba(72,100,72,.2)",
          backgroundColor: "rgba(72,100,72,.2)",
          pointBorderColor: "transparent",
        },
      ];

      // Safe bar chart data
      this.barChartData = [
        { data: [58, 60, 74, 78, 55, 64, 42], label: "AA Coffee" },
        { data: [30, 45, 51, 22, 79, 35, 82], label: "AB Coffee" },
        { data: [30, 45, 51, 22, 79, 35, 82], label: "C Coffee" },
      ];

      // Configure Apex area chart options for coffee price estimation
      this.apexAreaChartOptions = {
        series: [
          { name: "AA COFFEE", data: aaCoffeeData },
          { name: "AB COFFEE", data: abCoffeeData },
          { name: "C COFFEE", data: cCoffeeData },
        ],
        chart: {
          height: 350,
          type: "area",
          toolbar: { show: false },
          foreColor: "#9aa0ac",
        },
        xaxis: {
          type: "category",
          categories: [
            "Day 1",
            "Day 2",
            "Day 3",
            "Day 4",
            "Day 5",
            "Day 6",
            "Day 7",
          ],
          labels: {
            style: {
              colors: "#9aa0ac",
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: "#9aa0ac",
            },
            formatter: function (val: number) {
              return Math.round(val).toString();
            },
          },
        },
        tooltip: {
          theme: "dark",
          marker: { show: true },
          x: { show: true },
          y: {
            formatter: function (val: number) {
              return Math.round(val).toString();
            },
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "right",
          offsetY: 0,
          offsetX: -5,
          labels: {
            colors: "#9aa0ac",
          },
        },
        colors: ["#00E396", "#775DD0", "#FF9800"],
        stroke: {
          width: 3,
          curve: "smooth",
        },
        dataLabels: {
          enabled: false,
        },
      };
    } catch (error) {
      console.error("Error initializing chart data:", error);
      // Provide default empty data in case of errors
      this.areaChartData = [];
      this.barChartData = [];
    }
  }

  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    
    if (isNaN(id)) {
      console.error("Invalid user ID - cannot retrieve orders");
      return;
    }
    
    // Reset counters before counting
    this.newOrders = 0;
    this.acceptedOrders = 0;
    this.shippedOrders = 0;
    this.deliveredOrders = 0;
    
    this.orderService.getMyOrder().subscribe(
      data => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log("No orders found for this user");
          return;
        }
        
        console.log("Processing orders for buyer:", id);
        
        // First pass: count all orders to ensure we don't miss any
        data.forEach((value) => {
          try {
            if (!value) return;
            
            const buyerMatches = value.buyer === id;
            
            if (!buyerMatches) return; // Skip orders not belonging to this buyer
            
            // Do case-insensitive status comparison to be safe
            const status = value.status ? value.status.toLowerCase() : '';
            
            // NEW ORDERS: Status is "pending" (regardless of driver assignment)
            if (status === 'pending' && buyerMatches) {
              this.newOrders += 1;
              console.log(`Order #${value.id} counted as new order - Status: ${value.status}, Driver: ${value.driver}, Buyer: ${value.buyer}`);
            }
            // ACCEPTED ORDERS: Status is "accepted" (must have a driver assigned)
            else if (status === 'accepted' && buyerMatches) {
              this.acceptedOrders += 1;
              console.log(`Order #${value.id} counted as accepted order - Status: ${value.status}, Driver: ${value.driver}, Buyer: ${value.buyer}`);
            }
            // SHIPPED ORDERS: Status is "shipped" (must have a driver assigned)
            else if (status === 'shipped' && buyerMatches) {
              this.shippedOrders += 1;
              console.log(`Order #${value.id} counted as shipped order`);
            }
            // DELIVERED ORDERS: Status is "delivered" (must have a driver assigned)
            else if (status === 'delivered' && buyerMatches) {
              this.deliveredOrders += 1;
              console.log(`Order #${value.id} counted as delivered order`);
            }
            // Log any order that doesn't fit into the main categories
            else if (buyerMatches) {
              console.warn(`Order #${value.id} with status "${value.status}" and driver ${value.driver} not counted in any category`);
            }
          } catch (error) {
            console.error("Error processing order:", error);
          }
        });

        console.log('Final order counts for buyer:', {
          newOrders: this.newOrders,
          acceptedOrders: this.acceptedOrders,
          shippedOrders: this.shippedOrders,
          deliveredOrders: this.deliveredOrders
        });
      },
      error => {
          console.error("Error fetching orders:", error);
      }
    );
  }
}
