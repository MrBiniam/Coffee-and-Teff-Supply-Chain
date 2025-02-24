import { Component, OnInit } from "@angular/core";
import { TokenStorageService } from "src/app/shared/security/token-storage.service";
import { Order } from "../../orders/order.model";
import { OrderService } from "../../orders/order.service";
import { Data } from "../dashboard2/data";
@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
})
export class MainComponent implements OnInit {
  newOrders: number = 0
  acceptedOrders: number= 0
  shippedOrders:number =0
  deliveredOrders: number = 0
  data: Data = new Data()
  constructor(private tokenStorage: TokenStorageService, private orderService: OrderService) {}
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
  ngOnInit() {this.getOrder()}

  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    this.orderService.getMyOrder().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.driver==null && value.buyer==id && value.status=='Pending'){
              this.newOrders+=1
            }else 
          if(value.driver!=null && value.buyer==id && value.status=='Pending'){
              this.acceptedOrders+=1
            }else 
          if(value.driver!=null && value.buyer==id && value.status=='Shipped'){
              this.shippedOrders+=1
            }else 
          if(value.driver!=null && value.buyer==id && value.status=='Delivered'){
            this.deliveredOrders+=1
          }
          }
        );
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
}
