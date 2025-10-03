import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedResumeData {
  text: string;
  name?: string;
  email?: string;
  phone?: string;
}

export async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

export async function parseDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseResume(file: File): Promise<ParsedResumeData> {
  let text = '';
  
  if (file.type === 'application/pdf') {
    text = await parsePDF(file);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    text = await parseDOCX(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
  
  return {
    text,
    // Basic extraction (will be enhanced by AI)
    email: extractEmail(text),
    phone: extractPhone(text),
  };
}

function extractEmail(text: string): string | undefined {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const match = text.match(emailRegex);
  return match ? match[0] : undefined;
}

function extractPhone(text: string): string | undefined {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : undefined;
}
