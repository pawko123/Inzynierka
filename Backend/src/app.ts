import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import cors from 'cors';
import router from './routers';
import { validateAllUUIDs } from './middlewares/validateUUIDs';
import { initializeWebSocket } from './services/websocketService';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
	cors: {
		origin: ['http://localhost:8081', 'http://localhost:8082'],
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// Initialize WebSocket handlers
initializeWebSocket(io);

app.use(express.json());

const allowedOrigins = ['http://localhost:8081', 'http://localhost:8082'];

const corsOptions: cors.CorsOptions = {
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
	credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(validateAllUUIDs);

// Make io available to routes
app.set('io', io);

app.use('/', router());

app.use('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

AppDataSource.initialize()
	.then(async (connection) => {
		console.log('Database connection established successfully.');
		await connection.runMigrations();
	})
	.catch((error) => {
		console.error('Error during Data Source initialization:', error);
	});

server.listen(process.env.PORT, () => {
	return console.log(`Express server with WebSocket is listening at http://localhost:${process.env.PORT}`);
});
