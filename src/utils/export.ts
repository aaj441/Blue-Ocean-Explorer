export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOpportunities(opportunities: any[], format: 'csv' | 'json') {
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
  
  if (format === 'csv') {
    const headers = ['id', 'title', 'description', 'segment', 'market', 'status', 'score', 'risk', 'roi', 'revenue', 'strategicFit', 'entryBarrier', 'createdAt'];
    const csv = convertToCSV(flatData, headers);
    downloadFile(csv, `opportunities-${Date.now()}.csv`, 'text/csv');
  } else {
    const json = JSON.stringify(flatData, null, 2);
    downloadFile(json, `opportunities-${Date.now()}.json`, 'application/json');
  }
}

export function exportSegments(segments: any[], format: 'csv' | 'json') {
  const flatData = segments.map(seg => ({
    id: seg.id,
    name: seg.name,
    characteristics: seg.characteristics,
    size: seg.size || '',
    growth: seg.growth || '',
    opportunitiesCount: seg.opportunities?.length || 0,
    createdAt: new Date(seg.createdAt).toISOString(),
  }));
  
  if (format === 'csv') {
    const headers = ['id', 'name', 'characteristics', 'size', 'growth', 'opportunitiesCount', 'createdAt'];
    const csv = convertToCSV(flatData, headers);
    downloadFile(csv, `segments-${Date.now()}.csv`, 'text/csv');
  } else {
    const json = JSON.stringify(flatData, null, 2);
    downloadFile(json, `segments-${Date.now()}.json`, 'application/json');
  }
}

export function exportCompetitors(competitors: any[], format: 'csv' | 'json') {
  const flatData = competitors.map(comp => ({
    id: comp.id,
    name: comp.name,
    strengths: comp.strengths,
    weaknesses: comp.weaknesses,
    marketShare: comp.marketShare || '',
    positioning: comp.positioning || '',
    createdAt: new Date(comp.createdAt).toISOString(),
  }));
  
  if (format === 'csv') {
    const headers = ['id', 'name', 'strengths', 'weaknesses', 'marketShare', 'positioning', 'createdAt'];
    const csv = convertToCSV(flatData, headers);
    downloadFile(csv, `competitors-${Date.now()}.csv`, 'text/csv');
  } else {
    const json = JSON.stringify(flatData, null, 2);
    downloadFile(json, `competitors-${Date.now()}.json`, 'application/json');
  }
}

export function exportMarket(market: any, format: 'csv' | 'json') {
  if (format === 'json') {
    const json = JSON.stringify(market, null, 2);
    downloadFile(json, `market-${market.name.replace(/\s+/g, '-')}-${Date.now()}.json`, 'application/json');
  } else {
    // For CSV, export a summary
    const summary = {
      id: market.id,
      name: market.name,
      description: market.description,
      sector: market.sector,
      segmentsCount: market.segments?.length || 0,
      competitorsCount: market.competitors?.length || 0,
      trendsCount: market.trends?.length || 0,
      createdAt: new Date(market.createdAt).toISOString(),
    };
    const csv = convertToCSV([summary], Object.keys(summary));
    downloadFile(csv, `market-${market.name.replace(/\s+/g, '-')}-${Date.now()}.csv`, 'text/csv');
  }
}
