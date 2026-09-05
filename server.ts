import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
    },
  });

  app.use(express.json());

  // In-memory state for rooms
  const rooms = new Map<string, any>();

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/generate-problem', async (req, res) => {
    try {
      const { difficulty, topic } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a competitive programming problem. Difficulty: ${difficulty || 'medium'}. Topic: ${topic || 'random'}. Return ONLY a JSON object with this schema.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    output: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                },
              },
              constraints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              hiddenTestCases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    expectedOutput: { type: Type.STRING },
                  },
                },
              },
            },
            required: ['title', 'description', 'difficulty', 'examples', 'constraints', 'hiddenTestCases'],
          },
        },
      });

      const problem = JSON.parse(response.text || '{}');
      res.json(problem);
    } catch (error) {
      console.error('Error generating problem:', error);
      res.status(500).json({ error: 'Failed to generate problem' });
    }
  });

  app.post('/api/evaluate', async (req, res) => {
    try {
      const { code, language, problem } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Evaluate the following ${language} code against the given problem and hidden test cases. 
        Code: 
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Problem: ${JSON.stringify(problem)}
        
        Determine if the code is correct and passes all test cases (both example and hidden). 
        Return a JSON object with this schema.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              allPassed: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING },
              testResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    input: { type: Type.STRING },
                    expected: { type: Type.STRING },
                    actual: { type: Type.STRING },
                  }
                }
              }
            },
            required: ['allPassed', 'feedback', 'testResults']
          }
        }
      });
      const evaluation = JSON.parse(response.text || '{}');
      res.json(evaluation);
    } catch (error) {
      console.error('Error evaluating code:', error);
      res.status(500).json({ error: 'Failed to evaluate code' });
    }
  });

  // Socket.io for Real-Time Rooms
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', ({ roomId, user }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: {},
          status: 'waiting', // waiting, active, finished
          problem: null,
        });
      }
      
      const room = rooms.get(roomId);
      room.users[socket.id] = { ...user, id: socket.id, ready: false, progress: 0 };
      
      io.to(roomId).emit('room_state_update', room);
      socket.to(roomId).emit('chat_message', { system: true, text: `${user.name} joined the room.` });
    });

    socket.on('toggle_ready', async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || !room.users[socket.id]) return;
      
      room.users[socket.id].ready = !room.users[socket.id].ready;
      io.to(roomId).emit('room_state_update', room);

      // Check if all users are ready (min 2)
      const userList = Object.values(room.users) as any[];
      if (userList.length >= 1 && userList.every(u => u.ready)) {
         // Auto-generate problem for them if not already done
         if(room.status === 'waiting') {
           io.to(roomId).emit('chat_message', { system: true, text: 'Generating match problem...' });
           try {
             const response = await ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: `Generate a competitive programming problem. Difficulty: medium. Topic: random. Return ONLY a JSON object with this schema.`,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          input: { type: Type.STRING },
                          output: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                        },
                      },
                    },
                    constraints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    hiddenTestCases: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          input: { type: Type.STRING },
                          expectedOutput: { type: Type.STRING },
                        },
                      },
                    },
                  },
                  required: ['title', 'description', 'difficulty', 'examples', 'constraints', 'hiddenTestCases'],
                },
              },
            });
            const problem = JSON.parse(response.text || '{}');
            room.problem = problem;
            room.status = 'active';
            room.startTime = Date.now();
            io.to(roomId).emit('room_state_update', room);
            io.to(roomId).emit('match_started', problem);
           } catch(e) {
             io.to(roomId).emit('chat_message', { system: true, text: 'Failed to generate problem.' });
             // reset ready state
             userList.forEach(u => u.ready = false);
             io.to(roomId).emit('room_state_update', room);
           }
         }
      }
    });

    socket.on('progress_update', ({ roomId, progress }) => {
      const room = rooms.get(roomId);
      if (!room || !room.users[socket.id]) return;
      room.users[socket.id].progress = progress;
      socket.to(roomId).emit('opponent_progress', { userId: socket.id, progress });
    });

    socket.on('send_chat', ({ roomId, text }) => {
      const room = rooms.get(roomId);
      if (!room || !room.users[socket.id]) return;
      io.to(roomId).emit('chat_message', { user: room.users[socket.id].name, text });
    });

    socket.on('match_won', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || !room.users[socket.id]) return;
      room.status = 'finished';
      room.winner = socket.id;
      io.to(roomId).emit('match_over', { winner: room.users[socket.id] });
      io.to(roomId).emit('room_state_update', room);
    });

    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.users[socket.id]) {
          const name = room.users[socket.id].name;
          delete room.users[socket.id];
          io.to(roomId).emit('room_state_update', room);
          io.to(roomId).emit('chat_message', { system: true, text: `${name} left the room.` });
          
          if (Object.keys(room.users).length === 0) {
            rooms.delete(roomId);
          }
        }
      });
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
