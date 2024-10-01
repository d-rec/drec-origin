import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { DrecModule } from './drec.module';
import * as PortUtils from './port';
import { startAPI } from './index'; // Adjust the import path as needed
import { SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';

jest.mock('@nestjs/core');
jest.mock('fs');
jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn(),
  })),
  ApiProperty: jest.fn(),
  ApiPropertyOptional: jest.fn(),
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
}));

jest.mock('class-validator', () => ({
  IsISO31661Alpha2: jest.fn(() => (target: any, propertyKey: string) => {}),
  IsString: jest.fn(() => (target: any, propertyKey: string) => {}),
  IsEmail: jest.fn(() => (target: any, propertyKey: string) => {}),
  IsOptional: jest.fn(() => (target: any, propertyKey: string) => {}),
  IsArray: jest.fn(() => (target: any, propertyKey: string) => {}),
  IsNotEmpty: jest.fn(() => (target: any, propertyKey: string) => {}),
}));

describe('startAPI', () => {
  let app: INestApplication;
  let logger: LoggerService;

  beforeEach(async () => {
    app = {
      useGlobalPipes: jest.fn(),
      enableShutdownHooks: jest.fn(),
      enableCors: jest.fn(),
      setGlobalPrefix: jest.fn(),
      select: jest.fn().mockReturnValue({}),
      useLogger: jest.fn(),
      listen: jest.fn().mockResolvedValue(null),
    } as unknown as INestApplication;

    (NestFactory.create as jest.Mock).mockResolvedValue(app);

    logger = {
      log: jest.fn(),
    } as unknown as LoggerService;

    jest.spyOn(PortUtils, 'getPort').mockReturnValue(3000);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        version: '1.0.0',
      }),
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize the Nest application', async () => {
    await startAPI();

    expect(NestFactory.create).toHaveBeenCalledWith(DrecModule);
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(app.enableShutdownHooks).toHaveBeenCalled();
    expect(app.enableCors).toHaveBeenCalled();
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(app.listen).toHaveBeenCalledWith(3000);
  });

  it('should log the correct startup information if logger is provided', async () => {
    await startAPI(logger);

    expect(logger.log).toHaveBeenCalledWith('Backend starting on port: 3000');
    expect(logger.log).toHaveBeenCalledWith(
      'Backend versions: {"@energyweb/origin-drec-api":"1.0.0"}',
    );
  });

  it('should not log startup information if logger is not provided', async () => {
    await startAPI();

    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should configure Swagger correctly', async () => {
    await startAPI();

    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(
      app,
      expect.any(Object),
    );
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'swagger',
      app,
      expect.any(Object),
    );
  });

  it('should return the application instance', async () => {
    const result = await startAPI();

    expect(result).toBe(app);
  });

  it('should handle the case when package.json does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await startAPI(logger);

    expect(logger.log).toHaveBeenCalledWith('Backend versions: "unknown"');
  });
});
