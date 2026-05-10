import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { supabase, subscribeToMatch } from '../utils/supabase';
import { COLORS } from '../constants/colors';
import { PROMPTS } from '../constants/prompts';
import { GAME_CONSTANTS } from '../constants/game';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiDraw'>;

function strokesToSVG(strokes: Stroke[], w = 300, h = 300, bg = '#FFFFFF'): string {
  const lastFill = [...strokes].reverse().find(s => s.isFill);
  const bgColor = lastFill ? lastFill.fillColor! : bg;
  const paths = strokes
    .filter(s => !s.isFill && s.points)
    .map(s => `<path d="${s.points}" stroke="${s.color}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${paths}</svg>`;
}

function botSVG(prompt: string, botName?: string): string {
  const p = prompt.toLowerCase();

  // Each bot gets a stable "age" (10–16) from their name — determines drawing quality
  const nSeed = (botName || 'bot').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pSeed = prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const age = 10 + (nSeed % 7); // 10–16
  const skill = age - 9;        // 1–7

  // Deterministic pseudo-random: different per bot AND per prompt
  let rngState = ((nSeed * 1664525) ^ (pSeed * 22695477)) >>> 0;
  const rng = () => { rngState = (rngState * 1664525 + 1013904223) >>> 0; return rngState / 0xFFFFFFFF; };
  // Jitter: younger kids draw wobblier, older kids draw straighter
  const jAmt = Math.max(1, 9 - skill);
  const j = (v: number, scale = 1.0) => Math.round(v + (rng() * 2 - 1) * jAmt * scale);

  // Kid-style bright color palette — each bot gets their own pair
  const kidColors = ['#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#5856D6','#FF2D55','#AF52DE','#FF6B35','#30B0C7'];
  const c1 = kidColors[nSeed % kidColors.length];
  const c2 = kidColors[(nSeed + 3) % kidColors.length];
  const c3 = kidColors[(nSeed + 6) % kidColors.length];
  const bgs = ['#FFFEF5','#F5F5FF','#FFF5F5','#F5FFFA','#FFF8F0','#F0F8FF'];
  const bg = bgs[(nSeed * 7 + pSeed) % bgs.length];

  // SVG turbulence filter — younger = much wobblier
  const freq = (0.008 + (8 - skill) * 0.006).toFixed(3);
  const disp = Math.max(2, 12 - skill * 1.5).toFixed(1);
  const filt = `<defs><filter id="h" x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${(nSeed * 7 + pSeed) % 100}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${disp}" xChannelSelector="R" yChannelSelector="G"/>
  </filter></defs>`;

  // Compositional offset — bots don't always draw dead-centre
  const cx = j(150, 0.4);
  const cy = j(148, 0.4);

  // Younger kids (age ≤ 12) often label their drawing like a caption
  const labelEl = age <= 12
    ? `<text x="${j(150)}" y="${j(24)}" font-size="${j(13)}" fill="${c1}" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(${((rng()-0.5)*10).toFixed(1)},${j(150)},${j(24)})">${prompt.slice(0,16)}</text>`
    : '';

  // ── Prompt-matched drawing subjects ──────────────────────────────────────
  let body = '';

  const hasCat     = /\bcat\b/.test(p);
  const hasDog     = /\bdog\b/.test(p);
  const hasFish    = /\bfish\b/.test(p);
  const hasPenguin = /\bpenguin\b/.test(p);
  const hasDino    = /\b(dino|dinosaur)\b/.test(p);
  const hasDragon  = /\bdragon\b/.test(p);
  const hasSnail   = /\bsnail\b/.test(p);
  const hasCow     = /\bcow\b/.test(p);
  const hasElephant= /\belephant\b/.test(p);
  const hasMonster = /\bmonster\b/.test(p);
  const hasRobot   = /\brobot\b/.test(p);
  const hasPizza   = /\bpizza\b/.test(p);
  const hasSandwich= /\bsandwich\b/.test(p);
  const hasBanana  = /\bbanana\b/.test(p);
  const hasDonut   = /\bdonut\b/.test(p);
  const hasIceCream= /\bice.?cream\b/.test(p);
  const hasSpaghetti=/\bspaghetti\b/.test(p);
  const hasBreakfast=/\bbreakfast\b/.test(p);
  const hasHouse   = /\b(house|treehouse|cabin)\b/.test(p);
  const hasRocket  = /\brocket\b/.test(p);
  const hasMoon    = /\bmoon\b/.test(p);
  const hasCloud   = /\bcloud\b/.test(p);
  const hasTree    = /\btree\b/.test(p);
  const hasSun     = /\bsun\b/.test(p);
  const hasTornado = /\btornado\b/.test(p);
  const hasHero    = /\bsuperhero\b/.test(p);
  const hasSneaker = /\b(sneaker|shoe)\b/.test(p);
  const hasBicycle = /\bbicycle\b/.test(p);
  const hasClock   = /\bclock\b/.test(p);

  if (hasCat || hasDog || hasPenguin || hasCow || hasElephant) {
    // Animal face — kids draw big round heads with simple features
    const r = j(62, 0.5);
    const eOff = j(22, 0.5);
    const eyeY = cy - j(16, 0.5);
    const noseY = cy + j(5, 0.3);
    const mouthY = cy + j(22, 0.5);
    const earH = hasCat ? `
      <polygon points="${cx-r+j(5)},${eyeY-j(28)} ${cx-r+j(20)},${eyeY-j(55)} ${cx-r+j(38)},${eyeY-j(28)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <polygon points="${cx+r-j(5)},${eyeY-j(28)} ${cx+r-j(20)},${eyeY-j(55)} ${cx+r-j(38)},${eyeY-j(28)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <polygon points="${cx-r+j(8)},${eyeY-j(26)} ${cx-r+j(20)},${eyeY-j(46)} ${cx-r+j(33)},${eyeY-j(26)}" fill="${c3}"/>
      <polygon points="${cx+r-j(8)},${eyeY-j(26)} ${cx+r-j(20)},${eyeY-j(46)} ${cx+r-j(33)},${eyeY-j(26)}" fill="${c3}"/>` : hasDog ? `
      <ellipse cx="${cx-r+j(12)}" cy="${eyeY-j(18)}" rx="${j(22)}" ry="${j(30)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <ellipse cx="${cx+r-j(12)}" cy="${eyeY-j(18)}" rx="${j(22)}" ry="${j(30)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>` : hasPenguin ? `
      <ellipse cx="${cx-r+j(14)}" cy="${eyeY-j(22)}" rx="${j(16)}" ry="${j(12)}" fill="#333"/>
      <ellipse cx="${cx+r-j(14)}" cy="${eyeY-j(22)}" rx="${j(16)}" ry="${j(12)}" fill="#333"/>` : '';
    const whiskers = hasCat ? `
      <line x1="${j(cx-8)}" y1="${j(noseY+2)}" x2="${j(cx-55)}" y2="${j(noseY-5)}" stroke="#555" stroke-width="1.5"/>
      <line x1="${j(cx-8)}" y1="${j(noseY+6)}" x2="${j(cx-55)}" y2="${j(noseY+9)}" stroke="#555" stroke-width="1.5"/>
      <line x1="${j(cx+8)}" y1="${j(noseY+2)}" x2="${j(cx+55)}" y2="${j(noseY-5)}" stroke="#555" stroke-width="1.5"/>
      <line x1="${j(cx+8)}" y1="${j(noseY+6)}" x2="${j(cx+55)}" y2="${j(noseY+9)}" stroke="#555" stroke-width="1.5"/>` : '';
    body = `
      ${earH}
      <circle cx="${j(cx)}" cy="${j(cy)}" r="${r}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <circle cx="${j(cx-eOff)}" cy="${j(eyeY)}" r="${j(12)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+eOff)}" cy="${j(eyeY)}" r="${j(12)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-eOff+2)}" cy="${j(eyeY)}" r="${j(6)}" fill="#222"/>
      <circle cx="${j(cx+eOff+2)}" cy="${j(eyeY)}" r="${j(6)}" fill="#222"/>
      <circle cx="${j(cx-eOff+4)}" cy="${j(eyeY-2)}" r="${j(2)}" fill="white"/>
      <circle cx="${j(cx+eOff+4)}" cy="${j(eyeY-2)}" r="${j(2)}" fill="white"/>
      <ellipse cx="${j(cx)}" cy="${j(noseY)}" rx="${j(8)}" ry="${j(6)}" fill="${c2}"/>
      <path d="M ${j(cx-18)} ${j(mouthY)} Q ${j(cx)} ${j(mouthY+16)} ${j(cx+18)} ${j(mouthY)}" stroke="#333" stroke-width="${j(2.5)}" fill="none" stroke-linecap="round"/>
      ${whiskers}`;

  } else if (hasFish || p.includes('jellyfish') || p.includes('bicycle') && false) {
    const fw = j(80, 0.5); const fh = j(45, 0.5);
    body = `
      <rect width="300" height="300" fill="#B8E4FF"/>
      <ellipse cx="${j(cx-10)}" cy="${j(cy)}" rx="${fw}" ry="${fh}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <polygon points="${cx+fw-j(10)},${cy-j(35)} ${cx+fw+j(40)},${cy} ${cx+fw-j(10)},${cy+j(35)}" fill="${c2}" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-fw+j(20))}" cy="${j(cy-j(12))}" r="${j(10)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-fw+j(23))}" cy="${j(cy-j(10))}" r="${j(5)}" fill="#222"/>
      <path d="M ${j(cx-fw+j(35))} ${j(cy+j(15))} Q ${j(cx-fw+j(50))} ${j(cy+j(28))} ${j(cx+j(10))} ${j(cy+j(25))}" stroke="#333" stroke-width="${j(2)}" fill="none"/>
      <path d="M ${j(cx-fw+j(30))} ${j(cy-j(18))} Q ${j(cx-j(20))} ${j(cy-j(30))} ${j(cx+j(15))} ${j(cy-j(28))}" stroke="#333" stroke-width="${j(1.5)}" fill="none"/>
      <circle cx="${j(cx-30)}" cy="${j(cy-50)}" r="${j(7)}" fill="white" opacity="0.7" stroke="#87CEEB" stroke-width="1"/>
      <circle cx="${j(cx+30)}" cy="${j(cy-70)}" r="${j(5)}" fill="white" opacity="0.7" stroke="#87CEEB" stroke-width="1"/>`;

  } else if (hasDino || hasDragon) {
    const tailX = cx - j(90, 0.5);
    body = `
      <ellipse cx="${j(cx+10)}" cy="${j(cy+20)}" rx="${j(70)}" ry="${j(55)}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <ellipse cx="${j(cx+60)}" cy="${j(cy-30)}" rx="${j(40)}" ry="${j(32)}" fill="${c1}" stroke="#333" stroke-width="${j(2.5)}"/>
      <path d="M ${j(cx+30)} ${j(cy-10)} Q ${j(cx+50)} ${j(cy-20)} ${j(cx+60)} ${j(cy-10)}" fill="${c1}" stroke="none"/>
      ${hasDragon ? `
        <polygon points="${cx+j(30)},${cy-j(70)} ${cx+j(50)},${cy-j(40)} ${cx+j(75)},${cy-j(60)}" fill="${c2}" stroke="#333" stroke-width="1.5"/>
        <polygon points="${cx+j(60)},${cy-j(75)} ${cx+j(80)},${cy-j(45)} ${cx+j(100)},${cy-j(65)}" fill="${c2}" stroke="#333" stroke-width="1.5"/>` : `
        <polygon points="${cx+j(52)},${cy-j(58)} ${cx+j(62)},${cy-j(38)} ${cx+j(72)},${cy-j(55)}" fill="${c1}" stroke="#333" stroke-width="1.5"/>
        <polygon points="${cx+j(68)},${cy-j(56)} ${cx+j(76)},${cy-j(38)} ${cx+j(85)},${cy-j(52)}" fill="${c1}" stroke="#333" stroke-width="1.5"/>`}
      <circle cx="${j(cx+72)}" cy="${j(cy-38)}" r="${j(8)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+74)}" cy="${j(cy-37)}" r="${j(4)}" fill="#222"/>
      <circle cx="${j(cx+78)}" cy="${j(cy-28)}" r="${j(6)}" fill="${c1}" stroke="#333" stroke-width="1.5"/>
      <path d="M ${j(tailX+20)} ${j(cy+45)} Q ${j(tailX)} ${j(cy+70)} ${j(tailX+25)} ${j(cy+85)}" stroke="#333" stroke-width="${j(3)}" fill="none" stroke-linecap="round"/>
      <line x1="${j(cx-30)}" y1="${j(cy+70)}" x2="${j(cx-40)}" y2="${j(cy+110)}" stroke="#333" stroke-width="${j(4)}" stroke-linecap="round"/>
      <line x1="${j(cx+10)}" y1="${j(cy+72)}" x2="${j(cx+5)}" y2="${j(cy+115)}" stroke="#333" stroke-width="${j(4)}" stroke-linecap="round"/>`;

  } else if (hasSnail) {
    body = `
      <rect x="0" y="${j(230)}" width="300" height="70" fill="#7EC850"/>
      <ellipse cx="${j(cx-20)}" cy="${j(cy+30)}" rx="${j(55)}" ry="${j(28)}" fill="${c1}" stroke="#333" stroke-width="${j(2.5)}"/>
      <circle cx="${j(cx+20)}" cy="${j(cy-10)}" r="${j(48)}" fill="none" stroke="${c2}" stroke-width="${j(12)}"/>
      <circle cx="${j(cx+22)}" cy="${j(cy-8)}" r="${j(28)}" fill="none" stroke="${c3}" stroke-width="${j(8)}"/>
      <circle cx="${j(cx+24)}" cy="${j(cy-6)}" r="${j(12)}" fill="${c1}"/>
      <line x1="${j(cx-5)}" y1="${j(cy-30)}" x2="${j(cx-15)}" y2="${j(cy-55)}" stroke="#333" stroke-width="${j(2)}"/>
      <line x1="${j(cx+5)}" y1="${j(cy-32)}" x2="${j(cx+2)}" y2="${j(cy-55)}" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-15)}" cy="${j(cy-57)}" r="${j(4)}" fill="#222"/>
      <circle cx="${j(cx+2)}" cy="${j(cy-57)}" r="${j(4)}" fill="#222"/>`;

  } else if (hasMonster) {
    const bumps = Array.from({length: 3 + (nSeed % 3)}, (_, i) =>
      `<ellipse cx="${j(cx + (i-1)*j(28))}" cy="${j(cy-j(80))}" rx="${j(10)}" ry="${j(14)}" fill="${c2}" stroke="#333" stroke-width="${j(1.5)}"/>`
    ).join('');
    body = `
      ${bumps}
      <ellipse cx="${j(cx)}" cy="${j(cy+10)}" rx="${j(78)}" ry="${j(85)}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <circle cx="${j(cx-22)}" cy="${j(cy-28)}" r="${j(18)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+22)}" cy="${j(cy-28)}" r="${j(18)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-20)}" cy="${j(cy-26)}" r="${j(9)}" fill="${c2}"/>
      <circle cx="${j(cx+24)}" cy="${j(cy-26)}" r="${j(9)}" fill="${c2}"/>
      <circle cx="${j(cx-18)}" cy="${j(cy-24)}" r="${j(4)}" fill="#111"/>
      <circle cx="${j(cx+26)}" cy="${j(cy-24)}" r="${j(4)}" fill="#111"/>
      <path d="M ${j(cx-48)} ${j(cy+30)} L ${j(cx-34)} ${j(cy+12)} L ${j(cx-16)} ${j(cy+30)} L ${j(cx)} ${j(cy+10)} L ${j(cx+16)} ${j(cy+30)} L ${j(cx+34)} ${j(cy+12)} L ${j(cx+48)} ${j(cy+30)}" stroke="#333" stroke-width="2" fill="${c3}" stroke-linejoin="round"/>`;

  } else if (hasRobot) {
    const bx = cx - j(42, 0.5); const by = cy - j(50, 0.5);
    body = `
      <rect x="${j(bx)}" y="${j(by-38)}" width="${j(84)}" height="${j(68)}" rx="${j(10)}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <line x1="${j(cx)}" y1="${j(by-38)}" x2="${j(cx)}" y2="${j(by-58)}" stroke="#333" stroke-width="${j(3)}"/>
      <circle cx="${j(cx)}" cy="${j(by-63)}" r="${j(9)}" fill="${c2}" stroke="#333" stroke-width="1.5"/>
      <rect x="${j(bx)}" y="${j(by+30)}" width="${j(84)}" height="${j(62)}" rx="${j(6)}" fill="${c2}" stroke="#333" stroke-width="${j(2.5)}"/>
      <rect x="${j(bx-28)}" y="${j(by+35)}" width="${j(24)}" height="${j(52)}" rx="${j(6)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <rect x="${j(bx+84+4)}" y="${j(by+35)}" width="${j(24)}" height="${j(52)}" rx="${j(6)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-20)}" cy="${j(by-10)}" r="${j(13)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+20)}" cy="${j(by-10)}" r="${j(13)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-18)}" cy="${j(by-8)}" r="${j(6)}" fill="${c3}"/>
      <circle cx="${j(cx+22)}" cy="${j(by-8)}" r="${j(6)}" fill="${c3}"/>
      <rect x="${j(cx-22)}" y="${j(by+12)}" width="${j(44)}" height="${j(12)}" rx="${j(4)}" fill="${c3}" opacity="0.7"/>
      <line x1="${j(bx-16)}" y1="${j(by+75)}" x2="${j(bx-16)}" y2="${j(by+95)}" stroke="#333" stroke-width="${j(3)}" stroke-linecap="round"/>
      <line x1="${j(bx+100)}" y1="${j(by+75)}" x2="${j(bx+104)}" y2="${j(by+95)}" stroke="#333" stroke-width="${j(3)}" stroke-linecap="round"/>`;

  } else if (hasPizza) {
    const tipY = cy - j(78, 0.5);
    const baseY = cy + j(65, 0.5);
    const lx = cx - j(88, 0.5); const rx2 = cx + j(88, 0.5);
    body = `
      <polygon points="${j(cx)},${tipY} ${lx},${baseY} ${rx2},${baseY}" fill="#F4C430" stroke="#8B4513" stroke-width="${j(3)}" stroke-linejoin="round"/>
      <path d="M ${lx} ${baseY} Q ${j(cx)} ${j(baseY+18)} ${rx2} ${baseY}" fill="${c1}" stroke="#8B4513" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-22)}" cy="${j(cy+8)}" r="${j(13)}" fill="${c2}" opacity="0.9"/>
      <circle cx="${j(cx+18)}" cy="${j(cy+22)}" r="${j(11)}" fill="${c2}" opacity="0.9"/>
      <circle cx="${j(cx-5)}" cy="${j(cy-15)}" r="${j(10)}" fill="${c2}" opacity="0.9"/>
      <circle cx="${j(cx+36)}" cy="${j(cy+5)}" r="${j(9)}" fill="${c3}" opacity="0.8"/>
      <circle cx="${j(cx-38)}" cy="${j(cy+20)}" r="${j(8)}" fill="${c3}" opacity="0.8"/>`;

  } else if (hasSandwich || hasSpaghetti || hasBreakfast) {
    if (hasSpaghetti) {
      body = `
        <ellipse cx="${j(cx)}" cy="${j(cy+40)}" rx="${j(90)}" ry="${j(28)}" fill="#E8C4A0" stroke="#8B4513" stroke-width="${j(2)}"/>
        <path d="M ${j(cx-70)} ${j(cy-10)} Q ${j(cx-30)} ${j(cy+30)} ${j(cx+20)} ${j(cy-5)} Q ${j(cx+50)} ${j(cy+40)} ${j(cx+65)} ${j(cy+10)}" stroke="#F4C430" stroke-width="${j(6)}" fill="none" stroke-linecap="round"/>
        <path d="M ${j(cx-50)} ${j(cy+15)} Q ${j(cx+10)} ${j(cy-15)} ${j(cx+55)} ${j(cy+20)}" stroke="#F4C430" stroke-width="${j(6)}" fill="none" stroke-linecap="round"/>
        <path d="M ${j(cx-65)} ${j(cy+30)} Q ${j(cx)} ${j(cy+5)} ${j(cx+60)} ${j(cy+28)}" stroke="#F4C430" stroke-width="${j(6)}" fill="none" stroke-linecap="round"/>
        <circle cx="${j(cx-20)}" cy="${j(cy-10)}" r="${j(12)}" fill="${c1}" opacity="0.9"/>
        <circle cx="${j(cx+15)}" cy="${j(cy-5)}" r="${j(11)}" fill="${c1}" opacity="0.9"/>
        <circle cx="${j(cx-40)}" cy="${j(cy+5)}" r="${j(10)}" fill="${c2}" opacity="0.8"/>`;
    } else {
      const sw = j(155, 0.5); const sx = cx - sw/2;
      body = `
        <rect x="${sx}" y="${cy-j(68)}" width="${sw}" height="${j(28)}" rx="${j(12)}" fill="#DEB887" stroke="#8B4513" stroke-width="${j(2)}"/>
        <rect x="${j(sx-4)}" y="${cy-j(44)}" width="${sw+j(8)}" height="${j(20)}" fill="${c1}" opacity="0.9"/>
        <rect x="${sx}" y="${cy-j(27)}" width="${sw}" height="${j(18)}" fill="#F0E68C"/>
        <rect x="${j(sx+8)}" y="${cy-j(12)}" width="${sw-j(16)}" height="${j(16)}" fill="#228B22" opacity="0.8"/>
        <rect x="${sx}" y="${cy+j(2)}" width="${sw}" height="${j(28)}" rx="${j(12)}" fill="#DEB887" stroke="#8B4513" stroke-width="${j(2)}"/>
        <circle cx="${j(cx-38)}" cy="${cy-j(36)}" r="${j(9)}" fill="#DC143C" opacity="0.9"/>
        <circle cx="${j(cx+28)}" cy="${cy-j(30)}" r="${j(8)}" fill="#DC143C" opacity="0.9"/>`;
    }

  } else if (hasDonut || hasIceCream) {
    if (hasIceCream) {
      body = `
        <polygon points="${j(cx)},${j(cy+90)} ${j(cx-42)},${j(cy+10)} ${j(cx+42)},${j(cy+10)}" fill="${c2}" stroke="#8B4513" stroke-width="${j(2)}" stroke-linejoin="round"/>
        <ellipse cx="${j(cx)}" cy="${j(cy+10)}" rx="${j(48)}" ry="${j(46)}" fill="${c1}" stroke="#333" stroke-width="${j(2.5)}"/>
        <ellipse cx="${j(cx-22)}" cy="${j(cy-25)}" rx="${j(35)}" ry="${j(34)}" fill="${c3}" stroke="#333" stroke-width="${j(2)}"/>
        <path d="M ${j(cx-10)} ${j(cy-65)} Q ${j(cx-18)} ${j(cy-80)} ${j(cx-10)} ${j(cy-90)}" stroke="#DC143C" stroke-width="${j(4)}" fill="none" stroke-linecap="round"/>
        <circle cx="${j(cx-10)}" cy="${j(cy-91)}" r="${j(6)}" fill="#DC143C"/>`;
    } else {
      body = `
        <ellipse cx="${j(cx)}" cy="${j(cy+10)}" rx="${j(68)}" ry="${j(47)}" fill="${c1}" stroke="#8B4513" stroke-width="${j(2)}"/>
        <ellipse cx="${j(cx)}" cy="${j(cy+10)}" rx="${j(30)}" ry="${j(19)}" fill="${bg}"/>
        <path d="M ${j(cx-62)} ${j(cy+10)} Q ${j(cx-35)} ${j(cy-42)} ${j(cx)} ${j(cy-44)} Q ${j(cx+38)} ${j(cy-42)} ${j(cx+58)} ${j(cy+10)}" stroke="${c2}" stroke-width="${j(6)}" fill="none" stroke-linecap="round" opacity="0.85"/>
        <circle cx="${j(cx-28)}" cy="${j(cy-22)}" r="${j(5)}" fill="white" opacity="0.9"/>
        <circle cx="${j(cx+22)}" cy="${j(cy-26)}" r="${j(4)}" fill="white" opacity="0.9"/>`;
    }

  } else if (hasHouse) {
    const wallX = cx - j(65, 0.5); const wallY = cy - j(18, 0.5);
    body = `
      <rect x="0" y="${j(255)}" width="300" height="50" fill="#7EC850"/>
      <rect x="${j(wallX)}" y="${j(wallY)}" width="${j(130)}" height="${j(98)}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <polygon points="${j(wallX-12)},${j(wallY+2)} ${j(cx)},${j(wallY-j(68,0.5))} ${j(wallX+142)},${j(wallY+2)}" fill="${c2}" stroke="#333" stroke-width="${j(2.5)}" stroke-linejoin="round"/>
      <rect x="${j(cx-19)}" y="${j(wallY+52)}" width="${j(38)}" height="${j(48)}" fill="${c3}" stroke="#333" stroke-width="${j(2)}"/>
      <rect x="${j(wallX+14)}" y="${j(wallY+20)}" width="${j(32)}" height="${j(30)}" fill="#87CEEB" stroke="#333" stroke-width="${j(2)}"/>
      <line x1="${j(wallX+30)}" y1="${j(wallY+20)}" x2="${j(wallX+30)}" y2="${j(wallY+50)}" stroke="#333" stroke-width="1.5"/>
      <line x1="${j(wallX+14)}" y1="${j(wallY+35)}" x2="${j(wallX+46)}" y2="${j(wallY+35)}" stroke="#333" stroke-width="1.5"/>
      <circle cx="${j(cx+j(70))}" cy="${j(60)}" r="${j(28)}" fill="#FFD700" opacity="0.9"/>`;

  } else if (hasRocket || hasMoon) {
    const dark = '#0d0d2b';
    const stars = Array.from({length: 10}, () =>
      `<circle cx="${Math.round(rng()*280+10)}" cy="${Math.round(rng()*200+10)}" r="${(rng()*3+1).toFixed(1)}" fill="white" opacity="${(rng()*0.5+0.5).toFixed(2)}"/>`
    ).join('');
    if (hasMoon) {
      body = `
        <rect width="300" height="300" fill="${dark}"/>
        ${stars}
        <circle cx="${j(cx+15)}" cy="${j(cy-15)}" r="${j(72)}" fill="#FFD700"/>
        <circle cx="${j(cx+44)}" cy="${j(cy-22)}" r="${j(65)}" fill="${dark}"/>`;
    } else {
      body = `
        <rect width="300" height="300" fill="${dark}"/>
        ${stars}
        <polygon points="${j(cx)},${j(cy-90)} ${j(cx-38)},${j(cy+55)} ${j(cx+38)},${j(cy+55)}" fill="${c1}" stroke="${c2}" stroke-width="${j(3)}" stroke-linejoin="round"/>
        <circle cx="${j(cx)}" cy="${j(cy-32)}" r="${j(20)}" fill="#87CEEB" stroke="${c2}" stroke-width="${j(2)}"/>
        <polygon points="${j(cx-38)},${j(cy+38)} ${j(cx-60)},${j(cy+72)} ${j(cx-18)},${j(cy+58)}" fill="${c2}"/>
        <polygon points="${j(cx+38)},${j(cy+38)} ${j(cx+60)},${j(cy+72)} ${j(cx+18)},${j(cy+58)}" fill="${c2}"/>
        <ellipse cx="${j(cx)}" cy="${j(cy+68)}" rx="${j(26)}" ry="${j(12)}" fill="${c3}" opacity="0.7"/>
        <ellipse cx="${j(cx)}" cy="${j(cy+76)}" rx="${j(16)}" ry="${j(9)}" fill="#FF6B35" opacity="0.85"/>`;
    }

  } else if (hasCloud) {
    body = `
      <rect width="300" height="300" fill="#87CEEB"/>
      <ellipse cx="${j(cx)}" cy="${j(cy+5)}" rx="${j(82)}" ry="${j(50)}" fill="white" stroke="#ddd" stroke-width="1"/>
      <ellipse cx="${j(cx-52)}" cy="${j(cy+18)}" rx="${j(56)}" ry="${j(40)}" fill="white"/>
      <ellipse cx="${j(cx+55)}" cy="${j(cy+18)}" rx="${j(56)}" ry="${j(40)}" fill="white"/>
      <circle cx="${j(cx-18)}" cy="${j(cy-5)}" r="${j(20)}" fill="${c1}" stroke="white" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+18)}" cy="${j(cy-5)}" r="${j(20)}" fill="white" stroke="${c1}" stroke-width="${j(2)}"/>
      <path d="M ${j(cx-10)} ${j(cy)} Q ${j(cx+5)} ${j(cy+14)} ${j(cx+20)} ${j(cy)}" stroke="#333" stroke-width="${j(2.5)}" fill="none" stroke-linecap="round"/>
      <circle cx="${j(cx-20)}" cy="${j(cy-8)}" r="${j(6)}" fill="#333"/>
      <circle cx="${j(cx+18)}" cy="${j(cy-6)}" r="${j(6)}" fill="#333"/>`;

  } else if (hasTornado) {
    body = `
      <rect width="300" height="300" fill="#C8D8E8"/>
      <path d="M ${j(cx-82)} ${j(78)} Q ${j(cx)} ${j(68)} ${j(cx+82)} ${j(78)}" stroke="#888" stroke-width="${j(42)}" fill="none" stroke-linecap="round" opacity="0.65"/>
      <path d="M ${j(cx-55)} ${j(128)} Q ${j(cx)} ${j(118)} ${j(cx+55)} ${j(128)}" stroke="#999" stroke-width="${j(32)}" fill="none" stroke-linecap="round" opacity="0.65"/>
      <path d="M ${j(cx-28)} ${j(175)} Q ${j(cx)} ${j(165)} ${j(cx+28)} ${j(175)}" stroke="#aaa" stroke-width="${j(22)}" fill="none" stroke-linecap="round" opacity="0.65"/>
      <line x1="${j(cx-8)}" y1="${j(182)}" x2="${j(cx+5)}" y2="${j(238)}" stroke="#888" stroke-width="${j(10)}" stroke-linecap="round"/>
      <circle cx="${j(cx-42)}" cy="${j(205)}" r="${j(13)}" fill="${c1}" opacity="0.8"/>
      <circle cx="${j(cx+52)}" cy="${j(175)}" r="${j(11)}" fill="${c2}" opacity="0.8"/>
      <rect x="${j(cx+60)}" y="${j(210)}" width="${j(18)}" height="${j(22)}" fill="${c3}" opacity="0.7"/>`;

  } else if (hasHero) {
    // Stick figure superhero with cape
    const hy = cy - j(88, 0.5);
    const rays = Array.from({length: 8}, (_, i) => {
      const a = (i * 45) * Math.PI / 180;
      const r1 = j(75); const r2 = j(95);
      return `<line x1="${Math.round(cx+Math.cos(a)*r1)}" y1="${Math.round(hy+Math.sin(a)*r1)}" x2="${Math.round(cx+Math.cos(a)*r2)}" y2="${Math.round(hy+Math.sin(a)*r2)}" stroke="#FFD700" stroke-width="${j(3)}" stroke-linecap="round"/>`;
    }).join('');
    body = `
      ${rays}
      <circle cx="${j(cx)}" cy="${j(hy)}" r="${j(30)}" fill="${c1}" stroke="#333" stroke-width="${j(2.5)}"/>
      <circle cx="${j(cx-10)}" cy="${j(hy-6)}" r="${j(8)}" fill="white"/>
      <circle cx="${j(cx+10)}" cy="${j(hy-6)}" r="${j(8)}" fill="white"/>
      <circle cx="${j(cx-8)}" cy="${j(hy-4)}" r="${j(4)}" fill="#333"/>
      <circle cx="${j(cx+12)}" cy="${j(hy-4)}" r="${j(4)}" fill="#333"/>
      <path d="M ${j(cx-10)} ${j(hy+14)} Q ${j(cx)} ${j(hy+24)} ${j(cx+10)} ${j(hy+14)}" stroke="#333" stroke-width="${j(2)}" fill="none"/>
      <line x1="${j(cx)}" y1="${j(hy+30)}" x2="${j(cx)}" y2="${j(cy+52)}" stroke="#333" stroke-width="${j(5)}"/>
      <path d="M ${j(cx)},${j(hy+40)} L ${j(cx-52)},${j(cy+15)} L ${j(cx)},${j(cy+44)}" fill="${c2}" stroke="#333" stroke-width="2"/>
      <line x1="${j(cx)}" y1="${j(hy+52)}" x2="${j(cx-46)}" y2="${j(cy+18)}" stroke="#333" stroke-width="${j(3.5)}"/>
      <line x1="${j(cx)}" y1="${j(hy+52)}" x2="${j(cx+46)}" y2="${j(cy+18)}" stroke="#333" stroke-width="${j(3.5)}"/>
      <line x1="${j(cx)}" y1="${j(cy+52)}" x2="${j(cx-28)}" y2="${j(cy+100)}" stroke="#333" stroke-width="${j(4)}"/>
      <line x1="${j(cx)}" y1="${j(cy+52)}" x2="${j(cx+28)}" y2="${j(cy+100)}" stroke="#333" stroke-width="${j(4)}"/>`;

  } else if (hasSneaker) {
    body = `
      <ellipse cx="${j(cx)}" cy="${j(cy+45)}" rx="${j(100)}" ry="${j(20)}" fill="#333" opacity="0.15"/>
      <rect x="${j(cx-70)}" y="${j(cy-10)}" width="${j(140)}" height="${j(55)}" rx="${j(18)}" fill="${c1}" stroke="#333" stroke-width="${j(2.5)}"/>
      <rect x="${j(cx-80)}" y="${j(cy+22)}" width="${j(160)}" height="${j(22)}" rx="${j(10)}" fill="${c2}" stroke="#333" stroke-width="${j(2)}"/>
      <polygon points="${cx-j(60)},${cy-j(12)} ${cx-j(72)},${cy-j(50)} ${cx-j(20)},${cy-j(48)} ${cx-j(10)},${cy-j(12)}" fill="white" stroke="#333" stroke-width="${j(1.5)}"/>
      <line x1="${j(cx-30)}" y1="${j(cy-8)}" x2="${j(cx-30)}" y2="${j(cy+18)}" stroke="white" stroke-width="${j(2)}"/>
      <line x1="${j(cx)}" y1="${j(cy-6)}" x2="${j(cx)}" y2="${j(cy+18)}" stroke="white" stroke-width="${j(2)}"/>
      <line x1="${j(cx+30)}" y1="${j(cy-6)}" x2="${j(cx+30)}" y2="${j(cy+18)}" stroke="white" stroke-width="${j(2)}"/>`;

  } else if (hasBicycle) {
    body = `
      <circle cx="${j(cx-55)}" cy="${j(cy+30)}" r="${j(45)}" fill="none" stroke="#333" stroke-width="${j(5)}"/>
      <circle cx="${j(cx+55)}" cy="${j(cy+30)}" r="${j(45)}" fill="none" stroke="#333" stroke-width="${j(5)}"/>
      <circle cx="${j(cx-55)}" cy="${j(cy+30)}" r="${j(10)}" fill="#333"/>
      <circle cx="${j(cx+55)}" cy="${j(cy+30)}" r="${j(10)}" fill="#333"/>
      <line x1="${j(cx-55)}" y1="${j(cy+30)}" x2="${j(cx)}" y2="${j(cy-20)}" stroke="#333" stroke-width="${j(4)}"/>
      <line x1="${j(cx+55)}" y1="${j(cy+30)}" x2="${j(cx)}" y2="${j(cy-20)}" stroke="#333" stroke-width="${j(4)}"/>
      <line x1="${j(cx-55)}" y1="${j(cy+30)}" x2="${j(cx)}" y2="${j(cy+30)}" stroke="#333" stroke-width="${j(3)}"/>
      <line x1="${j(cx)}" y1="${j(cy+30)}" x2="${j(cx+55)}" y2="${j(cy+30)}" stroke="#333" stroke-width="${j(3)}"/>
      <line x1="${j(cx)}" y1="${j(cy-20)}" x2="${j(cx-18)}" y2="${j(cy-38)}" stroke="#333" stroke-width="${j(4)}"/>
      <line x1="${j(cx-18)}" y1="${j(cy-38)}" x2="${j(cx+22)}" y2="${j(cy-38)}" stroke="#333" stroke-width="${j(4)}"/>
      <ellipse cx="${j(cx+5)}" cy="${j(cy-42)}" rx="${j(16)}" ry="${j(8)}" fill="${c1}" stroke="#333" stroke-width="${j(2)}"/>
      <line x1="${j(cx)}" y1="${j(cy-20)}" x2="${j(cx+3)}" y2="${j(cy-42)}" stroke="#333" stroke-width="${j(3)}"/>`;

  } else if (hasClock) {
    body = `
      <circle cx="${j(cx)}" cy="${j(cy)}" r="${j(80)}" fill="white" stroke="#333" stroke-width="${j(5)}"/>
      <circle cx="${j(cx)}" cy="${j(cy)}" r="${j(8)}" fill="#333"/>
      <line x1="${j(cx)}" y1="${j(cy)}" x2="${j(cx-j(10,0.3))}" y2="${j(cy-j(55,0.5))}" stroke="#333" stroke-width="${j(5)}" stroke-linecap="round"/>
      <line x1="${j(cx)}" y1="${j(cy)}" x2="${j(cx+j(40,0.5))}" y2="${j(cy+j(18,0.3))}" stroke="#333" stroke-width="${j(4)}" stroke-linecap="round"/>
      ${Array.from({length:12}, (_,i) => { const a=(i*30-90)*Math.PI/180; const r1=j(62); const r2=j(74);
        return `<line x1="${Math.round(cx+Math.cos(a)*r1)}" y1="${Math.round(cy+Math.sin(a)*r1)}" x2="${Math.round(cx+Math.cos(a)*r2)}" y2="${Math.round(cy+Math.sin(a)*r2)}" stroke="#333" stroke-width="${i%3===0?j(3):j(1.5)}"/>`;
      }).join('')}
      ${(hasClock && p.includes('melt')) ? `<path d="M ${j(cx+60)} ${j(cy+20)} Q ${j(cx+90)} ${j(cy+70)} ${j(cx+75)} ${j(cy+130)}" stroke="#333" stroke-width="${j(3)}" fill="none"/>` : ''}`;

  } else if (hasSun) {
    const numRays = 8 + skill;
    const rays2 = Array.from({length: numRays}, (_, i) => {
      const a = (i * 360/numRays) * Math.PI / 180;
      const r1 = j(68); const r2 = j(96);
      return `<line x1="${Math.round(cx+Math.cos(a)*r1)}" y1="${Math.round(cy+Math.sin(a)*r1)}" x2="${Math.round(cx+Math.cos(a)*r2)}" y2="${Math.round(cy+Math.sin(a)*r2)}" stroke="#FFA500" stroke-width="${j(5)}" stroke-linecap="round"/>`;
    }).join('');
    body = `
      <rect width="300" height="300" fill="#87CEEB"/>
      ${rays2}
      <circle cx="${j(cx)}" cy="${j(cy)}" r="${j(60)}" fill="#FFD700" stroke="#FFA500" stroke-width="${j(3)}"/>
      <circle cx="${j(cx-18)}" cy="${j(cy-10)}" r="${j(9)}" fill="#333" opacity="0.8"/>
      <circle cx="${j(cx+18)}" cy="${j(cy-10)}" r="${j(9)}" fill="#333" opacity="0.8"/>
      <path d="M ${j(cx-20)} ${j(cy+18)} Q ${j(cx)} ${j(cy+34)} ${j(cx+20)} ${j(cy+18)}" stroke="#333" stroke-width="${j(3.5)}" fill="none" stroke-linecap="round"/>`;

  } else if (hasBanana) {
    body = `
      <path d="M ${j(cx-58)} ${j(cy+52)} Q ${j(cx-48)} ${j(cy-78)} ${j(cx+68)} ${j(cy-32)}" fill="none" stroke="#FFD700" stroke-width="${j(38)}" stroke-linecap="round"/>
      <path d="M ${j(cx-58)} ${j(cy+52)} Q ${j(cx-48)} ${j(cy-78)} ${j(cx+68)} ${j(cy-32)}" fill="none" stroke="#F0C030" stroke-width="${j(30)}" stroke-linecap="round"/>
      <path d="M ${j(cx-60)} ${j(cy+50)} Q ${j(cx-50)} ${j(cy-80)} ${j(cx+66)} ${j(cy-34)}" fill="none" stroke="#FFE566" stroke-width="${j(18)}" stroke-linecap="round"/>
      <line x1="${j(cx+67)}" y1="${j(cy-33)}" x2="${j(cx+60)}" y2="${j(cy-52)}" stroke="#8B4513" stroke-width="${j(4)}" stroke-linecap="round"/>
      <line x1="${j(cx-58)}" y1="${j(cy+52)}" x2="${j(cx-55)}" y2="${j(cy+68)}" stroke="#8B4513" stroke-width="${j(3)}" stroke-linecap="round"/>`;

  } else if (hasTree) {
    body = `
      <rect x="0" y="${j(242)}" width="300" height="60" fill="#7EC850"/>
      <rect x="${j(cx-14)}" y="${j(cy-8)}" width="${j(28)}" height="${j(98)}" fill="#8B6914" stroke="#5C4400" stroke-width="${j(2)}"/>
      <ellipse cx="${j(cx-4)}" cy="${j(cy-58)}" rx="${j(72)}" ry="${j(78)}" fill="${c1}" stroke="${c2}" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+34)}" cy="${j(cy-28)}" r="${j(12)}" fill="${c2}" opacity="0.7"/>
      <circle cx="${j(cx-38)}" cy="${j(cy-20)}" r="${j(10)}" fill="${c2}" opacity="0.7"/>
      <circle cx="${j(cx+12)}" cy="${j(cy-8)}" r="${j(11)}" fill="${c2}" opacity="0.7"/>
      <ellipse cx="${j(cx+42)}" cy="${j(cy-48)}" rx="${j(38)}" ry="${j(42)}" fill="${c1}" opacity="0.8"/>
      <ellipse cx="${j(cx-42)}" cy="${j(cy-40)}" rx="${j(42)}" ry="${j(46)}" fill="${c1}" opacity="0.8"/>`;

  } else {
    // Fallback: friendly creature facing the viewer
    body = `
      <ellipse cx="${j(cx)}" cy="${j(cy+8)}" rx="${j(68)}" ry="${j(78)}" fill="${c1}" stroke="#333" stroke-width="${j(3)}"/>
      <circle cx="${j(cx-22)}" cy="${j(cy-24)}" r="${j(13)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx+22)}" cy="${j(cy-24)}" r="${j(13)}" fill="white" stroke="#333" stroke-width="${j(2)}"/>
      <circle cx="${j(cx-20)}" cy="${j(cy-22)}" r="${j(6)}" fill="#222"/>
      <circle cx="${j(cx+24)}" cy="${j(cy-22)}" r="${j(6)}" fill="#222"/>
      <circle cx="${j(cx-18)}" cy="${j(cy-24)}" r="${j(2)}" fill="white"/>
      <circle cx="${j(cx+26)}" cy="${j(cy-24)}" r="${j(2)}" fill="white"/>
      <path d="M ${j(cx-20)} ${j(cy+18)} Q ${j(cx)} ${j(cy+35)} ${j(cx+20)} ${j(cy+18)}" stroke="#333" stroke-width="${j(3)}" fill="none" stroke-linecap="round"/>
      <ellipse cx="${j(cx-52)}" cy="${j(cy+10)}" rx="${j(14)}" ry="${j(9)}" fill="${c2}" opacity="0.7"/>
      <ellipse cx="${j(cx+52)}" cy="${j(cy+10)}" rx="${j(14)}" ry="${j(9)}" fill="${c2}" opacity="0.7"/>
      <text x="${j(cx)}" y="${j(cy+76)}" text-anchor="middle" font-size="${j(11)}" fill="${c2}" font-family="sans-serif" opacity="0.6">${prompt.slice(0,18)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${bg}"/>
    ${filt}
    <g filter="url(#h)">${body}</g>
    ${labelEl}
    <text x="${j(294)}" y="${j(18)}" text-anchor="end" font-size="9" fill="${c1}" font-family="sans-serif" opacity="0.4">age ${age}</text>
    <text x="${j(150)}" y="${j(295)}" text-anchor="middle" font-size="${j(9)}" fill="#bbb" font-family="sans-serif">${prompt.slice(0,26)}</text>
  </svg>`;
}


const MAGIC_STAMPS = [
  // 5-pointed star
  'M 150 100 L 161 137 L 200 137 L 169 160 L 181 197 L 150 175 L 119 197 L 131 160 L 100 137 L 139 137 Z',
  // Heart
  'M 150 195 C 100 170 82 140 82 118 C 82 95 100 82 122 90 C 134 95 143 106 150 118 C 157 106 166 95 178 90 C 200 82 218 95 218 118 C 218 140 200 170 150 195 Z',
  // Lightning bolt
  'M 165 90 L 133 152 L 157 152 L 137 215 L 177 147 L 152 147 Z',
  // Crown
  'M 88 195 L 88 140 L 113 163 L 150 112 L 187 163 L 212 140 L 212 195 Z',
  // Diamond
  'M 150 95 L 205 150 L 150 205 L 95 150 Z',
  // 8-pointed burst
  'M 150 95 L 161 133 L 198 115 L 177 145 L 210 150 L 177 155 L 198 185 L 161 167 L 150 205 L 139 167 L 102 185 L 123 155 L 90 150 L 123 145 L 102 115 L 139 133 Z',
  // Arrow / rocket
  'M 150 90 L 195 148 L 168 148 L 168 210 L 132 210 L 132 148 L 105 148 Z',
  // Flower (4-petal)
  'M 150 108 C 168 108 182 122 182 140 C 182 152 176 158 165 160 C 176 162 182 168 182 180 C 182 198 168 212 150 212 C 132 212 118 198 118 180 C 118 168 124 162 135 160 C 124 158 118 152 118 140 C 118 122 132 108 150 108 Z',
];

function getRandomStamp(): string {
  return MAGIC_STAMPS[Math.floor(Math.random() * MAGIC_STAMPS.length)];
}

export default function MultiDrawScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost } = route.params;
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { strokes, addStroke, updateStrokes, undo, canUndo } = useDrawing();
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    // Save human drawing (non-fatal if it fails)
    try {
      const svgData = strokesToSVG(strokesRef.current);
      await supabase.from('drawings').insert({
        match_id: matchId,
        player_id: userId,
        round_number: round,
        prompt,
        svg_data: svgData,
      });
    } catch (e) {
      console.warn('Failed to save drawing:', e);
    }

    if (isHost) {
      // Add bot drawings — each insert is individually wrapped so one failure
      // doesn't block the rest or prevent match progression
      const { data: bots } = await supabase.from('match_players').select('display_name', {
        eqs: [['match_id', matchId], ['is_bot', true]],
      });

      for (const _bot of (bots || [])) {
        try {
          await supabase.from('drawings').insert({
            match_id: matchId,
            player_id: null,
            round_number: round,
            prompt,
            svg_data: botSVG(prompt, _bot.display_name),
            ai_score: Math.floor(Math.random() * 40) + 20,
            ai_feedback: 'Bot did their best!',
          });
        } catch (e) {
          console.warn('Bot drawing insert failed:', e);
        }
      }

      // Advance match status so non-host clients see it via polling
      try {
        await supabase.from('matches').update({ status: 'voting' }).eq('id', matchId);
      } catch (e) {
        console.warn('Failed to advance match status:', e);
      }

      // Host navigates immediately — don't sit waiting for the 2-second poll
      navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
    }
  }, [matchId, userId, round, prompt, isHost, navigation, roomCode, username]);

  const { seconds, start } = useTimer(GAME_CONSTANTS.DRAW_TIME_SECONDS, submit);
  useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    const stamp = getRandomStamp();
    addStroke({ id: 'magic-' + Date.now(), points: stamp, color, size: 3, fillColor: color, isFill: false });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = () => Alert.alert('Submit drawing?', 'Are you done?', [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit!', onPress: submit },
  ]);

  const handleLeave = () => {
    Alert.alert(
      'Leave Game?',
      'Your drawing will not be saved. The game will continue without you.',
      [
        { text: 'Keep Drawing', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
        },
      ]
    );
  };

  // Listen for host moving to voting (polling-based) or match cancelled
  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (payload) => {
      const match = payload.new as any;
      if (match.status === 'voting') {
        navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
      }
      // 'finished' before voting means host left mid-game
      if (match.status === 'finished' && !submittedRef.current) {
        Alert.alert('Game Over', 'The host has left the game.', [{ text: 'OK' }]);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeave();
      return true;
    });

    return () => { unsub(); backHandler.remove(); };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.promptBox}>
          <Text style={styles.roundLabel}>Round {round}/{totalRounds} · {roomCode}</Text>
          <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
        </View>
        <TouchableOpacity style={[styles.doneBtn, submitted && styles.doneBtnDone]} onPress={handleDone} disabled={submitted}>
          <Text style={styles.doneBtnText}>{submitted ? 'Submitted!' : 'Done'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerRow}>
        <CountdownTimer seconds={seconds} totalSeconds={GAME_CONSTANTS.DRAW_TIME_SECONDS} onTimeUp={submit} />
      </View>
      <View style={styles.canvasContainer} pointerEvents={submitted ? 'none' : 'auto'}>
        <DrawingCanvas
          color={color} brushSize={brushSize} tool={tool}
          strokes={strokes} onStrokesChange={updateStrokes} onNewStroke={addStroke}
        />
      </View>
      <Toolbar
        selectedColor={color} selectedBrushSize={brushSize} selectedTool={tool}
        onColorSelect={setColor} onBrushSizeSelect={setBrushSize} onToolSelect={setTool}
        onUndo={undo} canUndo={canUndo}
        magicStampUsed={magicStampUsed} onMagicStamp={handleMagicStamp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  leaveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  leaveBtnText: { color: '#DC2626', fontWeight: '900', fontSize: 15 },
  promptBox: { flex: 1 },
  roundLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  promptText: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  doneBtnDone: { backgroundColor: '#22C55E' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { paddingHorizontal: 12, marginVertical: 6 },
  canvasContainer: { flex: 1, marginHorizontal: 4 },
});
