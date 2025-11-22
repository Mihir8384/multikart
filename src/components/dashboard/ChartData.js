export const DashboardChartOptions = (data, convertCurrency) => {
  return {
    series: [
      {
        name: "Revenue",
        data: data?.revenues || [],
        color: "#22d3ee", // Cyan-400 - vibrant turquoise from your screenshot
      },
      {
        name: "Commission",
        data: data?.commissions || [],
        color: "#475569", // Slate-600 - elegant gray
      },
    ],
    options: {
      chart: {
        height: 380,
        type: "line",
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 10,
          color: "#22d3ee",
          opacity: 0.15,
        },
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        background: "transparent",
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
        strokeWidth: 3,
        strokeColors: "#ffffff",
        hover: {
          size: 8,
          sizeOffset: 3,
        },
        discrete: [],
      },
      stroke: {
        curve: "smooth",
        lineCap: "round",
        width: 3,
      },
      grid: {
        show: true,
        borderColor: "#e2e8f0",
        strokeDashArray: 3,
        position: "back",
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 10,
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        fontSize: "13px",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        labels: {
          colors: "#64748b",
        },
        markers: {
          width: 10,
          height: 10,
          radius: 12,
          offsetX: -5,
        },
        itemMargin: {
          horizontal: 16,
          vertical: 0,
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: "light",
        style: {
          fontSize: "13px",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        x: {
          show: true,
          format: "MMM 'yy",
        },
        y: {
          formatter: function (value) {
            return convertCurrency(value);
          },
        },
        marker: {
          show: true,
        },
      },
      responsive: [
        {
          breakpoint: 1200,
          options: {
            grid: {
              padding: {
                right: 10,
              },
            },
          },
        },
        {
          breakpoint: 992,
          options: {
            grid: {
              padding: {
                right: 5,
              },
            },
          },
        },
        {
          breakpoint: 767,
          options: {
            chart: {
              height: 240,
            },
            legend: {
              position: "bottom",
              horizontalAlign: "center",
            },
          },
        },
        {
          breakpoint: 576,
          options: {
            chart: {
              height: 220,
            },
            yaxis: {
              labels: {
                show: false,
              },
            },
            legend: {
              show: false,
            },
          },
        },
      ],
      yaxis: {
        tickAmount: 5,
        labels: {
          style: {
            colors: "#94a3b8",
            fontSize: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
          },
          offsetX: -10,
          formatter: function (value) {
            return convertCurrency(value);
          },
        },
      },
      xaxis: {
        categories: data?.months || [],
        range: undefined,
        labels: {
          style: {
            colors: "#94a3b8",
            fontSize: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      states: {
        normal: {
          filter: {
            type: "none",
            value: 0,
          },
        },
        hover: {
          filter: {
            type: "lighten",
            value: 0.1,
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: "darken",
            value: 0.1,
          },
        },
      },
    },
  };
};
