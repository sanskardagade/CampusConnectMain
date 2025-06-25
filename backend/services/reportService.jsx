const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } = require('docx');
const stream = require('stream');

async function generateReport(data, format, title = 'Faculty Attendance Report') {
  if (!Array.isArray(data)) throw new Error('Data must be an array');
  if (!data.length) throw new Error('No data to export');

  switch (format) {
    case 'csv': {
      const parser = new Parser();
      const csv = parser.parse(data);
      return { buffer: Buffer.from(csv, 'utf-8'), filename: 'report.csv', contentType: 'text/csv' };
    }
    case 'xlsx': {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
      worksheet.addRows(data);
      worksheet.insertRow(1, [title]);
      worksheet.mergeCells(1, 1, 1, worksheet.columns.length);
      worksheet.getRow(1).font = { bold: true, size: 14 };
      const buffer = await workbook.xlsx.writeBuffer();
      return { buffer, filename: 'report.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }
    case 'pdf': {
      const doc = new PDFDocument({ margin: 30 });
      const pass = new stream.PassThrough();
      doc.pipe(pass);
      // Title
      doc.fontSize(14).text(title, { align: 'center' });
      doc.moveDown();
      const headers = Object.keys(data[0]);
      // Table header
      doc.fontSize(10).fillColor('black');
      const tableTop = doc.y;
      const colWidth = 520 / headers.length;
      headers.forEach((h, i) => {
        doc.rect(40 + i * colWidth, tableTop, colWidth, 20).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text(h, 40 + i * colWidth + 4, tableTop + 6, { width: colWidth - 8, align: 'left' });
      });
      doc.moveDown();
      let y = tableTop + 20;
      data.forEach(row => {
        headers.forEach((h, i) => {
          doc.rect(40 + i * colWidth, y, colWidth, 20).stroke();
          doc.font('Helvetica').fontSize(10).fillColor('black').text(String(row[h] ?? ''), 40 + i * colWidth + 4, y + 6, { width: colWidth - 8, align: 'left' });
        });
        y += 20;
        if (y > doc.page.height - 40) {
          doc.addPage();
          y = 40;
        }
      });
      doc.end();
      const chunks = [];
      for await (const chunk of pass) chunks.push(chunk);
      return { buffer: Buffer.concat(chunks), filename: 'report.pdf', contentType: 'application/pdf' };
    }
    case 'docx': {
      const doc = new Document();
      const headers = Object.keys(data[0]);
      const tableRows = [
        new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }))
        }),
        ...data.map(row => new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph(String(row[h] ?? ''))] }))
        }))
      ];
      doc.addSection({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })], spacing: { after: 200 } }), new Table({ rows: tableRows })] });
      const buffer = await Packer.toBuffer(doc);
      return { buffer, filename: 'report.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    }
    default:
      throw new Error('Unsupported format');
  }
}

module.exports = { generateReport }; 