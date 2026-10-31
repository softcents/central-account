'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, ExternalLink, QrCode as QrCodeIcon, Smartphone } from 'lucide-react';

interface QRCodeProps {
  value?: string;
  size?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showActions?: boolean;
}

// Galois Field GF(256) tables with primitive polynomial 0x11D
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11D : 0);
}
EXP_TABLE[255] = EXP_TABLE[0];

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function polyMul(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(numEC: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < numEC; i++) {
    poly = polyMul(poly, new Uint8Array([1, EXP_TABLE[i]]));
  }
  return poly;
}

function calculateEC(data: Uint8Array, numEC: number): Uint8Array {
  const gen = getGeneratorPoly(numEC);
  const msg = new Uint8Array(data.length + numEC);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const lead = msg[i];
    if (lead !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], lead);
      }
    }
  }
  return msg.slice(data.length);
}

// Table of parameters for Level M (Version 1 to 10)
// [totalCodewords, dataCodewords, ecCodewordsPerBlock, numBlocksG1, dataG1, numBlocksG2, dataG2]
const VERSION_INFO_M: (number[] | null)[] = [
  null,
  [26, 16, 10, 1, 16, 0, 0], // V1 (up to 14 bytes)
  [44, 28, 16, 1, 28, 0, 0], // V2 (up to 26 bytes)
  [70, 44, 26, 1, 44, 0, 0], // V3 (up to 42 bytes)
  [100, 64, 18, 2, 32, 0, 0], // V4 (up to 62 bytes)
  [134, 86, 24, 2, 43, 0, 0], // V5 (up to 84 bytes)
  [172, 108, 16, 4, 27, 0, 0], // V6 (up to 106 bytes)
  [196, 124, 18, 4, 31, 0, 0], // V7 (up to 122 bytes)
  [242, 154, 22, 2, 38, 2, 39], // V8 (up to 152 bytes)
  [292, 182, 22, 3, 36, 2, 37], // V9 (up to 180 bytes)
  [346, 216, 26, 4, 40, 1, 41], // V10 (up to 213 bytes)
];

const ALIGNMENT_PATTERN_POS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

const FORMAT_BITS_M = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];

function generateQRCodeMatrix(text: string): (0 | 1)[][] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  let version = 1;
  while (version <= 10 && bytes.length > (VERSION_INFO_M[version]![1] - (version <= 9 ? 2 : 3))) {
    version++;
  }
  if (version > 10) version = 10;

  const vInfo = VERSION_INFO_M[version]!;
  const totalDataBytes = vInfo[1];

  const bitArr: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitArr.push((val >> i) & 1);
    }
  }

  // Mode: Byte (0100)
  pushBits(4, 4);
  // Character count indicator (8 bits for V1-9, 16 bits for V10+)
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  // Data bytes
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }
  // Terminator (up to 4 zeroes)
  const totalDataBits = totalDataBytes * 8;
  const termLen = Math.min(4, totalDataBits - bitArr.length);
  pushBits(0, termLen);
  // Pad to byte boundary
  while (bitArr.length % 8 !== 0) {
    bitArr.push(0);
  }
  // Pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArr.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte array
  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArr[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // De-interleave / Block split
  const [, , numEC, b1Count, b1Data, b2Count, b2Data] = vInfo;
  const blocks: { data: Uint8Array; ec: Uint8Array }[] = [];
  let offset = 0;
  for (let i = 0; i < b1Count; i++) {
    const d = dataBytes.slice(offset, offset + b1Data);
    offset += b1Data;
    blocks.push({ data: d, ec: calculateEC(d, numEC) });
  }
  for (let i = 0; i < b2Count; i++) {
    const d = dataBytes.slice(offset, offset + b2Data);
    offset += b2Data;
    blocks.push({ data: d, ec: calculateEC(d, numEC) });
  }

  // Interleave data codewords
  const interleaved: number[] = [];
  const maxDataLen = Math.max(b1Data, b2Data || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of blocks) {
      if (i < blk.data.length) interleaved.push(blk.data[i]);
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < numEC; i++) {
    for (const blk of blocks) {
      if (i < blk.ec.length) interleaved.push(blk.ec[i]);
    }
  }

  // Convert interleaved into final bit array
  const finalBits: number[] = [];
  for (const byteVal of interleaved) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((byteVal >> b) & 1);
    }
  }

  // Initialize Matrix
  const size = 17 + 4 * version;
  const matrix: (0 | 1)[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r: number, c: number, val: 0 | 1) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // Finder Patterns
  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setFunction(row, col, inOuter && (isBorder || isCenter) ? 1 : 0);
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunction(6, i, i % 2 === 0 ? 1 : 0);
    if (!isFunction[i][6]) setFunction(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Alignment patterns
  const alignPos = ALIGNMENT_PATTERN_POS[version] || [];
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i];
      const c = alignPos[j];
      // Skip finder corners
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === size - 7) ||
        (r === size - 7 && c === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunction(r + dr, c + dc, isBlack ? 1 : 0);
        }
      }
    }
  }

  // Dark module
  setFunction(4 * version + 9, 8, 1);

  // Reserve format bits areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // Place data bits in zigzag
  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip timing column
    for (let i = 0; i < size; i++) {
      const row = upwards ? size - 1 - i : i;
      for (let col = right; col >= right - 1; col--) {
        if (!isFunction[row][col]) {
          matrix[row][col] = bitIdx < finalBits.length ? (finalBits[bitIdx++] as 0 | 1) : 0;
        }
      }
    }
    upwards = !upwards;
  }

  // Mask pattern 0: (row + col) % 2 === 0
  const maskPattern = (r: number, c: number) => (r + c) % 2 === 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if (maskPattern(r, c)) {
          matrix[r][c] = matrix[r][c] === 1 ? 0 : 1;
        }
      }
    }
  }

  // Place format bits (Mask 0 -> FORMAT_BITS_M[0] = 0x5412)
  const fBits = FORMAT_BITS_M[0];
  const formatArray: (0 | 1)[] = [];
  for (let i = 14; i >= 0; i--) {
    formatArray.push(((fBits >> i) & 1) as 0 | 1);
  }

  // Around top-left finder
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatArray[i];
  matrix[8][7] = formatArray[6];
  matrix[8][8] = formatArray[7];
  matrix[7][8] = formatArray[8];
  for (let i = 9; i <= 14; i++) matrix[14 - i][8] = formatArray[i];

  // Around top-right and bottom-left finders
  for (let i = 0; i <= 7; i++) matrix[8][size - 1 - i] = formatArray[i];
  for (let i = 8; i <= 14; i++) matrix[size - 15 + i][8] = formatArray[i];

  return matrix;
}

export function QRCode({
  value,
  size = 190,
  className = '',
  title = 'Scan to Continue on Phone',
  subtitle = 'Use your mobile camera to take photos & verify',
  showActions = true,
}: QRCodeProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string>(value || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (value) {
      setResolvedUrl(value);
    } else if (typeof window !== 'undefined') {
      setResolvedUrl(window.location.href);
    }
  }, [value]);

  const matrix = useMemo(() => {
    if (!resolvedUrl) return null;
    try {
      return generateQRCodeMatrix(resolvedUrl);
    } catch {
      return null;
    }
  }, [resolvedUrl]);

  const handleCopy = async () => {
    if (!resolvedUrl) return;
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const matrixSize = matrix ? matrix.length : 21;
  const cellSize = 10;
  const padding = 20;
  const totalDim = matrixSize * cellSize + padding * 2;

  return (
    <div
      className={`flex flex-col items-center p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl text-center select-none ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center space-x-2 text-indigo-400 mb-2">
        <Smartphone className="w-4 h-4 animate-bounce" />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mb-4 max-w-xs">{subtitle}</p>}

      {/* QR Code Container */}
      <div className="relative p-3 bg-white rounded-2xl shadow-2xl shadow-indigo-500/10 ring-4 ring-indigo-500/20 group transition-transform hover:scale-[1.02]">
        {/* Corner framing brackets */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-indigo-500 rounded-tl pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-indigo-500 rounded-tr pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-indigo-500 rounded-bl pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-indigo-500 rounded-br pointer-events-none" />

        {matrix ? (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${totalDim} ${totalDim}`}
            className="w-full h-auto block"
            shapeRendering="crispEdges"
          >
            <rect width={totalDim} height={totalDim} fill="#ffffff" />
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell === 1 ? (
                  <rect
                    key={`${r}-${c}`}
                    x={padding + c * cellSize}
                    y={padding + r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#0f172a"
                  />
                ) : null,
              ),
            )}
          </svg>
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 text-slate-500"
          >
            <QrCodeIcon className="w-12 h-12 animate-pulse text-indigo-500" />
          </div>
        )}
      </div>

      {/* Action Controls */}
      {showActions && (
        <div className="mt-4 flex items-center space-x-2 w-full max-w-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          <a
            href={resolvedUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-[11px] font-semibold flex items-center justify-center space-x-1 border border-indigo-500/30 transition-all"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
export default QRCode;
