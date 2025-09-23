export async function generateEmbeddingsForJournal(journalId: string, force: boolean = false) {
  try {
    console.log("Triggering embedding generation for journal:", journalId);
    
    const response = await fetch('/api/chat/generate-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ journalId, force }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Embeddings generated successfully:', result);
      return { success: true, data: result };
    } else {
      console.error('Failed to generate embeddings:', result);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error triggering embedding generation:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Batch generate embeddings for all journals without embeddings
export async function generateMissingEmbeddings() {
  try {
    const response = await fetch('/api/chat/generate-all-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating missing embeddings:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Test function
export async function testEmbeddingGeneration() {
  try {
    const response = await fetch('/api/test-embeddings');
    const result = await response.json();
    
    console.log('Embedding test result:', result);
    return result;
  } catch (error) {
    console.error('Error testing embeddings:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}