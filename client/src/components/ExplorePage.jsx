import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap, FileText, Image, Music, Video, Archive, Code,
  GitMerge, Scissors, RotateCw, Trash2, FileOutput,
  FilePlus, Lock, Unlock, PenTool, Shield,
  ArrowRight, Star, TrendingUp, Globe, ChevronRight,
  FileImage, Droplet, ListOrdered, Tags, Layers,
  Minimize2, FlipVertical, Copy, PlusSquare, Crop, AlignCenter
} from 'lucide-react';

const converterCards = [
  { icon: Image,    label: 'Image Convert',  desc: 'PNG, JPG, WebP, AVIF, HEIC, PSD, RAW, JXL…', color: '#6366f1', from: 'Image',  badge: 'Popular' },
  { icon: FileText, label: 'Document',        desc: 'PDF, DOCX, EPUB, MOBI, FB2, DJVU, TEX…',    color: '#8b5cf6', from: 'Doc',    badge: null },
  { icon: Video,    label: 'Video Convert',   desc: 'MP4, MKV, MOV, WEBM, TS, VOB, MXF, MPG…',  color: '#ec4899', from: 'Video',  badge: 'New' },
  { icon: Music,    label: 'Audio Convert',   desc: 'MP3, FLAC, AAC, OGG, OPUS, AIFF, MIDI…',    color: '#f59e0b', from: 'Audio',  badge: null },
  { icon: Archive,  label: 'Archive Tools',   desc: 'ZIP, RAR, 7Z, TAR, BZ2, XZ, ISO, CAB…',     color: '#22c55e', from: 'Archive',badge: null },
  { icon: Code,     label: 'Code / Data',     desc: 'JSON, XML, CSV, YAML, TOML, NDJSON…',        color: '#06b6d4', from: 'Code',  badge: null },
  { icon: Zap,      label: 'Spreadsheet',     desc: 'XLSX, XLS, ODS, CSV, NUMBERS, XLSM…',        color: '#f59e0b', from: 'Spreadsheet', badge: 'New' },
  { icon: FileText, label: 'Presentation',    desc: 'PPTX, PPT, KEY, ODP, PPS, POTX…',           color: '#a855f7', from: 'Presentation', badge: null },
  { icon: FileText, label: 'eBook',           desc: 'EPUB, MOBI, AZW3, FB2, LIT, PDB…',           color: '#f43f5e', from: 'Ebook', badge: 'New' },
  { icon: Code,     label: 'Vector / Font',   desc: 'SVG, AI, EPS, DXF, TTF, OTF, WOFF…',        color: '#10b981', from: 'Vector', badge: null },
];

const pdfCards = [
  { id: 'merge',   icon: GitMerge,   label: 'Merge PDFs',    desc: 'Combine multiple PDFs',    color: '#6366f1' },
  { id: 'split',   icon: Scissors,   label: 'Split PDF',     desc: 'Divide into sections',     color: '#8b5cf6' },
  { id: 'rotate',  icon: RotateCw,   label: 'Rotate Pages',  desc: 'Fix orientations',         color: '#ec4899' },
  { id: 'delete',  icon: Trash2,     label: 'Delete Pages',  desc: 'Remove unwanted pages',    color: '#ef4444' },
  { id: 'extract', icon: FileOutput, label: 'Extract Pages', desc: 'Pull specific pages',      color: '#f59e0b' },
  { id: 'insert',  icon: FilePlus,   label: 'Insert Pages',  desc: 'Add from another PDF',     color: '#22c55e' },
  { id: 'protect', icon: Lock,       label: 'Protect PDF',   desc: 'Password protection',      color: '#f43f5e' },
  { id: 'unlock',  icon: Unlock,     label: 'Unlock PDF',    desc: 'Remove password',          color: '#fbbf24' },
  { id: 'sign',    icon: PenTool,    label: 'Sign PDF',      desc: 'Add image signature',      color: '#8b5cf6' },
  { id: 'esign',   icon: Shield,     label: 'eSign',         desc: 'Draw digital signature',   color: '#10b981' },
  { id: 'images',  icon: FileImage,  label: 'Image to PDF',  desc: 'Images to single PDF',     color: '#f43f5e' },
  { id: 'watermark', icon: Droplet,  label: 'Watermark',     desc: 'Add diagonal text',        color: '#06b6d4' },
  { id: 'numbers', icon: ListOrdered,label: 'Page Numbers',  desc: 'Add to bottom center',     color: '#8b5cf6' },
  { id: 'metadata',icon: Tags,       label: 'Metadata',      desc: 'Edit PDF properties',      color: '#eab308' },
  { id: 'flatten',     icon: Layers,       label: 'Flatten PDF',     desc: 'Lock form fields',           color: '#ef4444' },
  { id: 'compress',    icon: Minimize2,    label: 'Compress PDF',    desc: 'Shrink file size',            color: '#22c55e' },
  { id: 'reverse',     icon: FlipVertical, label: 'Reverse Pages',   desc: 'Flip page order',             color: '#a855f7' },
  { id: 'duplicate',   icon: Copy,         label: 'Duplicate Pages', desc: 'Clone specific pages',        color: '#06b6d4' },
  { id: 'blank',       icon: PlusSquare,   label: 'Add Blank Page',  desc: 'Insert empty page',           color: '#f59e0b' },
  { id: 'crop',        icon: Crop,         label: 'Crop Pages',      desc: 'Trim page margins',           color: '#f43f5e' },
  { id: 'headerfooter',icon: AlignCenter,  label: 'Header & Footer', desc: 'Add top/bottom text',         color: '#10b981' },
];

const stats = [
  { value: '150+', label: 'File Formats', icon: Globe },
  { value: '21',   label: 'PDF Tools',   icon: FileText },
  { value: '100%', label: 'Free to Use', icon: Star },
  { value: '∞',    label: 'Conversions', icon: TrendingUp },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function ExplorePage({ onGoConvert, onGoPdf }) {
  return (
    <div className="explore-page">

      {/* ── Hero ── */}
      <section className="hero">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <motion.div {...fadeUp(0.1)} className="hero-chip">
          <Zap size={12} /> Premium File Engine — v2.0
        </motion.div>

        <motion.h1 {...fadeUp(0.2)} className="hero-title">
          Convert anything.<br />
          <span className="hero-gradient">In seconds.</span>
        </motion.h1>

        <motion.p {...fadeUp(0.3)} className="hero-sub">
          The most powerful file conversion and PDF editing suite — beautifully designed,
          blazing fast, and completely free.
        </motion.p>

        <motion.div {...fadeUp(0.4)} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="hero-cta-primary" onClick={onGoConvert}>
            Start Converting <ArrowRight size={18} />
          </button>
          <button className="hero-cta-secondary" onClick={onGoPdf}>
            PDF Tools <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div {...fadeUp(0.5)} className="stats-row">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <s.icon size={16} className="stat-icon" />
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── File Converters ── */}
      <section className="explore-section">
        <motion.div {...fadeUp(0)} className="section-header">
          <div className="section-chip"><Zap size={12} /> File Converter</div>
          <h2 className="section-title">Convert Any File Format</h2>
          <p className="section-sub">Upload once, convert to dozens of formats instantly — powered by Nexify Engine</p>
        </motion.div>

        <div className="explore-grid">
          {converterCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                {...fadeUp(i * 0.07)}
                className="explore-card"
                onClick={onGoConvert}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ '--card-color': card.color }}
              >
                {card.badge && (
                  <span className={`card-badge ${card.badge === 'Popular' ? 'badge-popular' : 'badge-new'}`}>
                    {card.badge}
                  </span>
                )}
                <div className="explore-card-icon" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                  <Icon size={24} color={card.color} />
                </div>
                <h3 className="explore-card-title">{card.label}</h3>
                <p className="explore-card-desc">{card.desc}</p>
                <div className="explore-card-arrow">
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── PDF Tools ── */}
      <section className="explore-section">
        <motion.div {...fadeUp(0)} className="section-header">
          <div className="section-chip"><FileText size={12} /> PDF Suite</div>
          <h2 className="section-title">Complete PDF Toolkit</h2>
          <p className="section-sub">Everything you need to edit, protect, and manage PDF files</p>
        </motion.div>

        <div className="pdf-tools-grid">
          {pdfCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                {...fadeUp(i * 0.05)}
                className="pdf-tool-card"
                onClick={() => onGoPdf(card.id)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                style={{ '--card-color': card.color }}
              >
                <div className="pdf-tool-icon" style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                  <Icon size={20} color={card.color} />
                </div>
                <div>
                  <p className="pdf-tool-title">{card.label}</p>
                  <p className="pdf-tool-desc">{card.desc}</p>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.3, marginLeft: 'auto', flexShrink: 0 }} />
              </motion.div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
