import {
  ShaderMount,
  defaultPatternSizing,
  getShaderColorFromString,
  getShaderNoiseTexture,
  warpFragmentShader,
  ShaderFitOptions,
  WarpPatterns
} from "@paper-design/shaders";

function initWarpShader() {
  const container = document.getElementById("adminShaderCanvas");
  if (!container) return;

  const colors = [
    "hsl(200, 100%, 20%)",
    "hsl(160, 100%, 75%)",
    "hsl(180, 90%, 30%)",
    "hsl(170, 100%, 80%)"
  ];

  const uniforms = {
    u_colors: colors.map(getShaderColorFromString),
    u_colorsCount: colors.length,
    u_proportion: 0.45,
    u_softness: 1.0,
    u_distortion: 0.25,
    u_swirl: 0.8,
    u_swirlIterations: 10,
    u_shapeScale: 0.1,
    u_shape: WarpPatterns.checks,
    u_noiseTexture: getShaderNoiseTexture(),
    u_scale: 1.0,
    u_rotation: 0,
    u_fit: ShaderFitOptions.cover,
    u_offsetX: 0,
    u_offsetY: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_worldWidth: 1,
    u_worldHeight: 1
  };

  try {
    new ShaderMount(container, warpFragmentShader, uniforms, { alpha: true, antialias: true }, 1.0, 0);
  } catch (err) {
    console.warn("Shader mount warning:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWarpShader);
} else {
  initWarpShader();
}
