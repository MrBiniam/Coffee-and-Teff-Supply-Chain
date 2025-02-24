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
  @ViewChild('chart') chart: ChartComponent
  public areaChartOptions: Partial<areaChartOptions>
  public radialChartOptions: Partial<radialChartOptions>
  public linechartOptions: Partial<linechartOptions>
  newOrders: number = 0
  acceptedOrders: number= 0
  shippedOrders:number =0
  deliveredOrders: number = 0
  data: Data = new Data()
  constructor(private orderService: OrderService, private tokenStorage: TokenStorageService) {}

  ngOnInit() {
    this.getOrder()
    this.chart1()
    this.chart2()
  }
  private chart1() {
    this.areaChartOptions = {
      series: [
        {
          name: 'AA COFFEE',
          data: [
            this.data.dataAACoffee[16].price,
            this.data.dataAACoffee[17].price,
            this.data.dataAACoffee[18].price,
            this.data.dataAACoffee[19].price,
            this.data.dataAACoffee[20].price,
            this.data.dataAACoffee[21].price,
            this.data.dataAACoffee[22].price,
          ],
        },
        {
          name: 'AB COFFEE',
          data: [
            this.data.dataCoffeeAB[16].price,
            this.data.dataCoffeeAB[17].price,
            this.data.dataCoffeeAB[18].price,
            this.data.dataCoffeeAB[19].price,
            this.data.dataCoffeeAB[20].price,
            this.data.dataCoffeeAB[21].price,
            this.data.dataCoffeeAB[22].price,
          ],
        },
        {
          name: 'C COFFEE',
          data: [
            this.data.dataCoffeeC[16].price,
            this.data.dataCoffeeC[17].price,
            this.data.dataCoffeeC[18].price,
            this.data.dataCoffeeC[19].price,
            this.data.dataCoffeeC[20].price,
            this.data.dataCoffeeC[21].price,
            this.data.dataCoffeeC[22].price,
          ],
        },
      ],
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#7D4988', '#66BB6A', '#66BB9C'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      xaxis: {
        categories: [
          "Day One",
          "Day Two",
          "Day Three",
          "Day Four",
          "Day Five",
          "Day Six",
          "Day Seven",
        ],
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        offsetX: 0.1,
        offsetY: 0.1,
      },

      tooltip: {
        x: {
        },
      },
    };
  }
  private chart2() {
    this.radialChartOptions = {
      series: [this.data.dataAACoffee[18].price,
               this.data.dataCoffeeAB[18].price,
               this.data.dataCoffeeC[18].price],
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
            },
            total: {
              show: false,
            },
          },
        },
      },
      colors: ['green', '#3f51b5', 'red'],

      labels: ['AA COFFEE', 'AB COFFEE', 'C COFFEE'],
    };
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    this.orderService.getMyOrder().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.driver==null && value.product[0].seller==id && value.status=='Pending'){
              this.newOrders+=1
            }else 
          if(value.driver!=null && value.product[0].seller==id && value.status=='Pending'){
              this.acceptedOrders+=1
            }else 
          if(value.driver!=null && value.product[0].seller==id && value.status=='Shipped'){
              this.shippedOrders+=1
            }else 
          if(value.driver!=null && value.product[0].seller==id && value.status=='Delivered'){
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