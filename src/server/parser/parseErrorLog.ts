export interface ParsedError {
  language: string;
  exceptionType: string;
  errorMessage: string;
  topFrames: string[];
}

export function parseErrorLog(rawLog: string): ParsedError {
  if (!rawLog || typeof rawLog !== "string") {
    return {
      language: "Unknown",
      exceptionType: "UnknownException",
      errorMessage: "No error log content provided.",
      topFrames: [],
    };
  }

  const lines = rawLog.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      language: "Unknown",
      exceptionType: "UnknownException",
      errorMessage: "Empty error log content.",
      topFrames: [],
    };
  }

  // 1. Language Detection & Parsing
  // Check SQL first since database logs running on JS runtimes contain "at pool.js" frames
  const isSQL = 
    /FATAL:|ERROR:|ConnectionError|pg-pool|database connection|SQLSTATE|syntax error at or near/.test(rawLog);

  if (isSQL) {
    return parseSQL(lines);
  }

  // A. Java Stack Trace Detection
  const isJava = 
    rawLog.includes("Exception in thread") || 
    /at\s+[a-zA-Z0-9_$.]+\.[a-zA-Z0-9_$]+\([a-zA-Z0-9_$]+\.java:\d+\)/.test(rawLog) ||
    /Exception:\s+/.test(rawLog) ||
    /NullPointerException|IllegalArgumentException|ClassNotFoundException|SQLException|RuntimeException/.test(rawLog);

  if (isJava) {
    return parseJava(lines);
  }

  // B. Python Stack Trace Detection
  const isPython = 
    rawLog.includes("Traceback (most recent call last)") || 
    /File\s+"[^"]+",\s+line\s+\d+/.test(rawLog) ||
    /OperationalError|KeyError|IndexError|TypeError|ValueError|NameError|AttributeError:\s+/.test(rawLog);

  if (isPython) {
    return parsePython(lines);
  }

  // C. JavaScript/TypeScript Stack Trace Detection
  const isJS = 
    /at\s+.*\(?.*:\d+:\d+\)?/.test(rawLog) || 
    /Error:\s+/.test(rawLog) ||
    /TypeError|ReferenceError|SyntaxError|RangeError|URIError/.test(rawLog);

  if (isJS) {
    return parseJavaScript(lines);
  }

  // E. Fallback generic parsing
  return parseGeneric(lines);
}

function parseJava(lines: string[]): ParsedError {
  let exceptionType = "JavaException";
  let errorMessage = "";
  const topFrames: string[] = [];

  const firstLine = lines[0];
  const javaExceptionRegex = /(?:Exception in thread "[^"]+"\s+)?([a-zA-Z0-9._$]*Exception|NullPointerException|Error)(?::\s+(.*))?/;
  const match = firstLine.match(javaExceptionRegex);

  if (match) {
    exceptionType = match[1].split(".").pop() || match[1];
    errorMessage = match[2] ? match[2].trim() : "Null Pointer or Runtime error occurred.";
  } else {
    for (const line of lines) {
      if (line.includes("Exception") || line.includes("Error")) {
        const parts = line.split(":");
        exceptionType = parts[0].trim().split(".").pop() || parts[0].trim();
        errorMessage = parts.slice(1).join(":").trim();
        break;
      }
    }
  }

  for (const line of lines) {
    if (line.startsWith("at ")) {
      const frameMatch = line.match(/at\s+([a-zA-Z0-9_$.]+\.[a-zA-Z0-9_$]+)\((.*?)\)/);
      if (frameMatch) {
        topFrames.push(`${frameMatch[1]} (${frameMatch[2]})`);
      } else {
        topFrames.push(line.replace("at ", ""));
      }
      if (topFrames.length >= 5) break;
    }
  }

  return {
    language: "Java",
    exceptionType,
    errorMessage: errorMessage || "Java Runtime Exception",
    topFrames,
  };
}

function parsePython(lines: string[]): ParsedError {
  let exceptionType = "PythonError";
  let errorMessage = "An error occurred during script execution.";
  const topFrames: string[] = [];

  let exceptionLine = "";
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/[a-zA-Z0-9._]+Error:\s+/.test(line) || /[a-zA-Z0-9._]+Exception:\s+/.test(line)) {
      exceptionLine = line;
      break;
    }
  }

  if (!exceptionLine && lines.length > 0) {
    exceptionLine = lines[lines.length - 1];
  }

  if (exceptionLine) {
    const parts = exceptionLine.split(":");
    const fullException = parts[0].trim();
    // Get clean class name (e.g. "OperationalError" instead of "sqlalchemy.exc.OperationalError")
    exceptionType = fullException.split(".").pop() || fullException;
    errorMessage = parts.slice(1).join(":").trim();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("File ") && line.includes(", line ")) {
      const match = line.match(/File\s+"([^"]+)",\s+line\s+(\d+)(?:,\s+in\s+(.+))?/);
      if (match) {
        const file = match[1].split(/[\/\\]/).pop() || match[1];
        const lineNum = match[2];
        const func = match[3] ? ` in ${match[3]}` : "";
        topFrames.push(`${file}:${lineNum}${func}`);
      } else {
        topFrames.push(line);
      }
    }
  }

  topFrames.reverse();

  return {
    language: "Python",
    exceptionType,
    errorMessage,
    topFrames: topFrames.slice(0, 5),
  };
}

function parseJavaScript(lines: string[]): ParsedError {
  let exceptionType = "JavaScriptError";
  let errorMessage = "";
  const topFrames: string[] = [];

  const firstLine = lines[0];
  const jsErrorRegex = /^([a-zA-Z0-9._]+Error|Error)(?::\s+(.*))?/;
  const match = firstLine.match(jsErrorRegex);

  if (match) {
    exceptionType = match[1];
    errorMessage = match[2] ? match[2].trim() : "JavaScript execution failed.";
  } else {
    errorMessage = firstLine;
  }

  for (const line of lines) {
    if (line.includes("at ")) {
      const frameMatch = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/) || line.match(/at\s+(.*?):(\d+):(\d+)/);
      if (frameMatch) {
        if (frameMatch.length === 5) {
          const method = frameMatch[1];
          const file = frameMatch[2].split(/[\/\\]/).pop() || frameMatch[2];
          const lineNum = frameMatch[3];
          topFrames.push(`${method} (${file}:${lineNum})`);
        } else {
          const file = frameMatch[1].split(/[\/\\]/).pop() || frameMatch[1];
          const lineNum = frameMatch[2];
          topFrames.push(`${file}:${lineNum}`);
        }
      } else {
        topFrames.push(line.replace("at ", ""));
      }
      if (topFrames.length >= 5) break;
    }
  }

  return {
    language: "TypeScript/JavaScript",
    exceptionType,
    errorMessage: errorMessage || "JavaScript Runtime Error",
    topFrames,
  };
}

function parseSQL(lines: string[]): ParsedError {
  let exceptionType = "DatabaseError";
  let errorMessage = lines[0];
  const topFrames: string[] = [];

  for (const line of lines) {
    if (line.startsWith("FATAL:") || line.startsWith("ERROR:")) {
      exceptionType = line.startsWith("FATAL:") ? "FatalDatabaseError" : "QuerySyntaxError";
      errorMessage = line.replace(/FATAL:|ERROR:/, "").trim();
      break;
    } else if (line.includes("ConnectionError") || line.includes("timeout")) {
      exceptionType = "DatabaseConnectionTimeout";
      errorMessage = line.trim();
      break;
    }
  }

  for (const line of lines) {
    if (line.includes("at ")) {
      const match = line.match(/at\s+(.*?)\s+\((.*?)\)/) || line.match(/at\s+(.*)/);
      if (match) {
        topFrames.push(match[1].split(/[\/\\]/).pop() || match[1]);
      }
      if (topFrames.length >= 3) break;
    }
  }

  return {
    language: "SQL/Database",
    exceptionType,
    errorMessage,
    topFrames,
  };
}

function parseGeneric(lines: string[]): ParsedError {
  let exceptionType = "RuntimeError";
  let errorMessage = lines[0];
  const topFrames: string[] = [];

  const errorWords = lines[0].match(/([a-zA-Z0-9_]+Error|[a-zA-Z0-9_]+Exception)/);
  if (errorWords) {
    exceptionType = errorWords[1];
  }

  for (const line of lines) {
    if (line.includes("at ") || line.includes("file ") || line.includes(".js") || line.includes(".py") || line.includes(".java")) {
      topFrames.push(line.trim().replace(/^at\s+/, ""));
      if (topFrames.length >= 5) break;
    }
  }

  return {
    language: "Unknown",
    exceptionType,
    errorMessage,
    topFrames,
  };
}
