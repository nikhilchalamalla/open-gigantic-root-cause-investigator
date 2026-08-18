import { describe, it, expect } from "vitest";
import { parseErrorLog } from "../src/server/parser/parseErrorLog";

describe("Stack Trace Parser", () => {
  it("should handle empty or null inputs gracefully", () => {
    const result = parseErrorLog("");
    expect(result.language).toBe("Unknown");
    expect(result.exceptionType).toBe("UnknownException");
    expect(result.errorMessage).toContain("No error log");
    expect(result.topFrames).toEqual([]);
  });

  it("should parse Java Spring stack traces correctly", () => {
    const javaLog = `java.lang.NullPointerException: Cannot invoke "com.example.service.UserService.getUserById(Long)" because "this.userService" is null
\tat com.example.controller.UserController.getUser(UserController.java:24)
\tat org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:255)`;

    const result = parseErrorLog(javaLog);
    expect(result.language).toBe("Java");
    expect(result.exceptionType).toBe("NullPointerException");
    expect(result.errorMessage).toBe('Cannot invoke "com.example.service.UserService.getUserById(Long)" because "this.userService" is null');
    expect(result.topFrames).toContain("com.example.controller.UserController.getUser (UserController.java:24)");
  });

  it("should parse Next.js React hydration mismatches correctly", () => {
    const hydrationLog = `Error: Hydration failed because the initial UI does not match what was rendered on the server.
Warning: Text content did not match. Server: "Login" Client: "Welcome, User!"
\tat div
\tat main
\tat Page (src/app/page.tsx:12:10)`;

    const result = parseErrorLog(hydrationLog);
    expect(result.language).toBe("TypeScript/JavaScript");
    expect(result.exceptionType).toBe("Error");
    expect(result.errorMessage).toContain("Hydration failed");
    expect(result.topFrames).toContain("Page (page.tsx:12)");
  });

  it("should parse Python SQLAlchemy / connection traces correctly", () => {
    const pythonLog = `Traceback (most recent call last):
  File "app.py", line 14, in main
    engine.connect()
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection failed: Connection refused`;

    const result = parseErrorLog(pythonLog);
    expect(result.language).toBe("Python");
    expect(result.exceptionType).toBe("OperationalError");
    expect(result.errorMessage).toContain("connection failed: Connection refused");
    expect(result.topFrames).toContain("app.py:14 in main");
  });

  it("should parse SQL Connection errors correctly", () => {
    const sqlLog = `FATAL: remaining connection slots are reserved for non-replication superuser connections
\tat pool.js:23:17`;

    const result = parseErrorLog(sqlLog);
    expect(result.language).toBe("SQL/Database");
    expect(result.exceptionType).toBe("FatalDatabaseError");
    expect(result.errorMessage).toContain("remaining connection slots");
  });
});
