import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { Conversation, Message } from '@/types/conversation';

// Specify Node.js runtime for file system access
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const full = searchParams.get('full') === 'true';

    // Check if at least userId or role is provided
    if (!userId && !role) {
      return NextResponse.json(
        { error: 'userId or role parameter is required' },
        { status: 400 }
      );
    }



    // Read all conversation files from public/data directory
    const dataDir = join(process.cwd(), 'public', 'data');
    const files = await readdir(dataDir);
    
    // Filter only conv-*.json files
    const convFiles = files.filter(file => file.startsWith('conv-') && file.endsWith('.json'));
    
    // Load and filter conversations
    const conversations = [];
    
    for (const file of convFiles) {
      try {
        const filePath = join(dataDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const conversation = JSON.parse(fileContent);
        
        // Apply filters
        let include = false;
        
        // If role is provided (HR/DRH), include all conversations or filter by category
        if (role === 'hr' || role === 'drh' || role === 'payroll') {
          include = true;
          
          // If category filter is specified, apply it
          if (category && conversation.request) {
            include = conversation.request.category === category;
          }
        } else if (userId) {
          // Filter by userId for regular users
          include = conversation.userId === userId;
        }
        
        if (include) {
          if (full) {
            // Return full conversation
            conversations.push(conversation);
          } else {
            // Return only metadata
            conversations.push({
              id: conversation.id,
              userId: conversation.userId,
              title: conversation.title,
              messages: conversation.messages,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              category: conversation.category,
              request: conversation.request ? {
                id: conversation.request.id,
                status: conversation.request.status,
                priority: conversation.request.priority
              } : undefined
            });
          }
        }
      } catch (err) {
        console.error(`Error loading conversation file ${file}:`, err);
        // Continue with other files
      }
    }
    
    // Sort by createdAt descending (most recent first)
    conversations.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({ conversations });
    
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    // Validate required fields
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      );
    }

    // Generate a unique conversation ID
    // This is a simple approach - in production you'd want something more robust
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const conversationId = `conv-${timestamp}-${randomNum}`;

    // Create the initial conversation structure
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: conversationId,
      userId: userId,
      title: "Nouvelle conversation",
      subtitle: `Créée le ${new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      messages: [
        {
          id: 'msg-1',
          type: 'question',
          content: message,
          timestamp: now,
          author: 'user'
        }
      ],
      category: 'Général',
      tags: [],
      complexity: 'low',
      createdAt: now,
      updatedAt: now
    };

    // Return the created conversation with its ID
    return NextResponse.json({
      success: true,
      conversation: conversation,
      conversationId: conversationId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
