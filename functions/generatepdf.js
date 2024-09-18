const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const Chart = require('chart.js/auto'); 
const { createCanvas } = require('canvas')
const measuredataModel = require('../models/measuredataModel');
const Patient = require('../models/patientModel');
const annotationPlugin = require('chartjs-plugin-annotation');
Chart.register(annotationPlugin);


const generateChart = async (data, graphData) => {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  // Extract time, flow, and volume from the dynamic data
  const labels = data.map(d => parseFloat(d.time));
  const flowData = data.map(d => {
    const flowValue = parseFloat(d.flow);
    return (!isFinite(flowValue) || isNaN(flowValue)) ? 0 : flowValue;
  });

  const volumeData = data.map(d => {
    const volumeValue = parseFloat(d.volume);
    return (!isFinite(volumeValue) || isNaN(volumeValue)) ? 0 : volumeValue;
  });

  // Find the maximum flow value and its index
  const maxFlow = Math.max(...flowData);
  const maxFlowIndex = flowData.indexOf(maxFlow);
  const maxFlowTime = labels[maxFlowIndex]; // Corresponding time for the max flow

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Flow (ml/sec)',
          data: flowData,
          borderColor: 'green',
          borderWidth: 1,
          fill: false,
          yAxisID: 'left-y-axis', // Assign to left y-axis
          pointRadius: 0, // No dots except at max flow
        },
        {
          label: 'Volume (ml)',
          data: volumeData,
          borderColor: 'blue',
          borderWidth: 1,
          fill: false,
          yAxisID: 'right-y-axis', // Assign to right y-axis
          pointRadius: 0, // No dots except at max flow
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'linear', // Set the axis type to linear for numeric values
          title: {
            display: true,
            text: 'Time (sec)',
            color: 'black'
          },
          ticks: {
            min: 0, // Set minimum value for the x-axis
            max: graphData.flowTime + 10, // Set maximum value for the x-axis
            stepSize: 10, // Set the step size for the x-axis ticks
            color: 'black',
            callback: function(value) {
              return `${value}`; // Format ticks (optional)
            },
            minRotation: 0, // Ensure labels are horizontal
            maxRotation: 0  // Ensure labels are horizontal
          }
        },
        'left-y-axis': {
          title: {
            display: true,
            text: 'Flow (ml/sec)',
            color: 'green'
          },
          ticks: {
            min: 0, // Set minimum value for y-axis
            max: 100, // Set maximum value for y-axis
            stepSize: 10, // Display ticks every 10 units
            color: 'green',
            callback: function(value) {
              return `${value} `; // Customize label for each tick
            }
          },
          beginAtZero: true,
          position: 'left',
        },
        'right-y-axis': {
          title: {
            display: true,
            text: 'Volume (ml)',
            color: 'blue'
          },
          ticks: {
            min: 0, // Set minimum value for y-axis
            max: 100, // Set maximum value for y-axis
            stepSize: 20, // Display ticks every 20 units
            color: 'blue',
            callback: function(value) {
              return `${value}`; // Customize label for each tick
            }
          },
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          }
        }
      },
      plugins: {
        annotation: {
          annotations: {
            maxFlowPoint: {
              type: 'point',
              xValue: maxFlowTime, // Position of max flow on the x-axis
              yValue: maxFlow, // Position of max flow on the y-axis
              backgroundColor: 'red', // Color of the point
              radius: 5, // Size of the point
              label: {
                content: `Max: ${maxFlow} ml/sec`,
                enabled: true,
                position: 'top',
                color: 'red',
                font: {
                  size: 14
                }
              }
            }
          }
        }
      }
    }
  });

  // Generate chart buffer
  const buffer = canvas.toBuffer('image/png');
  const image = await canvas.toBuffer();
  return { buffer, width: canvas.width, height: canvas.height };
};




const createPDF = async (userid, date) => {
  try {
    // const parsedDate = new Date(date);
    const patientData = await Patient.findOne({ userId: userid }).exec();
    const graphData = await measuredataModel.findOne({
      userId: userid,
      date: date
    }).exec();

    // console.log(graphData)
    const calcData = graphData.data;
    // console.log("calcData",calcData);

    if (!graphData) {
      throw new Error('No measurement data found for the given userId and date');
    }
    // console.log('GraphData:', graphData);
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 850]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const columnWidth = (pageWidth - 3 * margin) / 2;

    // Draw margin lines
    page.drawLine({
      start: { x: margin, y: margin },
      end: { x: pageWidth - margin, y: margin },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: margin, y: margin },
      end: { x: margin, y: pageHeight - margin },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: margin, y: pageHeight - margin },
      end: { x: pageWidth - margin, y: pageHeight - margin },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: pageWidth - margin, y: margin },
      end: { x: pageWidth - margin, y: pageHeight - margin },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Title
    page.drawText('UROFLOWMETRY', {
      x: (pageWidth - 200) / 2,
      y: pageHeight - margin - 30,
      size: 24,
      font:boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw header table
    const leftColumnX = margin + 10;
    const rightColumnX = margin + columnWidth + 30;
    const headerRows = [
      { label: 'Patient name:', value: `${patientData.firstname} ${patientData.lastname}` || 'N/A' },
      { label: 'DOB:', value: patientData.DOB ? new Date(patientData.DOB).toLocaleDateString() : 'N/A' },
      { label: 'Identity:', value: patientData.SSN || 'N/A' }
    ];
    
    const rowHeight = 20;
    const headerStartY = pageHeight - margin - 60;
    
    // Loop through each row and draw text
    headerRows.forEach((row, index) => {
      const yOffset = headerStartY - Math.floor(index / 2) * rowHeight;
    
      // Draw text for the left column
      if (index % 2 === 0) {
        page.drawText(`${row.label} ${row.value}`, {
          x: leftColumnX,
          y: yOffset-10,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      } else {
        // Draw text for the right column
        page.drawText(`${row.label} ${row.value}`, {
          x: rightColumnX,
          y: yOffset-10,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }
    });

    // Draw data table
    const dataTableStartY = pageHeight - margin - 140;
    const dataTableColumnWidth = [150, 100, 100, 100];
    const dataTableHeaders = ['Marker data', 'Left', 'Difference', 'Right'];
    const dataTableRows = [
      { marker: 'Time (sec):', left: '', difference: '', right: '' },
      { marker: 'Volume (ml):', left: '', difference: '', right: '' },
      { marker: 'Speed (ml/s):', left: '', difference: '', right: '' },
    ];

    // Draw table headers
    dataTableHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: margin + 10 + dataTableColumnWidth.slice(0, index).reduce((a, b) => a + b, 0),
        y: dataTableStartY - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });

    page.drawLine({
      start: { x: margin + 5, y: dataTableStartY - 15 },
      end: { x: margin + 5 + dataTableColumnWidth.reduce((a, b) => a + b + 10, 0), y: dataTableStartY - 15 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Draw table rows
    dataTableRows.forEach((row, rowIndex) => {
      const rowY = dataTableStartY - (rowIndex + 1) * 20;
      page.drawText(row.marker, {
        x: margin + 10,
        y: rowY - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.left, {
        x: margin + dataTableColumnWidth[0],
        y: rowY - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.difference, {
        x: margin + dataTableColumnWidth[0] + dataTableColumnWidth[1],
        y: rowY - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.right, {
        x: margin + dataTableColumnWidth[0] + dataTableColumnWidth[1] + dataTableColumnWidth[2],
        y: rowY - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });

    // Draw table borders
    const dataTableHeight = (dataTableRows.length + 1) * 20;
    const dataTableWidth = dataTableColumnWidth.reduce((a, b) => a + b, 0) + margin;

    // Top border
    page.drawLine({
      start: { x: margin + 5, y: dataTableStartY + 5 },
      end: { x: margin - 5 + dataTableWidth, y: dataTableStartY + 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Bottom border
    page.drawLine({
      start: { x: margin + 5, y: dataTableStartY - dataTableHeight },
      end: { x: margin - 5 + dataTableWidth, y: dataTableStartY - dataTableHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Vertical borders
    let currentX = margin + 5;
    dataTableColumnWidth.forEach((width) => {
      page.drawLine({
        start: { x: currentX, y: dataTableStartY + 5 },
        end: { x: currentX, y: dataTableStartY - dataTableHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      currentX += width;
    });

    page.drawLine({
      start: { x: currentX + 40, y: dataTableStartY + 5 },
      end: { x: currentX + 40, y: dataTableStartY - dataTableHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Embed chart
    const { buffer: chartBuffer, width: chartWidth, height: chartHeight } = await generateChart(calcData, graphData);
    const chartImage = await pdfDoc.embedPng(chartBuffer);

    // Calculate chart and table positions
    const chartYPosition = pageHeight - margin - chartHeight - 100; // Adjust vertical position of chart
    const autoEvalTableStartY = chartYPosition - 20; // Position table below chart

    // Draw chart
    page.drawImage(chartImage, {
      x: margin,
      y: chartYPosition,
      width: chartWidth-120,
      height: chartHeight-150,
    });
    page.drawLine({
      start: { x: margin, y:275 },
      end: { x: margin+500, y: 275 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Draw auto-evaluation table heading
    page.drawText('Auto-Evaluation Summary', {
      x: margin+160,
      y: autoEvalTableStartY-20,
      size: 14,
      font:boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw auto-evaluation table
    const autoEvalRows = [
      { label1: 'Total volume:', value1: `${graphData.totalVolume}`, label2: 'Total measure time:', value2:`${graphData.totalMeasureTime} ` },
      { label1: 'Max. flow speed:', value1:`${graphData.maxFlowSpeed} `, label2: 'Flow time:', value2: `${graphData.flowTime} ` },
      { label1: 'Average flow speed:', value1: `${graphData.averageFlowSpeed} `, label2: 'Time of max. speed:', value2: `${graphData.timeOfMaxSpeed} ` },
    ];

    // Table headers
    // page.drawText('Label', { x: margin+150, y: autoEvalTableStartY - 50, size: 12, font, color: rgb(0, 0, 0) });
    // page.drawText('Value', { x: margin + 150, y: autoEvalTableStartY - 50, size: 12, font, color: rgb(0, 0, 0) });
    // page.drawText('Label', { x: margin + 300, y: autoEvalTableStartY - 50, size: 12, font, color: rgb(0, 0, 0) });
    // page.drawText('Value', { x: margin + 450, y: autoEvalTableStartY - 50, size: 12, font, color: rgb(0, 0, 0) });

    // Draw table rows
    autoEvalRows.forEach((row, index) => {
      const yOffset = autoEvalTableStartY - (index + 1) * 20;
      page.drawText(row.label1, {
        x: margin+10,
        y: yOffset-30,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.value1, {
        x: margin + 135,
        y: yOffset-30,
        size: 12,
        font:boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.label2, {
        x: margin + 255,
        y: yOffset-30,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(row.value2, {
        x: margin + 405,
        y: yOffset-30,
        size: 12,
        font:boldFont,
        color: rgb(0, 0, 0),
      });
    });

    // Draw table borders
    const autoEvalTableHeight = (autoEvalRows.length + 1) * 20 + 50;
    const autoEvalTableWidth = 500; // Total width of the table

    // Top border
    page.drawLine({
      start: { x: margin, y: autoEvalTableStartY - 25 },
      end: { x: margin + autoEvalTableWidth, y: autoEvalTableStartY - 25 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Bottom border
    page.drawLine({
      start: { x: margin, y: autoEvalTableStartY - autoEvalTableHeight+5 },
      end: { x: margin + autoEvalTableWidth, y: autoEvalTableStartY - autoEvalTableHeight+5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Vertical borders
    page.drawLine({
      start: { x: margin, y: autoEvalTableStartY - 25 },
      end: { x: margin, y: autoEvalTableStartY - autoEvalTableHeight+45 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    // page.drawLine({
    //   start: { x: margin + 130, y: autoEvalTableStartY - 25 },
    //   end: { x: margin + 130, y: autoEvalTableStartY - autoEvalTableHeight+45 },
    //   thickness: 1,
    //   color: rgb(0, 0, 0),
    // });
    page.drawLine({
      start: { x: margin + 250, y: autoEvalTableStartY - 25 },
      end: { x: margin + 250, y: autoEvalTableStartY - autoEvalTableHeight+25 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    // page.drawLine({
    //   start: { x: margin + 400, y: autoEvalTableStartY - 25 },
    //   end: { x: margin + 400, y: autoEvalTableStartY - autoEvalTableHeight+45 },
    //   thickness: 1,
    //   color: rgb(0, 0, 0),
    // });
    page.drawLine({
      start: { x: margin + 500, y: autoEvalTableStartY - 25 },
      end: { x: margin + 500, y: autoEvalTableStartY - autoEvalTableHeight+45 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText('Report', {
      x: margin+225,
      y: 160,
      size: 14,
      font:boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: margin, y: 175 },
      end: { x: margin+500, y: 175 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    
    // Draw stamp and signature area
    page.drawEllipse({
      x: 450, // Center horizontally
      y: 110, // Adjust vertical position near the bottom
      xScale: 25, // Radius for x-axis
      yScale: 25, // Radius for y-axis (same for a perfect circle)
      borderColor: rgb(0.7, 0.7, 0.7), // Color of the circle's border
      borderWidth: 1, // Thickness of the border
    });
    page.drawText('stamp', {
      x: margin+385,
      y: 108,
      size: 12,
      font,
      color: rgb(0.7, 0.7, 0.7),
    });
    page.drawLine({
      start: { x: margin+330, y: 65 },
      end: { x: margin+470, y: 65 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    page.drawText(' Urodoc Lite v2.43  (C) 2024, Right licenced to Advin Health Care', {
      x: margin+60,
      y: 35,
      size: 12,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });


    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(__dirname, `Client-Report-${patientData.firstname}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    return { pdfBuffer: Buffer.from(pdfBytes), filePath };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF generation failed');
  }
};

module.exports = { createPDF };
