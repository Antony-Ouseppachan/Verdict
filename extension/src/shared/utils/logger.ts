type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  }

  public setDevelopment(isDev: boolean): void {
    this.isDevelopment = isDev;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[Verdict][${timestamp}][${level.toUpperCase()}] ${message}`;
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      if (context) {
        console.debug(this.formatMessage('debug', message), context);
      } else {
        console.debug(this.formatMessage('debug', message));
      }
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      if (context) {
        console.info(this.formatMessage('info', message), context);
      } else {
        console.info(this.formatMessage('info', message));
      }
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      console.warn(this.formatMessage('warn', message), context);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  public error(message: string, error?: unknown): void {
    if (error) {
      console.error(this.formatMessage('error', message), error);
    } else {
      console.error(this.formatMessage('error', message));
    }
  }
}

export const logger = new Logger();
