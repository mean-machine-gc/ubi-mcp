// scripts/export-schemas.ts
import { TypeCompiler } from '@sinclair/typebox/compiler';
import * as fs from 'fs';
import { AssertionsSchema } from './assertions-schema';
import { DeciderSchema } from './decider-schema';
import { LifecycleSchema } from './lifecycle-schema';
// Export JSON schemas for VSCode
const lifecycleJsonSchema = TypeCompiler.Code(LifecycleSchema);
const assertionsJsonSchema = TypeCompiler.Code(AssertionsSchema);
const deciderJsonSchema = TypeCompiler.Code(DeciderSchema);
fs.writeFileSync('./schemas/lifecycle-schema.json', JSON.stringify(lifecycleJsonSchema, null, 2));
fs.writeFileSync('./schemas/assertions-schema.json', JSON.stringify(assertionsJsonSchema, null, 2));
fs.writeFileSync('./schemas/decider-schema.json', JSON.stringify(deciderJsonSchema, null, 2));
console.log('✅ JSON schemas exported for VSCode integration');
