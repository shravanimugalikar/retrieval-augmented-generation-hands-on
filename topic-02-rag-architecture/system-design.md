# Topic 2: Designing the RAG Blueprint

## Objective

The goal of this assignment is to visualize the complete Request Lifecycle of a Retrieval-Augmented Generation (RAG) system. The architecture consists of two major pipelines:

1. Ingestion Path
2. Retrieval Path

These pipelines work together to convert documents into searchable vector embeddings and generate grounded responses for user queries.

---

# 1. System Overview

This RAG system enables:

- Document Upload
- Background Processing
- Embedding Generation
- Vector Storage
- Semantic Search
- Grounded Response Generation

### Core Components

- React Client
- Express Backend API
- MongoDB
- Redis + BullMQ
- Worker Service
- Qdrant Vector Database
- OpenAI API

---

# 2. Ingestion Path

## Goal

Convert uploaded documents into searchable semantic vectors.

## Ingestion Flow

```text
User Uploads File
        ↓
Backend API
        ↓
Store Metadata in MongoDB
        ↓
Push Job to Queue (BullMQ)
        ↓
Worker Service
        ↓
Extract Text
        ↓
Chunk Text
        ↓
Generate Embeddings
        ↓
Store in Qdrant Vector Database
        ↓
Update Status = READY
```

## Step 1: File Upload

### Endpoint

```http
POST /documents/upload
```

### Responsibilities

- Validate file type
- Validate file size
- Store uploaded file
- Save metadata in MongoDB

Example metadata:

```json
{
  "documentId": "123",
  "fileName": "policy.pdf",
  "status": "PROCESSING"
}
```

---

## Step 2: Queue Processing

After storing metadata, the backend pushes a job to BullMQ.

```javascript
queue.add("process-document", {
  documentId
});
```

### Why Use a Queue?

- Embedding generation is time-consuming
- Improves user experience
- Supports retries
- Prevents API timeouts

---

## Step 3: Worker Processing

The Worker Service processes documents asynchronously.

### A. Text Extraction

Tools:

- PDF → pdf-parse
- DOCX → mammoth

### B. Chunking

Configuration:

- Chunk Size = 800 tokens
- Overlap = 150 tokens

Purpose:

- Preserve context
- Improve retrieval accuracy

### C. Embedding Generation

Generate embeddings using OpenAI's Embedding API.

Each chunk becomes a high-dimensional vector representing semantic meaning.

### D. Store in Qdrant

Example record:

```json
{
  "vector": [0.021, -0.883, 0.192, 0.774],
  "payload": {
    "userId": "user1",
    "docId": "123",
    "text": "Refund policy allows returns...",
    "page": 2
  }
}
```

### Final Step

Update document status:

```json
{
  "status": "READY"
}
```

---

## Benefits of Separate Ingestion

- Better scalability
- Improved reliability
- Background processing
- Faster user experience
- Independent worker scaling

---

# 3. Retrieval Path

## Goal

Answer user questions using semantically relevant document context.

## Retrieval Flow

```text
User Asks Question
        ↓
Backend API
        ↓
Generate Query Embedding
        ↓
Search Qdrant (Top K)
        ↓
Retrieve Relevant Chunks
        ↓
Construct Prompt
        ↓
Send to LLM
        ↓
Return Grounded Answer
```

---

## Step 1: Receive Query

### Endpoint

```http
POST /rag/query
```

Example Input:

```json
{
  "question": "What is the refund policy?"
}
```

---

## Step 2: Generate Query Embedding

Convert the user's question into a vector representation.

### Why?

Vector databases search vectors rather than raw text.

---

## Step 3: Search Vector Database

Search Qdrant using semantic similarity.

Configuration:

```javascript
topK = 5
```

Filter:

```javascript
userId = currentUserId
```

### Importance

Ensures multi-tenant isolation and user data security.

---

## Step 4: Retrieve Relevant Context

Example retrieved chunks:

```text
Chunk 1:
Refund policy allows returns within 30 days.

Chunk 2:
Digital products are non-refundable.
```

These chunks become the context for the LLM.

---

## Step 5: Prompt Construction

Example Prompt:

```text
Answer ONLY from the context below.

If the answer is not available, respond:

"I don't have enough information."

Context:
{retrieved_chunks}

Question:
{user_query}
```

This reduces hallucinations and keeps answers grounded.

---

## Step 6: Generate Answer

Send the prompt and context to GPT-4o-mini.

The model generates an answer based only on the retrieved information.

---

## Step 7: Return Response

Example Output:

```json
{
  "answer": "The refund policy allows returns within 30 days.",
  "sources": ["policy.pdf"]
}
```

---

# 4. System Architecture Diagram

```text
┌─────────────────┐
│  React Client   │
└─────────┬───────┘
          │
┌─────────▼─────────┐
│    Express API    │
└──────┬─────┬──────┘
       │     │
┌──────▼─┐ ┌─▼───────┐
│MongoDB │ │ Redis   │
└──────┬─┘ └─┬───────┘
       │      │
       └──┬───┘
          ▼
┌─────────────────┐
│ Worker Service  │
└─────────┬───────┘
          │
┌─────────▼─────────┐
│     Qdrant DB     │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│      OpenAI       │
└───────────────────┘
```

---

# 5. Sequence Diagram (Request Lifecycle)

## Ingestion Lifecycle

```text
User → API
API → MongoDB
API → Queue
Queue → Worker
Worker → OpenAI (Embeddings)
Worker → Qdrant
Worker → MongoDB (Status Update)
```

---

## Retrieval Lifecycle

```text
User → API
API → OpenAI (Query Embedding)
API → Qdrant (Search)
API → OpenAI (Answer Generation)
API → User
```

---

# Conclusion

This architecture separates ingestion and retrieval into independent pipelines to improve scalability, reliability, and performance. During ingestion, documents are transformed into vector embeddings and stored in Qdrant. During retrieval, user questions are converted into embeddings, matched against stored vectors, and used to generate grounded answers through a Large Language Model. This design forms the foundation of a production-ready Retrieval-Augmented Generation (RAG) system.