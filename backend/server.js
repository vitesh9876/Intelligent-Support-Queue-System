const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const Ticket = require('./models/Ticket');
const Agent = require('./models/Agent');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

async function connectDB() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }
  
  mongoose.connect(uri)
    .then(() => console.log('Database connected successfully.'))
    .catch(err => console.error(err));
}
connectDB();

const DISPLACEMENT_LIMIT = 3;
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

function calculatePriority(ticket) {
  let priority = ticket.initialPriority;
  const timeElapsed = (Date.now() - new Date(ticket.createdAt).getTime()) / 60000;
  priority += timeElapsed * 0.5;
  
  if (ticket.displacementCount >= DISPLACEMENT_LIMIT) {
    priority += 1000;
  }
  return priority;
}

async function getSortedQueue() {
  const tickets = await Ticket.find({ status: 'waiting' }).lean();
  
  tickets.forEach(t => {
    t.currentPriority = calculatePriority(t);
  });
  
  tickets.sort((a, b) => {
    if (b.currentPriority !== a.currentPriority) {
      return b.currentPriority - a.currentPriority;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  
  return tickets;
}

async function broadcastQueue() {
  const queue = await getSortedQueue();
  io.emit('queue_update', queue);
}

async function checkInactivity() {
  const now = Date.now();
  const inactiveTickets = await Ticket.find({ 
    status: 'waiting', 
    lastActivity: { $lt: new Date(now - INACTIVITY_TIMEOUT) } 
  });
  
  for (let ticket of inactiveTickets) {
    ticket.status = 'cancelled';
    await ticket.save();
    io.to(`customer_${ticket.customerId}`).emit('notification', { message: 'Session closed due to inactivity.' });
  }
  
  if (inactiveTickets.length > 0) broadcastQueue();
}

app.post('/api/tickets', async (req, res) => {
  try {
    const { customerId, type, initialPriority = 1 } = req.body;
    const newTicket = new Ticket({ customerId, type, initialPriority, lastActivity: new Date() });
    
    const waitingTickets = await getSortedQueue();
    let displacedIds = [];
    
    for (let t of waitingTickets) {
      if (t.currentPriority < initialPriority) {
        displacedIds.push(t._id);
      }
    }
    
    if (displacedIds.length > 0) {
      await Ticket.updateMany(
        { _id: { $in: displacedIds } },
        { $inc: { displacementCount: 1 } }
      );
    }
    
    await newTicket.save();
    broadcastQueue();
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agents', async (req, res) => {
  const agents = await Agent.find().populate('currentTicket');
  res.json(agents);
});

app.post('/api/agents', async (req, res) => {
  const { name, specialization } = req.body;
  const agent = new Agent({ name, specialization });
  await agent.save();
  io.emit('agent_update');
  res.json(agent);
});

io.on('connection', (socket) => {
  getSortedQueue().then(queue => socket.emit('queue_update', queue));
  
  socket.on('join_customer', (customerId) => {
    socket.join(`customer_${customerId}`);
  });
  
  socket.on('heartbeat', async (customerId) => {
    await Ticket.updateMany(
      { customerId, status: 'waiting' },
      { $set: { lastActivity: new Date() } }
    );
  });
  
  socket.on('assign_ticket', async ({ agentId, ticketId }) => {
    const ticket = await Ticket.findById(ticketId);
    const agent = await Agent.findById(agentId);
    
    if (ticket && agent && agent.isAvailable && ticket.status === 'waiting' && agent.specialization === ticket.type) {
      ticket.status = 'processing';
      ticket.assignedTo = agent._id;
      await ticket.save();
      
      agent.isAvailable = false;
      agent.currentTicket = ticket._id;
      await agent.save();
      
      broadcastQueue();
      io.emit('agent_update');
    }
  });

  socket.on('resolve_ticket', async (agentId) => {
    const agent = await Agent.findById(agentId).populate('currentTicket');
    if (agent && agent.currentTicket) {
      const ticket = await Ticket.findById(agent.currentTicket._id);
      ticket.status = 'resolved';
      await ticket.save();
      
      agent.isAvailable = true;
      agent.currentTicket = null;
      await agent.save();
      
      broadcastQueue();
      io.emit('agent_update');
    }
  });
});

setInterval(broadcastQueue, 5000);
setInterval(checkInactivity, 10000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
