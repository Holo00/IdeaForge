---
name: docx
description: Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with professional documents (.docx files) for (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks.
---

# DOCX Processing

## Overview

Work with Microsoft Word documents (.docx files) for creation, editing, analysis, and conversion.

## Reading/Analyzing Documents

### Text Extraction
Use pandoc for simple text extraction:
```bash
pandoc document.docx -t plain -o output.txt
```

### Raw XML Access
Unpack for direct access to comments, formatting, and metadata:
```bash
unzip document.docx -d document_unpacked/
```

## Creating New Documents

Use JavaScript/TypeScript with the docx library:

```typescript
import { Document, Paragraph, TextRun, Packer } from 'docx';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        children: [
          new TextRun("Hello World"),
        ],
      }),
    ],
  }],
});

// Export
const buffer = await Packer.toBuffer(doc);
```

## Editing Existing Documents

### Workflow
1. Unpack the DOCX file
2. Modify XML content directly
3. Repack the document

### Python Approach
```python
from docx import Document

doc = Document('input.docx')
for para in doc.paragraphs:
    if 'old text' in para.text:
        para.text = para.text.replace('old text', 'new text')
doc.save('output.docx')
```

## Redlining Workflow (Tracked Changes)

1. Convert to markdown first
2. Identify changes in logical batches (3-10 per group)
3. Unpack the document
4. Implement changes using precise XML edits
5. Only mark text that actually changes
6. Verify comprehensively

## Document Conversion

### DOCX to PDF
```bash
libreoffice --headless --convert-to pdf document.docx
```

### PDF to Images
```bash
pdftoppm -jpeg -r 150 document.pdf output
```

## Key Principles

- Read referenced documentation files completely without range limits
- Maintain minimal, precise edits when working with tracked changes
- Preserve original formatting when possible