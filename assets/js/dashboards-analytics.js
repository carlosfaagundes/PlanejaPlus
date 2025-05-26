/**
 * Dashboard Analytics
 */

'use strict';

(function () {
  let cardColor, headingColor, axisColor, shadeColor, borderColor;

  // Garante que 'config' e 'config.colors' existam
  if (typeof config !== 'undefined' && typeof config.colors !== 'undefined') {
    cardColor = config.colors.white;
    headingColor = config.colors.headingColor;
    axisColor = config.colors.axisColor;
    borderColor = config.colors.borderColor;
    shadeColor = config.colors.primary; // Usado para alguns destaques, pode ser usado para Despesas Fixas se desejar
  } else {
    // Fallback de cores se 'config' não estiver definido
    cardColor = '#fff';
    headingColor = '#566a7f';
    axisColor = '#a1acb8';
    borderColor = '#dfe3e7';
    shadeColor = '#696cff'; // Cor primária padrão do Sneat
    console.warn('Objeto config.colors não encontrado, usando cores padrão para gráficos.');
  }


  // 1. Gráfico de Rosca (Composição Financeira Atual)
  const chartOrderStatisticsEl = document.querySelector('#orderStatisticsChart');
  let statisticsChart = null;

  const orderChartConfig = {
    chart: {
      height: 165,
      width: 130,
      type: 'donut'
    },
    labels: ['Despesas Variadas', 'Despesas Fixas', 'Reserva'], // ATUALIZADO
    series: [0, 0, 0],
    colors: [config.colors.warning, config.colors.primary, config.colors.success], // ATUALIZADO: Usando primary para Desp.Fixas
    stroke: { width: 5, colors: [cardColor] },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { padding: { top: 0, bottom: 0, right: 15 } },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            value: {
              fontSize: '1.1rem',
              fontFamily: 'Public Sans',
              color: headingColor,
              offsetY: -10,
              formatter: (val) => 'R$' + parseFloat(val).toFixed(2)
            },
            name: {
              show: false
            },
            total: {
              show: true,
              showAlways: true,
              fontSize: '0.75rem',
              color: axisColor,
              label: 'Alocado',
              offsetY: 5,
              formatter: (w) => 'R$' + parseFloat(w.globals.seriesTotals.reduce((a, b) => a + b, 0)).toFixed(2)
            }
          }
        }
      }
    }
  };

  if (chartOrderStatisticsEl) {
    statisticsChart = new ApexCharts(chartOrderStatisticsEl, orderChartConfig);
    statisticsChart.render();
  }

  window.updateFinanceChart = function (data) {
    if (statisticsChart) {
      const newSeries = [
        data.despesasVariadas || 0,
        data.despesasFixas || 0, // ATUALIZADO
        data.reserva || 0
      ];
      statisticsChart.updateSeries(newSeries);
    }
  };

  // 2. GRÁFICO DE HISTÓRICO ANUAL (Colunas)
  const annualHistoryChartEl = document.querySelector('#annualHistoryChart');
  let annualHistoryApexChart = null;

  const annualHistoryChartOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 320,
      stacked: false,
      toolbar: {
        show: true,
        tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 5,
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: false,
      formatter: function (val) { return val > 0 ? "R$" + val.toFixed(0) : ""; },
      offsetY: -20,
      style: { fontSize: '10px', colors: [headingColor] }
    },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      labels: { style: { colors: axisColor, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: 'Valor (R$)', style: { color: headingColor, fontSize: '12px'} },
      labels: { style: { colors: axisColor, fontSize: '12px' }, formatter: (val) => 'R$' + val.toFixed(0) },
      min: 0
    },
    fill: { opacity: 1 },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      offsetY: 5,
      labels: { colors: axisColor },
      itemMargin: { horizontal: 10, vertical: 2 },
      markers: { width: 10, height: 10, offsetX: -2 }
    },
    colors: [config.colors.success, config.colors.warning, config.colors.primary, config.colors.info], // Saldo Adic., Desp. Var., Desp. Fixas (usando primary), Reserva Adic. (usando info)
    tooltip: {
      y: {
        formatter: function (val) {
          return "R$ " + parseFloat(val).toFixed(2);
        }
      }
    },
    grid: {
        borderColor: borderColor,
        padding: { top: 20, right: 0, bottom: -8, left: 20 }
    }
  };

  if (annualHistoryChartEl) {
    annualHistoryApexChart = new ApexCharts(annualHistoryChartEl, annualHistoryChartOptions);
    annualHistoryApexChart.render();
  }

  window.updateAnnualHistoryChart = function (chartData) {
    if (annualHistoryApexChart) {
      annualHistoryApexChart.updateOptions({
        series: chartData.series || [],
        // ATUALIZADO NOME DA SÉRIE CASO NECESSÁRIO NO OBJETO chartData.series
        // Ex: { name: 'Desp. Fixas', data: ... }
      });
    }
  };

  // 3. NOVO GRÁFICO: Resumo Mensal Detalhado (Colunas)
  const newDetailedMonthlyChartEl = document.querySelector('#newDetailedMonthlyChart');
  let newDetailedMonthlyApexChart = null;

  const newDetailedMonthlyChartOptions = {
    series: [], // Ex: [{ name: 'Saldo Adicionado', data: [...] }, { name: 'Desp. Variadas', data: [...] }, ...]
    chart: {
      type: 'bar',
      height: 350,
      stacked: false, // ou true se preferir empilhado
      toolbar: {
        show: true,
        tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '80%', // Pode ajustar para diferenciar do outro gráfico de barras
        borderRadius: 5,
        dataLabels: {
          position: 'top', // Mostra valores no topo das barras
        }
      }
    },
    dataLabels: {
      enabled: false, // Habilitar se quiser ver os valores diretamente nas colunas
      formatter: function (val) {
        return val > 0 ? "R$" + val.toFixed(0) : "";
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: [headingColor] // Cor do texto do dataLabel
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      labels: {
        style: {
          colors: axisColor,
          fontSize: '12px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: {
        text: 'Valor (R$)',
        style: { color: headingColor, fontSize: '12px' }
      },
      labels: {
        style: {
          colors: axisColor,
          fontSize: '12px'
        },
        formatter: (val) => 'R$' + val.toFixed(0)
      },
      min: 0 // Garante que o eixo Y comece em 0
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      offsetY: 5,
      labels: {
        colors: axisColor
      },
      itemMargin: {
        horizontal: 10,
        vertical: 2
      },
      markers: {
        width: 10,
        height: 10,
        offsetX: -2
      }
    },
    // Cores para: Saldo Adicionado, Despesas Variadas, Despesas Fixas, Reserva Adicionada
    colors: [config.colors.success, config.colors.warning, config.colors.danger, config.colors.info], // Usando danger para Desp.Fixas aqui para diferenciar
    tooltip: {
      y: {
        formatter: function (val) {
          return "R$ " + parseFloat(val).toFixed(2);
        }
      }
    },
    grid: {
      borderColor: borderColor,
      padding: { top: 20, right: 0, bottom: -8, left: 20 }
    }
  };

  if (newDetailedMonthlyChartEl) {
    newDetailedMonthlyApexChart = new ApexCharts(newDetailedMonthlyChartEl, newDetailedMonthlyChartOptions);
    newDetailedMonthlyApexChart.render();
  }

  window.updateNewDetailedMonthlyChart = function (chartData) {
    if (newDetailedMonthlyApexChart) {
      newDetailedMonthlyApexChart.updateOptions({
        series: chartData.series || []
        // As categorias (meses) são fixas.
        // Os nomes das séries já devem vir corretos de `chartData.series`
        // Ex: { name: 'Desp. Fixas', data: [...] }
      });
    }
  };

})();