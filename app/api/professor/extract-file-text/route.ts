import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

function normalizeExtractedText(input: string): string {
  const withUnixNewlines = input.replace(/\r\n?|\u2028|\u2029/g, '\n');
  const collapsedSpaces = withUnixNewlines.replace(/[\t\u00a0]+/g, ' ');
  const trimmedLines = collapsedSpaces
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  return trimmedLines.trim();
}

export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Parse the request body
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    let extractedText = '';

    // Extract text based on file type
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    switch (fileExtension) {
      case 'pdf':
        try {
          // Dynamically import pdf-parse at runtime to avoid bundler test file resolution
          const { default: parsePdf } = await import('pdf-parse');
          
          // Extract text from PDF
          const pdfData = await parsePdf(fileBuffer as any);
          const rawPdfText = (pdfData as any).text || '';
          
          // Convert to temporary .txt file for consistency and auditing if needed
          const tmpDir = os.tmpdir();
          const tmpTxtPath = path.join(tmpDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
          await fs.writeFile(tmpTxtPath, rawPdfText, 'utf-8');
          
          try {
            // Read back from the .txt (ensures downstream text-only pipeline)
            const txtContent = await fs.readFile(tmpTxtPath, 'utf-8');
            extractedText = txtContent;
          } finally {
            // Clean up temp file
            await fs.unlink(tmpTxtPath).catch(() => {});
          }
        } catch (error: any) {
          console.error('PDF parsing error:', error);
          return NextResponse.json(
            { error: `Failed to parse PDF file: ${error.message || 'Unknown error'}` },
            { status: 400 }
          );
        }
        break;

      case 'docx':
        try {
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = result.value;
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to parse DOCX file' },
            { status: 400 }
          );
        }
        break;

      case 'txt':
        extractedText = fileBuffer.toString('utf-8');
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported file type: ${fileExtension}. Please upload PDF, DOCX, or TXT files.` },
          { status: 400 }
        );
    }

    // Normalize and validate the extracted text
    extractedText = normalizeExtractedText(extractedText);
    
    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json(
        { error: 'File appears to be empty or has insufficient content. Please upload a file with substantial text.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      text: extractedText,
      fileName: fileName,
      fileSize: file.size,
      extractedLength: extractedText.length
    });
    
  } catch (error: any) {
    console.error('Error extracting file text:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}

