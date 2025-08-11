import express from 'express';
import * as dotenv from 'dotenv'
import { AppDataSource } from './config/data-source';
import cors from 'cors';
import router from './routers';
import { validateAllUUIDs } from './middlewares/validateUUIDs';

dotenv.config()

const app = express();

app.use(express.json());
app.use(cors());
app.use(validateAllUUIDs);
app.use('/',router());

app.use('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

AppDataSource.initialize()
  .then(async (connection) => {
    console.log("Database connection established successfully.");
    await connection.runMigrations();
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });



app.listen(process.env.PORT, () => {
  return console.log(`Express is listening at http://localhost:${process.env.PORT}`);
});
