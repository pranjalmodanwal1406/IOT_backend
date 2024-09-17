const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas'); // Required to generate the chart

// Function to generate the chart as an image using Chart.js and canvas
const generateChart = async () => {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');
  
  // Load Chart.js library to the Node environment
  const Chart = require('chart.js/auto');

  // Create the chart using static data (or you can pass dynamic data)
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45], // Time in seconds
      datasets: [
        {
          label: 'Flow (ml/sec)',
          data: [0, 10, 30, 45, 60, 75, 60, 45, 30, 0], // Static flow data
          borderColor: 'blue',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Volume (ml)',
          data: [0, 5, 15, 25, 45, 50, 40, 30, 20, 10], // Static volume data
          borderColor: 'green',
          borderWidth: 2,
          fill: false,
        }
      ]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time (sec)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Flow / Volume (ml/sec or ml)'
          },
          beginAtZero: true
        }
      }
    }
  });

  // Save the chart as an image
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(__dirname, 'chart.png');
  fs.writeFileSync(filePath, buffer);

  return filePath;
};

// Function to create the PDF
const createPDF = async (client, tableData = []) => {
  try {
    // Create the PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 850]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.drawText('UROFLOWMETRY', {
      x: 210,
      y: 800,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Patient details section
    const leftColumnX = 50;
    const rightColumnX = 350;
    const yOffset = 740;
    
    page.drawText(`Patient name: ${client.clientName}`, {
      x: leftColumnX,
      y: yOffset,
      size: 12,
      font: font,
    });
    page.drawText(`Birthday: ${client.birthday}`, {
      x: rightColumnX,
      y: yOffset,
      size: 12,
      font: font,
    });

    page.drawText(`Mother name: ${client.motherName}`, {
      x: leftColumnX,
      y: yOffset - 20,
      size: 12,
      font: font,
    });
    page.drawText(`Identity: ${client.identity}`, {
      x: rightColumnX,
      y: yOffset - 20,
      size: 12,
      font: font,
    });

    page.drawText(`Measure time: ${client.measureTime}`, {
      x: leftColumnX,
      y: yOffset - 40,
      size: 12,
      font: font,
    });

    // Table header and structure
    const tableStartY = 650;
    const rowHeight = 20;
    const colWidths = [150, 100, 100, 100]; // Widths for the table columns
    const headers = ['Marker data', 'Left', 'Difference', 'Right'];
    const tableXStart = 50;

    // Check that tableData and colWidths exist and are valid
    if (!Array.isArray(tableData)) {
      throw new Error("tableData must be an array");
    }

    // Draw table header and add lines
    headers.forEach((header, index) => {
      const x = tableXStart + (colWidths.slice(0, index).reduce((a, b) => a + b, 0) || 0);
      page.drawText(header, { x, y: tableStartY, size: 12, font: font });

      // Draw vertical lines for the header
      page.drawLine({
        start: { x: tableXStart, y: tableStartY + 10 },
        end: { x: tableXStart + colWidths.reduce((a, b) => a + b, 0), y: tableStartY + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    });

    // Draw horizontal lines (for rows and columns)
    const totalRows = tableData.length;
    const totalHeight = rowHeight * totalRows;

    // Draw vertical column lines
    for (let i = 0; i <= headers.length; i++) {
      const x = tableXStart + (colWidths.slice(0, i).reduce((a, b) => a + b, 0) || 0);
      page.drawLine({
        start: { x, y: tableStartY + 10 },
        end: { x, y: tableStartY - totalHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Draw table rows
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        const x = tableXStart + (colWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0) || 0);
        const y = tableStartY - rowHeight * (rowIndex + 1);
        page.drawText(cell ? cell.toString() : '', { x, y, size: 12, font: font });

        // Draw horizontal line for each row
        page.drawLine({
          start: { x: tableXStart, y },
          end: { x: tableXStart + colWidths.reduce((a, b) => a + b, 0), y },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      });
    });

    // Draw bottom horizontal line
    page.drawLine({
      start: { x: tableXStart, y: tableStartY - totalHeight },
      end: { x: tableXStart + colWidths.reduce((a, b) => a + b, 0), y: tableStartY - totalHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Add auto-evaluation table
    const autoEvalY = tableStartY - rowHeight * (tableData.length + 1) - 40;
    page.drawText('Total volume: 210.25 ml', { x: leftColumnX, y: autoEvalY, size: 12, font: font });
    page.drawText('Max. flow speed: 48.12 ml/s', { x: rightColumnX, y: autoEvalY, size: 12, font: font });

    // Embed chart
    const chartPath = await generateChart();
    const chartImageBytes = fs.readFileSync(chartPath);
    const chartImage = await pdfDoc.embedPng(chartImageBytes);
    const chartDims = chartImage.scale(0.5);
    
    page.drawImage(chartImage, {
      x: 50,
      y: autoEvalY - 300,
      width: chartDims.width,
      height: chartDims.height,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(__dirname, `Uroflowmetry-Report-${client.clientId}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    return { pdfBuffer: Buffer.from(pdfBytes), filePath };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF generation failed');
  }
};

module.exports = { createPDF };