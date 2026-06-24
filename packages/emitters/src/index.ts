// packages/emitters — public API
export { emitTerraform } from './terraform.js';
export { emitCloudFormation } from './cloudformation.js';
export { emitBicep } from './bicep.js';

import { emitTerraform } from './terraform.js';
import { emitCloudFormation } from './cloudformation.js';
import { emitBicep } from './bicep.js';
import type { TBCanvas, OutputFormat } from '@terrabuilder/engine';

export function emit(canvas: TBCanvas, format: OutputFormat): string {
  switch (format) {
    case 'terraform': return emitTerraform(canvas);
    case 'cloudformation': return emitCloudFormation(canvas);
    case 'bicep': return emitBicep(canvas);
    default: return emitTerraform(canvas);
  }
}

export function getFileExtension(format: OutputFormat): string {
  switch (format) {
    case 'terraform': return '.tf';
    case 'cloudformation': return '.yaml';
    case 'bicep': return '.bicep';
    default: return '.tf';
  }
}

export function getLanguageId(format: OutputFormat): string {
  switch (format) {
    case 'terraform': return 'hcl';
    case 'cloudformation': return 'yaml';
    case 'bicep': return 'bicep';
    default: return 'hcl';
  }
}
