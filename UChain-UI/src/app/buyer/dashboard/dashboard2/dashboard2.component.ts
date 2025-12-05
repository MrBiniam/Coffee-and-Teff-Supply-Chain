import { Component, OnInit } from "@angular/core";
import { EChartOption } from "echarts";
import { Data } from "./data";
@Component({
    selector: "app-dashboard2",
    templateUrl: "./dashboard2.component.html",
    styleUrls: ["./dashboard2.component.scss"],
    standalone: false
})
export class Dashboard2Component implements OnInit {
config: any;
data: Data = new Data()
today: any = this.data.dataAACoffee[20].price
thisWeek: any = this.data.getSumAA(24,0,17)
thisMonth: any = this.data.getMonthAA(0);
today1: any = this.data.dataCoffeeAB[20].price
thisWeek1: any = this.data.getSumAB(24,0,17)
thisMonth1: any = this.data.getMonthAB(0);
today2: any = this.data.dataCoffeeC[20].price
thisWeek2: any = this.data.getSumC(24,0,17)
thisMonth2: any = this.data.getMonthC(0);
  line_chart: EChartOption = {
    grid: {
      top: "6",
      right: "0",
      bottom: "17",
      left: "25",
    },
    xAxis: {
      data: ["Week One", "Week Two", "Week Three", "Week Four"],
      axisLine: {
        lineStyle: {
          color: "#eaeaea",
        },
      },
      axisLabel: {
        fontSize: 10,
        color: "#9aa0ac",
      },
    },
    tooltip: {
      show: true,
      showContent: true,
      alwaysShowContent: false,
      triggerOn: "mousemove",
      trigger: "axis",
    },
    yAxis: {
      splitLine: {
        lineStyle: {
          color: "#eaeaea",
        },
      },
      axisLine: {
        lineStyle: {
          color: "#eaeaea",
        },
      },
      axisLabel: {
        fontSize: 10,
        color: "#9aa0ac",
      },
    },
    series: [
      {
        name: "AA COFFEE",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: "rgba(0,0,0,0.4)",
          shadowBlur: 10,
          shadowOffsetY: 10,
        },
        data: [this.data.getSumAA(7,0,0),this.data.getSumAA(14,0,7),this.data.getSumAA(21,0,14),this.data.getSumAA(28,0,21)],
        symbolSize: 10,
        // color: ["#FF8D60"]
      },
      {
        name: "AB COFFEE",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: "rgba(0,0,0,0.4)",
          shadowBlur: 10,
          shadowOffsetY: 10,
        },
        symbolSize: 10,
        // size: 10,
        data: [this.data.getSumAB(7,0,0),this.data.getSumAB(14,0,7),this.data.getSumAB(21,0,14),this.data.getSumAB(28,0,21)],
        // color: ["#009DA0"]
      },
      {
        name: "C COFFEE",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: "rgba(0,0,0,0.4)",
          shadowBlur: 10,
          shadowOffsetY: 10,
        },
        symbolSize: 10,
        // size: 10,
        data: [
          this.data.getSumC(7,0,0),this.data.getSumC(14,0,7),this.data.getSumC(21,0,14),this.data.getSumC(28,0,21)],
        // color: ["#009DA0"]
      },
    ],
    color: ["#3FA7DC", "#F6A025", "#9BC311"],
  };

  // Doughnut chart start
  public doughnutChartLabels: string[] = ["India", "USA", "Itely"];
  public doughnutChartData: number[] = [45, 25, 30];
  public doughnutChartLegend = false;
  public doughnutChartColors: any[] = [
    {
      backgroundColor: ["#735A84", "#E76412", "#9BC311"],
    },
  ];
  public doughnutChartType = "doughnut";
  public doughnutChartOptions: any = {
    animation: false,
    responsive: true,
  };
  // Doughnut chart end
  constructor() {
  }
  ngOnInit() {}

}
