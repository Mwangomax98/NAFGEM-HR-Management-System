/**
 * File Upload Security Validation
 * Prevents malicious file uploads and enforces size/type restrictions
 */

import { logFileUpload } from './auditLogger';

export interface FileValidationConfig {
  maxSizeBytes?: number;
  allowedTypes?: readonly string[] | string[];
  allowedExtensions?: readonly string[] | string[];
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

// Default configuration
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'text/plain',
];

const DEFAULT_ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
];

/**
 * Validate a single file against security rules
 */
export const validateFile = (
  file: File,
  config: FileValidationConfig = {}
): FileValidationResult => {
  const errors: string[] = [];
  const maxSize = config.maxSizeBytes || DEFAULT_MAX_SIZE;
  const allowedTypes = config.allowedTypes || DEFAULT_ALLOWED_TYPES;
  const allowedExtensions = config.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    errors.push(`File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File "${file.name}" has invalid type: ${file.type}`);
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File "${file.name}" has invalid extension: ${extension}`);
  }

  // Check for suspicious file names
  if (isSuspiciousFileName(file.name)) {
    errors.push(`File "${file.name}" has a suspicious name`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: File[],
  config: FileValidationConfig = {}
): FileValidationResult => {
  const allErrors: string[] = [];

  files.forEach((file) => {
    const result = validateFile(file, config);
    allErrors.push(...result.errors);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Check if filename contains suspicious patterns
 */
const isSuspiciousFileName = (fileName: string): boolean => {
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.zip$/i,
    /\.rar$/i,
    /\.7z$/i,
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(fileName));
};

/**
 * Sanitize filename for safe storage
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  const maxLength = 100;
  if (sanitized.length > maxLength) {
    const extension = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(0, maxLength - (extension?.length || 0) - 1);
    sanitized = `${nameWithoutExt}.${extension}`;
  }
  
  return sanitized;
};

/**
 * Validate and log file upload
 */
export const validateAndLogFileUpload = async (
  file: File,
  bucket: string,
  config: FileValidationConfig = {}
): Promise<FileValidationResult> => {
  const result = validateFile(file, config);
  
  if (result.isValid) {
    // Log successful validation
    await logFileUpload(file.name, file.size, bucket);
  }
  
  return result;
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Predefined validation configs for different upload contexts
 */
export const FILE_VALIDATION_CONFIGS = {
  DOCUMENTS: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
  },
  IMAGES: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  },
  TIMESHEET_ATTACHMENTS: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  },
  EXIT_ATTACHMENTS: {
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  },
} as const;
