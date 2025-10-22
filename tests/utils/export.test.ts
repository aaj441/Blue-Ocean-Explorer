import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  convertToCSV,
  downloadFile,
  exportOpportunities,
  exportSegments,
  exportCompetitors,
  exportMarket,
} from "../../src/utils/export";

describe("convertToCSV", () => {
  it("should convert simple data to CSV format", () => {
    const data = [
      { name: "John", age: 30 },
      { name: "Jane", age: 25 },
    ];
    const headers = ["name", "age"];
    const result = convertToCSV(data, headers);

    expect(result).toBe("name,age\nJohn,30\nJane,25");
  });

  it("should handle data with commas by wrapping in quotes", () => {
    const data = [{ name: "Doe, John", city: "New York" }];
    const headers = ["name", "city"];
    const result = convertToCSV(data, headers);

    expect(result).toBe('name,city\n"Doe, John",New York');
  });

  it("should escape quotes in data", () => {
    const data = [{ quote: 'He said "Hello"' }];
    const headers = ["quote"];
    const result = convertToCSV(data, headers);

    expect(result).toBe('quote\n"He said ""Hello"""');
  });

  it("should handle null and undefined values", () => {
    const data = [{ name: "John", value: null, other: undefined }];
    const headers = ["name", "value", "other"];
    const result = convertToCSV(data, headers);

    expect(result).toBe("name,value,other\nJohn,,");
  });

  it("should handle object values by stringifying", () => {
    const data = [{ name: "John", meta: { age: 30 } }];
    const headers = ["name", "meta"];
    const result = convertToCSV(data, headers);

    expect(result).toBe('name,meta\nJohn,"{\\"age\\":30}"');
  });

  it("should handle empty data array", () => {
    const data: any[] = [];
    const headers = ["name", "age"];
    const result = convertToCSV(data, headers);

    expect(result).toBe("name,age");
  });
});

describe("downloadFile", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink as any);
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");
    vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => null as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create and download a file", () => {
    const content = "test content";
    const filename = "test.txt";
    const mimeType = "text/plain";

    downloadFile(content, filename, mimeType);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it("should create blob with correct content and type", () => {
    const content = "test,data\n1,2";
    const filename = "data.csv";
    const mimeType = "text/csv";

    downloadFile(content, filename, mimeType);

    const blobCall = createObjectURLSpy.mock.calls[0]?.[0] as Blob;
    expect(blobCall).toBeInstanceOf(Blob);
    expect(blobCall.type).toBe(mimeType);
  });
});

describe("exportOpportunities", () => {
  let downloadFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const { downloadFile: originalDownloadFile } = await import(
      "../../src/utils/export"
    );
    downloadFileSpy = vi
      .spyOn(await import("../../src/utils/export"), "downloadFile")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockOpportunities = [
    {
      id: 1,
      title: "Opportunity 1",
      description: "Description 1",
      segment: {
        name: "Segment 1",
        market: { name: "Market 1" },
      },
      status: "active",
      score: 85,
      risk: "low",
      roi: "high",
      revenue: "1M",
      strategicFit: "excellent",
      entryBarrier: "medium",
      createdAt: new Date("2024-01-01"),
    },
  ];

  it("should export opportunities as CSV", () => {
    exportOpportunities(mockOpportunities, "csv");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/opportunities-\d+\.csv/);
    expect(call?.[2]).toBe("text/csv");
    expect(call?.[0]).toContain("Opportunity 1");
    expect(call?.[0]).toContain("Segment 1");
  });

  it("should export opportunities as JSON", () => {
    exportOpportunities(mockOpportunities, "json");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/opportunities-\d+\.json/);
    expect(call?.[2]).toBe("application/json");
    const jsonData = JSON.parse(call?.[0] as string);
    expect(jsonData).toHaveLength(1);
    expect(jsonData[0]?.title).toBe("Opportunity 1");
  });

  it("should handle opportunities without segment or market", () => {
    const opportunitiesWithoutSegment = [
      {
        id: 2,
        title: "Opportunity 2",
        description: "Description 2",
        segment: null,
        status: "pending",
        score: 70,
        risk: "medium",
        createdAt: new Date("2024-01-02"),
      },
    ];

    exportOpportunities(opportunitiesWithoutSegment as any, "csv");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[0]).toContain("Opportunity 2");
  });
});

describe("exportSegments", () => {
  let downloadFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    downloadFileSpy = vi
      .spyOn(await import("../../src/utils/export"), "downloadFile")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSegments = [
    {
      id: 1,
      name: "Segment 1",
      characteristics: "Characteristics 1",
      size: "large",
      growth: "high",
      opportunities: [{}, {}],
      createdAt: new Date("2024-01-01"),
    },
  ];

  it("should export segments as CSV", () => {
    exportSegments(mockSegments, "csv");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/segments-\d+\.csv/);
    expect(call?.[2]).toBe("text/csv");
  });

  it("should export segments as JSON", () => {
    exportSegments(mockSegments, "json");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    const jsonData = JSON.parse(call?.[0] as string);
    expect(jsonData[0]?.opportunitiesCount).toBe(2);
  });
});

describe("exportCompetitors", () => {
  let downloadFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    downloadFileSpy = vi
      .spyOn(await import("../../src/utils/export"), "downloadFile")
      .mockImplementation(() => {});
  });

  const mockCompetitors = [
    {
      id: 1,
      name: "Competitor 1",
      strengths: "Strong brand",
      weaknesses: "High prices",
      marketShare: "25%",
      positioning: "Premium",
      createdAt: new Date("2024-01-01"),
    },
  ];

  it("should export competitors as CSV", () => {
    exportCompetitors(mockCompetitors, "csv");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/competitors-\d+\.csv/);
  });

  it("should export competitors as JSON", () => {
    exportCompetitors(mockCompetitors, "json");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    const jsonData = JSON.parse(call?.[0] as string);
    expect(jsonData[0]?.name).toBe("Competitor 1");
  });
});

describe("exportMarket", () => {
  let downloadFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    downloadFileSpy = vi
      .spyOn(await import("../../src/utils/export"), "downloadFile")
      .mockImplementation(() => {});
  });

  const mockMarket = {
    id: 1,
    name: "Test Market",
    description: "Market description",
    sector: "Technology",
    segments: [{}, {}],
    competitors: [{}],
    trends: [{}, {}, {}],
    createdAt: new Date("2024-01-01"),
  };

  it("should export market as JSON", () => {
    exportMarket(mockMarket, "json");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/market-Test-Market-\d+\.json/);
    const jsonData = JSON.parse(call?.[0] as string);
    expect(jsonData.name).toBe("Test Market");
  });

  it("should export market summary as CSV", () => {
    exportMarket(mockMarket, "csv");

    expect(downloadFileSpy).toHaveBeenCalled();
    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toMatch(/market-Test-Market-\d+\.csv/);
    expect(call?.[0]).toContain("Test Market");
    expect(call?.[0]).toContain("Technology");
  });

  it("should replace spaces in filename", () => {
    exportMarket(mockMarket, "json");

    const call = downloadFileSpy.mock.calls[0];
    expect(call?.[1]).toContain("Test-Market");
  });
});
