import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
  } from 'class-validator';
import { Column } from 'typeorm';
  
  export enum DocumentType {
    FORM_SF_02 = 'Form SF-02 - Production Facility Registration',
    SF_02C = "SF-02C Owner's Declaration or Proof of Ownership",
    METERING_EVIDENCE = 'Metering Evidence',
    SINGLE_LINE_DIAGRAM = 'Single Line Diagram',
    PROJECT_PHOTOS = 'Project Photos',
  }
  
  export class UploadDeviceDocumentDto {
    @IsNumber()
    @Column({name: 'target_type'})
    TargetType: number;
  
    @IsEnum(DocumentType)
    type: DocumentType;
  
    @IsString()
    extension: string;
  
    @IsString()
    url: string;
  }
  