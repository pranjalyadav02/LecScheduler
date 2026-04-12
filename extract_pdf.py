import PyPDF2
import sys
import os

pdf_path = r"C:\Users\omen\Downloads\Updated_MCA_TT_Jan_May_12012026 (1).pdf"
output_path = "pdf_text.txt"

try:
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}", file=sys.stderr)
        sys.exit(1)

    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        print(f"Total pages: {len(reader.pages)}")
        
        full_text = ""
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            full_text += f"\n--- PAGE {i+1} ---\n" + text
        
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(full_text)
            
        print(f"Successfully extracted {len(reader.pages)} pages to {output_path}")
        
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
