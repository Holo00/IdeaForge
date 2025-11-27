---
name: xlsx
description: Comprehensive spreadsheet work including creation, editing, and analysis of Excel files (.xlsx, .xlsm, .csv, .tsv). When Claude needs to work with spreadsheets for data analysis, financial modeling, or any Excel-related tasks.
---

# XLSX Processing

## Overview

Work with Excel spreadsheets for creation, editing, data analysis, and financial modeling.

## Key Requirements

### Zero Formula Errors
All Excel deliverables must have no errors:
- `#REF!` - Invalid reference
- `#DIV/0!` - Division by zero
- `#VALUE!` - Wrong value type
- `#N/A` - Value not available
- `#NAME?` - Unrecognized name

### Template Preservation
When updating existing files, study and exactly match existing format, style, and conventions.

## Financial Model Standards

### Color Coding Convention
| Color | Usage |
|-------|-------|
| Blue text | Hardcoded inputs users will modify |
| Black text | All formulas and calculations |
| Green text | Links from other worksheets |
| Red text | External file links |
| Yellow background | Key assumptions requiring attention |

### Number Formatting
- Years as text strings ("2024" not "2,024")
- Currency: `$#,##0` with units in headers
- Zeros displayed as "-"
- Percentages: `0.0%` format
- Negative numbers in parentheses, not minus signs

## Python Libraries

### pandas - Data Analysis
```python
import pandas as pd

# Read Excel
df = pd.read_excel('input.xlsx', sheet_name='Sheet1')

# Process data
df['Total'] = df['Price'] * df['Quantity']

# Write Excel
df.to_excel('output.xlsx', index=False)
```

### openpyxl - Complex Formatting
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

wb = Workbook()
ws = wb.active

# Add data with formatting
ws['A1'] = 'Revenue'
ws['A1'].font = Font(bold=True)

# Add formula
ws['B10'] = '=SUM(B1:B9)'

wb.save('output.xlsx')
```

## Tool Selection

| Task | Tool |
|------|------|
| Data analysis | pandas |
| Bulk operations | pandas |
| Simple exports | pandas |
| Complex formatting | openpyxl |
| Formulas | openpyxl |
| Excel-specific features | openpyxl |

## Critical Rules

### Use Formulas, Not Hardcoded Values
Always employ Excel formulas instead of calculating in Python and embedding results. This maintains spreadsheet dynamism.

```python
# Good - uses formula
ws['C1'] = '=A1+B1'

# Bad - hardcoded result
ws['C1'] = 15  # Don't do this
```

### Documentation Requirements
Hardcoded values require comments citing:
- Source
- Date
- Location

Example: "Source: Company 10-K, FY2024, Page 45"

## Common Operations

### Reading Multiple Sheets
```python
xlsx = pd.ExcelFile('workbook.xlsx')
for sheet_name in xlsx.sheet_names:
    df = pd.read_excel(xlsx, sheet_name=sheet_name)
```

### Conditional Formatting
```python
from openpyxl.formatting.rule import ColorScaleRule

rule = ColorScaleRule(
    start_type='min', start_color='FF0000',
    end_type='max', end_color='00FF00'
)
ws.conditional_formatting.add('A1:A10', rule)
```

### Pivot Tables with pandas
```python
pivot = df.pivot_table(
    values='Sales',
    index='Region',
    columns='Product',
    aggfunc='sum'
)
```