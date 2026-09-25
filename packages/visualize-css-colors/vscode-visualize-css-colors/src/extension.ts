import { extractCssColors } from "@moyarich/css-color-parser";
import * as vscode from "vscode";
import { SUPPORTED_LANGUAGE_IDS } from "./languages";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toHexByte(value: number) {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

function toHexPresentation(color: vscode.Color) {
  const red = toHexByte(color.red);
  const green = toHexByte(color.green);
  const blue = toHexByte(color.blue);
  const alpha = toHexByte(color.alpha);

  return color.alpha < 1
    ? `#${red}${green}${blue}${alpha}`
    : `#${red}${green}${blue}`;
}

function toRgbPresentation(color: vscode.Color) {
  const red = Math.round(clamp(color.red, 0, 1) * 255);
  const green = Math.round(clamp(color.green, 0, 1) * 255);
  const blue = Math.round(clamp(color.blue, 0, 1) * 255);

  if (color.alpha >= 1) {
    return `rgb(${red}, ${green}, ${blue})`;
  }

  const alpha = Number(clamp(color.alpha, 0, 1).toFixed(3));

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createPresentations(
  color: vscode.Color,
  context: {
    document: vscode.TextDocument;
    range: vscode.Range;
  },
) {
  const original = context.document.getText(context.range).trim().toLowerCase();
  const hex = toHexPresentation(color);
  const rgb = toRgbPresentation(color);
  const labels = original.startsWith("rgb") ? [rgb, hex] : [hex, rgb];

  return labels.map((label) => new vscode.ColorPresentation(label));
}

const colorProvider: vscode.DocumentColorProvider = {
  provideDocumentColors(document) {
    return extractCssColors(document.getText()).map((match) => {
      const range = new vscode.Range(
        document.positionAt(match.start),
        document.positionAt(match.end),
      );

      const color = new vscode.Color(
        clamp(match.color.red / 255, 0, 1),
        clamp(match.color.green / 255, 0, 1),
        clamp(match.color.blue / 255, 0, 1),
        clamp(match.color.alpha, 0, 1),
      );

      return new vscode.ColorInformation(range, color);
    });
  },

  provideColorPresentations(color, context) {
    return createPresentations(color, context);
  },
};

/**
 * Activates the web extension and contributes native document color support.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerColorProvider(
      [...SUPPORTED_LANGUAGE_IDS],
      colorProvider,
    ),
  );
}

export function deactivate() {}
