export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];
  
  // Add BOM for Excel compatibility
  csvRows.push('\uFEFF');
  
  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      // Escape quotes and wrap in quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function convertToExcel(data: any[], headers: string[], sheetName: string = 'Sheet1'): string {
  // Simple Excel XML format
  const xmlHeader = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName}">
  <Table>`;

  const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

  // Add header row
  const headerRow = `   <Row>
${headers.map(h => `    <Cell><Data ss:Type="String">${h}</Data></Cell>`).join('\n')}
   </Row>`;

  // Add data rows
  const dataRows = data.map(row => {
    const cells = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '<Cell><Data ss:Type="String"></Data></Cell>';
      if (typeof value === 'number') return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
      return `<Cell><Data ss:Type="String">${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
    });
    return `   <Row>
${cells.map(c => `    ${c}`).join('\n')}
   </Row>`;
  }).join('\n');

  return xmlHeader + '\n' + headerRow + '\n' + dataRows + '\n' + xmlFooter;
}

export function convertToPDF(data: any[], headers: string[], title: string = 'Export'): string {
  // Simple HTML that can be converted to PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .timestamp { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '<td></td>';
            if (typeof value === 'object') return `<td>${JSON.stringify(value)}</td>`;
            return `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
</body>
</html>`;
  
  return html;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAsPDF(html: string, filename: string) {
  // For PDF generation, we'll use the browser's print functionality
  // In a real app, you'd use a library like jsPDF or Puppeteer
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export function exportOpportunities(opportunities: any[], format: 'csv' | 'json' | 'excel' | 'pdf') {
  const flatData = opportunities.map(opp => ({
    id: opp.id,
    title: opp.title,
    description: opp.description,
    segment: opp.segment?.name || '',
    market: opp.segment?.market?.name || '',
    status: opp.status,
    score: opp.score,
    risk: opp.risk,
    roi: opp.roi || '',
    revenue: opp.revenue || '',
    strategicFit: opp.strategicFit || '',
    entryBarrier: opp.entryBarrier || '',
    createdAt: new Date(opp.createdAt).toISOString(),
  }));
  
  const headers = ['id', 'title', 'description', 'segment', 'market', 'status', 'score', 'risk', 'roi', 'revenue', 'strategicFit', 'entryBarrier', 'createdAt'];
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'csv':
      const csv = convertToCSV(flatData, headers);
      downloadFile(csv, `opportunities-${timestamp}.csv`, 'text/csv');
      break;
    case 'json':
      const json = JSON.stringify(flatData, null, 2);
      downloadFile(json, `opportunities-${timestamp}.json`, 'application/json');
      break;
    case 'excel':
      const excel = convertToExcel(flatData, headers, 'Opportunities');
      downloadFile(excel, `opportunities-${timestamp}.xls`, 'application/vnd.ms-excel');
      break;
    case 'pdf':
      const pdf = convertToPDF(flatData, headers, 'Opportunities Report');
      downloadAsPDF(pdf, `opportunities-${timestamp}.pdf`);
      break;
  }
}

export function exportSegments(segments: any[], format: 'csv' | 'json' | 'excel' | 'pdf') {
  const flatData = segments.map(seg => ({
    id: seg.id,
    name: seg.name,
    characteristics: seg.characteristics,
    size: seg.size || '',
    growth: seg.growth || '',
    opportunitiesCount: seg.opportunities?.length || 0,
    createdAt: new Date(seg.createdAt).toISOString(),
  }));
  
  const headers = ['id', 'name', 'characteristics', 'size', 'growth', 'opportunitiesCount', 'createdAt'];
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'csv':
      const csv = convertToCSV(flatData, headers);
      downloadFile(csv, `segments-${timestamp}.csv`, 'text/csv');
      break;
    case 'json':
      const json = JSON.stringify(flatData, null, 2);
      downloadFile(json, `segments-${timestamp}.json`, 'application/json');
      break;
    case 'excel':
      const excel = convertToExcel(flatData, headers, 'Segments');
      downloadFile(excel, `segments-${timestamp}.xls`, 'application/vnd.ms-excel');
      break;
    case 'pdf':
      const pdf = convertToPDF(flatData, headers, 'Market Segments Report');
      downloadAsPDF(pdf, `segments-${timestamp}.pdf`);
      break;
  }
}

export function exportCompetitors(competitors: any[], format: 'csv' | 'json' | 'excel' | 'pdf') {
  const flatData = competitors.map(comp => ({
    id: comp.id,
    name: comp.name,
    strengths: comp.strengths,
    weaknesses: comp.weaknesses,
    marketShare: comp.marketShare || '',
    positioning: comp.positioning || '',
    createdAt: new Date(comp.createdAt).toISOString(),
  }));
  
  const headers = ['id', 'name', 'strengths', 'weaknesses', 'marketShare', 'positioning', 'createdAt'];
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'csv':
      const csv = convertToCSV(flatData, headers);
      downloadFile(csv, `competitors-${timestamp}.csv`, 'text/csv');
      break;
    case 'json':
      const json = JSON.stringify(flatData, null, 2);
      downloadFile(json, `competitors-${timestamp}.json`, 'application/json');
      break;
    case 'excel':
      const excel = convertToExcel(flatData, headers, 'Competitors');
      downloadFile(excel, `competitors-${timestamp}.xls`, 'application/vnd.ms-excel');
      break;
    case 'pdf':
      const pdf = convertToPDF(flatData, headers, 'Competitive Analysis Report');
      downloadAsPDF(pdf, `competitors-${timestamp}.pdf`);
      break;
  }
}

export function exportMarket(market: any, format: 'csv' | 'json' | 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = market.name.replace(/\s+/g, '-').toLowerCase();
  
  if (format === 'json') {
    const json = JSON.stringify(market, null, 2);
    downloadFile(json, `market-${filename}-${timestamp}.json`, 'application/json');
  } else {
    // For other formats, export a comprehensive summary
    const summary = {
      id: market.id,
      name: market.name,
      description: market.description,
      sector: market.sector,
      segmentsCount: market.segments?.length || 0,
      competitorsCount: market.competitors?.length || 0,
      trendsCount: market.trends?.length || 0,
      totalOpportunities: market.segments?.reduce((sum: number, seg: any) => sum + (seg.opportunities?.length || 0), 0) || 0,
      createdAt: new Date(market.createdAt).toISOString(),
    };
    
    const headers = Object.keys(summary);
    
    switch (format) {
      case 'csv':
        const csv = convertToCSV([summary], headers);
        downloadFile(csv, `market-${filename}-${timestamp}.csv`, 'text/csv');
        break;
      case 'excel':
        const excel = convertToExcel([summary], headers, 'Market Summary');
        downloadFile(excel, `market-${filename}-${timestamp}.xls`, 'application/vnd.ms-excel');
        break;
      case 'pdf':
        const pdf = convertToPDF([summary], headers, `${market.name} - Market Report`);
        downloadAsPDF(pdf, `market-${filename}-${timestamp}.pdf`);
        break;
    }
  }
}

// Batch export functionality
export function exportBatch(data: {
  opportunities?: any[];
  segments?: any[];
  competitors?: any[];
  market?: any;
}, format: 'csv' | 'json' | 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  const zipName = `blue-ocean-export-${timestamp}`;
  
  // Create a comprehensive export object
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      source: 'Blue Ocean Explorer',
    },
    data: {
      opportunities: data.opportunities || [],
      segments: data.segments || [],
      competitors: data.competitors || [],
      market: data.market || null,
    },
  };
  
  if (format === 'json') {
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, `${zipName}.json`, 'application/json');
  } else {
    // For other formats, create a summary report
    const summary = {
      exportDate: exportData.metadata.exportDate,
      opportunitiesCount: data.opportunities?.length || 0,
      segmentsCount: data.segments?.length || 0,
      competitorsCount: data.competitors?.length || 0,
      marketName: data.market?.name || 'N/A',
      totalDataPoints: (data.opportunities?.length || 0) + (data.segments?.length || 0) + (data.competitors?.length || 0),
    };
    
    const headers = Object.keys(summary);
    
    switch (format) {
      case 'csv':
        const csv = convertToCSV([summary], headers);
        downloadFile(csv, `${zipName}.csv`, 'text/csv');
        break;
      case 'excel':
        const excel = convertToExcel([summary], headers, 'Export Summary');
        downloadFile(excel, `${zipName}.xls`, 'application/vnd.ms-excel');
        break;
      case 'pdf':
        const pdf = convertToPDF([summary], headers, 'Blue Ocean Explorer - Export Summary');
        downloadAsPDF(pdf, `${zipName}.pdf`);
        break;
    }
  }
}

// Export analytics and insights
export function exportAnalytics(analytics: any, format: 'csv' | 'json' | 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Flatten analytics data
  const flatData = Object.entries(analytics).map(([key, value]) => ({
    metric: key,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
    timestamp: new Date().toISOString(),
  }));
  
  const headers = ['metric', 'value', 'timestamp'];
  
  switch (format) {
    case 'csv':
      const csv = convertToCSV(flatData, headers);
      downloadFile(csv, `analytics-${timestamp}.csv`, 'text/csv');
      break;
    case 'json':
      const json = JSON.stringify(analytics, null, 2);
      downloadFile(json, `analytics-${timestamp}.json`, 'application/json');
      break;
    case 'excel':
      const excel = convertToExcel(flatData, headers, 'Analytics');
      downloadFile(excel, `analytics-${timestamp}.xls`, 'application/vnd.ms-excel');
      break;
    case 'pdf':
      const pdf = convertToPDF(flatData, headers, 'Analytics Report');
      downloadAsPDF(pdf, `analytics-${timestamp}.pdf`);
      break;
  }
}