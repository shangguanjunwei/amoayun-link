#!/usr/bin/env python3
"""Generate the macOS installation presentation for Amoayun Link."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt
from pptx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "assets"
OUT = ROOT / "docs" / "amoayun-link-install-guide.pptx"

# ---- palette ----
INK = RGBColor(16, 24, 40)
MUTED = RGBColor(102, 112, 133)
GREEN = RGBColor(7, 193, 96)
GREEN_DARK = RGBColor(4, 120, 87)
GREEN_PALE = RGBColor(236, 253, 245)
LINE = RGBColor(229, 231, 235)
BG = RGBColor(246, 248, 251)
WHITE = RGBColor(255, 255, 255)
AMBER = RGBColor(180, 83, 9)
AMBER_PALE = RGBColor(255, 247, 237)
DARK = RGBColor(11, 18, 32)

FONT = "PingFang SC"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
TOTAL = 15


def rgb_hex(c):
    return str(c)


def add_rect(slide, x, y, w, h, fill=None, line=None, lw=1, radius=True, shape=MSO_SHAPE.ROUNDED_RECTANGLE, transparency=None):
    shp = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(lw)
    if transparency is not None:
        # a:alpha inside solidFill
        fill_el = shp.fill._xPr.find(qn("a:solidFill"))
        if fill_el is not None:
            clr = fill_el.find(qn("a:srgbClr"))
            if clr is not None:
                alpha = etree.SubElement(clr, qn("a:alpha"))
                alpha.set("val", str(int((1 - transparency) * 100000)))
    return shp


def add_text(slide, x, y, w, h, text, size=14, color=INK, bold=False, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, line_spacing=1.15, margin=0, font=FONT):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return box


def add_rich(slide, x, y, w, h, parts, size=14, color=INK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, line_spacing=1.15):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    for text, opts in parts:
        run = p.add_run()
        run.text = text
        run.font.name = FONT
        run.font.size = Pt(opts.get("size", size))
        run.font.bold = opts.get("bold", False)
        run.font.color.rgb = opts.get("color", color)
    return box


def add_pill(slide, x, y, w, h, text, fill=WHITE, color=MUTED, size=9, line=LINE):
    add_rect(slide, x, y, w, h, fill=fill, line=line, lw=0.8)
    add_text(slide, x, y, w, h, text, size=size, color=color, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def add_bg(slide, color=BG):
    add_rect(slide, 0, 0, 13.333, 7.5, fill=color, line=None, shape=MSO_SHAPE.RECTANGLE)
    # subtle corner glow
    add_rect(slide, 10.6, -1.5, 4.2, 4.2, fill=RGBColor(236, 253, 245), line=None, shape=MSO_SHAPE.OVAL, transparency=0.05)
    add_rect(slide, -1.8, 5.9, 3.6, 3.6, fill=RGBColor(239, 246, 255), line=None, shape=MSO_SHAPE.OVAL, transparency=0.18)


def add_header(slide, number, tag, title, desc):
    add_text(slide, 0.68, 0.38, 3.0, 0.28, f"STEP {number:02d}", size=10, color=GREEN_DARK, bold=True)
    add_pill(slide, 0.68, 0.70, 0.82, 0.28, tag, fill=GREEN_PALE, color=GREEN_DARK, size=9, line=RGBColor(187, 247, 208))
    add_text(slide, 0.68, 1.04, 3.75, 0.92, title, size=26, color=INK, bold=True, line_spacing=1.05)
    add_text(slide, 0.68, 2.02, 3.7, 1.0, desc, size=12, color=MUTED, line_spacing=1.4)


def add_footer(slide, page):
    add_rect(slide, 0.68, 6.94, 12.0, 0.005, fill=LINE, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, 0.68, 7.05, 6.4, 0.22, "@amoayun/dsh-amoayun-link-plugin", size=8, color=RGBColor(152, 162, 179))
    add_text(slide, 10.55, 7.05, 2.1, 0.22, f"{page:02d} / {TOTAL:02d}", size=8, color=RGBColor(152, 162, 179), align=PP_ALIGN.RIGHT)


def add_notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def image_size(path):
    with Image.open(path) as im:
        return im.width, im.height


def add_callout(slide, img_left, img_top, img_w, img_h, hotspot, label=None, line_color=GREEN):
    left = img_left + img_w * hotspot["left"] / 100.0
    top = img_top + img_h * hotspot["top"] / 100.0
    w = img_w * hotspot["width"] / 100.0
    h = img_h * hotspot["height"] / 100.0
    add_rect(slide, left, top, w, h, fill=None, line=line_color, lw=2.5, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    # corner handles
    for cx, cy in [(left, top), (left + w, top), (left, top + h), (left + w, top + h)]:
        add_rect(slide, cx - 0.045, cy - 0.045, 0.09, 0.09, fill=line_color, line=None, shape=MSO_SHAPE.OVAL)
    text = label or hotspot.get("label", "")
    if not text:
        return
    tw = max(0.72, min(2.4, 0.085 * len(text) + 0.32))
    th = 0.26
    tx = min(max(left + w / 2 - tw / 2, 0.72), 12.6 - tw)
    ty = top - th - 0.09
    if ty < 0.45:
        ty = top + h + 0.09
    add_rect(slide, tx, ty, tw, th, fill=GREEN_DARK, line=None)
    add_text(slide, tx, ty, tw, th, text, size=8.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def add_image_card(slide, path, left, top, max_w, max_h, hotspots=(), label=None):
    iw, ih = image_size(path)
    scale = min(max_w / iw, max_h / ih)
    w, h = iw * scale, ih * scale
    # shadow/frame
    add_rect(slide, left - 0.08, top - 0.08, w + 0.16, h + 0.16, fill=WHITE, line=LINE, lw=1)
    slide.shapes.add_picture(str(path), Inches(left), Inches(top), Inches(w), Inches(h))
    for hs in hotspots:
        add_callout(slide, left, top, w, h, hs)
    if label:
        add_pill(slide, left, top + h + 0.18, 1.5, 0.28, label, fill=WHITE, color=MUTED, size=8.5)
    return w, h


def add_cover():
    slide = prs.slides.add_slide(BLANK)
    add_rect(slide, 0, 0, 13.333, 7.5, fill=DARK, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_rect(slide, 9.4, -1.2, 5.2, 5.2, fill=RGBColor(6, 78, 59), line=None, shape=MSO_SHAPE.OVAL, transparency=0.25)
    add_rect(slide, -1.8, 5.1, 4.4, 4.4, fill=RGBColor(30, 64, 175), line=None, shape=MSO_SHAPE.OVAL, transparency=0.35)
    add_pill(slide, 0.78, 0.72, 2.25, 0.32, "macOS · DEEPSEEK HARNESS", fill=RGBColor(6, 78, 59), color=RGBColor(167, 243, 208), size=8.5, line=RGBColor(4, 120, 87))
    add_text(slide, 0.78, 1.35, 7.6, 0.72, "Amoayun Link", size=48, color=WHITE, bold=True)
    add_text(slide, 0.78, 2.20, 7.0, 0.72, "macOS 安装指南", size=34, color=RGBColor(167, 243, 208), bold=True)
    add_text(slide, 0.80, 3.18, 6.1, 0.62, "从下载 DeepSeek Harness 到第一次对话", size=16, color=RGBColor(203, 213, 225))
    add_text(slide, 0.80, 4.02, 6.2, 0.30, "@amoayun/dsh-amoayun-link-plugin", size=12, color=RGBColor(134, 239, 172))
    for i, (num, label) in enumerate([("13", "步骤"), ("5", "分钟"), ("2.3.4", "插件版本")]):
        x = 0.80 + i * 2.05
        add_text(slide, x, 5.0, 1.3, 0.36, num, size=20, color=WHITE, bold=True)
        add_text(slide, x, 5.38, 1.2, 0.24, label, size=9, color=RGBColor(148, 163, 184))
    # decorative app window
    add_rect(slide, 8.15, 1.25, 4.5, 4.9, fill=RGBColor(15, 23, 42), line=RGBColor(51, 65, 85), lw=1)
    add_rect(slide, 8.8, 1.9, 3.55, 3.55, fill=RGBColor(248, 250, 252), line=None)
    add_rect(slide, 8.8, 1.9, 0.72, 3.55, fill=RGBColor(226, 232, 240), line=None)
    for j, ww in enumerate([1.9, 1.5, 2.4, 1.7]):
        add_rect(slide, 9.72, 2.35 + j * 0.38, ww, 0.12, fill=RGBColor(203, 213, 225), line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    add_rect(slide, 10.7, 5.55, 1.55, 0.48, fill=GREEN, line=None)
    add_text(slide, 10.7, 5.55, 1.55, 0.48, "Amoayun Link", size=8.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 0.80, 6.78, 8.0, 0.24, "安装完成后请重启 DeepSeek Harness", size=9, color=RGBColor(251, 191, 36), bold=True)
    add_notes(slide, "开场：这份演示从下载 DeepSeek Harness 开始，完整走一遍 Amoayun Link 在 macOS 桌面端的安装、重启、扫码和权限设置。")


def add_overview():
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_text(slide, 0.68, 0.58, 3.0, 0.28, "OVERVIEW", size=10, color=GREEN_DARK, bold=True)
    add_text(slide, 0.68, 0.90, 7.4, 0.62, "四步完成接入", size=30, color=INK, bold=True)
    add_text(slide, 0.70, 1.55, 8.8, 0.38, "安装完成后，右下角的 Amoayun Link 会接管 vx 消息与 DSH Agent。", size=12, color=MUTED)
    cards = [
        ("01", "下载 & 安装", "DeepSeek Harness\n桌面端"),
        ("02", "安装 & 启用", "Amoayun Link\n插件"),
        ("03", "重启 & 绑定", "重启 DSH\n扫码登录 vx"),
        ("04", "权限 & 测试", "访问控制\n发送测试消息"),
    ]
    for i, (num, title, desc) in enumerate(cards):
        x = 0.68 + i * 3.02
        add_rect(slide, x, 2.28, 2.75, 2.6, fill=WHITE, line=LINE, lw=1)
        add_text(slide, x + 0.22, 2.50, 0.55, 0.35, num, size=18, color=GREEN, bold=True)
        add_text(slide, x + 0.22, 3.00, 2.25, 0.33, title, size=15, color=INK, bold=True)
        add_text(slide, x + 0.22, 3.46, 2.25, 0.8, desc, size=11, color=MUTED, line_spacing=1.35)
        if i < 3:
            add_text(slide, x + 2.78, 3.30, 0.2, 0.3, "→", size=15, color=GREEN, bold=True)
    add_rect(slide, 0.68, 5.4, 12.0, 0.82, fill=AMBER_PALE, line=RGBColor(253, 230, 138), lw=1)
    add_text(slide, 0.92, 5.40, 0.4, 0.82, "!", size=18, color=AMBER, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 1.35, 5.40, 10.8, 0.82, "关键：安装并点击「立即启用」后，必须重启 DeepSeek Harness 桌面端。", size=13, color=AMBER, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 0.68, 6.62, 4.0, 0.24, "macOS · 13 个步骤", size=9, color=RGBColor(152, 162, 179))
    add_footer(slide, 2)
    add_notes(slide, "先给用户一个全貌：四步，13 个小步骤。强调安装启用后必须重启。")


def add_image_step(page, number, tag, title, desc, image, hotspots, hint, notes, package_input=False):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, number, tag, title, desc)
    if package_input:
        add_rect(slide, 0.68, 3.14, 3.72, 0.48, fill=DARK, line=None)
        add_text(slide, 0.63, 3.16, 3.55, 0.44, "@amoayun/dsh-amoayun-link-plugin", size=9.5, color=RGBColor(209, 250, 229), bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_image_card(slide, ASSETS / image, 4.55, 1.28, 8.05, 5.35, hotspots)
    add_text(slide, 0.68, 6.18, 3.6, 0.46, hint, size=10, color=MUTED, line_spacing=1.3)
    add_footer(slide, page)
    add_notes(slide, notes)


def add_restart(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 8, "关键", "必须重启 DeepSeek Harness", "安装并启用插件后，直接退出 DSH，然后重新打开。")
    add_rect(slide, 0.68, 3.18, 12.0, 0.82, fill=AMBER_PALE, line=RGBColor(253, 230, 138), lw=1)
    add_text(slide, 0.92, 3.18, 0.4, 0.82, "!", size=18, color=AMBER, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 1.35, 3.18, 10.9, 0.82, "安装成功不等于已经加载。无论是否出现重启提示，都必须重启一次。", size=13, color=AMBER, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    # mac menu mock
    add_rect(slide, 1.05, 4.22, 7.25, 1.95, fill=WHITE, line=LINE, lw=1)
    add_rect(slide, 1.05, 4.22, 7.25, 0.38, fill=RGBColor(243, 244, 246), line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, 1.20, 4.24, 0.3, 0.34, "●", size=10, color=DARK, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 1.50, 4.24, 2.15, 0.34, "DeepSeek Harness", size=9, color=INK, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    for i, t in enumerate(["文件", "Edit", "Window"]):
        add_text(slide, 3.35 + i * 0.65, 4.24, 0.65, 0.34, t, size=8.5, color=MUTED, anchor=MSO_ANCHOR.MIDDLE)
    add_rect(slide, 5.8, 4.58, 2.05, 1.22, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 5.95, 4.68, 1.65, 0.26, "关于 DeepSeek Harness", size=7.5, color=MUTED)
    add_text(slide, 5.95, 4.95, 1.65, 0.26, "设置…", size=7.5, color=MUTED)
    add_rect(slide, 5.9, 5.22, 1.82, 0.32, fill=GREEN_PALE, line=None)
    add_text(slide, 5.98, 5.22, 1.65, 0.32, "退出 DeepSeek Harness", size=7.5, color=GREEN_DARK, bold=True)
    add_text(slide, 9.05, 4.55, 2.9, 0.45, "完全退出", size=22, color=AMBER, bold=True)
    add_text(slide, 9.05, 5.08, 2.5, 0.35, "然后重新打开 DSH", size=13, color=AMBER)
    add_footer(slide, page)
    add_notes(slide, "这是最关键的一页：安装和启用都不是加载。演示时直接告诉用户现在退出 DSH，再重新打开，不要只刷新页面。")


def add_launcher(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 9, "入口", "打开右下角 Amoayun Link", "重启 DSH 后，窗口右下角会出现绿色悬浮按钮。")
    add_rect(slide, 0.68, 3.18, 12.0, 3.1, fill=DARK, line=RGBColor(30, 41, 59), lw=1)
    add_rect(slide, 1.05, 3.55, 9.0, 2.35, fill=RGBColor(248, 250, 252), line=None)
    add_rect(slide, 1.05, 3.55, 1.7, 2.35, fill=RGBColor(226, 232, 240), line=None)
    for i, w in enumerate([2.1, 3.1, 2.6]):
        add_rect(slide, 3.1, 3.90 + i * 0.35, w, 0.12, fill=RGBColor(203, 213, 225), line=None)
    add_rect(slide, 10.1, 5.28, 2.05, 0.58, fill=GREEN, line=None)
    add_text(slide, 10.1, 5.28, 2.05, 0.58, "Amoayun Link  1", size=10, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 10.1, 6.0, 2.1, 0.24, "右下角入口", size=9, color=RGBColor(187, 247, 208), bold=True)
    add_footer(slide, page)
    add_notes(slide, "重启后先找右下角绿色按钮。找不到时先确认插件已启用，再完全退出并重新打开 DSH。")


def add_qr(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 10, "vx", "添加 vx 并扫码登录", "进入账户设置，点击添加 vx，然后用 vx 扫描 DSH 面板中的真实二维码。")
    # panel
    add_rect(slide, 1.0, 3.10, 8.2, 3.35, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 1.25, 3.28, 4.0, 0.3, "Amoayun Link", size=14, color=INK, bold=True)
    add_text(slide, 1.25, 3.60, 7.2, 0.24, "扫码接入 vx，文字、图片、文件和语音自动进入 Agent", size=8.5, color=MUTED)
    add_rect(slide, 1.25, 3.95, 7.7, 0.33, fill=RGBColor(226, 232, 240), line=None)
    add_rect(slide, 4.15, 3.95, 4.8, 0.33, fill=WHITE, line=LINE, lw=0.5)
    add_text(slide, 1.4, 3.95, 3.0, 0.33, "插件设置", size=8, color=MUTED, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 5.0, 3.95, 3.0, 0.33, "账户设置", size=8, color=INK, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rect(slide, 1.25, 4.44, 6.55, 0.36, fill=WHITE, line=LINE, lw=0.7)
    add_text(slide, 1.4, 4.44, 4.5, 0.36, "账号备注，例如：工作号", size=8, color=MUTED, anchor=MSO_ANCHOR.MIDDLE)
    add_rect(slide, 7.90, 4.44, 1.02, 0.36, fill=GREEN, line=None)
    add_text(slide, 7.90, 4.44, 1.02, 0.36, "添加 vx", size=8, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rect(slide, 1.25, 4.96, 7.7, 0.55, fill=WHITE, line=LINE, lw=0.7)
    add_rect(slide, 1.38, 5.05, 0.34, 0.34, fill=RGBColor(20, 184, 166), line=None)
    add_text(slide, 1.38, 5.05, 0.34, 0.34, "消", size=7, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 1.82, 4.99, 2.4, 0.2, "工作号", size=9, color=INK, bold=True)
    add_text(slide, 1.82, 5.20, 2.4, 0.18, "等待扫码", size=7, color=MUTED)
    add_pill(slide, 7.75, 5.06, 0.88, 0.24, "等待扫码", fill=AMBER_PALE, color=AMBER, size=6.5, line=RGBColor(253, 230, 138))
    # qr card
    add_rect(slide, 9.55, 3.10, 2.85, 3.35, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 9.72, 3.28, 2.5, 0.24, "扫码示意", size=9, color=MUTED, bold=True)
    slide.shapes.add_picture(str(ASSETS / "qr-mock.png"), Inches(10.05), Inches(3.60), Inches(1.75), Inches(1.75))
    add_rect(slide, 10.12, 4.42, 1.6, 0.025, fill=GREEN, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, 9.75, 5.55, 2.5, 0.5, "二维码仅为示意\n请扫描 DSH 面板中的真实二维码", size=7, color=MUTED, align=PP_ALIGN.CENTER, line_spacing=1.2)
    add_text(slide, 9.75, 6.02, 2.4, 0.24, "不要把二维码发给别人", size=7, color=AMBER, bold=True, align=PP_ALIGN.CENTER)
    add_footer(slide, page)
    add_notes(slide, "演示时强调：二维码以实际面板为准，教程里的二维码只是示意，不要扫。扫码后用 vx 确认授权。")


def add_online(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 11, "vx", "确认账号在线", "扫码成功后，账号状态会从「等待扫码」变成「在线」。")
    add_rect(slide, 0.68, 3.18, 12.0, 2.55, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 0.95, 3.38, 4.0, 0.3, "账户详情", size=14, color=INK, bold=True)
    add_rect(slide, 0.95, 3.85, 11.45, 0.88, fill=WHITE, line=LINE, lw=1)
    add_rect(slide, 1.12, 4.02, 0.52, 0.52, fill=RGBColor(20, 184, 166), line=None)
    add_text(slide, 1.12, 4.02, 0.52, 0.52, "消", size=13, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 1.82, 4.02, 2.8, 0.28, "工作号", size=14, color=INK, bold=True)
    add_text(slide, 1.82, 4.31, 2.8, 0.20, "已登录", size=9, color=MUTED)
    add_pill(slide, 10.95, 4.12, 1.1, 0.32, "● 在线", fill=GREEN_PALE, color=GREEN_DARK, size=9, line=RGBColor(187, 247, 208))
    add_text(slide, 1.0, 5.0, 10.8, 0.24, "账号已连接，联系人消息会自动进入 Agent。", size=10, color=GREEN_DARK)
    add_footer(slide, page)
    add_notes(slide, "看到在线状态再让联系人发消息。账号不在线时，消息不会进入 Agent。")


def add_access(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 12, "安全", "建议开启访问控制", "只允许可信联系人触发 Agent，避免陌生人消耗额度或调用本机工具。")
    add_rect(slide, 0.68, 3.18, 12.0, 2.85, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 0.95, 3.40, 4.0, 0.3, "账户详情", size=14, color=INK, bold=True)
    add_rect(slide, 0.95, 3.90, 11.45, 0.72, fill=WHITE, line=LINE, lw=1)
    add_text(slide, 1.15, 3.99, 4.2, 0.24, "仅允许已授权联系人", size=12, color=INK, bold=True)
    add_text(slide, 1.15, 4.23, 5.5, 0.22, "未授权用户不会进入 Agent", size=8.5, color=MUTED)
    add_rect(slide, 10.95, 4.03, 0.95, 0.42, fill=GREEN, line=None)
    add_rect(slide, 11.45, 4.08, 0.34, 0.32, fill=WHITE, line=None, shape=MSO_SHAPE.OVAL)
    add_rect(slide, 0.95, 4.86, 11.45, 0.62, fill=GREEN_PALE, line=RGBColor(187, 247, 208), lw=1)
    add_text(slide, 1.15, 4.92, 1.6, 0.2, "配对码", size=9, color=MUTED, bold=True)
    add_text(slide, 2.55, 4.88, 1.8, 0.3, "••••••", size=18, color=GREEN_DARK, bold=True)
    add_text(slide, 9.15, 4.96, 2.8, 0.22, "仅发给可信联系人", size=8.5, color=GREEN_DARK, align=PP_ALIGN.RIGHT)
    add_text(slide, 0.95, 5.62, 10.8, 0.22, "已授权用户可以正常聊天，也可以使用 Agent 的完全权限。", size=8.5, color=AMBER)
    add_footer(slide, page)
    add_notes(slide, "访问控制只决定谁可以触发 Agent，不限制已授权用户的工具权限。把配对码单独发给可信联系人。")


def add_done(page):
    slide = prs.slides.add_slide(BLANK)
    add_bg(slide)
    add_header(slide, 13, "完成", "安装完成", "让联系人发一条测试消息，确认会话创建和回复都正常。")
    add_rect(slide, 0.68, 3.14, 12.0, 2.95, fill=GREEN_PALE, line=RGBColor(187, 247, 208), lw=1)
    add_rect(slide, 5.95, 3.42, 1.4, 1.4, fill=WHITE, line=RGBColor(187, 247, 208), lw=1, shape=MSO_SHAPE.OVAL)
    add_text(slide, 5.95, 3.42, 1.4, 1.4, "✓", size=42, color=GREEN, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, 4.0, 5.0, 5.3, 0.45, "Amoayun Link 已就绪", size=22, color=INK, bold=True, align=PP_ALIGN.CENTER)
    add_text(slide, 3.9, 5.50, 5.5, 0.28, "在联系人会话里发送消息，即可开始使用。", size=10, color=MUTED, align=PP_ALIGN.CENTER)
    add_footer(slide, page)
    add_notes(slide, "最后做一条测试消息。如果收不到，先检查账号在线、访问控制和是否重启过 DSH。")


# cover + overview
add_cover()
add_overview()

# steps
add_image_step(3, 1, "准备", "下载 DeepSeek Harness", "打开 DeepSeek 官网，选择 macOS 版本。下载完成后安装并打开 DSH。",
               "001.jpg", [{"left": 57.5, "top": 77.4, "width": 10.9, "height": 4.6, "label": "Harness 桌面端"}],
               "只支持 macOS。安装完成后，按 macOS 常规方式打开。",
               "第一步：打开 DeepSeek 官网，下载 macOS 版 DeepSeek Harness，安装并打开。")
add_image_step(4, 2, "插件", "进入「插件」页面", "打开 DeepSeek Harness，在左侧边栏点击「插件」。",
               "002.jpg", [{"left": 1.3, "top": 17.4, "width": 16.2, "height": 3.8, "label": "插件"}],
               "截图中的工作区和联系人信息已打码。",
               "第二步：在左侧边栏找到插件入口。这里也是后续管理账号和配置的地方。")
add_image_step(5, 3, "插件", "点击「添加插件」", "在插件页面右上角点击「添加插件」。",
               "002.jpg", [{"left": 82.2, "top": 9.2, "width": 8.3, "height": 3.5, "label": "添加插件"}],
               "不要点旁边的下拉箭头，直接点「添加插件」。",
               "第三步：点击右上角添加插件，打开安装弹窗。")
add_image_step(6, 4, "插件", "输入插件包名", "在包名输入框里填写完整包名。",
               "004.jpg", [{"left": 17.8, "top": 39.5, "width": 39.9, "height": 3.9, "label": "包名输入框"}],
               "包名必须完整，包括 @amoayun/ 前缀。",
               "第四步：输入完整包名 @amoayun/dsh-amoayun-link-plugin。", package_input=True)
add_image_step(7, 5, "插件", "点击「安装」", "确认包名、版本和来源无误后，点击安装。第三方插件会显示信任提示。",
               "004.jpg", [{"left": 17.8, "top": 65.6, "width": 39.9, "height": 4.0, "label": "安装"}],
               "当前版本为 2.3.4。只安装你信任的来源。",
               "第五步：确认来源，点击安装。安装过程不要关闭窗口。")
add_image_step(8, 6, "插件", "等待安装完成", "DSH 会显示插件安装中。等待进度结束。",
               "005.jpg", [], "安装过程会下载并检查插件依赖。",
               "第六步：等待安装完成。不要关闭 DSH 或安装窗口。")
add_image_step(9, 7, "插件", "点击「立即启用」", "看到已安装后，点击「立即启用」。",
               "006.jpg", [{"left": 17.8, "top": 62.4, "width": 40.0, "height": 4.5, "label": "立即启用"}],
               "启用后先不要扫码，下一步必须先重启 DSH。",
               "第七步：点击立即启用。接下来是最关键的一步：重启。")
add_restart(10)
add_launcher(11)
add_qr(12)
add_online(13)
add_access(14)
add_done(15)

prs.core_properties.title = "Amoayun Link macOS 安装指南"
prs.core_properties.author = "Amoayun"
prs.core_properties.subject = "DeepSeek Harness 桌面端插件安装教程"
prs.core_properties.comments = "macOS only. Masked screenshots; QR is illustrative."

OUT.parent.mkdir(parents=True, exist_ok=True)
prs.save(OUT)
print(f"generated {OUT} ({OUT.stat().st_size} bytes)")
