import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSoftwareRendererName } from '../../lib/capabilities.ts';

test('reconoce renderers por software', () => {
  for (const name of [
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)',
    'google swiftshader',
  ]) assert.ok(isSoftwareRendererName(name), name);
});
test('no confunde GPUs reales', () => {
  for (const name of [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple M2',
    'Adreno (TM) 650',
    'Mali-G78',
    'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ]) assert.ok(!isSoftwareRendererName(name), name);
});
