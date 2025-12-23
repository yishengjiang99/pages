import { describe, it, expect } from 'vitest';
import { tools, systemPrompt } from '../tools.js';

describe('Tools Module', () => {
  it('exports systemPrompt', () => {
    expect(systemPrompt).toBeDefined();
    expect(typeof systemPrompt).toBe('string');
    expect(systemPrompt.length).toBeGreaterThan(0);
  });

  it('exports tools array', () => {
    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('has resize_video tool', () => {
    const resizeTool = tools.find(t => t.function.name === 'resize_video');
    expect(resizeTool).toBeDefined();
    expect(resizeTool.function.parameters.required).toContain('width');
    expect(resizeTool.function.parameters.required).toContain('height');
  });

  it('has crop_video tool', () => {
    const cropTool = tools.find(t => t.function.name === 'crop_video');
    expect(cropTool).toBeDefined();
    expect(cropTool.function.parameters.required).toContain('x');
    expect(cropTool.function.parameters.required).toContain('y');
    expect(cropTool.function.parameters.required).toContain('width');
    expect(cropTool.function.parameters.required).toContain('height');
  });

  it('has rotate_video tool', () => {
    const rotateTool = tools.find(t => t.function.name === 'rotate_video');
    expect(rotateTool).toBeDefined();
    expect(rotateTool.function.parameters.required).toContain('angle');
  });

  it('has add_text tool', () => {
    const textTool = tools.find(t => t.function.name === 'add_text');
    expect(textTool).toBeDefined();
    expect(textTool.function.parameters.required).toContain('text');
  });

  it('has trim_video tool', () => {
    const trimTool = tools.find(t => t.function.name === 'trim_video');
    expect(trimTool).toBeDefined();
    expect(trimTool.function.parameters.required).toContain('start');
    expect(trimTool.function.parameters.required).toContain('end');
  });

  it('has adjust_speed tool', () => {
    const speedTool = tools.find(t => t.function.name === 'adjust_speed');
    expect(speedTool).toBeDefined();
    expect(speedTool.function.parameters.required).toContain('speed');
  });

  it('all tools have proper structure', () => {
    tools.forEach(tool => {
      expect(tool.type).toBe('function');
      expect(tool.function.name).toBeDefined();
      expect(tool.function.description).toBeDefined();
      expect(tool.function.parameters).toBeDefined();
      expect(tool.function.parameters.type).toBe('object');
      expect(tool.function.parameters.properties).toBeDefined();
      expect(tool.function.parameters.required).toBeDefined();
    });
  });
});
