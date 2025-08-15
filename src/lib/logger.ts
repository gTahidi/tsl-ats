export interface LogAttributes {
  [key: string]: any;
}

enum LogLevel {
  TRACE = 1,
  DEBUG = 5,
  INFO = 9,
  WARN = 13,
  ERROR = 17,
}

const LogLevelName: { [key in LogLevel]: string } = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

export class Logger {
  private serviceName: string;
  private baseAttributes: LogAttributes;

  constructor(serviceName: string = 'tsl-ats-backend', baseAttributes: LogAttributes = {}) {
    this.serviceName = serviceName;
    this.baseAttributes = baseAttributes;
  }

  private createLogEntry(level: LogLevel, message: string, attributes?: LogAttributes, error?: Error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevelName[level],
      severity: level,
      service: this.serviceName,
      message,
      ...this.baseAttributes,
      ...attributes,
    };

    if (error) {
      (logEntry as any).error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    return logEntry;
  }

  private log(level: LogLevel, message: string, attributes?: LogAttributes, error?: Error) {
    const logEntry = this.createLogEntry(level, message, attributes, error);
    const output = JSON.stringify(logEntry, null, 2);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        if (process.env.NODE_ENV === 'development') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, attributes?: LogAttributes) {
    this.log(LogLevel.INFO, message, attributes);
  }

  error(message: string, error?: Error, attributes?: LogAttributes) {
    this.log(LogLevel.ERROR, message, attributes, error);
  }

  warn(message: string, attributes?: LogAttributes) {
    this.log(LogLevel.WARN, message, attributes);
  }

  debug(message: string, attributes?: LogAttributes) {
    this.log(LogLevel.DEBUG, message, attributes);
  }

  trace(message: string, attributes?: LogAttributes) {
    this.log(LogLevel.TRACE, message, attributes);
  }

  child(additionalAttributes: LogAttributes): Logger {
    const newBaseAttributes = {
      ...this.baseAttributes,
      ...additionalAttributes,
    };
    return new Logger(this.serviceName, newBaseAttributes);
  }
}

export const appLogger = new Logger();

export const logInfo = (message: string, attributes?: LogAttributes) => appLogger.info(message, attributes);
export const logError = (message: string, error?: Error, attributes?: LogAttributes) => appLogger.error(message, error, attributes);
export const logWarn = (message: string, attributes?: LogAttributes) => appLogger.warn(message, attributes);
export const logDebug = (message: string, attributes?: LogAttributes) => appLogger.debug(message, attributes);
export const logTrace = (message: string, attributes?: LogAttributes) => appLogger.trace(message, attributes);

export function createRequestLogger(request: Request, additionalAttributes?: LogAttributes) {
  const url = new URL(request.url);
  
  return appLogger.child({
    'http.method': request.method,
    'http.url': request.url,
    'http.route': url.pathname,
    'http.user_agent': request.headers.get('user-agent') || 'unknown',
    'http.remote_addr': request.headers.get('x-forwarded-for') || 'unknown',
    ...additionalAttributes,
  });
}

export function createDatabaseLogger(operation: string, table?: string, additionalAttributes?: LogAttributes) {
  return appLogger.child({
    'db.operation': operation,
    'db.table': table,
    'db.system': 'postgresql',
    ...additionalAttributes,
  });
}

export function createExternalAPILogger(service: string, endpoint: string, additionalAttributes?: LogAttributes) {
  return appLogger.child({
    'external.service': service,
    'external.endpoint': endpoint,
    ...additionalAttributes,
  });
}