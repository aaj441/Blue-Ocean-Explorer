import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  sanitizeSql,
  sanitizeFileName,
  sanitizeUrl,
  sanitizeEmail,
  removeNullBytes,
  sanitizeObject,
  sanitizeInt,
  sanitizeFloat,
  truncateString,
} from "../../../src/server/utils/sanitize";

describe("sanitizeHtml", () => {
  it("should escape HTML special characters", () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    expect(output).toBe(
      "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;",
    );
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should handle non-string input", () => {
    expect(sanitizeHtml(null as any)).toBe("");
    expect(sanitizeHtml(undefined as any)).toBe("");
  });
});

describe("sanitizeSql", () => {
  it("should escape single quotes", () => {
    const input = "O'Reilly";
    const output = sanitizeSql(input);
    expect(output).toBe("O''Reilly");
  });

  it("should remove SQL comment markers", () => {
    const input = "test -- comment";
    const output = sanitizeSql(input);
    expect(output).not.toContain("--");
  });

  it("should remove semicolons", () => {
    const input = "DROP TABLE users;";
    const output = sanitizeSql(input);
    expect(output).not.toContain(";");
  });
});

describe("sanitizeFileName", () => {
  it("should remove directory traversal sequences", () => {
    const input = "../../etc/passwd";
    const output = sanitizeFileName(input);
    expect(output).not.toContain("..");
  });

  it("should remove slashes", () => {
    const input = "path/to/file.txt";
    const output = sanitizeFileName(input);
    expect(output).not.toContain("/");
  });

  it("should replace special characters with underscores", () => {
    const input = "file name!@#.txt";
    const output = sanitizeFileName(input);
    expect(output).toBe("file_name___.txt");
  });

  it("should truncate to 255 characters", () => {
    const input = "a".repeat(300);
    const output = sanitizeFileName(input);
    expect(output.length).toBe(255);
  });
});

describe("sanitizeUrl", () => {
  it("should allow relative URLs", () => {
    const input = "/dashboard";
    const output = sanitizeUrl(input);
    expect(output).toBe("/dashboard");
  });

  it("should block external URLs", () => {
    const input = "http://evil.com";
    const output = sanitizeUrl(input);
    expect(output).toBe("/");
  });

  it("should allow localhost URLs", () => {
    const input = "http://localhost:3000";
    const output = sanitizeUrl(input);
    expect(output).toBe(input);
  });

  it("should handle invalid URLs", () => {
    const input = "not a url";
    const output = sanitizeUrl(input);
    expect(output).toBe("/");
  });
});

describe("sanitizeEmail", () => {
  it("should convert to lowercase", () => {
    const input = "Test@Example.COM";
    const output = sanitizeEmail(input);
    expect(output).toBe("test@example.com");
  });

  it("should trim whitespace", () => {
    const input = "  test@example.com  ";
    const output = sanitizeEmail(input);
    expect(output).toBe("test@example.com");
  });
});

describe("removeNullBytes", () => {
  it("should remove null bytes", () => {
    const input = "test\0null\0bytes";
    const output = removeNullBytes(input);
    expect(output).toBe("testnullbytes");
  });

  it("should handle string without null bytes", () => {
    const input = "normal string";
    const output = removeNullBytes(input);
    expect(output).toBe(input);
  });
});

describe("sanitizeObject", () => {
  it("should sanitize string values", () => {
    const input = {
      name: "test\0",
      description: '<script>alert("XSS")</script>',
    };
    const output = sanitizeObject(input, { html: true });
    expect(output.name).not.toContain("\0");
    expect(output.description).toContain("&lt;script&gt;");
  });

  it("should handle nested objects", () => {
    const input = {
      user: {
        name: "test\0",
      },
    };
    const output = sanitizeObject(input);
    expect(output.user.name).toBe("test");
  });

  it("should preserve non-string values", () => {
    const input = {
      name: "test",
      age: 30,
      active: true,
    };
    const output = sanitizeObject(input);
    expect(output.age).toBe(30);
    expect(output.active).toBe(true);
  });
});

describe("sanitizeInt", () => {
  it("should parse valid integers", () => {
    expect(sanitizeInt("42")).toBe(42);
    expect(sanitizeInt(42)).toBe(42);
  });

  it("should return default for invalid input", () => {
    expect(sanitizeInt("not a number", { default: 0 })).toBe(0);
    expect(sanitizeInt("not a number", { default: 10 })).toBe(10);
  });

  it("should enforce minimum value", () => {
    expect(sanitizeInt(-5, { min: 0 })).toBe(0);
  });

  it("should enforce maximum value", () => {
    expect(sanitizeInt(150, { max: 100 })).toBe(100);
  });
});

describe("sanitizeFloat", () => {
  it("should parse valid floats", () => {
    expect(sanitizeFloat("3.14")).toBe(3.14);
    expect(sanitizeFloat(3.14)).toBe(3.14);
  });

  it("should return default for invalid input", () => {
    expect(sanitizeFloat("not a number", { default: 0 })).toBe(0);
  });

  it("should enforce minimum value", () => {
    expect(sanitizeFloat(-5.5, { min: 0 })).toBe(0);
  });

  it("should enforce maximum value", () => {
    expect(sanitizeFloat(150.5, { max: 100 })).toBe(100);
  });
});

describe("truncateString", () => {
  it("should truncate long strings", () => {
    const input = "a".repeat(2000);
    const output = truncateString(input, 1000);
    expect(output.length).toBe(1000);
  });

  it("should not truncate short strings", () => {
    const input = "short string";
    const output = truncateString(input, 1000);
    expect(output).toBe(input);
  });

  it("should handle non-string input", () => {
    expect(truncateString(null as any)).toBe("");
  });
});
