import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// Use legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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
          // Use pdfjs-dist for PDF parsing with Node.js compatibility
          // Convert Buffer to Uint8Array as required by pdfjs-dist
          const uint8Array = new Uint8Array(fileBuffer);
          
          // Use disableAutoFetch to prevent issues in Node.js
          const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useSystemFonts: true,
            disableAutoFetch: true,
            disableStream: true,
          });
          
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          
          // Extract text from all pages
          const textPromises = [];
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            textPromises.push(pageText);
          }
          
          extractedText = (await Promise.all(textPromises)).join('\n\n');
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

    // Clean up the extracted text
    extractedText = extractedText.trim();
    
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

