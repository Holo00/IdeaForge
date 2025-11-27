---
name: pdf
description: Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF form or programmatically process, generate, or analyze PDF documents at scale.
---

# PDF Processing

## Overview

Work with PDF documents for text extraction, creation, manipulation, and form handling.

## Python Libraries

### pypdf - Basic Operations
```python
from pypdf import PdfReader, PdfWriter

# Read PDF
reader = PdfReader("input.pdf")
text = reader.pages[0].extract_text()

# Merge PDFs
writer = PdfWriter()
writer.append("file1.pdf")
writer.append("file2.pdf")
writer.write("merged.pdf")

# Split PDF
writer = PdfWriter()
writer.add_page(reader.pages[0])
writer.write("page1.pdf")
```

### pdfplumber - Text and Tables
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    page = pdf.pages[0]

    # Extract text with layout
    text = page.extract_text()

    # Extract tables
    tables = page.extract_tables()
```

### reportlab - PDF Creation
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("output.pdf", pagesize=letter)
c.drawString(100, 750, "Hello World")
c.save()
```

## Command-Line Tools

### Text Extraction (poppler-utils)
```bash
pdftotext document.pdf output.txt
pdftotext -layout document.pdf output.txt  # Preserve layout
```

### Page Manipulation (qpdf)
```bash
qpdf input.pdf --pages . 1-5 -- output.pdf  # Extract pages
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf
```

### pdftk Operations
```bash
pdftk input.pdf output output.pdf user_pw password  # Add password
pdftk input.pdf cat 1-5 output first5.pdf  # Extract pages
```

## Advanced Operations

### OCR for Scanned Documents
```python
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path('scanned.pdf')
text = pytesseract.image_to_string(images[0])
```

### Table to DataFrame
```python
import pandas as pd
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    table = pdf.pages[0].extract_tables()[0]
    df = pd.DataFrame(table[1:], columns=table[0])
    df.to_excel("output.xlsx", index=False)
```

## Tool Selection Guide

| Task | Tool |
|------|------|
| Simple text extraction | pypdf |
| Layout-aware extraction | pdfplumber |
| Table extraction | pdfplumber |
| PDF creation | reportlab |
| Merge/split | pypdf or qpdf |
| Form filling | pypdf |
| OCR | pytesseract + pdf2image |