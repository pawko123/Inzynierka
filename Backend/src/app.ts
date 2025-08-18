import express from 'express';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import cors from 'cors';
import router from './routers';
import { validateAllUUIDs } from './middlewares/validateUUIDs';

dotenv.config();

const app = express();

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

app.listen(process.env.PORT, () => {
	return console.log(`Express is listening at http://localhost:${process.env.PORT}`);
});
